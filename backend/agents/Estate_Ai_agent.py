import os
import json
from datetime import datetime, timezone
from uuid import uuid4
from typing import Dict, Any, List, Optional, Set
import asyncio
from dotenv import load_dotenv
import pathlib

# from google import genai  # Not needed for now, re-enable for Gemini routing

# Load environment variables from .env file
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
from uagents import Context, Protocol, Agent
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)

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

# COMMENTED OUT - Gemini routing disabled for now
# GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# if not GEMINI_API_KEY:
#     raise RuntimeError("Missing GEMINI_API_KEY env var")
# client = genai.Client(api_key=GEMINI_API_KEY)

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
SELECTOR_SYSTEM_PROMPT = r"""
You are a routing agent for a real-estate investment analysis system.

Your ONLY responsibility is to decide which specialized agent(s) should be used to analyze the user's request.
You do NOT analyze properties yourself.
You do NOT generate investment advice.
You ONLY select specialists.

AVAILABLE SPECIALISTS (fixed list — do not invent new ones):
1. "single_family"
2. "multi_family"
3. "condo"
4. "townhouse"

ROUTING RULES:
- If the request explicitly mentions one or more property types, select ONLY those matching specialists.
- If the request is general (e.g., "analyze investment properties", "best rentals in 06103"), select ALL:
  ["single_family", "multi_family", "condo", "townhouse"]
- If ambiguous but implies rentals/investing/deals, default to ALL.
- Never invent new specialists.

OUTPUT RULES:
- Return ONLY valid JSON (no markdown, no extra text).
- Must match EXACTLY:
{"selected_specialists":["single_family","multi_family"]}

Now select the appropriate specialists for the user request.
"""


def select_specialists_via_asi(user_text: str) -> List[str]:
    """
    For now, always return all specialists to test routing.
    TODO: Re-enable Gemini AI routing later
    """
    # Always return all specialists
    return list(SPECIALISTS.keys())
    
    # COMMENTED OUT - Gemini routing (re-enable later)
    # try:
    #     response = client.models.generate_content(
    #         model=GEMINI_MODEL,
    #         contents = [
    #             SELECTOR_SYSTEM_PROMPT,
    #             user_text,
    #         ]
    #     )
    #     # Gemini API response format: response.text
    #     raw = (response.text or "").strip()
    #     
    #     # Remove markdown code blocks if present
    #     if raw.startswith("```json"):
    #         raw = raw[7:]
    #     if raw.startswith("```"):
    #         raw = raw[3:]
    #     if raw.endswith("```"):
    #         raw = raw[:-3]
    #     raw = raw.strip()
    #     
    #     data = json.loads(raw)
    #     selected = data.get("selected_specialists", [])
    #     if not isinstance(selected, list):
    #         return []
    #     return [k for k in selected if isinstance(k, str) and k in SPECIALISTS]
    # except Exception as e:
    #     # Fallback to all specialists on error
    #     print(f"Error selecting specialists: {e}")
    #     return list(SPECIALISTS.keys())


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


def parse_specialist_response(text: str) -> (Optional[str], Optional[str], str):
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
agent = Agent(
    name="Estate-Ai",
    seed="selector-agent",
    port=8005,
    mailbox=True,
    # endpoint="http://127.0.0.1:8005/submit",
    network="testnet",
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
    await ctx.send(sender, create_text_chat("Routing your request to the right specialists..."))

    # Select specialists
    selected = select_specialists_via_asi(user_text)
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

if __name__ == "__main__":
    agent.run()