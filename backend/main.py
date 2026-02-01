from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


from .db import MongoSettingsError, get_properties_collection
from .logic import analyze_properties
from .models import (
    AnalyzePropertiesRequest,
    AnalyzePropertiesResponse,
    MapProperty,
)


app = FastAPI(title="New England Deal Underwriter API")
mongo = get_properties_collection()

def _collection():
    try:
        return get_properties_collection()
    except MongoSettingsError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


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


@app.get("/api/properties", response_model=list[MapProperty])
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
    collection = _collection()
    query: dict = {}

    if zipCode:
        query["zipCode"] = zipCode
    if priceMin is not None or priceMax is not None:
        query["listPrice"] = {}
        if priceMin is not None:
            query["listPrice"]["$gte"] = priceMin
        if priceMax is not None:
            query["listPrice"]["$lte"] = priceMax
    if beds is not None:
        query["bedrooms"] = {"$gte": beds}
    if baths is not None:
        query["bathrooms"] = {"$gte": baths}
    if homeType:
        property_types = [value.strip() for value in homeType.split(",") if value.strip()]
        if property_types:
            query["propertyType"] = {"$in": property_types}

    # centerLat/centerLng are accepted for compatibility; ignoring without geospatial index.
    docs = list(collection.find(query, {"_id": 0}).limit(count))
    return docs


@app.get("/api/properties/{listing_id}", response_model=MapProperty)
def get_property(listing_id: str):
    collection = _collection()
    listing = collection.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Property not found.")
    return listing

