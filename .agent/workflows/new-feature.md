---
description: Scaffold a new feature end-to-end (branch, route, service, component, page)
---

# New Feature Workflow

Step-by-step process for adding a new feature from branch creation to PR.

## Steps

### 1. Create a Feature Branch

```bash
git checkout -b feature/<feature-name>
```

### 2. Backend (if needed)

Create the following files in order:

1. **Schema** — `packages/backend/app/schemas/<feature>.py`
   - Define Pydantic request/response models
2. **Service** — `packages/backend/app/services/<feature>.py`
   - Business logic, keep routes thin
3. **Route** — `packages/backend/app/routes/<feature>.py`
   - Wire up FastAPI endpoints, import service functions
4. **Register** — Add the router in `packages/backend/main.py`:
   ```python
   from app.routes.<feature> import router as feature_router
   app.include_router(feature_router, prefix="/api/<feature>", tags=["<feature>"])
   ```
5. **Tests** — `packages/backend/tests/test_<feature>.py`

### 3. Frontend (if needed)

1. **Types** — `packages/frontend/src/types/<feature>.ts`
   - TypeScript interfaces matching backend schemas
2. **Hook** — `packages/frontend/src/hooks/use<Feature>.ts`
   - API calls, state management, loading/error handling
3. **Component(s)** — `packages/frontend/src/components/<feature>/`
   - Reusable UI pieces, each with a `className` prop
4. **Page** — `packages/frontend/src/pages/<Feature>Page.tsx`
   - Compose components into a full page
5. **Route** — Register in `App.tsx` router

### 4. Verify

Run the full verification suite:
```
/run-tests
/lint-and-format
```

### 5. Commit & Push

```bash
git add -A
git commit -m "feat: <description>"
git push origin feature/<feature-name>
```

### 6. Open PR

- Title matches commit format: `feat: <description>`
- Description includes Summary, Testing, and Screenshots
