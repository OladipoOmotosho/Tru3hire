---
inclusion: always
---

# Performance Standards

## 1. Backend Performance

### Async Best Practices

- FastAPI is async by default. Use `async def` for route handlers.
- **Never block the event loop** with synchronous I/O, CPU-heavy work, or `time.sleep()`.
- Offload blocking calls with `asyncio.to_thread()`:

```python
# GOOD: Non-blocking
result = await asyncio.to_thread(parse_pdf, file_bytes)

# BAD: Blocks the event loop
result = parse_pdf(file_bytes)  # This is CPU-bound
```

### Caching

- Use `@lru_cache` for pure functions with repeated inputs (e.g., JWKS client, static lookups).
- For API-level caching, use in-memory TTL caches for expensive computations (see `services/cache.py`).
- Cache Gemini embedding results to avoid repeated API calls.

### Database

- Use connection pooling (already configured in `database.py`).
- Add indexes for frequently queried columns.
- Limit result sets with `LIMIT` and pagination.

## 2. Frontend Performance

### React Optimization

- Use `React.memo()` for expensive pure components that re-render often.
- Use `useMemo()` for expensive computations derived from props/state.
- Use `useCallback()` for event handlers passed to child components.
- **Do not optimize prematurely.** Only add memo/useMemo when a measurable performance issue exists.

### Network

- Debounce search inputs (300ms minimum) to reduce API calls.
- Implement pagination or infinite scroll for lists over 50 items.
- Use loading skeletons instead of spinners for better perceived performance.
- Cancel in-flight requests when the user navigates away (AbortController).

### Bundle Size

- Import only what you need from libraries (`import { Shield } from 'lucide-react'`, not `import * as Lucide`).
- Use dynamic imports (`React.lazy()`) for heavy pages not on the initial route.
- Keep node_modules out of the bundle by splitting vendor chunks.

## 3. API Design

- Paginate all list endpoints: `?page=1&limit=20`
- Return only the fields the client needs. Avoid sending entire database rows.
- Use compression (gzip) for large response payloads.
- Set appropriate `Cache-Control` headers for static data.
