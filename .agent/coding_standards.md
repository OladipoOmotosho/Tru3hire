---
inclusion: always
---

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

## Component Standards

- **Naming**: All components use descriptive PascalCase names (e.g. `JobCard`, `ScoreGauge`). No framework-specific prefixes.
- **className Prop**: Every visual component must accept an optional `className` prop for style overrides.
- **Responsive**: Use mobile-first Tailwind (`w-full md:w-1/2`). Test at `sm`, `md`, `lg` breakpoints.
- **Props Interface**: Always define TypeScript interfaces for component props
- **Named Exports**: Use named exports for components (`export function JobCard`), named exports for utilities
- **Composition**: Design components to be composable and reusable
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Performance**: Implement React.memo for expensive components
- **Error Boundaries**: Wrap complex components with error boundaries
- **LINES OF CODE PER FILE**: No file should exceed 350 lines of code

## Change Scope Limits

- Prefer 15–25 files per PR for routine work
- Exceptions are allowed for large refactors, cross-cutting renames, or multi-layer features — justify in the PR description and get reviewer/owner approval

## Code Quality Requirements

- All code must be concise, readable, performant, efficient, scalable, and maintainable
- Ensure existing functions, hooks, and utilities are used before adding new ones to avoid repetition
- Follow DRY principles at all times
- Use separation of concerns for modules, services, and components
- Modularize where possible and create reusable components when future use is likely
- Avoid prop drilling; prefer context, hooks, or state management patterns
- Follow system design tokens, design systems, and product requirements

## 5. Rules Modification

> "As we progress and learn we will be updating these rules."

- If a rule slows us down without benefit, we discuss and remove it.
