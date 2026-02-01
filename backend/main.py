from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .logic import analyze_properties
from .models import (
    AnalyzePropertiesRequest,
    AnalyzePropertiesResponse,
)


app = FastAPI(title="New England Deal Underwriter API")


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
    return [
      {
        "id": "prop-0001",
        "address": "121 Summer Street",
        "zipCode": "06114",
        "lat": 41.721884,
        "lng": -72.694396,
        "listPrice": 915888,
        "bedrooms": 2,
        "bathrooms": 2,
        "sqft": 3188,
        "propertyType": "condo",
        "yearBuilt": 2006,
        "estimatedRent": 6577,
        "propertyTaxPerYear": 10285,
        "insurancePerYear": 4107,
        "hoaPerYear": 6726
      },
      {
        "id": "prop-0002",
        "address": "331 Hill Road",
        "zipCode": "02125",
        "lat": 42.315568,
        "lng": -71.06041,
        "listPrice": 1233536,
        "bedrooms": 5,
        "bathrooms": 3,
        "sqft": 2492,
        "propertyType": "townhouse",
        "yearBuilt": 1983,
        "estimatedRent": 7681,
        "propertyTaxPerYear": 15747,
        "insurancePerYear": 6089,
        "hoaPerYear": 6097
      },
      {
        "id": "prop-0003",
        "address": "117 School Street",
        "zipCode": "02136",
        "lat": 41.783125,
        "lng": -71.425447,
        "listPrice": 1621125,
        "bedrooms": 2,
        "bathrooms": 2,
        "sqft": 3298,
        "propertyType": "single-family",
        "yearBuilt": 1950,
        "estimatedRent": 7991,
        "propertyTaxPerYear": 16378,
        "insurancePerYear": 6153,
        "hoaPerYear": 0
      },
    ]
