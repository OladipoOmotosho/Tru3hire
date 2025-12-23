"""
TrueHire Backend API - FastAPI Application

This is the main entry point for the TrueHire backend.
It provides the TrueScore analysis API for job postings.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router as analyze_router
from app.schemas import HealthResponse

# =============================================================================
# App Configuration
# =============================================================================

app = FastAPI(
    title="TrueHire API",
    description="AI-powered job posting credibility and fit analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# =============================================================================
# CORS Middleware - Allow frontend to connect
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Vite dev server
        "http://localhost:5173",      # Vite default
        "http://127.0.0.1:5173",
        "http://localhost:5174",      # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Include Routers
# =============================================================================

app.include_router(analyze_router)

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
            "fake_job_model": "pending",  # TODO: Check model loaded
            "bias_detector": "pending",   # TODO: Check model loaded
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
        "analyze": "/api/analyze",
    }
