from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from .models import MapProperty


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT_DIR / "data" / "sample-listings.json"

all_listings: List[MapProperty] = []
listings_by_id: Dict[str, MapProperty] = {}


def load_sample_data() -> None:
    global all_listings, listings_by_id
    if not DATA_PATH.exists():
        all_listings = []
        listings_by_id = {}
        return
    with DATA_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    all_listings = [MapProperty.model_validate(item) for item in data]
    listings_by_id = {item.id: item for item in all_listings}


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 3958.8
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def _filter_listings(
    listings: Iterable[MapProperty],
    zip_code: Optional[str],
    price_min: Optional[float],
    price_max: Optional[float],
    beds: Optional[int],
    baths: Optional[int],
    property_types: Optional[List[str]],
) -> List[MapProperty]:
    filtered = []
    for item in listings:
        if zip_code and item.zipCode != zip_code:
            continue
        if price_min is not None and item.listPrice < price_min:
            continue
        if price_max is not None and item.listPrice > price_max:
            continue
        if beds is not None and item.bedrooms < beds:
            continue
        if baths is not None and item.bathrooms < baths:
            continue
        if property_types and item.propertyType not in property_types:
            continue
        filtered.append(item)
    return filtered


def query_listings(
    zip_code: Optional[str] = None,
    center_lat: Optional[float] = None,
    center_lng: Optional[float] = None,
    count: int = 50,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    beds: Optional[int] = None,
    baths: Optional[int] = None,
    property_types: Optional[List[str]] = None,
) -> List[MapProperty]:
    listings = _filter_listings(
        all_listings,
        zip_code=zip_code,
        price_min=price_min,
        price_max=price_max,
        beds=beds,
        baths=baths,
        property_types=property_types,
    )

    if center_lat is not None and center_lng is not None:
        listings = sorted(
            listings,
            key=lambda item: _haversine_miles(center_lat, center_lng, item.lat, item.lng),
        )

    return listings[:count]


def get_listing(listing_id: str) -> Optional[MapProperty]:
    return listings_by_id.get(listing_id)

