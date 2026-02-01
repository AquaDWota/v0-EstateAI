import os
import requests
import json
from datetime import datetime, timezone
from uuid import uuid4
import re
from typing import Optional

from openai import OpenAI
from uagents import Context, Protocol, Agent
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)

from protocol_models import SpecialistRequest, SpecialistResult


# ----------------------------
# Helpers
# ----------------------------
def utcnow():
    return datetime.now(timezone.utc)


def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(timestamp=utcnow(), msg_id=uuid4(), content=content)


def safe_json_dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


# ----------------------------
# Config
# ----------------------------
subject_matter = "Single-Family Specialist"

# ✅ DO NOT hardcode secrets in source
ASI_API_KEY = "sk_6b423c270c7a4dbcae9315ad2d120fd8cc9ba2c4989542abad77bf5bf787a80c"
if not ASI_API_KEY:
    raise RuntimeError("Missing ASI_API_KEY env var")

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=ASI_API_KEY,
)

MODEL = os.getenv("ASI_MODEL", "asi1-mini")


SYSTEM_PROMPT = f"""You are a helpful assistant who only answers questions about {subject_matter}.""" + r"""
You are a conservative real estate investment analyst specializing in SINGLE-FAMILY rental homes.

You will be given a list of single-family listings (each may include address, id, zipCode, listPrice, estimatedRent, bedrooms, bathrooms, sqft, yearBuilt, propertyTaxPerYear, insurancePerYear).

Your task is to evaluate these listings from an investor’s perspective and present the results in a CLEAR, HUMAN-READABLE format suitable for real estate decision-making.

=====================
OUTPUT FORMAT (STRICT)
=====================

Return your response as STRUCTURED TEXT using the exact format below.

IMPORTANT:
- Only include the TOP 5 ranked properties
- Do NOT list or mention properties ranked below the top 5
- Use the property address if provided; otherwise use the property ID
- Use ALL CAPS for verdicts

SECTION 1: OVERALL SUMMARY
2–4 sentences summarizing overall yield levels, cashflow quality, and the most common risks across the top opportunities.

SECTION 2: TOP 5 RANKED INVESTMENTS

1. <Address or Property ID>, <VERDICT>
Financial overview:
- Estimated rent: <$X/month or $X/year>
- Purchase price context: <low / mid / high $X range>
- Net yield proxy: <approximate % or range>
- Fixed cost burden: <low / moderate / high>

Risk & downside analysis:
<1–2 sentences explaining margin of safety, vacancy sensitivity, and capex risk.>

(repeat the same format for ranks 2–5)

=====================
ANALYSIS RULES
=====================

SINGLE-FAMILY INVESTMENT LOGIC:
- Emphasize clean cashflow relative to fixed costs
- Highlight simplicity and strong resale liquidity
- Flag single-tenant vacancy risk explicitly
- Mention capex risk for older homes when relevant

CALCULATIONS (internal only; DO NOT show math):
- gross_rent_year = estimatedRent × 12
- annual_fixed_costs = propertyTaxPerYear + insurancePerYear
- net_yield_proxy = (gross_rent_year − annual_fixed_costs) ÷ listPrice

VERDICTS (use EXACTLY these labels):
- STRONG BUY
- BUY
- HOLD
- AVOID

STYLE REQUIREMENTS:
- Professional, investor-grade tone
- No JSON, no emojis, no markdown tables
- Do NOT mention calculations explicitly

Now evaluate the single-family listings provided in the user prompt and return ONLY the top 5 ranked investments using the format above.
"""



def extract_zipcode(text: str) -> Optional[str]:
    """Extract 5-digit zip code from user text"""
    # Look for 5-digit zip codes
    match = re.search(r'\b(\d{5})\b', text)
    if match:
        return match.group(1)
    return None

def run_singlefamily_analysis(user_text: str) -> str:
    """Calls ASI-1 and returns the model's JSON string (as text)."""
    zipCode = extract_zipcode(user_text)
    url = f"https://property-api-f9k4.onrender.com/api/properties/zipcode/{zipCode}"
    
    response = requests.get(url)
    data = response.json()

    r = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + str(data)},
            {"role": "user", "content": user_text},
        ],
        max_tokens=2048,
        temperature=0.2,
    )
    return (r.choices[0].message.content or "").strip()


# ----------------------------
# Agent + Protocols
# ----------------------------
NETWORK = os.getenv("UAGENTS_NETWORK", "testnet").strip() or None

agent = Agent(
    name="SingleFamilySpecialist",
    seed=os.getenv("SINGLEFAMILY_SEED", "SingleFamilySpecialist2026"),
    port=int(os.getenv("SINGLEFAMILY_PORT", "8010")),
    mailbox=True,
    network=NETWORK,  # must match router network
)

chat_proto = Protocol(spec=chat_protocol_spec)
router_proto = Protocol(name="EstateSpecialistProtocol", version="0.1.0")


# ----------------------------
# Chat handler (supports BOTH direct chat and router JSON-over-chat)
# ----------------------------
@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # Ack
    await ctx.send(sender, ChatAcknowledgement(timestamp=utcnow(), acknowledged_msg_id=msg.msg_id))

    # Greet on session start
    if any(isinstance(item, StartSessionContent) for item in msg.content):
        await ctx.send(sender, create_text_chat(f"Hi! I'm a {subject_matter}. Send single-family listings to analyze."))
        return

    text = (msg.text() or "").strip()
    if not text:
        return

    # ---- Router JSON-over-chat path ----
    # Router sends JSON: {"type":"estate_specialist_request","request_id":"...","specialist":"single_family","user_text":"..."}
    try:
        data = json.loads(text)
        if isinstance(data, dict) and data.get("type") == "estate_specialist_request":
            request_id = data.get("request_id")
            specialist = data.get("specialist") or "single_family"
            user_text = data.get("user_text", "")

            # run analysis
            try:
                analysis = run_singlefamily_analysis(user_text)
            except Exception as e:
                ctx.logger.exception("Error querying ASI model")
                analysis = safe_json_dumps({"error": "model_call_failed", "detail": str(e)})

            # IMPORTANT: respond as JSON including request_id so router can correlate
            reply = safe_json_dumps(
                {
                    "request_id": request_id,
                    "specialist": specialist,
                    "result": analysis,
                }
            )
            await ctx.send(sender, create_text_chat(reply))
            return
    except Exception:
        # Not JSON; treat as direct user chat
        pass

    # ---- Direct chat path (ASI UI / human) ----
    try:
        response = run_singlefamily_analysis(text)
    except Exception as e:
        ctx.logger.exception("Error querying ASI model")
        response = safe_json_dumps({"error": "model_call_failed", "detail": str(e)})

    await ctx.send(sender, create_text_chat(response, end_session=True))


# ----------------------------
# Router protocol handler (Router -> Specialist) [typed model path]
# ----------------------------
@router_proto.on_message(SpecialistRequest)
async def handle_router_req(ctx: Context, sender: str, msg: SpecialistRequest):
    ctx.logger.info(f"[{msg.specialist}] handling request_id={msg.request_id}")

    try:
        analysis = run_singlefamily_analysis(msg.user_text)
    except Exception as e:
        ctx.logger.exception("Error querying ASI model")
        analysis = safe_json_dumps({"error": "model_call_failed", "detail": str(e)})

    await ctx.send(
        sender,
        SpecialistResult(
            request_id=msg.request_id,   # DO NOT CHANGE
            specialist=msg.specialist,   # DO NOT CHANGE
            result=analysis,
        ),
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


# include BOTH protocols
agent.include(chat_proto, publish_manifest=True)
agent.include(router_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
