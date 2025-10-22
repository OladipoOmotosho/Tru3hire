# 🧠 TrustCheck — Technical Developer README

> A cross-platform setup guide for running the **Fake Job Posting Detector (MVP)** with both frontend and backend servers locally.
> Compatible with **Windows**, **macOS**, and **Linux**, and can be run via **PowerShell** or **VS Code terminal**.

---

## 🗂️ Project Structure

```
fake-job-posting-tracker/
├─ package.json                # root - Yarn workspace config + helper scripts
├─ .gitignore
├─ packages/
│  ├─ frontend/                # React + TypeScript + Tailwind app
│  │  ├─ .env.example
│  │  └─ src/
│  └─ backend/                 # FastAPI (Python) backend
│     ├─ .env.example
│     ├─ requirements.txt
│     ├─ main.py
│     └─ .venv/                # virtual environment (not committed)
└─ shared/
```

---

## ⚙️ Prerequisites

### Required on all systems

* **Node.js v18+** and **Yarn v1.x**

  ```bash
  node --version
  yarn --version
  ```
* **Python 3.10+**

  ```bash
  python --version
  ```
* **Git** (for cloning & version control)
* **VS Code** (recommended for integrated terminal and debugging)

---

## 🧩 Step 1: Install Node/Yarn workspace dependencies

From **root directory**, open a terminal (**PowerShell**, **cmd**, or **VS Code integrated terminal**) and run:

```bash
yarn install
```

This installs dependencies for both **frontend** and **backend**.

---

## 🐍 Step 2: Set up Backend (Python + FastAPI)

### 🪟 On Windows (PowerShell or VS Code terminal)

```powershell
cd packages/backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

### 🐧 On macOS/Linux

```bash
cd packages/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> 💡 If you later add new Python packages, remember to update:
>
> ```bash
> pip freeze > requirements.txt
> ```

---

## 🚀 Step 3: Start Backend Server

Once your virtual environment is active:

```bash
python -m uvicorn main:app --reload --port 8000
```

* Backend runs at 👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**
* API docs at 👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

Quick health check:

```bash
curl http://127.0.0.1:8000/
```

---

## 💻 Step 4: Start Frontend Server

In a **new terminal** (PowerShell or VS Code):

```bash
yarn workspace frontend dev
```

* Frontend runs at 👉 **[http://localhost:5173](http://localhost:5173)**
* Communicates with backend via environment variable `VITE_API_URL`.

---

## ⚡ Step 5: Start Both Together

You have **three options** depending on your preference.

### 🟢 Option 1 — Two Separate Terminals (recommended)

* Terminal A → Start backend

  ```bash
  cd packages/backend
  .\.venv\Scripts\Activate    # Windows
  # OR
  source .venv/bin/activate   # macOS/Linux
  python -m uvicorn main:app --reload --port 8000
  ```
* Terminal B → Start frontend

  ```bash
  yarn workspace frontend dev
  ```

### 🟣 Option 2 — PowerShell Script (Windows only)

Create a file in root called `start-all.ps1` with:

```powershell
Write-Host "Activating Python environment..."
cd packages/backend
& .\.venv\Scripts\Activate

Start-Job { python -m uvicorn main:app --reload --port 8000 }

cd ../..
Write-Host "Starting frontend..."
yarn workspace frontend dev
```

Run it:

```powershell
.\start-all.ps1
```

### 🔵 Option 3 — Concurrently from root (works on all OS)

In your **root `package.json`**, add:

```json
"scripts": {
  "dev:all": "concurrently \"cd packages/backend && .venv/bin/activate && python -m uvicorn main:app --reload --port 8000\" \"yarn workspace frontend dev\""
}
```

Then run:

```bash
yarn dev:all
```

> ⚠️ On Windows, if `.venv/bin/activate` fails, modify to `.venv\\Scripts\\activate`.

---

## 🔐 Environment Configuration

### 🧩 Frontend (`packages/frontend/.env.example`)

```env
# API URL for backend
VITE_API_URL=http://127.0.0.1:8000

# Optional analytics or environment name
VITE_ENV=development
```

### 🧩 Backend (`packages/backend/.env.example`)

```env
# FastAPI Config
HOST=127.0.0.1
PORT=8000
DEBUG=True

# Example ML model path
MODEL_PATH=app/ml/fake_job_model.pkl

# CORS settings
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 🔗 How they connect

* Frontend calls backend via `VITE_API_URL`
  → e.g., `fetch(`${import.meta.env.VITE_API_URL}/analyze`)`
* Backend loads configuration from `.env` (if using `python-dotenv`)
* Both can run independently — no shared state required during dev

---

## 🧠 Example Workflow

1. Clone the repo

   ```bash
   git clone <repo-url>
   cd fake-job-posting-tracker
   ```
2. Run setup commands:

   ```bash
   yarn install
   cd packages/backend
   python -m venv .venv
   .\.venv\Scripts\Activate   # or source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run servers:

   * Backend → `python -m uvicorn main:app --reload --port 8000`
   * Frontend → `yarn workspace frontend dev`
4. Visit:

   * Backend API → [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   * Frontend UI → [http://localhost:5173](http://localhost:5173)

---

## 🧪 Quick Demo (API Test)

```bash
curl -X POST http://127.0.0.1:8000/analyze \
     -H "Content-Type: application/json" \
     -d '{"title":"Remote Data Entry","description":"Pay training fee"}'
```

✅ Expected:

```json
{
  "trust_score": 0.12,
  "label": "High-Risk",
  "reasons": ["payment_request", "free_email"]
}
```

---

## 🧰 Common Issues

| Problem                     | Fix                                      |
| --------------------------- | ---------------------------------------- |
| `source: command not found` | On Windows, use `.venv\Scripts\Activate` |
| `ModuleNotFoundError: main` | Make sure you’re in `packages/backend`   |
| `CORS error in browser`     | Enable CORS in `main.py` (see below)     |

### CORS Fix Example

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## 💡 Contributing Guidelines

* Use branches: `feature/<short-desc>`
* Keep PRs small & well-documented
* Backend tests go in `packages/backend/tests/`
* Frontend components under `src/components/`

---

## 🧭 Next Steps (Post-MVP)

* ✅ Add job description scraping
* ✅ Integrate ML-based classification (sklearn)
* 🚀 Deploy frontend (Vercel) and backend (Render or AWS Lambda)
* 🧠 Add fake job report crowdsourcing

---

## ⚖️ License — MIT

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Would you like me to also include a **`start-all.sh`** (Linux/macOS equivalent of `start-all.ps1`) so your teammates on Mac or Ubuntu can launch both servers easily too?
