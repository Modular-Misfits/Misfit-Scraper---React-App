# backend/app/routes.py

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx
import urllib.parse

from .filters import extract_dynamic_filters, get_all_filters

router = APIRouter()

BASE_URL = "https://www.dodsbirsttr.mil/topics/api/public/topics"

@router.get("/topics")
async def get_topics(
    term: Optional[str] = Query(None),
    program: Optional[List[str]] = Query(None),
    component: Optional[List[str]] = Query(None),
    technology_area: Optional[List[str]] = Query(None),
    modernization_priority: Optional[List[str]] = Query(None),
    solicitation: Optional[List[str]] = Query(None),
    topic_status: Optional[List[str]] = Query(None),
    page: int = 0,
    page_size: int = 10
):
    try:
        search_payload = {
            "searchText": term,
            "components": component,
            "programYear": None,
            "solicitationCycleNames": ["openTopics"],
            "releaseNumbers": [],
            "topicReleaseStatus": [591, 592],
            "modernizationPriorities": modernization_priority,
            "sortBy": "finalTopicCode,asc",
            "technologyAreaIds": [],
            "component": component,
            "program": program
        }

        payload_str = urllib.parse.quote(str(search_payload).replace("'", '\"'))
        params = {"searchParam": payload_str, "size": page_size, "page": page}

        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/search", params=params)
            response.raise_for_status()
            data = response.json()

        # Refresh dynamic filters cache
        extract_dynamic_filters(data.get("data", []))

        return {
            "topics": data.get("data", []),
            "total": data.get("total", 0),
            "page": page,
            "page_size": page_size,
            "has_more": (page + 1) * page_size < data.get("total", 0)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/questions/{topic_id}")
async def get_questions(topic_id: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/{topic_id}/questions")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=404, detail=f"Questions not found for topic {topic_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filters")
async def get_filters():
    try:
        return get_all_filters()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load filters: {e}")
