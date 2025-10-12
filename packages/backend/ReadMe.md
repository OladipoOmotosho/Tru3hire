# Backend (FastAPI)

This folder contains the Python backend for the TrustCheck MVP.

## Setup (local dev)

python3 -m venv .venv
source .venv/bin/activate # mac/linux

# .venv\Scripts\activate # windows

pip install -r requirements.txt

# run locally

uvicorn app.main:app --reload --port 8000
