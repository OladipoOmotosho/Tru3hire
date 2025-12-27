"""
SafeHire Backend API - FastAPI Application

This is the main entry point for the SafeHire backend.
It provides the TrueScore analysis API for job postings.
"""

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
    title="SafeHire API",
    description="AI-powered job posting credibility and scam detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# =============================================================================
# CORS Middleware - Allow frontend to connect
# =============================================================================

# Allowed origins - add your Netlify URLs here
ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    # Production - Netlify frontend
    "https://saf3hire.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
            "bias_detector": "ok",
        }
    )


# =============================================================================
# Root Endpoint
# =============================================================================

@app.get("/", tags=["root"])
def root():
    """Welcome message and API info."""
    return {
        "message": "Welcome to SafeHire API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "analyze": "POST /api/analyze",
            "report_scam": "POST /api/report-scam",
            "report_stats": "GET /api/report-scam/stats",
        }
    }
