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
        meta={"zipCode": payload.zipCode, "summary": summary},
    )

@app.get("/api/properties/{zip_code}")
def get_properties(zip_code: str):
    properties = list(mongo.find({"zipCode": zip_code}))
    if not properties:
        return {}
    for prop in properties:
        prop["_id"] = str(prop["_id"])  # Convert ObjectId to string for JSON serialization
<<<<<<< Updated upstream
    return properties
=======
    return properties

from .agent.agent import AgentverseClient


# Example function to use AgentverseClient within an agent's message handler
# The context (ctx) would be provided by the uagents framework
def call_agent_with_user_data(ctx, property_data: dict):
    """
    Call this function from within a uagents message handler where ctx is available.
    Sends property data to the appropriate agent and returns analysis summary.
    
    Args:
        ctx: Context object provided by uagents framework
        property_data: Dictionary containing property information matching PropertyInput type
        
    Returns:
        AgentCommentary-like response with analysis summary
    """
    # Initialize the client with the provided context
    client = AgentverseClient(ctx=ctx)
    
    # Extract property type to determine which agent to call
    property_type = property_data.get("property_type", "single_family").lower()
    
    # Prepare analysis request data
    analysis_request = {
        "property": {
            "id": property_data.get("id"),
            "nickname": property_data.get("nickname"),
            "address": property_data.get("address"),
            "zipCode": property_data.get("zipCode"),
            "listPrice": property_data.get("listPrice"),
            "estimatedRent": property_data.get("estimatedRent"),
            "propertyTaxPerYear": property_data.get("propertyTaxPerYear"),
            "insurancePerYear": property_data.get("insurancePerYear"),
            "hoaPerYear": property_data.get("hoaPerYear"),
            "maintenancePerMonth": property_data.get("maintenancePerMonth"),
            "utilitiesPerMonth": property_data.get("utilitiesPerMonth"),
            "vacancyRatePercent": property_data.get("vacancyRatePercent"),
            "downPaymentPercent": property_data.get("downPaymentPercent"),
            "interestRatePercent": property_data.get("interestRatePercent"),
            "loanTermYears": property_data.get("loanTermYears"),
            "closingCosts": property_data.get("closingCosts"),
            "renovationBudget": property_data.get("renovationBudget"),
            "arv": property_data.get("arv"),
        }
    }

    # Call the appropriate agent based on property type
    if property_type == "single_family":
        response = client.callSingleFamily(analysis_request)
    elif property_type == "multi_family":
        response = client.callMultiFamily(analysis_request)
    elif property_type == "condo":
        response = client.callCondoFamily(analysis_request)
    elif property_type == "townhouse":
        response = client.callTownHouse(analysis_request)
    else:
        # Default to selector agent
        response = client.callSelectorAgent(analysis_request)
    
    return response


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
>>>>>>> Stashed changes
