---
description: Debug a backend issue (logs, test isolation, request tracing)
---

# Debug Backend Issue

Systematic approach to diagnosing backend problems.

## Steps

### 1. Check Logs

Look at the recent backend log file:
// turbo
```bash
type packages\backend\backend_debug.log
```

### 2. Reproduce in Isolation

Run the specific failing test:
```bash
cd packages/backend && python -m pytest tests/test_<relevant>.py -v -s
```

The `-s` flag shows print/log output in real-time.

### 3. Hit the Endpoint Directly

Use curl or httpx to test the endpoint:
```bash
curl -X POST http://localhost:8000/api/<endpoint> -H "Content-Type: application/json" -d "{\"key\": \"value\"}"
```

### 4. Check the Interactive Docs

FastAPI auto-generates docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 5. Database Check

If the issue is data-related, inspect the database:
```bash
cd packages/backend && python -c "from app.database import ...; ..."
```

### 6. Common Issues

| Symptom                   | Likely Cause                   | Fix                                 |
| ------------------------- | ------------------------------ | ----------------------------------- |
| 401 Unauthorized          | Missing/expired Clerk JWT      | Check `CLERK_ISSUER_URL` env var    |
| 500 Internal Server Error | Unhandled exception in service | Check logs, add try/except          |
| CORS error in browser     | Missing origin in FastAPI CORS | Add origin to `main.py` CORS config |
| Slow response             | Blocking I/O on main thread    | Use `asyncio.to_thread()` or httpx  |
