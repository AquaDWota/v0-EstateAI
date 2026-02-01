import os
import uuid
import threading
from typing import Dict, Any, List

from fastapi import FastAPI, Request, HTTPException
from uagents.crypto import Identity
from fetchai.communication import parse_message_from_agent, send_message_to_agent

# ----------------------------
# Config
# ----------------------------
AI_KEY = os.getenv("@selectoragent")  # orchestrator agent seed (identity seed, NOT an API key)
if not AI_KEY:
    raise RuntimeError("Missing AI_KEY env var (your orchestrator identity seed)")

SELECTOR_AGENT_ADDRESS = os.getenv("agent1qgkq02guhyjsvdlum38rc6jm6y6wdsc6zy8jw267cjadf2a09ydag36t75n")
if not SELECTOR_AGENT_ADDRESS:
    raise RuntimeError("Missing SELECTOR_AGENT_ADDRESS env var")

# Specialist addresses (agent1... deployed agents)
SPECIALIST_ADDRESS_MAP = {
    "single_family": os.getenv("SINGLE_FAMILY_AGENT_ADDRESS", "agent1qfx2t3l547y6fxh36sdlpdul6enjwq9ln7temx0svga45k8wpte6u0gx806"),
    "multi_family": os.getenv("MULTI_FAMILY_AGENT_ADDRESS", "agent1qg9sdk22q7esjn6pkgszxkdeftvuu6wdf9lyldz9ymmh5987cx4u6aca03v"),
    "condo": os.getenv("CONDO_AGENT_ADDRESS", "agent1qgw377xy88pww76us3c0y3v5vp9cdfuhya0w6ygy5ynd9e2klmxd29ru52m"),
    "townhouse": os.getenv("TOWNHOUSE_AGENT_ADDRESS", "agent1qv3jmxq2p0aj20tx9fsy4p84svqpxfysweajsjuxgstedl598xmxx42fn3h"),
}

# Validate specialist addresses only when needed (some users may not run all)
# Orchestrator identity
ORCH_IDENTITY = Identity.from_seed(AI_KEY, 0)

# In-memory correlation store: request_id -> {"event": Event, "data": Optional[dict]}
_PENDING: Dict[str, Dict[str, Any]] = {}

app = FastAPI()


# ----------------------------
# Helpers
# ----------------------------
def _new_pending(request_id: str):
    _PENDING[request_id] = {"event": threading.Event(), "data": None}


def _wait_for_response(request_id: str, timeout_s: int = 30) -> Dict[str, Any]:
    entry = _PENDING.get(request_id)
    if not entry:
        raise RuntimeError("Unknown request_id")

    event: threading.Event = entry["event"]
    ok = event.wait(timeout=timeout_s)

    if not ok or entry.get("data") is None:
        raise TimeoutError(f"Timed out waiting for agent response (request_id={request_id})")

    return entry["data"]


def build_specialist_query(specialist_key: str, user_text: str, backend_info: Dict[str, Any]) -> str:
    """
    Builds a specialist-specific query/prompt based on selector output.
    Keep it simple, deterministic, and non-hallucinated.

    You can enrich this later with real backend context (DB lookups, listings, etc.).
    """
    label = {
        "single_family": "single-family homes",
        "multi_family": "multi-family homes (duplex/triplex/4-plex/apartments)",
        "condo": "condos",
        "townhouse": "townhouses",
    }.get(specialist_key, specialist_key)

    # If your backend computes extra context (zip, listings ids, etc.) include it here
    zip_code = backend_info.get("zip") or backend_info.get("zipCode") or ""

    extra = f" ZIP={zip_code}" if zip_code else ""
    return f"Specialist focus: {label}.{extra}\nUser request: {user_text}"


def _parse_selector_reply(selector_reply: Dict[str, Any]) -> Dict[str, Any]:
    """
    Supports two selector reply formats:

    A) New format (recommended):
       {"request_id": "...", "selected_specialists": ["condo", "single_family"]}

    B) Old format (single target):
       {"request_id": "...", "selected_agent_address": "agent1...", "payload": {...}}
    """
    # New format
    selected_specialists = selector_reply.get("selected_specialists")
    if isinstance(selected_specialists, list) and all(isinstance(x, str) for x in selected_specialists):
        cleaned = [x.strip() for x in selected_specialists if x.strip()]
        if not cleaned:
            raise RuntimeError(f"Selector returned empty selected_specialists: {selector_reply}")
        return {"mode": "by_specialist_keys", "selected_specialists": cleaned}

    # Old format
    selected_agent = selector_reply.get("selected_agent_address")
    payload = selector_reply.get("payload")
    if selected_agent and isinstance(payload, dict):
        return {"mode": "direct_address", "selected_agent_address": selected_agent, "payload": payload}

    raise RuntimeError(f"Selector returned unrecognized routing format: {selector_reply}")


# ----------------------------
# Webhook endpoint for Agentverse -> your orchestrator
# ----------------------------
@app.post("/webhook")
async def webhook(request: Request):
    raw = (await request.body()).decode("utf-8")

    try:
        msg = parse_message_from_agent(raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Bad agent message: {e}")

    payload = msg.payload  # dict sent by remote agent

    request_id = payload.get("request_id")
    if not request_id:
        return {"status": "ignored (missing request_id)"}

    entry = _PENDING.get(request_id)
    if not entry:
        return {"status": "ignored (unknown request_id)"}

    entry["data"] = payload
    entry["event"].set()

    return {"status": "ok"}


# ----------------------------
# Core pipeline
# ----------------------------
def route_query_via_selector(user_text: str, backend_info: Dict[str, Any], timeout_s: int = 30) -> Dict[str, Any]:
    """
    1) Call selector agent with (user_text + backend_info)
    2) Selector replies with either:
       - selected_specialists: ["condo","single_family"...]
       OR (legacy)
       - selected_agent_address + payload
    3) Build specialist query/payload per selected specialist
    4) Send to specialist agent(s)
    5) Return aggregated results + selected agents info
    """
    base_request_id = str(uuid.uuid4())

    # ---- Step 1: call selector
    selector_request_id = f"{base_request_id}:selector"
    _new_pending(selector_request_id)

    selector_payload = {
        "request_id": selector_request_id,
        "text": user_text,
        "backend": backend_info,
        "task": "select_specialist",
    }

    send_message_to_agent(
        ORCH_IDENTITY,
        SELECTOR_AGENT_ADDRESS,
        selector_payload,
    )

    # ---- Step 2: wait for selector response
    selector_reply = _wait_for_response(selector_request_id, timeout_s=timeout_s)

    routing = _parse_selector_reply(selector_reply)

    # ---- Step 3+4: call specialist(s)
    if routing["mode"] == "direct_address":
        # Legacy mode: selector already picked an agent address + payload.
        specialist_request_id = f"{base_request_id}:specialist"
        _new_pending(specialist_request_id)

        forward_payload = {
            "request_id": specialist_request_id,
            "task": "run",
            **routing["payload"],
        }

        selected_agent_address = routing["selected_agent_address"]

        send_message_to_agent(
            ORCH_IDENTITY,
            selected_agent_address,
            forward_payload,
        )

        specialist_reply = _wait_for_response(specialist_request_id, timeout_s=timeout_s)

        return {
            "ok": True,
            "selector_reply": selector_reply,
            "selected_specialists": [],
            "selected_agents": [{"address": selected_agent_address}],
            "results": {"direct": specialist_reply},
        }

    # New mode: selector returns specialist keys
    selected_specialists: List[str] = routing["selected_specialists"]

    # Validate addresses exist for the chosen keys
    selected_agents = []
    for key in selected_specialists:
        addr = SPECIALIST_ADDRESS_MAP.get(key, "")
        if not addr:
            raise RuntimeError(
                f"Selector chose '{key}' but no address configured. "
                f"Set env var for it (e.g., {key.upper()}_AGENT_ADDRESS) or update SPECIALIST_ADDRESS_MAP."
            )
        selected_agents.append({"specialist": key, "address": addr})

    results: Dict[str, Any] = {}

    # You can run these sequentially (simple) or in parallel (more complex).
    # Sequential is easiest to debug.
    for item in selected_agents:
        key = item["specialist"]
        addr = item["address"]

        specialist_request_id = f"{base_request_id}:{key}"
        _new_pending(specialist_request_id)

        specialist_query = build_specialist_query(key, user_text, backend_info)

        forward_payload = {
            "request_id": specialist_request_id,
            "task": "run",
            # This is the "query" you asked to build from selector output:
            "text": specialist_query,
            # keep originals too (often useful)
            "original_text": user_text,
            "backend": backend_info,
            "specialist": key,
        }

        send_message_to_agent(
            ORCH_IDENTITY,
            addr,
            forward_payload,
        )

        results[key] = _wait_for_response(specialist_request_id, timeout_s=timeout_s)

    return {
        "ok": True,
        "selector_reply": selector_reply,
        "selected_specialists": selected_specialists,
        "selected_agents": selected_agents,
        "results": results,
    }


# ----------------------------
# Simple test route
# ----------------------------
@app.post("/run")
async def run_pipeline(body: Dict[str, Any]):
    user_text = body.get("text", "")
    backend_info = body.get("backend", {})

    if not user_text:
        raise HTTPException(status_code=400, detail="Missing 'text'")

    try:
        result = route_query_via_selector(user_text, backend_info, timeout_s=45)
        return result
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
