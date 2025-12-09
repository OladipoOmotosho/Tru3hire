# TrueHire MVP: Backend PRD

## 1. Overview

The backend must evolve from a simple inference engine to an aggregation service. It needs to accept files (resumes), process text (jobs), and run multiple isolated analysis modules to compute the "TrueScore".

## 2. API Design

### A. Endpoints

- `POST /analyze`

  - **Input**: `Multipart/Form-Data`
    - `resume_file`: File (Optional)
    - `job_text`: String
    - `job_url`: String (Optional)
  - **Output**: JSON
    - `true_score`: Integer (0-100)
    - `breakdown`: { authenticity, likelihood, match, fairness, reputation }
    - `insights`: List[String]
    - `recommendations`: List[String]

- `GET /health`
  - Status check for all ML services.

## 3. Architecture Changes

- **Service Layer Pattern**: Separate `routes` from `logic`.
  - `services/parser.py`: Handles PDF/Docx text extraction.
  - `services/scorer.py`: Orchestrates the 5 metrics.
  - `services/ml.py`: Loads and runs the specific models.
- **Data Models**: Define Pydantic models for the complex response structure.

## 4. Daily Task List (Backend)

### Step 1: Environment & Parsing

- [ ] Install `python-multipart`, `pypdf`, `beautifulsoup4`.
- [ ] Implement `ResumeParser` class (extract text from PDF).
- [ ] Implement `JobScraper` (basic version: fetch HTML and extract text if URL provided).
- _Acceptance_: Unit test passes for extracting text from a sample PDF.

### Step 2: The TrueScore Engine (Skeleton)

- [ ] Create `ScoreAggregator` class.
- [ ] Implement the weighted sum logic: `(Auth * 0.25) + (Hiring * 0.25) + ...`
- [ ] Define the Pydantic Response Schemas.
- _Acceptance_: Calling the aggregator with mock scores returns a correct total TrueScore.

### Step 3: API Endpoint Implementation

- [ ] Create `POST /analyze` endpoint in FastAPI.
- [ ] Handle file uploads and text input.
- [ ] Connect Endpoint -> Parser -> Aggregator -> Response.
- _Acceptance_: cURL request with a PDF and Text returns a valid JSON structure.

### Step 4: Error Handling & Refinement

- [ ] Add validations (file size limits, empty text).
- [ ] Add CORS configuration for Frontend.
- _Acceptance_: Invalid inputs return 400 Client Errors with helpful messages.
