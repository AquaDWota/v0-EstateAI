### Write code for the new module here and import it from agent.py.# protocol_models.py
from uagents import Model


# -----------------------------
# Existing structured output messages (used by your older main agent flow)
# -----------------------------
class StructuredOutputPrompt(Model):
    prompt: str
    output_schema: dict


class StructuredOutputResponse(Model):
    output: dict


# -----------------------------
# NEW: Correlated router <-> specialist protocol (fixes pending request correlation)
# -----------------------------
class SpecialistRequest(Model):
    request_id: str
    specialist: str  # e.g. "single_family" | "multi_family" | "condo" | "townhouse"
    user_text: str   # the user request or prompt to analyze


class SpecialistResult(Model):
    request_id: str
    specialist: str
    result: str      # specialist’s analysis (plain text or JSON string)
