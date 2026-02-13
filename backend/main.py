from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


from db import MongoSettingsError, get_properties_collection
from logic import analyze_properties
from models import (
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

# Agent integration - the specialized agents in backend/agents/ run separately
import httpx
from typing import Dict, Any
import json
import os


# Estate AI Agent Configuration
ESTATE_AI_AGENT_ADDRESS = "agent1qgkq02guhyjsvdlum38rc6jm6y6wdsc6zy8jw267cjadf2a09ydag36t75n"
AGENTVERSE_MAILBOX_API_URL = "https://agentverse.ai/v1/mailbox"

# Get agent endpoint from environment (defaults to localhost for development)
AGENT_ENDPOINT = os.getenv("AGENT_ENDPOINT", "http://127.0.0.1:8005") #change to cloudflared url if non-local development


async def send_message_to_agent(agent_address: str, message_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send a message to a uagent via the Agentverse mailbox.
    
    Args:
        agent_address: The agent's address on testnet/mainnet
        message_data: The data to send to the agent
        
    Returns:
        Response from the agent
    """
    api_key = os.getenv("AGENTVERSE_API_KEY")
    
    if not api_key:
        # If no API key, try agent endpoint (for development)
        # Estate_AI_agent runs on port 8005 locally or via tunnel
        try:
            agent_url = f"{AGENT_ENDPOINT}/submit" if not AGENT_ENDPOINT.endswith("/submit") else AGENT_ENDPOINT
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    agent_url,
                    json=message_data,
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Local agent call failed: {e}")
            pass
    
    # Use Agentverse mailbox API
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "destination": agent_address,
        "message": message_data,
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            AGENTVERSE_MAILBOX_API_URL,
            json=payload,
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to communicate with agent: {response.text}"
            )
        
        return response.json()


async def call_agent_with_analysis_data(analysis_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send property data to Estate AI agent for analysis and get AI commentary.
    
    Args:
        analysis_payload: Dictionary containing:
            - input: Original request data (with properties, zipCode, globalAssumptions)
            - results: Analysis results for all properties
            - summary: Overall summary text
            
    Returns:
        Agent commentary response with investment insights
    """
    if not analysis_payload.get("results"):
        raise HTTPException(status_code=400, detail="No results in analysis payload")
    
    # Try to send to Estate AI agent
    try:
        input_data = analysis_payload.get("input", {})
        
        # Send to Estate AI agent's REST endpoint (local or remote)
        agent_url = f"{AGENT_ENDPOINT}/api/analyze" if not AGENT_ENDPOINT.endswith("/api/analyze") else AGENT_ENDPOINT
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                agent_url,
                json={
                    "properties": input_data.get("properties", []),
                    "zipCode": input_data.get("zipCode", ""),
                    "globalAssumptions": input_data.get("globalAssumptions", {})
                }
            )
            
            if response.status_code == 200:
                agent_response = response.json()
                print(f"✅ Estate AI agent responded: {agent_response.get('message')}")
                
                # Format agent responses into commentary
                results = agent_response.get("results", [])
                
                # Combine analyses
                analyses = [r.get("analysis", "") for r in results if r.get("analysis")]
                combined_analysis = "\n\n---\n\n".join(analyses) if analyses else ""
                
                # Use first 500 chars for summaries
                cash_flow_summary = combined_analysis[:500] if combined_analysis else "Analysis completed by Estate AI"
                
                # Extract key insights for different sections from the combined analysis
                analysis_lines = combined_analysis.split('\n')
                
                # Try to parse sections from the analysis
                cash_flow_section = ""
                risk_section = ""
                market_section = ""
                renovation_section = ""
                
                for i, line in enumerate(analysis_lines):
                    line_upper = line.upper()
                    if 'CASH FLOW' in line_upper or 'MONTHLY' in line_upper:
                        # Get next few lines
                        cash_flow_section += '\n'.join(analysis_lines[i:min(i+3, len(analysis_lines))])
                    elif 'RISK' in line_upper:
                        risk_section += '\n'.join(analysis_lines[i:min(i+3, len(analysis_lines))])
                    elif 'MARKET' in line_upper or 'TIMING' in line_upper:
                        market_section += '\n'.join(analysis_lines[i:min(i+3, len(analysis_lines))])
                    elif 'RENOVATION' in line_upper or 'REPAIR' in line_upper:
                        renovation_section += '\n'.join(analysis_lines[i:min(i+3, len(analysis_lines))])
                
                return {
                    "cashFlowSummary": cash_flow_section[:300] if cash_flow_section else cash_flow_summary,
                    "riskSummary": risk_section[:300] if risk_section else "AI-powered risk assessment completed. See detailed analysis below.",
                    "marketTimingSummary": market_section[:300] if market_section else "Market timing analysis from AI specialists. See detailed analysis below.",
                    "renovationSummary": renovation_section[:300] if renovation_section else "Renovation insights included in detailed analysis.",
                    "overallSummary": analysis_payload.get("summary", ""),
                    "keyBullets": [
                        f"✓ Processed by Estate AI: {len(results)} properties analyzed",
                        f"✓ Analysis type: {results[0].get('type', 'N/A').title() if results else 'N/A'}",
                        f"✓ Top property: {analysis_payload['results'][0].get('property', {}).get('nickname', 'N/A')}",
                        f"✓ Comprehensive AI investment analysis generated"
                    ],
                    "detailedAnalysis": combined_analysis
                }
    
    except Exception as e:
        print(f"⚠️ Could not reach Estate AI agent: {e}")
        print("Falling back to metrics-based commentary")
    
    # Fallback: Generate commentary from metrics
    try:
        top_property = analysis_payload["results"][0]
        property_data = top_property.get("property", {})
        metrics = top_property.get("metrics", {})
        property_type = property_data.get("type", "")
        
        cash_flow_summary = f"""Analyzed {len(analysis_payload['results'])} properties. 
Top property generates ${metrics.get('monthlyCashFlow', 0):.2f}/month in cash flow with a 
{metrics.get('capRatePercent', 0):.2f}% cap rate."""
        
        risk_summary = f"""Risk Level: {metrics.get('riskLevel', 'medium').upper()}
Monthly expenses: ${metrics.get('monthlyOperatingExpenses', 0):.2f}
Vacancy impact considered at {property_data.get('vacancyRatePercent', 5)}%"""
        
        timing_summary = f"""Recommendation: {metrics.get('timingRecommendation', 'watch').replace('_', ' ').upper()}"""
        
        renovation_summary = f"""Renovation budget: ${property_data.get('renovationBudget', 0):,.0f}
ARV: ${property_data.get('arv', 0):,.0f}"""
        
        type_insights = ""
        if property_type == "multi-family":
            type_insights = "Multi-family properties offer income diversification."
        elif property_type == "single-family":
            type_insights = "Single-family homes typically see strong appreciation."
        elif property_type == "condo":
            type_insights = "Condo investments require attention to HOA fees."
        elif property_type == "townhouse":
            type_insights = "Townhouses balance appreciation with shared maintenance."
        else:
            type_insights = "General property analysis completed."
        
        overall = f"""{analysis_payload.get('summary', '')}

{type_insights}

5-year projection: ${metrics.get('fiveYearTotalCashFlow', 0):,.0f} cash flow, 
${metrics.get('fiveYearEquityBuilt', 0):,.0f} equity built."""
        
        return {
            "cashFlowSummary": cash_flow_summary,
            "riskSummary": risk_summary,
            "marketTimingSummary": timing_summary,
            "renovationSummary": renovation_summary,
            "overallSummary": overall,
            "keyBullets": [
                f"Monthly Cash Flow: ${metrics.get('monthlyCashFlow', 0):.2f}",
                f"Cash-on-Cash Return: {metrics.get('cashOnCashReturnPercent', 0):.2f}%",
                f"Cap Rate: {metrics.get('capRatePercent', 0):.2f}%",
                f"5-Year ROI: {metrics.get('fiveYearTotalRoiPercent', 0):.1f}%"
            ]
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "cashFlowSummary": "Analysis completed",
            "riskSummary": "Risk assessment included",
            "marketTimingSummary": "Market analysis included",
            "renovationSummary": "Renovation insights included",
            "overallSummary": analysis_payload.get("summary", "Analysis complete"),
            "keyBullets": ["Analysis complete"]
        }


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
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
