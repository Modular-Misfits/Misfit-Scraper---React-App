# Misfit-Opportunity-Scraper - Alpha/backend/app/routes.py
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import StreamingResponse # Added for PDF streaming
import httpx
import json
import logging
import io # Added for BytesIO

# Assuming FilterManager is correctly defined in your filters.py
# from .filters import get_filter_manager, FilterManager # Uncomment or adjust if FilterManager is used

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO) # Or your preferred logging level

router = APIRouter()

DOD_BASE_URL = "https://www.dodsbirsttr.mil/topics/api/public/topics"

# Define the external PDF API template (as discussed)
PDF_API_TEMPLATE_EXTERNAL = "https://www.dodsbirsttr.mil/topics/api/public/topics/{topic_uid}/download/PDF"


@router.get("/topics", summary="Search DoD SBIR/STTR Topics", tags=["topics"])
async def search_topics(
    request: Request,
    q: str = Query(None, description="Search term"),
    program: str = Query(None, description="Program (SBIR or STTR)"),
    # Add other query parameters as they are defined in your frontend/API contract
    # For example:
    component: str = Query(None, description="DoD Component"),
    topic_status: str = Query(None, description="Topic Status"), # Assuming name alignment
    solicitation: str = Query(None, description="Solicitation"),
    technology_area: str = Query(None, description="Technology Area"),
    modernization_priority: str = Query(None, description="Modernization Priority"),
    page: int = Query(0, ge=0, description="Page number for pagination"),
    size: int = Query(25, ge=1, le=100, description="Number of results per page")
):
    """
    Proxy endpoint to search for topics from the DoD SBIR/STTR API.
    Constructs a query based on provided parameters.
    """
    search_params_dict = {}
    if q:
        search_params_dict["searchText"] = q
    if program and program.lower() != "all":
        search_params_dict["program"] = program
    if component and component.lower() != "all":
        # Assuming API uses 'components' or similar, adjust if needed
        search_params_dict["components"] = [component] if component else None # API might expect a list
    if topic_status and topic_status.lower() != "all":
        search_params_dict["topicStatus"] = topic_status # Adjust key if API uses different like 'topicStatuses'
    if solicitation and solicitation.lower() != "all":
        search_params_dict["solicitationTitle"] = solicitation # Adjust key if API uses different like 'solicitations'
    if technology_area and technology_area.lower() != "all":
        search_params_dict["technologyAreas"] = [technology_area] # API often expects list for multi-select
    if modernization_priority and modernization_priority.lower() != "all":
        search_params_dict["modernizationPriorities"] = [modernization_priority] # API often expects list

    # Default search parameters that were in your Python example for /download, might be useful here too
    # Or ensure your API call structure aligns with what the DOD_BASE_URL/search endpoint expects
    # search_params_dict.setdefault("solicitationCycleNames", ["openTopics"]) # Example
    # search_params_dict.setdefault("topicReleaseStatus", [591, 592]) # Example
    # search_params_dict.setdefault("sortBy", "finalTopicCode,asc") # Example

    # Construct the query parameter for the DoD API.
    # The exact structure (searchParam JSON string vs individual params) depends on the target API.
    # Your original App.tsx used individual params, so we'll stick to that for the /topics proxy for now.
    # If DOD_BASE_URL/search expects a JSON string in a 'searchParam' query arg like your Python example:
    # query_string = f"searchParam={requests.utils.quote(json.dumps(search_params_dict))}&size={size}&page={page}"
    # search_url = f"{DOD_BASE_URL}/search?{query_string}"

    # Assuming individual query parameters are appended directly (like App.tsx was doing):
    api_query_params = {k: v for k, v in search_params_dict.items() if v is not None}
    api_query_params["size"] = size
    api_query_params["page"] = page
    
    search_url = f"{DOD_BASE_URL}/search" # Main search endpoint

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MisfitOpportunityScraper/1.0)",
        "Accept": "application/json",
    }

    logger.info(f"Proxying request to DoD API: {search_url} with params: {api_query_params}")

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        try:
            response = await client.get(search_url, params=api_query_params, headers=headers)
            response.raise_for_status()
            # TODO: Potentially extract dynamic filter options here if not using a separate /filters endpoint logic
            # For example, from response.json().get('aggregations') or similar if API provides them
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from DoD API: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=f"Error from DoD API: {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request error to DoD API: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Could not connect to DoD API: {str(e)}")


# --- NEW PDF DOWNLOAD PROXY ENDPOINT ---
@router.get("/download_pdf/{topic_uid}", tags=["pdf_download"])
async def download_topic_pdf_proxy(topic_uid: str):
    """
    Acts as a proxy to download a PDF for a given topic_uid from the external DoD API.
    This helps bypass potential CORS issues and allows setting custom headers.
    """
    external_pdf_url = PDF_API_TEMPLATE_EXTERNAL.format(topic_uid=topic_uid)
    
    # Mimic headers from your Python example or other successful requests
    request_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", # A common browser User-Agent
        "Referer": "https://www.dodsbirsttr.mil/topics-app/", # Referer used in your Python example
        "Accept": "application/pdf,application/octet-stream,*/*", # Accept PDF or general binary stream
    }

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client: # Increased timeout for potentially large files
        try:
            logger.info(f"Attempting to fetch PDF from external source: {external_pdf_url} for UID: {topic_uid}")
            response = await client.get(external_pdf_url, headers=request_headers)
            response.raise_for_status()  # Raises HTTPStatusError for 4xx/5xx responses

            # Read all bytes of the PDF content
            pdf_content_bytes = await response.aread() 
            
            # Prepare headers for the response to send back to the React client (browser)
            # This tells the browser to download the file with the given name.
            client_response_headers = {
                "Content-Disposition": f"attachment; filename=\"{topic_uid}.pdf\"",
                "Content-Type": "application/pdf", # Standard MIME type for PDF
                "Content-Length": str(len(pdf_content_bytes)) # Important for progress bars and handling
            }
            
            # Stream the PDF content back to the client
            return StreamingResponse(io.BytesIO(pdf_content_bytes), 
                                     media_type="application/pdf", 
                                     headers=client_response_headers)

        except httpx.HTTPStatusError as e:
            # Log detailed error information
            error_detail = f"Error fetching PDF from source for UID {topic_uid}: Status {e.response.status_code}."
            try:
                error_detail += f" Response: {e.response.text}" # Append response text if available
            except Exception:
                pass # Ignore if response text is not available or not decodable
            logger.error(error_detail)
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)
        except httpx.RequestError as e:
            # Handle network-related errors during the request to the external service
            error_detail = f"Network error while fetching PDF for UID {topic_uid} from {e.request.url}: {str(e)}"
            logger.error(error_detail)
            raise HTTPException(status_code=503, detail=error_detail) # 503 Service Unavailable
        except Exception as e:
            # Catch-all for any other unexpected errors during the process
            error_detail = f"Unexpected error processing PDF download for UID {topic_uid}: {str(e)}"
            logger.error(error_detail, exc_info=True) # Log stack trace for unexpected errors
            raise HTTPException(status_code=500, detail=error_detail)


# You might have other routes here, or routes related to filters.
# Ensure this 'router' instance is included in your main FastAPI application (e.g., in main.py)
# Example: app.include_router(router, prefix="/api")
