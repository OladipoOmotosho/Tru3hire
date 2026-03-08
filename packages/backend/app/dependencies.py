import os
import logging
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# Clerk Issuer URL from env (e.g., https://your-clerk-domain.clerk.accounts.dev)
# Support both CLERK_ISSUER_URL and CLERK_ISSUER for compatibility
CLERK_ISSUER = os.getenv("CLERK_ISSUER_URL") or os.getenv("CLERK_ISSUER")
# Expected JWT audience (e.g. Clerk client ID) for audience verification
CLERK_AUDIENCE = os.getenv("CLERK_CLIENT_ID") or os.getenv("CLERK_AUDIENCE")

# If using a specific JWKS URL (optional, otherwise inferred from issuer)
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL") or (f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else None)

security = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient:
    """Cached JWKS client so signing key lookups reuse the JWKS cache."""
    return PyJWKClient(CLERK_JWKS_URL)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Verify the JWT token from Clerk and return the user_id (sub).
    Raises 401 if no token or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return await verify_token(credentials.credentials)

async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """
    Verify the JWT token if present. Returns user_id or None.
    """
    if not credentials:
        return None
    try:
        return await verify_token(credentials.credentials)
    except HTTPException:
        return None # Invalid token treated as anonymous

async def verify_token(token: str) -> str:
    """Helper to verify token logic"""
    # If no CLERK_ISSUER is set, we can't verify properly.
    if not CLERK_ISSUER and not CLERK_JWKS_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: Missing CLERK_ISSUER_URL or CLERK_JWKS_URL"
        )

    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify signature + issuer + expiry
        # NOTE: Clerk session tokens do NOT include an 'aud' claim by default.
        # Only enable audience verification if a custom JWT template is configured
        # in the Clerk dashboard that explicitly includes an audience.
        decode_options = {"verify_exp": True}
        decode_kwargs = {
            "algorithms": ["RS256"],
            "issuer": CLERK_ISSUER,
            "options": decode_options,
        }
        if CLERK_AUDIENCE:
            decode_options["verify_aud"] = True
            decode_kwargs["audience"] = CLERK_AUDIENCE
        else:
            decode_options["verify_aud"] = False

        payload = jwt.decode(token, signing_key.key, **decode_kwargs)
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user_id (sub)"
            )
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        logger.warning("JWT verification failed: token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidAudienceError as e:
        logger.warning("JWT verification failed: audience mismatch — %s (configured CLERK_AUDIENCE=%s)", e, CLERK_AUDIENCE)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except jwt.InvalidIssuerError as e:
        logger.warning("JWT verification failed: issuer mismatch — %s (configured CLERK_ISSUER=%s)", e, CLERK_ISSUER)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except jwt.InvalidTokenError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        logger.error("JWT validation error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


# Log auth config at startup for debugging
logger.info(
    "Auth config — CLERK_ISSUER=%s, CLERK_AUDIENCE=%s, CLERK_JWKS_URL=%s",
    CLERK_ISSUER, CLERK_AUDIENCE or "(none — aud check disabled)", CLERK_JWKS_URL,
)
