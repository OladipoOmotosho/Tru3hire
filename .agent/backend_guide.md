---
inclusion: always
---

# TrueHire Backend Guide

## 1. Architecture Overview

- **Framework**: FastAPI (async Python)
- **Runtime**: Uvicorn
- **Auth**: Clerk JWT verification (`pyjwt[crypto]`, JWKS)
- **Database**: PostgreSQL (`psycopg2-binary`)
- **ML/NLP**: scikit-learn, TF-IDF, Gemini embeddings
- **Deploy**: Render (Docker)

## 2. Project Layout

```
packages/backend/
├── main.py              # FastAPI app, CORS, router registration
├── app/
│   ├── config/          # Environment, feature flags
│   ├── database.py      # DB connection, queries
│   ├── dependencies.py  # Auth guards (get_current_user, etc.)
│   ├── routes/          # Thin route handlers
│   ├── schemas/         # Pydantic request/response models
│   ├── services/        # Business logic (fat services, thin routes)
│   ├── ml/              # ML models, vectorizers
│   └── utils/           # Shared helpers
├── tests/               # pytest test suite
├── data/                # Static data, CSV seeds
└── requirements.txt     # Python dependencies
```

## 3. Route Handler Rules

- **Thin routes**: Routes should only parse input, call a service, and return output.
- **Never put business logic in a route file.** Move it to `services/`.
- **Auth**: Use `Depends(get_current_user)` for protected endpoints or `Depends(get_optional_current_user)` for optional auth.
- **Validation**: Always use Pydantic schemas for request bodies and responses.
- **Error handling**: Raise `HTTPException` with specific status codes and messages.

```python
# GOOD: Route delegates to service
@router.post("/analyze")
async def analyze_job(req: AnalyzeRequest, user_id: str = Depends(get_current_user)):
    return await analysis_service.analyze(req, user_id)

# BAD: Route contains business logic
@router.post("/analyze")
async def analyze_job(req: AnalyzeRequest):
    score = calculate_tfidf(req.text)  # Don't do this in routes
    ...
```

## 4. Service Layer Patterns

- One service file per domain: `scorer.py`, `resume_parser.py`, `search_orchestrator.py`
- Functions should have clear type hints for inputs and return values.
- Use `asyncio.to_thread()` for blocking I/O (PDF parsing, CPU-heavy ML).
- Handle errors at the service level, and raise meaningful exceptions.

## 5. Database Patterns

- All queries go through `app/database.py`.
- Use parameterized queries (`%s` placeholders) to prevent SQL injection.
- Connection pooling is handled at the module level.
- For new tables, write a migration script in `packages/backend/`.

## 6. Testing

- Test files: `tests/test_<module>.py`
- Use `pytest` with descriptive class and method names.
- Unit tests should not require a running server or database.
- Mock external services (Gemini API, Clerk, external URLs).
- Run: `python -m pytest tests/ -v`

## 7. Environment Variables

All secrets go in `.env` (never committed). Required variables:

| Variable           | Purpose                      |
| ------------------ | ---------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string |
| `CLERK_ISSUER_URL` | Clerk JWT issuer             |
| `CLERK_JWKS_URL`   | Clerk JWKS endpoint          |
| `GEMINI_API_KEY`   | Google Gemini API key        |

## 8. Performance

- Use `lru_cache` for expensive computations that repeat (e.g., JWKS client).
- Use `asyncio.to_thread()` for CPU-bound work.
- Rate limit LLM calls via `slowapi`.
- Profile slow endpoints with logging timers.
