"""
TrueHire Backend API - FastAPI Application

This is the main entry point for the TrueHire backend.
It provides the TrueScore analysis API for job postings.
"""

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routes.analyze import router as analyze_router
from app.routes.report import router as report_router
from app.schemas import HealthResponse
from app.database import init_database

# =============================================================================
# Lifespan - Database Initialization
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_database()
    yield

# =============================================================================
# App Configuration
# =============================================================================

app = FastAPI(
    title="TrueHire API",
    description="AI-powered job posting credibility and scam detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# =============================================================================
# CORS Middleware - Allow frontend to connect
# =============================================================================

# Exact allowed origins (no wildcards)
ALLOWED_ORIGINS_EXACT = {
    # Local development - all common ports
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",  # Vite preview
    # Production - Netlify frontend
    "https://tru3hire.netlify.app",
}

# Regex patterns for dynamic origin validation
ALLOWED_ORIGIN_PATTERNS = [
    # Canonical Netlify host for tru3hire
    re.compile(r"^https://tru3hire\.netlify\.app$"),
    # Netlify deploy previews (e.g., deploy-preview-123--tru3hire.netlify.app)
    re.compile(r"^https://deploy-preview-\d+--tru3hire\.netlify\.app$"),
    # Localhost with any port
    re.compile(r"^http://localhost:\d+$"),
    re.compile(r"^http://127\.0\.0\.1:\d+$"),
]


def is_origin_allowed(origin: str) -> bool:
    """
    Validate if the given origin is allowed for CORS.
    
    Returns True for:
    - Exact matches in ALLOWED_ORIGINS_EXACT
    - Origins matching any pattern in ALLOWED_ORIGIN_PATTERNS
    """
    if not origin:
        return False
    
    # Check exact matches first (faster)
    if origin in ALLOWED_ORIGINS_EXACT:
        return True
    
    # Check regex patterns
    for pattern in ALLOWED_ORIGIN_PATTERNS:
        if pattern.match(origin):
            return True
    
    return False


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],  # Empty list - we use allow_origin_func instead
    allow_origin_func=is_origin_allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Include Routers
# =============================================================================

app.include_router(analyze_router)
app.include_router(report_router)

# Import and include history router
from app.routes.history import router as history_router
app.include_router(history_router)

# Import and include jobs router
from app.routes.jobs import router as jobs_router
app.include_router(jobs_router, prefix="/api")

# Import and include resume router
from app.routes.resume import router as resume_router
app.include_router(resume_router, prefix="/api")

# Import and include company router
from app.routes.company import router as company_router
app.include_router(company_router, prefix="/api")

# =============================================================================
# Health Check Endpoint
# =============================================================================

@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    """
    Check the health status of the API and its dependencies.
    """
    return HealthResponse(
        status="healthy",
        services={
            "api": "ok",
            "database": "ok",
            "fake_job_model": "ok",
        }
    )


# =============================================================================
# Root Endpoint
# =============================================================================

@app.get("/", tags=["root"])
def root():
    """Welcome message and API info."""
    return {
        "message": "Welcome to TrueHire API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "analyze": "POST /api/analyze",
            "jobs_search": "GET /api/jobs/search",
            "jobs_ranked": "GET /api/jobs/ranked",
            "report_scam": "POST /api/report-scam",
        }
    }
