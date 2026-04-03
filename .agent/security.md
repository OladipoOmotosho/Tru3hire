---
inclusion: always
---

# Security Standards

## 1. Authentication & Authorization

- **All mutating endpoints** (POST, PUT, DELETE) MUST require authentication via `Depends(get_current_user)`.
- **Read-only public endpoints** (GET for job listings, public pages) can use `Depends(get_optional_current_user)`.
- **Never trust client-side data** for authorization decisions. Always verify the JWT server-side.
- **User isolation**: Users should only be able to access their own data (history, saved jobs, applications). Always filter by `user_id` in queries.

## 2. Input Validation

- **Pydantic models** for all API request bodies. No raw dict parsing.
- **Sanitize user input** before storing or displaying. Avoid XSS by escaping HTML in any user-generated content.
- **File uploads**: Validate MIME types and file sizes. Only accept `.pdf` and `.docx` for resumes.
- **URL inputs**: Validate the URL scheme (only `http` and `https`). Protect against SSRF by blocking internal IP ranges.

## 3. Secrets Management

- **ALL secrets** go in `.env` files. Never hardcode API keys, database URLs, or JWTs.
- `.env` files are in `.gitignore`. Verify this before any commit.
- Use `os.getenv()` with fallback values where appropriate.
- Rotate API keys periodically.

## 4. Database Security

- **Parameterized queries only**. Never use f-strings or string concatenation for SQL.
- Use the principle of least privilege for database credentials.
- Never expose raw database errors to the client. Catch and return generic messages.

## 5. Frontend Security

- **CORS**: Only allow the specific frontend origin in `main.py` CORS config. Never use `*` in production.
- **Auth tokens**: Store Clerk session tokens via Clerk's SDK (HttpOnly cookies). Never store JWTs in localStorage.
- **API calls**: Always send the auth token in the `Authorization: Bearer <token>` header.
- **Sensitive routes**: Use `<ProtectedRoute>` component to guard pages that require login.

## 6. Dependency Security

- Pin major versions in `requirements.txt`.
- Run `npm audit` and `pip audit` periodically.
- Keep dependencies updated, especially security-related ones (`pyjwt`, `httpx`, `fastapi`).

## 7. Logging

- **Never log** sensitive data: JWTs, passwords, API keys, personal user data.
- Log authentication failures at `WARNING` level.
- Log unexpected errors at `ERROR` level with stack traces.
- Use structured logging with the `logging` module.
