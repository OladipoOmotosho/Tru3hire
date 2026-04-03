---
description: Lint and format the entire codebase (ESLint, Prettier, Pyright)
---

# Lint & Format

Run all linters and formatters across both frontend and backend.

## Steps

1. Run ESLint on the frontend:
// turbo
```bash
yarn workspace frontend lint
```

2. Run Prettier for auto-formatting:
// turbo
```bash
yarn workspace frontend format
```

3. Run Pyright type-check on the backend:
// turbo
```bash
cd packages/backend && python -m pyright
```

4. (Optional) Run Python linter if ruff/flake8 is installed:
```bash
cd packages/backend && python -m ruff check app/ --fix
```

## Pre-Commit Checklist

Before committing, confirm:
- [ ] No ESLint errors
- [ ] Code is formatted (Prettier)
- [ ] No TypeScript errors (`yarn typecheck`)
- [ ] No Pyright errors
- [ ] All tests pass (`/run-tests`)
