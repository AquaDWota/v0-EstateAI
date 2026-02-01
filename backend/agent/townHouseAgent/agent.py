import os
import json
import requests
import re
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4

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
subject_matter = "Townhouse Specialist"

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
You are a conservative real estate investment analyst specializing in TOWNHOUSE rental properties.

You will be given a list of townhouse listings (each may include address, id, zipCode, listPrice, estimatedRent, bedrooms, bathrooms, sqft, yearBuilt, propertyTaxPerYear, insurancePerYear, hoaPerYear).

Your task is to evaluate these listings from an investor’s perspective and present the results in a CLEAR, HUMAN-READABLE format.

=====================
OUTPUT FORMAT (STRICT)
=====================

Return your response as STRUCTURED TEXT using the exact format below.

IMPORTANT:
- Only include the TOP 5 ranked properties
- Do NOT list or mention properties ranked below the top 5

SECTION 1: OVERALL SUMMARY
2–4 sentences summarizing yield quality, HOA impact, and risk balance across the top townhouse opportunities.

SECTION 2: TOP 5 RANKED INVESTMENTS

1. <Address or Property ID>, <VERDICT>
Financial overview:
- Estimated rent: <$X/month or $X/year>
- Purchase price context: <low / mid / high $X range>
- Net yield proxy: <approximate % or range>
- HOA impact: <low / moderate / high>

Risk & downside analysis:
<1–2 sentences addressing HOA uncertainty, maintenance scope, and margin sensitivity.>

(repeat the same format for ranks 2–5)

=====================
ANALYSIS RULES
=====================

TOWNHOUSE INVESTMENT LOGIC:
- HOA costs reduce yield but are typically lower than condos
- Maintenance responsibilities are often shared and may be unclear
- Strong rental demand for family-sized layouts
- Liquidity sits between single-family and condos

VERDICTS:
- STRONG BUY
- BUY
- HOLD
- AVOID

STYLE REQUIREMENTS:
- Investor-memo tone
- No JSON, no emojis, no math shown

Now evaluate the townhouse listings provided in the user prompt and return ONLY the top 5 ranked investments using the format above.
"""


def extract_zipcode(text: str) -> Optional[str]:
    """Extract 5-digit zip code from user text"""
    # Look for 5-digit zip codes
    match = re.search(r'\b(\d{5})\b', text)
    if match:
        return match.group(1)
    return None


def run_townhouse_analysis(user_text: str) -> str:
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
    name="TownhouseSpecialist",
    seed=os.getenv("TOWNHOUSE_SEED", "TownhouseSpecialist2026"),
    port=int(os.getenv("TOWNHOUSE_PORT", "8013")),
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
        await ctx.send(sender, create_text_chat(f"Hi! I'm a {subject_matter}. Send me townhouse listings to analyze."))
        return

    text = (msg.text() or "").strip()
    if not text:
        return

    # ---- Router JSON-over-chat path ----
    # Router sends JSON: {"type":"estate_specialist_request","request_id":"...","specialist":"townhouse","user_text":"..."}
    try:
        data = json.loads(text)
        if isinstance(data, dict) and data.get("type") == "estate_specialist_request":
            request_id = data.get("request_id")
            specialist = data.get("specialist") or "townhouse"
            user_text = data.get("user_text", "")

            try:
                analysis = run_townhouse_analysis(user_text)
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
        response = run_townhouse_analysis(text)
    except Exception as e:
        ctx.logger.exception("Error querying ASI model")
        response = safe_json_dumps({"error": "model_call_failed", "detail": str(e)})

    await ctx.send(sender, create_text_chat(response, end_session=True))


# ----------------------------
# Router protocol handler (Router -> Specialist) [typed model path]
# ----------------------------
@router_proto.on_message(SpecialistRequest)
async def handle_router_req(ctx: Context, sender: str, msg: SpecialistRequest):
    ctx.logger.info(f"[TownhouseSpecialist] got request_id={msg.request_id}")

    try:
        result_json_text = run_townhouse_analysis(msg.user_text)
    except Exception as e:
        ctx.logger.exception("Error querying ASI model for router request")
        result_json_text = safe_json_dumps({"error": "model_call_failed", "detail": str(e)})

    await ctx.send(
        sender,
        SpecialistResult(
            request_id=msg.request_id,
            specialist=msg.specialist,  # should be "townhouse"
            result=result_json_text,
        ),
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


agent.include(chat_proto, publish_manifest=True)
agent.include(router_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
