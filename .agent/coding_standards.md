# TrueHire Coding Standards

## 1. General Principles

- **DRY (Don't Repeat Yourself)**:
  - **Zero Tolerance** for duplication. Extract common logic into utils or hooks.
  - If you see usage 3+ times, refactor immediately.
- **KISS (Keep It Simple, Stupid)**: Start simple. Avoid over-engineering.
- **Clean Code**:
  - **No `console.log`** in production.
  - **No Magic Numbers**: Use constants.
  - **Self-documenting**: Variable names should explain _what_ they are. Comments explain _why_.

## 2. Naming Conventions

| Type               | Convention                                     | Example                        |
| :----------------- | :--------------------------------------------- | :----------------------------- |
| **Files**          | `PascalCase` (Components), `camelCase` (logic) | `JobCard.tsx`, `useAuth.ts`    |
| **Components**     | `PascalCase`                                   | `JobCard`, `ScoreGauge`        |
| **Functions**      | `camelCase`                                    | `calculateScore`, `fetchJobs`  |
| **Variables**      | `camelCase`                                    | `isLoading`, `userProfile`     |
| **Constants**      | `UPPER_SNAKE_CASE`                             | `MAX_RETRIES`, `API_URL`       |
| **Python Classes** | `PascalCase`                                   | `ResumeParser`                 |
| **Python Vars**    | `snake_case`                                   | `job_description`, `file_path` |

## 3. Frontend Standards (React + TS)

- **Strict TypeScript**:
  - **NO `any`**. Use `unknown` or define an `interface`.
  - Define interfaces for ALL component props.
- **Function Components**: Always use functional components + Hooks.
- **Folder Structure**:
  - `packages/frontend/src/components/`: Reusable UI (Buttons, Cards).
  - `packages/frontend/src/pages/`: Page layouts.
  - `packages/frontend/src/hooks/`: Custom state logic.
- **Styling**:
  - **Tailwind CSS** only. No `.css` files (except global).
  - Use `clsx` or `tailwind-merge` for conditional classes.
  - **No inline styles** (`style={{...}}`).
- **State**:
  - `useState` for local.
  - Context for global (User, Auth).

## 4. Backend Standards (Python + FastAPI)

- **PEP 8**: Follow standard Python style.
- **Type Hints**: **Mandatory** for all function arguments and returns.
  ```python
  def get_score(text: str) -> float:
      ...
  ```
- **Pydantic**: Use Pydantic models for all API Request/Response schemas.
- **Routers**: Split routes into `packages/backend/app/routers/` if `main.py` exceeds 200 lines.
- **Services**: Business logic goes in `packages/backend/app/services/`.

## 5. Rules Modification

> "As we progress and learn we will be updating these rules."

- If a rule slows us down without benefit, we discuss and remove it.
