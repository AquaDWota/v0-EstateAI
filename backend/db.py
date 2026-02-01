from __future__ import annotations

import os

from dotenv import dotenv_values, load_dotenv
from functools import lru_cache
from typing import Any, Dict

from pymongo import MongoClient
from pymongo.collection import Collection



class MongoSettingsError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise MongoSettingsError("MONGODB_URI is not set.")
    return MongoClient(uri)


def get_properties_collection() -> Collection[Dict[str, Any]]:
    load_dotenv("backend/.env")
    db_name = os.getenv("MONGODB_DB", "EstateAI")
    collection_name = os.getenv("MONGODB_COLLECTION", "Sample-Listing")

    return _client()[db_name][collection_name]