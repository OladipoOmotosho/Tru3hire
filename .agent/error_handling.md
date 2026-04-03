---
inclusion: always
---

# Error Handling Standards

## 1. Backend (FastAPI)

### HTTP Status Codes

Use the correct status code. Do not default to 500 for everything.

| Code | Meaning               | When to Use                                     |
| ---- | --------------------- | ----------------------------------------------- |
| 200  | OK                    | Successful GET/PUT                               |
| 201  | Created               | Successful POST that creates a resource          |
| 400  | Bad Request           | Invalid input, malformed request                 |
| 401  | Unauthorized          | Missing or invalid auth token                    |
| 403  | Forbidden             | Valid token but insufficient permissions          |
| 404  | Not Found             | Resource does not exist                          |
| 409  | Conflict              | Duplicate resource (e.g., already saved job)      |
| 422  | Unprocessable Entity  | Pydantic validation failure (auto by FastAPI)     |
| 429  | Too Many Requests     | Rate limit exceeded                              |
| 500  | Internal Server Error | Unhandled exception (should be rare)             |

### Exception Pattern

```python
# GOOD: Specific error with context
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail=f"Job {job_id} not found"
)

# BAD: Generic error
raise HTTPException(status_code=500, detail="Something went wrong")
```

### Service-Level Error Handling

```python
# Services should raise domain-specific exceptions or return None
def get_job_score(job_id: str) -> float:
    job = db.get_job(job_id)
    if job is None:
        raise ValueError(f"Job {job_id} not found")
    if job.word_count == 0:
        return 0.0  # Guard against division by zero
    return job.score / job.word_count
```

## 2. Frontend (React)

### API Call Pattern

Always handle loading, success, and error states:

```tsx
const [data, setData] = useState<Data | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setIsLoading(true);
  setError(null);
  const response = await fetch(url, { headers: authHeaders });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  setData(await response.json());
} catch (err) {
  setError(err instanceof Error ? err.message : "An unexpected error occurred");
} finally {
  setIsLoading(false);
}
```

### User-Facing Errors

- Show toast notifications for transient errors (network, rate limit).
- Show inline error messages for validation errors (form fields).
- Show full-page error states for unrecoverable errors (404, 500).
- **Never show raw error messages or stack traces** to users.

### Error Boundaries

Wrap complex page sections with React Error Boundaries to prevent full-page crashes:

```tsx
<ErrorBoundary fallback={<ErrorAlert message="Something went wrong" />}>
  <ComplexComponent />
</ErrorBoundary>
```

## 3. Logging vs User Messages

| Audience   | What to Include                      | What to Exclude           |
| ---------- | ------------------------------------ | ------------------------- |
| **Logs**   | Stack traces, request IDs, user IDs  | Passwords, JWTs, PII      |
| **User**   | Friendly message, suggested action   | Technical details, IDs     |
