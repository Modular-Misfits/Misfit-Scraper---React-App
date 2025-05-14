from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.filters import router as filters_router
from app.routes import router as routes_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(filters_router, prefix="/api")
app.include_router(routes_router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok", "message": "FastAPI backend is live"}
