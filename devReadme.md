## 🪟 **Windows PowerShell Script — `start-all.ps1`**

Save this file in the **project root** (`Fake-Job-Posting-Tracker/start-all.ps1`):

```powershell
<#
.SYNOPSIS
Starts both the FastAPI backend (Python) and the React frontend (Vite) together.
.DESCRIPTION
Activates the backend virtual environment, runs the Python server,
and starts the frontend development server concurrently.
#>

Write-Host "🚀 Starting TrustCheck servers..." -ForegroundColor Cyan

# Path setup
$backendPath = "packages/backend"
$frontendPath = "packages/frontend"

# Check Python venv exists
if (!(Test-Path "$backendPath\.venv")) {
    Write-Host "⚠️ Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv "$backendPath\.venv"
}

# Activate backend venv
Write-Host "🔹 Activating Python virtual environment..." -ForegroundColor Cyan
& "$backendPath\.venv\Scripts\Activate"

# Start backend server in new PowerShell window
Write-Host "🧠 Starting FastAPI backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "cd '$backendPath'; .\.venv\Scripts\Activate; python -m uvicorn main:app --reload --port 8000"

# Start frontend server in new PowerShell window
Write-Host "🌐 Starting React frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "cd '$frontendPath'; yarn dev"

Write-Host ""
Write-Host "✅ Backend running at http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "✅ Frontend running at http://localhost:5173" -ForegroundColor Green
Write-Host "Press CTRL + C in either window to stop the servers."
```

### ▶️ To Run

From **PowerShell in the project root**:

```powershell
.\start-all.ps1
```

This will:

- Activate `.venv`
- Start backend in a new PowerShell window
- Start frontend in another window

---

## 🐧 **macOS / Linux Bash Script — `start-all.sh`**

Save this in the **project root** (`Fake-Job-Posting-Tracker/start-all.sh`) and make it executable:

```bash
#!/bin/bash
# =====================================
# TrustCheck Startup Script (macOS/Linux)
# =====================================

echo "🚀 Starting TrustCheck servers..."

BACKEND_DIR="packages/backend"
FRONTEND_DIR="packages/frontend"

# Check and activate Python venv
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "⚠️  Virtual environment not found. Creating one..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"

# Start backend
echo "🧠 Starting FastAPI backend on port 8000..."
cd "$BACKEND_DIR"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting React frontend on port 5173..."
cd "../../$FRONTEND_DIR"
yarn dev &
FRONTEND_PID=$!

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT

wait
```

### ▶️ To Run

From your **project root** terminal:

```bash
chmod +x start-all.sh
./start-all.sh
```

This script:

- Activates the backend venv
- Starts `uvicorn` and `yarn dev` in the background
- Gracefully shuts down both on `Ctrl + C`

---

## ✅ Summary

| OS             | File            | Run Command       | Effect                                              |
| -------------- | --------------- | ----------------- | --------------------------------------------------- |
| 🪟 Windows     | `start-all.ps1` | `.\start-all.ps1` | Opens two PowerShell windows for backend + frontend |
| 🐧 macOS/Linux | `start-all.sh`  | `./start-all.sh`  | Starts both in background, same terminal            |
