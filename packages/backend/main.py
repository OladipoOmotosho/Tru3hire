"""
TrueHire Backend API - FastAPI Application

This is the main entry point for the TrueHire backend.
It provides the TrueScore analysis API for job postings.
"""

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

import os
import warnings

# Suppress sklearn parallel warning (cosmetic; doesn't affect scoring)
warnings.filterwarnings(
    "ignore",
    message=".*delayed.*should be used with.*Parallel.*",
    category=UserWarning,
)
import re
import logging
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

# Rate limiting (shared limiter; limits applied in route modules)
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.config.rate_limits import limiter

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
    # Initialize database with error handling to preventing startup crashes
    try:
        # Run DB init in executor to avoid blocking the event loop
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, init_database)
        print("✅ Database initialized successfully")
    except Exception as e:
        logging.getLogger("uvicorn.error").error(f"❌ Critical: Database initialization failed: {e}", exc_info=True)
        # We allow startup to continue so we can see the logs in Cloud Run
        # capabilities depending on DB will fail at runtime

    # Log the active embeddings provider so degraded mode is visible in logs
    try:
        from app.services.health import get_embeddings_status
        provider, degraded = get_embeddings_status()
        logging.getLogger("uvicorn.error").info(
            "Embeddings provider: %s%s", provider, " (DEGRADED)" if degraded else ""
        )
    except Exception as e:
        logging.getLogger("uvicorn.error").warning("Could not determine embeddings provider: %s", e)

    # Pre-warm ML models only if explicitly enabled
    # Disabled by default for Render free tier (512MB limit)
    # Set WARMUP_MODELS=true to enable (requires paid tier with more RAM)
    if os.getenv("WARMUP_MODELS", "false").lower() == "true":
        try:
            from app.ml.embeddings import warmup_models
            await warmup_models()
        except Exception as e:
            logging.getLogger("uvicorn.error").error(
                "Model warmup failed: %s", e, exc_info=True
            )
    
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
# Rate Limiting — protect LLM quotas
# =============================================================================

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add standard browser security headers to every response.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# Add custom CORS middleware (compatible with all Starlette versions)
app.add_middleware(DynamicCORSMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# =============================================================================
# Include Routers
# =============================================================================

app.include_router(analyze_router)
app.include_router(report_router)

# Import and include history router
from app.routes.history import router as history_router
app.include_router(history_router, prefix="/api")

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

# Import and include credentials router (Phase 2: Pathway Engine)
from app.routes.credentials import router as credentials_router
app.include_router(credentials_router, prefix="/api/credentials", tags=["Credentials"])

# Import and include discover router (AI-powered job discovery)
from app.routes.discover import router as discover_router
app.include_router(discover_router, prefix="/api")

# =============================================================================
# Health Check Endpoint
# =============================================================================

@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """
    Liveness + component status. Always returns 200 while the process is up;
    `status` is "degraded" when any real dependency check fails so silent
    fallbacks (e.g. missing Gemini key) are visible to monitors.
    """
    from app.services.health import run_checks

    checks = await run_checks()

    # Gather cache stats for monitoring
    cache_info = {}
    logger = logging.getLogger(__name__)
    try:
        from app.services.cache import get_cache_stats
        cache_info["scoring"] = get_cache_stats()
    except Exception:
        logger.debug("Failed to get scoring cache stats", exc_info=True)
    try:
        from app.services.embedding_service import get_cache_stats as emb_cache
        cache_info["embeddings"] = emb_cache()
    except Exception:
        logger.debug("Failed to get embeddings cache stats", exc_info=True)
    try:
        from app.services.search_orchestrator import get_pipeline_cache_stats
        cache_info["pipeline"] = await get_pipeline_cache_stats()
    except Exception:
        logger.debug("Failed to get pipeline cache stats", exc_info=True)

    degraded = not checks["ready"] or checks["embeddings_degraded"]
    return HealthResponse(
        status="degraded" if degraded else "healthy",
        services={
            "api": "ok",
            "database": checks["db"],
            "fake_job_model": checks["model"],
            "embeddings_provider": checks["embeddings_provider"],
            "caches": cache_info,
        }
    )


@app.get("/health/ready", tags=["health"])
async def readiness_check(response: Response):
    """
    Readiness probe: 200 only when the database round-trips and the scam
    classifier artifact is loadable. 503 otherwise, naming the failing
    component. Cloud Run's startup probe should point here.
    """
    from app.services.health import run_checks

    checks = await run_checks()
    failing = [
        name
        for name, ok in (("database", checks["db_ok"]), ("model", checks["model_ok"]))
        if not ok
    ]
    if failing:
        response.status_code = 503
        return {"ready": False, "failing": failing,
                "details": {"database": checks["db"], "model": checks["model"]}}
    return {"ready": True}


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

