# Git & Workflow Standards

## 1. Branching Strategy

- **`main`**: Production ready. Protected.
- **`develop`** (Optional): Integration branch.
- **Feature Branches**: `feature/<name>` (e.g., `feature/resume-parser`).
- **Fix Branches**: `fix/<issue>` (e.g., `fix/api-headers`).
- **Chore**: `chore/<task>` (e.g., `chore/update-deps`).

## 2. Commit Messages

Use **Conventional Commits** to keep history readable.

Format: `<type>: <description>`

- `feat: add resume upload component`
- `fix: resolve cors error in backend`
- `docs: update readme with truehire vision`
- `style: format code with prettier`
- `refactor: simplify scoring logic`

## 3. Pull Requests (PRs)

- **Small & Focused**: Keep PRs limited to one feature or fix.
- **Title**: Matches commit format.
- **Description**:
  - **Summary**: What does this PR do?
  - **Testing**: How was it verified? (e.g. "Ran local backend, uploaded PDF").
- **Review**: Self-review your code before asking for feedback.

## 4. Pre-Commit Checklist

1.  **Lint**: Ensure no ESLint errors.
2.  **Format**: Code is formatted (Prettier).
3.  **Type Check**: No TypeScript errors.
4.  **Test**: Unit tests pass (where applicable).
