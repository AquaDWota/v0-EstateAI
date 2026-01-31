from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .logic import analyze_properties
from .models import (
    AnalyzePropertiesRequest,
    AnalyzePropertiesResponse,
    MapProperty,
)
from .sample_data import get_listing, load_sample_data, query_listings


app = FastAPI(title="New England Deal Underwriter API")


@app.on_event("startup")
def _load_data() -> None:
    load_sample_data()


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


@app.get("/api/properties", response_model=List[MapProperty])
def list_properties(
    zipCode: Optional[str] = None,
    centerLat: Optional[float] = None,
    centerLng: Optional[float] = None,
    count: int = Query(50, ge=1, le=500),
    priceMin: Optional[float] = None,
    priceMax: Optional[float] = None,
    beds: Optional[int] = None,
    baths: Optional[int] = None,
    homeType: Optional[str] = None,
):
    property_types = homeType.split(",") if homeType else None
    listings = query_listings(
        zip_code=zipCode,
        center_lat=centerLat,
        center_lng=centerLng,
        count=count,
        price_min=priceMin,
        price_max=priceMax,
        beds=beds,
        baths=baths,
        property_types=property_types,
    )
    return listings


@app.get("/api/properties/{listing_id}", response_model=MapProperty)
def get_property(listing_id: str):
    listing = get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Property not found.")
    return listing

