"""
Rate limit configuration — the single place all API throttles are defined.

Limits are env-tunable so they can be adjusted on Cloud Run by rolling a new
revision with updated env vars, no code change needed.
Design reference: .agent/90-day-roadmap/design.md §3.2.
"""

import hashlib
import os

from slowapi import Limiter
from starlette.requests import Request

# Per-IP limits for endpoints that accept anonymous traffic
ANALYZE_LIMIT = os.getenv("RL_ANALYZE", "10/minute")
REPORT_LIMIT = os.getenv("RL_REPORT", "5/minute")

# Per-user limit for authenticated discovery endpoints (falls back to IP)
DISCOVER_LIMIT = os.getenv("RL_DISCOVER", "20/minute")


def client_ip_key(request: Request) -> str:
    """
    Rate-limit key for anonymous endpoints.

    Cloud Run terminates TLS at the load balancer, so the real client IP is
    the first entry of X-Forwarded-For; request.client would be the LB.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def user_or_ip_key(request: Request) -> str:
    """
    Rate-limit key for authenticated endpoints.

    Buckets by bearer token (hashed) so users behind a shared NAT don't
    starve each other. The token is only a bucket key here — real
    authentication still happens in the route's dependency.
    """
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer ") and len(auth) > len("bearer "):
        token = auth[len("bearer "):]
        return hashlib.sha256(token.encode()).hexdigest()[:32]
    return client_ip_key(request)


# Shared limiter instance: registered on the app in main.py, applied to
# routes via @limiter.limit(...) decorators in the route modules.
# headers_enabled adds Retry-After / X-RateLimit-* to 429 responses (Req 2.4).
limiter = Limiter(key_func=client_ip_key, headers_enabled=True)
