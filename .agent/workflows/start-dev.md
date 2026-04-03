---
description: Start full-stack development environment (frontend + backend)
---

# Start Dev Environment

Start both the frontend and backend dev servers concurrently.

## Prerequisites

- Python virtual environment activated at `packages/backend/.venv`
- Node dependencies installed (`yarn install`)
- `.env` file configured in `packages/backend/`

## Steps

1. Activate the Python venv and start the backend server:
// turbo
```bash
cd packages/backend && .venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000
```

2. In a separate terminal, start the frontend dev server:
// turbo
```bash
yarn workspace frontend dev
```

> **Alternative**: Run both at once from the repo root:
> ```bash
> yarn dev
> ```
> This uses `concurrently` to run both servers in one terminal.
