---
inclusion: always
---

# API Design Standards

## 1. URL Conventions

- Use **plural nouns** for resources: `/api/jobs`, `/api/applications`
- Use **path parameters** for specific resources: `/api/jobs/{job_id}`
- Use **query parameters** for filtering, sorting, pagination: `/api/jobs?page=1&limit=20&sort=score`
- Use **kebab-case** for multi-word paths: `/api/skill-gap`, `/api/company-insights`

## 2. HTTP Methods

| Method | Purpose              | Example                          |
| ------ | -------------------- | -------------------------------- |
| GET    | Read / list          | `GET /api/jobs`                  |
| POST   | Create / trigger     | `POST /api/analyze`              |
| PUT    | Full update          | `PUT /api/applications/{id}`     |
| PATCH  | Partial update       | `PATCH /api/profile`             |
| DELETE | Remove               | `DELETE /api/saved-jobs/{id}`    |

## 3. Response Format

All API responses should follow a consistent structure:

```json
// Success (single item)
{
  "id": "abc123",
  "title": "Software Engineer",
  "score": 85.2
}

// Success (list with pagination)
{
  "items": [...],
  "total": 142,
  "page": 1,
  "limit": 20
}

// Error
{
  "detail": "Job not found"
}
```

## 4. Versioning

- Currently unversioned (`/api/...`).
- If breaking changes are needed, prefix with version: `/api/v2/...`
- Keep v1 endpoints working during migration periods.

## 5. Rate Limiting

- LLM-backed endpoints (analyze, skill-gap) must be rate-limited via `slowapi`.
- Standard rate: **10 requests/minute** per user for LLM endpoints.
- Return `429 Too Many Requests` with a `Retry-After` header.

## 6. Pagination Defaults

- Default `page=1`, `limit=20`
- Maximum `limit=100`
- Always return `total` count for client-side pagination UI.

## 7. Documentation

FastAPI auto-generates OpenAPI docs. Keep them useful:
- Add docstrings to every route handler (they appear in Swagger UI).
- Use Pydantic Field descriptions for request/response fields.
- Tag routes by domain: `tags=["analyze"]`, `tags=["jobs"]`, `tags=["applications"]`.
