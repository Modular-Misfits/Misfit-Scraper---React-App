# backend/app/filters.py

from cachetools import TTLCache
from typing import Dict, Set, List
from fastapi import APIRouter

# Define the APIRouter instance
router = APIRouter()

# Static filters — these do not change between releases
PROGRAMS = ["SBIR", "STTR"]

COMPONENTS = [
    "ARMY", "CBD", "DARPA", "DHA", "MDA", "DTRA",
    "DMEA", "DLA", "NAVY", "OSD", "SOCOM", "USAF"
]

TOPIC_STATUSES = ["Pre-Release", "Open", "Closed"]

# Initialize a TTL cache: 1 item, expires every 10 minutes
filter_cache = TTLCache(maxsize=1, ttl=600)

# Dynamic filters — reset and reloaded at runtime
DYNAMIC_FILTERS = {
    "technology_areas": set(),
    "modernization_priorities": set(),
    "solicitations": set()
}

def extract_dynamic_filters(topics: List[Dict]):
    """Populate dynamic filter sets from API response data."""
    DYNAMIC_FILTERS["technology_areas"].clear()
    DYNAMIC_FILTERS["modernization_priorities"].clear()
    DYNAMIC_FILTERS["solicitations"].clear()

    for topic in topics:
        if tech := topic.get("technologyAreaTitle"):
            DYNAMIC_FILTERS["technology_areas"].add(tech)

        if mods := topic.get("modernizationPriorities"):
            for mod in mods:
                DYNAMIC_FILTERS["modernization_priorities"].add(mod)

        if sol := topic.get("solicitationTitle"):
            DYNAMIC_FILTERS["solicitations"].add(sol)

    # Convert sets to sorted lists
    for key in DYNAMIC_FILTERS:
        DYNAMIC_FILTERS[key] = sorted(DYNAMIC_FILTERS[key])

def get_all_filters() -> Dict[str, List[str]]:
    """Return merged static and dynamic filters."""
    if "filters" in filter_cache:
        return filter_cache["filters"]

    all_filters = {
        "programs": PROGRAMS,
        "components": COMPONENTS,
        "topic_statuses": TOPIC_STATUSES,
        "technology_areas": DYNAMIC_FILTERS["technology_areas"],
        "modernization_priorities": DYNAMIC_FILTERS["modernization_priorities"],
        "solicitations": DYNAMIC_FILTERS["solicitations"]
    }

    filter_cache["filters"] = all_filters
    return all_filters

# Define the endpoint using the router
@router.get("/filters")
def get_filters_endpoint():
    """Endpoint to return all filters."""
    return get_all_filters()