from __future__ import annotations

from typing import Any, Dict, Optional

from uagents import Context, Model


agents_id: Dict[str, str] = {
    "selector": "agent1qgkq02guhyjsvdlum38rc6jm6y6wdsc6zy8jw267cjadf2a09ydag36t75n",
    "single_family": "agent1qfx2t3l547y6fxh36sdlpdul6enjwq9ln7temx0svga45k8wpte6u0gx806",
    "multi_family": "agent1qg9sdk22q7esjn6pkgszxkdeftvuu6wdf9lyldz9ymmh5987cx4u6aca03v",
    "condo": "agent1qgw377xy88pww76us3c0y3v5vp9cdfuhya0w6ygy5ynd9e2klmxd29ru52m",
    "townhouse": "agent1qv3jmxq2p0aj20tx9fsy4p84svqpxfysweajsjuxgstedl598xmxx42fn3h",
}


class AgentMessage(Model):
    subject: str
    message: Dict[str, Any]


class AgentverseClient:
    """
    Small helper to call your Agentverse agents using your custom message format.
    """
    def __init__(self, ctx: Optional[Context] = None) -> None:
        self.ctx = ctx

    def _build_message(self, subject: str, body: Dict[str, Any]) -> AgentMessage:
        """
        Build YOUR custom message shape here.

        If your agents already expect fields like `subject` + `message`,
        keep it exactly matching what your agents parse.
        """
        return AgentMessage(subject=subject, message=body)

    def call_agent(
        self,
        agent_key: str,
        subject: str,
        body: Dict[str, str],
        *,
        timeout_s: Optional[int] = None,
    ) -> Any:
        """
        Generic caller: pick agent by key, send a custom message, return response.
        """
        if agent_key not in agents_id:
            raise KeyError(f"Unknown agent_key={agent_key!r}. Valid: {list(agents_id.keys())}")

        agent_address = agents_id[agent_key]
        payload = self._build_message(subject=subject, body=body)

        # NOTE: Using ctx.send() if context is available, otherwise raise error
        if self.ctx is None:
            raise RuntimeError("Context is required to send messages to agents")
        
        response = self.ctx.send(agent_address, payload)
        return response

    # ---- Thin wrappers (nice ergonomics) ----

    def callSelectorAgent(self, body: Dict[str, Any]) -> Any:
        return self.call_agent("selector", subject="selector", body=body)

    def callSingleFamily(self, body: Dict[str, Any]) -> Any:
        return self.call_agent("single_family", subject="single_family", body=body)

    def callMultiFamily(self, body: Dict[str, Any]) -> Any:
        return self.call_agent("multi_family", subject="multi_family", body=body)

    def callCondoFamily(self, body: Dict[str, Any]) -> Any:
        return self.call_agent("condo", subject="condo", body=body)

    def callTownHouse(self, body: Dict[str, Any]) -> Any:
        return self.call_agent("townhouse", subject="townhouse", body=body)
