import os
import json
import sys
from datetime import datetime, timezone
from uuid import uuid4
from typing import Dict, Any, List, Optional, Set
import asyncio
from dotenv import load_dotenv
import pathlib

# Add parent directory to path to import models
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from models import PropertyInput, DealMetrics

from google import genai

# Load environment variables from .env file
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

from uagents import Context, Protocol, Agent, Model
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)
from uagents_core.envelope import Envelope
from uagents_core.utils.messages import parse_envelope, send_message_to_agent
from fastapi import FastAPI

# Request-level locks to prevent concurrent storage updates
_request_locks: Dict[str, asyncio.Lock] = {}


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


def safe_json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


# ----------------------------
# Config
# ----------------------------
subject_matter = "Estate.AI Selector + Orchestrator"

# Not currently using ASI or Gemini API for routing
# ASI_API_KEY = os.getenv("ASI_API_KEY")
# if not ASI_API_KEY:
#     raise RuntimeError("Missing ASI_API_KEY env var (ASI:One API key)")


#This is for OpenAI model use
# ASI_MODEL = os.getenv("ASI_MODEL", "asi1-mini")
#
# client = OpenAI(
#     base_url="https://api.asi1.ai/v1",
#     api_key=ASI_API_KEY,
# )

# Gemini for handling untyped properties
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY env var")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

SPECIALISTS: Dict[str, str] = {
    # "single_family": "agent1qgvq5wpy88sq8lkys59yrkd26zf2m7vtp8yq7y9sg0xz70p9ayj07ch8h4p",
    "multi_family": "agent1qwn423m6v3t7t7pwsc6ulj7u99crrfc8r40pr534asjkv5tfywwkqc4jysn",
    "condo": "agent1qv0fx4nfdy8unz0uy3z2h3mhkyzc97n0thzc5xzaexzjsk75fwskscx0l5w",
    # "townhouse": "agent1qd9lgwqunhe2m7gj9xseaesq3zhp2667qfh8ky4w24hm3xpf4n2mc4uk5v9",
}
SPECIALISTS = {k: v for k, v in SPECIALISTS.items() if v}

if not SPECIALISTS:
    raise RuntimeError("No specialist addresses configured.")

NETWORK = os.getenv("UAGENTS_NETWORK", "").strip() or None

# Timeout for specialist responses (seconds), defaults to 60 (1 minute)
SPECIALIST_TIMEOUT = int(os.getenv("SPECIALIST_TIMEOUT", "60"))

# Track active request IDs in memory
ACTIVE_REQUESTS: Set[str] = set()

# ----------------------------
# Storage-backed pending requests
# ----------------------------
PENDING_PREFIX = "estate:pending:"


def pending_key(req_id: str) -> str:
    return f"{PENDING_PREFIX}{req_id}"


def pending_set(ctx: Context, req_id: str, payload: Dict[str, Any]) -> None:
    safe = dict(payload)
    if isinstance(safe.get("expected"), set):
        safe["expected"] = sorted(list(safe["expected"]))
    ctx.storage.set(pending_key(req_id), safe_json_dumps(safe))
    ACTIVE_REQUESTS.add(req_id)


def pending_get(ctx: Context, req_id: str) -> Optional[Dict[str, Any]]:
    raw = ctx.storage.get(pending_key(req_id))
    if not raw:
        return None
    try:
        data = json.loads(raw)
        if isinstance(data.get("expected"), list):
            data["expected"] = set(data["expected"])
        if "received" not in data or not isinstance(data["received"], dict):
            data["received"] = {}
        return data
    except Exception as e:
        ctx.logger.error(f"Error parsing pending request: {e}")
        return None


def pending_del(ctx: Context, req_id: str) -> None:
    """Delete a pending request from storage and memory"""
    ctx.storage.set(pending_key(req_id), "")
    ACTIVE_REQUESTS.discard(req_id)
    # Also remove from locks
    if req_id in _request_locks:
        del _request_locks[req_id]


# ----------------------------
# Protocols
# ----------------------------
chat_proto = Protocol(spec=chat_protocol_spec)

# ----------------------------
# Selector prompt
# ----------------------------
# ----------------------------
# Property Type to Specialist Mapping
# ----------------------------
PROPERTY_TYPE_MAP = {
    "single-family": "single_family",
    "multi-family": "multi_family",
    "condo": "condo",
    "townhouse": "townhouse",
}


def get_specialist_from_property_type(property_type: str) -> Optional[str]:
    """
    Map property type from PropertyInput to specialist key.
    Returns None if type is not recognized.
    """
    # Normalize the property type (lowercase, handle variations)
    normalized = property_type.lower().strip()
    return PROPERTY_TYPE_MAP.get(normalized)


def parse_property_data(text: str) -> Optional[PropertyInput]:
    """
    Try to parse incoming text as PropertyInput JSON.
    Returns None if parsing fails.
    """
    try:
        data = json.loads(text)
        # Handle metrics being sent alongside property data
        if "metrics" in data:
            # Store metrics separately if needed
            data.pop("metrics", None)
        return PropertyInput(**data)
    except Exception as e:
        return None


def select_specialists_from_properties(user_text: str) -> Optional[List[str]]:
    """
    Parse property data and route based on type field.
    Returns None if property has empty type (needs Gemini analysis).
    Returns list of specialists if type is specified.
    """
    # Try to parse as single property
    prop = parse_property_data(user_text)
    if prop:
        # If type is empty string, return None to trigger Gemini
        if not prop.type or prop.type.strip() == "":
            return None
        # If type is specified, route to specialist
        specialist = get_specialist_from_property_type(prop.type)
        if specialist and specialist in SPECIALISTS:
            return [specialist]
    
    # Try to parse as array of properties
    try:
        data = json.loads(user_text)
        if isinstance(data, list):
            has_empty_type = False
            specialists = set()
            for item in data:
                try:
                    prop = PropertyInput(**item)
                    if not prop.type or prop.type.strip() == "":
                        has_empty_type = True
                    elif prop.type:
                        specialist = get_specialist_from_property_type(prop.type)
                        if specialist and specialist in SPECIALISTS:
                            specialists.add(specialist)
                except Exception:
                    continue
            # If any property has empty type, use Gemini for all
            if has_empty_type:
                return None
            if specialists:
                return list(specialists)
    except Exception:
        pass
    
    # Fallback: return all specialists for backward compatibility
    return list(SPECIALISTS.keys())


def generate_gemini_analysis(user_text: str) -> str:
    """
    Generate analysis using Gemini for properties with empty type field.
    Expects PropertyInput and optionally DealMetrics data.
    """
    GEMINI_SYSTEM_PROMPT = r"""You are a conservative real estate investment analyst.

You will receive property data (PropertyInput) and optionally deal metrics (DealMetrics).
Your task is to provide a comprehensive investment analysis for this property.

ANALYSIS STRUCTURE:

1. PROPERTY OVERVIEW
- Address and key characteristics
- Purchase price and estimated rent
- Basic financial metrics

2. CASH FLOW ANALYSIS
- Monthly rental income
- Operating expenses breakdown (property tax, insurance, HOA, maintenance, utilities)
- Net operating income
- Monthly cash flow after mortgage

3. RETURN METRICS
- Cap rate analysis
- Cash-on-cash return
- 5-year ROI projection
- Equity build projection

4. RISK ASSESSMENT
- Vacancy risk
- Maintenance considerations
- Market conditions
- Financial leverage risk
- Overall risk level (low/medium/high)

5. RECOMMENDATION
- Investment verdict (STRONG BUY / BUY / HOLD / AVOID)
- Key strengths and concerns
- Action items for due diligence
- Timing recommendation

STYLE:
- Professional and conservative tone
- No emojis, clear formatting
- Focus on investor decision-making
- Highlight risks and opportunities
- Be specific with numbers
- Consider the downpayment, interest rate, and loan terms
- Provide approximately 200 words of detailed analysis covering all key investment factors

Provide your analysis in a clear, structured format that helps the investor make an informed decision.
"""
    
    try:
        # Parse the incoming data to provide context
        data = json.loads(user_text) if isinstance(user_text, str) and user_text.strip().startswith('{') else {"raw": user_text}
        
        # Create a more readable context for Gemini
        context = json.dumps(data, indent=2)
        
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                GEMINI_SYSTEM_PROMPT,
                f"Property Data:\n{context}",
            ],
        )
        return (response.text or "").strip()
    except Exception as e:
        return f"Error generating analysis: {str(e)}. Please try again or specify a property type."


def format_combined_reply(received: Dict[str, str], expected: Set[str]) -> str:
    lines: List[str] = ["Estate.AI — Combined Specialist Analysis", ""]

    missing = expected - set(received.keys())

    for k in ["single_family", "multi_family", "condo", "townhouse"]:
        if k in received:
            lines.append(f"=== {k.replace('_', ' ').upper()} ===")
            lines.append(received[k].strip())
            lines.append("")

    if missing:
        lines.append("=== NOTE ===")
        lines.append(f"No response received from: {', '.join(sorted(missing))}")
        lines.append("")

    return "\n".join(lines).strip()


def build_specialist_payload(request_id: str, specialist_key: str, user_text: str) -> str:
    return safe_json_dumps(
        {
            "type": "estate_specialist_request",
            "request_id": request_id,
            "specialist": specialist_key,
            "user_text": user_text,
            "return_format": "json",
            "response_schema": {"request_id": "str", "specialist": "str", "result": "str"},
        }
    )


def parse_specialist_response(text: str) -> tuple[Optional[str], Optional[str], str]:
    t = (text or "").strip()
    if not t:
        return None, None, ""
    try:
        data = json.loads(t)
        if isinstance(data, dict):
            rid = data.get("request_id")
            spec = data.get("specialist")
            res = data.get("result")
            return (
                rid if isinstance(rid, str) else None,
                spec if isinstance(spec, str) else None,
                res if isinstance(res, str) else t,
            )
    except Exception:
        pass
    return None, None, t


# ----------------------------
# Agent
# ----------------------------
# Get endpoint from environment variable or use local default
AGENT_ENDPOINT = os.getenv("AGENT_ENDPOINT")
if AGENT_ENDPOINT:
    # Use public endpoint (e.g., from cloudflared tunnel)
    agent_endpoints = [AGENT_ENDPOINT]
    print(f"🌐 Using public endpoint: {AGENT_ENDPOINT}")
else:
    # Use local endpoint for testing
    agent_endpoints = ["http://127.0.0.1:8005/submit"]
    print("🏠 Using local endpoint: http://127.0.0.1:8005/submit")

agent = Agent(
    name="Estate-Ai",
    seed=os.getenv("AGENT_SEED", "selector-agent-team"),  # Use env var for production
    port=8005,
    mailbox=True,
    endpoint=agent_endpoints,
    network=NETWORK or "testnet",
)


# ----------------------------
# REST API endpoint for FastAPI backend to send property data
# ----------------------------

class PropertyAnalysisRequest(Model):
    """Model for receiving property analysis requests from FastAPI backend"""
    properties: List[Dict[str, Any]]
    zipCode: str
    globalAssumptions: Dict[str, Any]


class PropertyAnalysisResponse(Model):
    """Response model for property analysis"""
    status: str
    message: str
    results: List[Dict[str, Any]]


@agent.on_rest_post("/api/analyze", PropertyAnalysisRequest, PropertyAnalysisResponse)
async def handle_rest_analysis(ctx: Context, req: PropertyAnalysisRequest) -> PropertyAnalysisResponse:
    """
    REST endpoint for receiving property analysis requests from the FastAPI backend.
    This simulates receiving data and processing it.
    """
    ctx.logger.info(f"📥 Received REST request for {len(req.properties)} properties in ZIP {req.zipCode}")
    
    # Process each property
    responses = []
    for prop in req.properties:
        property_type = prop.get("type", "")
        property_id = prop.get("id", "unknown")
        
        ctx.logger.info(f"Processing property {property_id} with type: '{property_type}'")
        
        # If type is empty, use Gemini
        if not property_type or property_type.strip() == "":
            ctx.logger.info(f"Property {property_id} has empty type, using Gemini analysis")
            try:
                # Convert property to JSON string for Gemini
                property_json = json.dumps(prop)
                analysis = generate_gemini_analysis(property_json)
                responses.append({
                    "property_id": property_id,
                    "type": "gemini",
                    "analysis": analysis
                })
            except Exception as e:
                ctx.logger.error(f"Error with Gemini analysis: {e}")
                responses.append({
                    "property_id": property_id,
                    "type": "error",
                    "analysis": f"Error: {str(e)}"
                })
        else:
            # Route to specialist (simplified for now)
            specialist = get_specialist_from_property_type(property_type)
            ctx.logger.info(f"Property {property_id} type '{property_type}' maps to specialist: {specialist}")
            responses.append({
                "property_id": property_id,
                "type": "specialist",
                "specialist": specialist,
                "analysis": f"Would route to {specialist} specialist agent"
            })
    
    return PropertyAnalysisResponse(
        status="success",
        message=f"Processed {len(req.properties)} properties",
        results=responses
    )
# ----------------------------
# Startup handler to clear old requests
# ----------------------------
@agent.on_event("startup")
async def clear_old_requests(ctx: Context):
    """Clear any stale pending requests from previous runs"""
    ctx.logger.info("Clearing stale pending requests from previous sessions...")
    
    # Clear in-memory set first
    ACTIVE_REQUESTS.clear()
    
    # Clear all lock references
    _request_locks.clear()
    
    # Clear storage - get all keys and remove ones matching our prefix
    try:
        # Get all storage keys by attempting to access the internal storage
        all_keys = []
        if hasattr(ctx.storage, '_data'):
            all_keys = list(ctx.storage._data.keys())
        
        # Clear any keys that start with our pending prefix
        cleared_count = 0
        for key in all_keys:
            if key.startswith(PENDING_PREFIX):
                ctx.storage.set(key, "")
                cleared_count += 1
        
        ctx.logger.info(f"Cleared {cleared_count} stale pending requests from storage")
    except Exception as e:
        ctx.logger.warning(f"Could not access storage internals, doing basic cleanup: {e}")
    
    ctx.logger.info("Agent ready to accept new requests")


# ----------------------------
# Timeout handler for pending requests
# ----------------------------
@agent.on_interval(period=5.0)
async def check_timeouts(ctx: Context):
    """Check for timed-out requests and complete them with partial results after 1 minute"""
    if not ACTIVE_REQUESTS:
        return  # No active requests to check
    
    # Make a copy to avoid modification during iteration
    for req_id in list(ACTIVE_REQUESTS):
        pending = pending_get(ctx, req_id)

        if not pending:
            # Request no longer in storage, remove from active set
            ACTIVE_REQUESTS.discard(req_id)
            if req_id in _request_locks:
                del _request_locks[req_id]
            continue

        created_at_str = pending.get("created_at")
        if not created_at_str:
            # Invalid request, clean it up
            pending_del(ctx, req_id)
            continue

        try:
            created_at = datetime.fromisoformat(created_at_str)
            age = (utcnow() - created_at).total_seconds()

            if age > SPECIALIST_TIMEOUT:
                ctx.logger.warning(f"Request {req_id} timed out after {age:.1f}s (limit: {SPECIALIST_TIMEOUT}s)")
                user_sender = pending.get("user_sender")
                
                if not user_sender:
                    # No user to send to, just clean up
                    pending_del(ctx, req_id)
                    continue
                
                expected = pending.get("expected", set())
                received = pending.get("received", {})

                if received:
                    # Send partial results
                    combined = format_combined_reply(received, expected)
                    await ctx.send(user_sender, create_text_chat(combined, end_session=True))
                    ctx.logger.info(f"Sent partial results for timed-out request {req_id}")
                else:
                    # No responses at all
                    await ctx.send(
                        user_sender,
                        create_text_chat(
                            "Sorry, no specialist responses were received in time. Please try again.",
                            end_session=True
                        )
                    )
                    ctx.logger.info(f"No responses received for timed-out request {req_id}")

                # Clean up the request - this ensures it won't be processed again
                pending_del(ctx, req_id)
                    
        except Exception as e:
            ctx.logger.error(f"Error checking timeout for {req_id}: {e}")
            # Clean up problematic request
            pending_del(ctx, req_id)


# ----------------------------
# Single handler for ChatMessage (user + specialists)
# ----------------------------
@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # Always ACK messages
    await ctx.send(sender, ChatAcknowledgement(timestamp=utcnow(), acknowledged_msg_id=msg.msg_id))

    # 1) Check if message is FROM a specialist
    specialist_key_from_sender = next((k for k, a in SPECIALISTS.items() if a == sender), None)

    if specialist_key_from_sender:
        text = (msg.text() or "").strip()
        rid, spec_from_msg, result_text = parse_specialist_response(text)
        specialist_key = spec_from_msg or specialist_key_from_sender

        if not rid:
            ctx.logger.warning(f"Specialist {specialist_key} response missing request_id")
            return

        # Get or create lock for this request
        if rid not in _request_locks:
            _request_locks[rid] = asyncio.Lock()

        # Use lock to prevent concurrent updates
        async with _request_locks[rid]:
            pending = pending_get(ctx, rid)
            if not pending:
                ctx.logger.warning(f"No pending request found for request_id={rid}")
                return

            # Store the specialist's response
            pending["received"][specialist_key] = result_text
            ctx.logger.info(f"Received response from {specialist_key} for request {rid}")
            ctx.logger.info(f"Current received dict: {list(pending['received'].keys())}")

            expected: Set[str] = pending["expected"]
            received_keys: Set[str] = set(pending["received"].keys())
            remaining = expected - received_keys

            if remaining:
                ctx.logger.info(f"Still waiting for: {sorted(list(remaining))}")
                pending_set(ctx, rid, pending)
                return

            # All responses received - send combined result to user
            ctx.logger.info(f"All specialists responded for request {rid}")
            user_sender = pending["user_sender"]
            combined = format_combined_reply(pending["received"], expected)
            await ctx.send(user_sender, create_text_chat(combined, end_session=True))
            pending_del(ctx, rid)

            # Clean up lock
            if rid in _request_locks:
                del _request_locks[rid]
        return

    # 2) Message is from a user
    if any(isinstance(item, StartSessionContent) for item in msg.content):
        await ctx.send(
            sender,
            create_text_chat(
                "Hi! I'm the Estate.AI router.\nSend me a query like: \"Analyze investment properties in 06103\""
            ),
        )

    user_text = (msg.text() or "").strip()
    if not user_text:
        return

    ctx.logger.info(f"User request: {user_text}")
    
    # Select specialists based on property type
    selected = select_specialists_from_properties(user_text)
    
    # If None returned, property has empty type - use Gemini directly
    if selected is None:
        ctx.logger.info("Property has empty type field, using Gemini for direct analysis")
        await ctx.send(sender, create_text_chat("Analyzing property with AI (no type specified)..."))
        
        try:
            analysis = generate_gemini_analysis(user_text)
            await ctx.send(sender, create_text_chat(analysis, end_session=True))
            ctx.logger.info("Sent Gemini analysis to user")
        except Exception as e:
            ctx.logger.error(f"Error generating Gemini analysis: {e}")
            await ctx.send(
                sender,
                create_text_chat(
                    "Sorry, I couldn't analyze that property. Please ensure the data is valid and try again.",
                    end_session=True
                )
            )
        return
    
    # Route to specialists
    await ctx.send(sender, create_text_chat("Routing your request to the right specialists..."))
    
    if not selected:
        selected = list(SPECIALISTS.keys())

    # If still no specialists available, send error message
    if not selected:
        ctx.logger.error("No specialists available to handle request")
        await ctx.send(
            sender,
            create_text_chat(
                "Sorry, we can't process that request at this time. No specialists are available.",
                end_session=True
            )
        )
        return

    ctx.logger.info(f"Selected specialists: {selected}")

    # Create pending request
    request_id = str(uuid4())
    pending_set(
        ctx,
        request_id,
        {
            "user_sender": sender,
            "expected": set(selected),
            "received": {},
            "created_at": utcnow().isoformat(),
        },
    )

    # Send requests to specialists
    sent_count = 0
    for specialist_key in selected:
        addr = SPECIALISTS.get(specialist_key)
        if not addr:
            ctx.logger.warning(f"No address found for specialist: {specialist_key}")
            continue
        try:
            payload = build_specialist_payload(request_id, specialist_key, user_text)
            await ctx.send(addr, create_text_chat(payload))
            ctx.logger.info(f"Sent request to {specialist_key} ({addr})")
            sent_count += 1
        except Exception as e:
            ctx.logger.error(f"Failed to send to {specialist_key}: {e}")

    # If no messages were sent, notify user and clean up
    if sent_count == 0:
        ctx.logger.error(f"Failed to send messages to any specialist for request {request_id}")
        pending_del(ctx, request_id)
        await ctx.send(
            sender,
            create_text_chat(
                "Sorry, we can't process that request at this time. Unable to reach specialists.",
                end_session=True
            )
        )
        return

    await ctx.send(
        sender,
        create_text_chat(f"Dispatched to: {', '.join(selected)}. Waiting for responses...")
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle acknowledgements from specialists - just log them"""
    ctx.logger.debug(f"Received ACK from {sender} for message {msg.acknowledged_msg_id}")


agent.include(chat_proto, publish_manifest=True)

# ----------------------------
# Chat Protocol Endpoint (FastAPI-style for external access)
# ----------------------------

app = FastAPI()

@app.get("/status")
async def healthcheck():
    """Health check endpoint for monitoring"""
    return {
        "status": "OK",
        "agent": "Estate.AI Orchestrator",
        "address": str(agent.address),
        "network": NETWORK or "testnet"
    }

@app.post("/chat")
async def handle_chat_message(env: Envelope):
    """
    Chat Protocol endpoint that allows Estate.AI to be accessed from anywhere on Agentverse.
    This endpoint receives chat messages and responds with property analysis.
    """
    try:
        # Parse the incoming chat message
        msg = parse_envelope(env, ChatMessage)
        user_message = msg.text()
        
        print(f"📨 Received chat message from {env.sender}: {user_message}")
        
        # Try to parse as property data
        property_data = parse_property_data(user_message)
        
        if property_data:
            # Property data received - analyze it
            property_type = property_data.type or ""
            
            if not property_type.strip():
                # Empty type - use Gemini
                print(f"🤖 Analyzing with Gemini (no type specified)")
                try:
                    analysis = generate_gemini_analysis(user_message)
                    response_text = f"Estate.AI Analysis (Gemini):\n\n{analysis}"
                except Exception as e:
                    response_text = f"Error analyzing property: {str(e)}"
            else:
                # Route to specialist
                specialist = get_specialist_from_property_type(property_type)
                if specialist and specialist in SPECIALISTS:
                    response_text = f"Property type '{property_type}' received. Routing to {specialist} specialist agent for detailed analysis."
                    print(f"📤 Would route to {specialist} specialist")
                else:
                    response_text = f"Property type '{property_type}' not recognized. Available types: {', '.join(PROPERTY_TYPE_MAP.keys())}"
        else:
            # Not property data - treat as general inquiry
            response_text = f"""Hello! I'm Estate.AI, your real estate investment orchestrator.

Send me property data in JSON format with these fields:
- address (string)
- listPrice (number)
- estimatedRent (number)
- type (string): "single-family", "multi-family", "condo", or "townhouse" (leave empty for AI analysis)
- zipCode (string)
- bedrooms, bathrooms, sqft (numbers)
... and more

I'll analyze the property and provide investment recommendations!

You said: {user_message}"""
        
        # Send response back to sender
        send_message_to_agent(
            destination=env.sender,
            msg=ChatMessage([TextContent(response_text)]),
            sender=agent._identity,
        )
        
        print(f"✅ Responded to {env.sender}")
        
    except Exception as e:
        print(f"❌ Error handling chat message: {e}")
        # Try to send error response
        try:
            send_message_to_agent(
                destination=env.sender,
                msg=ChatMessage([TextContent(f"Error processing your message: {str(e)}")]),
                sender=agent._identity,
            )
        except:
            pass

if __name__ == "__main__":
    agent.run()