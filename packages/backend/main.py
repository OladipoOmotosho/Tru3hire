"""
TrueHire Backend API - FastAPI Application

This is the main entry point for the TrueHire backend.
It provides the TrueScore analysis API for job postings.
"""

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

import os
import re
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
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
    
    # Pre-warm ML models only if explicitly enabled
    # Disabled by default for Render free tier (512MB limit)
    # Set WARMUP_MODELS=true to enable (requires paid tier with more RAM)
    if os.getenv("WARMUP_MODELS", "false").lower() == "true":
        try:
            from app.ml.embeddings import warmup_models
            await warmup_models()
        except Exception:
            pass
    
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
    # Netlify deploy previews (e.g., deploy-preview-123--tru3hire.netlify.app)
    re.compile(r"^https://deploy-preview-\d+--tru3hire\.netlify\.app$"),
    # Production and main app subdomains (www, app, etc.)
    re.compile(r"^https://(www|app|prod)\.tru3hire\.netlify\.app$"),
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


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware that supports dynamic origin validation.
    Compatible with newer Starlette versions that removed allow_origin_func.
    """
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = Response(status_code=200)
            if origin and is_origin_allowed(origin):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
                response.headers["Access-Control-Max-Age"] = "600"
            response.headers["Vary"] = "Origin"
            return response
        
        # Handle regular requests
        response = await call_next(request)
        
        if origin and is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
        
        return response


# Add custom CORS middleware (compatible with all Starlette versions)
app.add_middleware(DynamicCORSMiddleware)

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

# Import and include applications router (Phase 2: Feedback Loop)
from app.routes.applications import router as applications_router
app.include_router(applications_router, prefix="/api")

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
