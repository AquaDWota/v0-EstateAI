from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


from .db import MongoSettingsError, get_properties_collection
from .logic import analyze_properties
from .models import (
    AnalyzePropertiesRequest,
    AnalyzePropertiesResponse,
)


app = FastAPI(title="New England Deal Underwriter API")
mongo = get_properties_collection()

@app.exception_handler(HTTPException)
def _http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
def _validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"error": "Invalid request payload."})


@app.post("/analyze-properties", response_model=AnalyzePropertiesResponse)
def analyze_properties_route(payload: AnalyzePropertiesRequest):
    if not payload.zipCode or len(payload.properties) < 2:
        raise HTTPException(status_code=400, detail="ZIP code and at least 2 properties are required.")
    if len(payload.properties) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 properties allowed per analysis.")

    results = analyze_properties(payload.properties, payload.globalAssumptions, payload.zipCode)
    results.sort(key=lambda item: item.overallScore, reverse=True)

    top = results[0]
    summary = (
        f"Analyzed {len(results)} properties in ZIP {payload.zipCode}. "
        f"Top pick: {top.property.nickname} with "
        f"{top.metrics.cashOnCashReturnPercent:.1f}% cash-on-cash return and "
        f"{top.metrics.riskLevel} risk profile."
    )
    return AnalyzePropertiesResponse(
        results=results,
        meta={
            "zipCode": payload.zipCode,
            "summary": summary,
            "aiPayload": {
                "input": payload.model_dump(),
                "results": [item.model_dump() for item in results],
                "summary": summary,
            },
        },
    )

@app.get("/api/properties/{zip_code}")
def get_properties(zip_code: str):
    properties = list(mongo.find({"zipCode": zip_code}))
    if not properties:
        return {}
    for prop in properties:
        prop["_id"] = str(prop["_id"])  # Convert ObjectId to string for JSON serialization
    return properties

from .agent.agent import AgentverseClient
import httpx
from typing import Dict, Any


async def call_agent_with_analysis_data(analysis_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call the agent with analysis data from the underwriting results.
    This function sends the data to Agentverse agents via HTTP.
    
    Args:
        analysis_payload: Dictionary containing:
            - input: Original request data
            - results: Analysis results for all properties
            - summary: Overall summary text
            
    Returns:
        Agent commentary response with investment insights
    """
    # Prepare the payload for the agent
    # Extract the top property from results to determine which agent to call
    if not analysis_payload.get("results"):
        raise HTTPException(status_code=400, detail="No results in analysis payload")
    
    top_property = analysis_payload["results"][0]
    property_type = top_property.get("property", {}).get("propertyType", "single_family").lower()
    
    # Map property types to agent addresses
    agents_id = {
        "selector": "agent1qgkq02guhyjsvdlum38rc6jm6y6wdsc6zy8jw267cjadf2a09ydag36t75n",
        "single_family": "agent1qfx2t3l547y6fxh36sdlpdul6enjwq9ln7temx0svga45k8wpte6u0gx806",
        "multi_family": "agent1qg9sdk22q7esjn6pkgszxkdeftvuu6wdf9lyldz9ymmh5987cx4u6aca03v",
        "condo": "agent1qgw377xy88pww76us3c0y3v5vp9cdfuhya0w6ygy5ynd9e2klmxd29ru52m",
        "townhouse": "agent1qv3jmxq2p0aj20tx9fsy4p84svqpxfysweajsjuxgstedl598xmxx42fn3h",
    }
    
    agent_key = property_type.replace(" ", "_")
    if agent_key not in agents_id:
        agent_key = "selector"
    
    # For now, return a mock response since we need proper Agentverse setup
    # TODO: Replace with actual Agentverse API call
    mock_response = {
        "cashFlowSummary": f"Analysis of {len(analysis_payload['results'])} properties completed",
        "riskSummary": "Risk assessment based on market conditions",
        "marketTimingSummary": "Current market analysis",
        "renovationSummary": "Renovation recommendations",
        "overallSummary": analysis_payload.get("summary", "Investment analysis complete"),
        "keyBullets": [
            "Property analysis complete",
            f"Top property: {top_property.get('property', {}).get('nickname', 'N/A')}",
            f"Overall score: {top_property.get('overallScore', 0):.2f}"
        ]
    }
    
    return mock_response


@app.post("/api/agent-commentary")
async def get_agent_commentary(payload: AnalyzePropertiesRequest):
    """
    Analyze properties and get AI agent commentary on the results.
    This endpoint combines property analysis with agent insights.
    """
    # First, run the property analysis
    if not payload.zipCode or len(payload.properties) < 2:
        raise HTTPException(status_code=400, detail="ZIP code and at least 2 properties are required.")
    if len(payload.properties) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 properties allowed per analysis.")

    results = analyze_properties(payload.properties, payload.globalAssumptions, payload.zipCode)
    results.sort(key=lambda item: item.overallScore, reverse=True)

    top = results[0]
    summary = (
        f"Analyzed {len(results)} properties in ZIP {payload.zipCode}. "
        f"Top pick: {top.property.nickname} with "
        f"{top.metrics.cashOnCashReturnPercent:.1f}% cash-on-cash return and "
        f"{top.metrics.riskLevel} risk profile."
    )
    
    # Prepare the AI payload
    ai_payload = {
        "input": payload.model_dump(),
        "results": [item.model_dump() for item in results],
        "summary": summary,
    }
    
    # Get agent commentary
    agent_response = await call_agent_with_analysis_data(ai_payload)
    
    return {
        "analysis": {
            "results": results,
            "meta": {
                "zipCode": payload.zipCode,
                "summary": summary,
            }
        },
        "agentCommentary": agent_response
    }


# Example usage within a uagents agent message handler:
"""
from uagents import Agent, Context, Model

class PropertyAnalysisRequest(Model):
    property_data: dict

agent = Agent(name="property_analyzer")

@agent.on_message(model=PropertyAnalysisRequest)
async def handle_property_analysis(ctx: Context, sender: str, msg: PropertyAnalysisRequest):
    # Example property data
    property_data = {
        "id": "prop-001",
        "nickname": "Boston Triple Decker",
        "address": "123 Main St, Boston, MA",
        "zipCode": "02118",
        "listPrice": 750000,
        "estimatedRent": 4500,
        "propertyTaxPerYear": 8000,
        "insurancePerYear": 1500,
        "hoaPerYear": 0,
        "maintenancePerMonth": 300,
        "utilitiesPerMonth": 200,
        "vacancyRatePercent": 5,
        "downPaymentPercent": 20,
        "interestRatePercent": 6.5,
        "loanTermYears": 30,
        "closingCosts": 15000,
        "renovationBudget": 50000,
        "arv": 850000,
        "property_type": "multi_family"
    }
    
    # Call the function with ctx and property data
    analysis_summary = call_agent_with_user_data(ctx, property_data)
    
    ctx.logger.info(f"Property Analysis Summary: {analysis_summary}")
    
    # The response would contain:
    # - cashFlowSummary: Analysis of monthly cash flow
    # - riskSummary: Risk assessment 
    # - marketTimingSummary: Market timing recommendation
    # - renovationSummary: Renovation potential analysis
    # - overallSummary: Overall investment recommendation
    # - keyBullets: List of key takeaways

if __name__ == "__main__":
    agent.run()
"""
