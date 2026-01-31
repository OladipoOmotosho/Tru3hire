import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

# Clerk Issuer URL from env (e.g., https://your-clerk-domain.clerk.accounts.dev)
# Support both CLERK_ISSUER_URL and CLERK_ISSUER for compatibility
CLERK_ISSUER = os.getenv("CLERK_ISSUER_URL") or os.getenv("CLERK_ISSUER")

# If using a specific JWKS URL (optional, otherwise inferred from issuer)
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL") or (f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else None)

security = HTTPBearer(auto_error=False)

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
         if os.getenv("STRICT_AUTH", "false").lower() == "true":
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Auth configuration missing (CLERK_ISSUER_URL)"
            )
         print("⚠️ CLERK_ISSUER_URL not set. JWT verification will fail.")
         raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail="Server configuration error: Missing CLERK_ISSUER_URL"
        )

    try:
        jwks_client = PyJWKClient(CLERK_JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        print(f"DEBUG: Verifying token with Issuer: {CLERK_ISSUER}")
        
        # Verify signature + issuer + expiry (no audience)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_exp": True, "verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            print("❌ DEBUG: Token missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user_id (sub)"
            )
        
        print(f"✅ Token verified for user: {user_id}")
        return user_id
        
    except jwt.ExpiredSignatureError:
        print("❌ DEBUG: Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidIssuerError:
        print(f"❌ DEBUG: Invalid Issuer. Expected: {CLERK_ISSUER}")
        # Try decoding without verify to see what the actual issuer is
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            print(f"❌ DEBUG: Actual token issuer: {unverified.get('iss')}")
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer"
        )
    except jwt.InvalidTokenError as e:
        print(f"❌ DEBUG: Invalid token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        print(f"❌ DEBUG: Catch-all Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
