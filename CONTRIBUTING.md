# Contributing to TrueHire

Thanks for contributing! This guide covers our branch, commit, and PR conventions.

## Branches

- Branch off `main`. Never commit directly to `main`.
- Name branches `type/short-description`, e.g.:
  - `feat/company-response-card`
  - `fix/lifespan-logging-crash`
  - `chore/prune-artifact-registry`
  - `docs/commit-conventions`

## Commit messages — Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<optional scope>): <short summary in the imperative mood>

<optional body — what changed and why>

<optional footer — trailers, breaking changes>
```

### Types

| Type | Use for |
| --- | --- |
| `feat` | A new feature or user-facing capability |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `test` | Adding or correcting tests (no product code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | A performance improvement |
| `chore` | Maintenance: cleanup, deps, config, tooling (no src/test behavior change) |
| `ci` | CI/CD configuration and scripts |
| `build` | Build system or external dependencies |
| `style` | Formatting/whitespace only, no logic change |
| `revert` | Reverts a previous commit |

> Note: the type for bug fixes is **`fix`** (the Conventional Commits standard),
> not `bug`/`bugs`.

### Scope (optional)

A short area in parentheses: `feat(search):`, `fix(backend):`, `chore(repo):`,
`ci(backend):`. Use it when it adds clarity.

### Rules

- Summary in the **imperative mood** ("add", "fix", "remove" — not "added"/"fixes").
- Keep the summary ≤ ~72 chars; put detail in the body.
- One logical change per commit where practical.
- A **breaking change** adds a `!` after the type/scope and a `BREAKING CHANGE:`
  footer, e.g. `feat(api)!: drop the legacy /analyze payload`.

### Examples

```
feat(search): make explicit seniority narrow results
fix(backend): remove shadowed `import logging` that crashed startup
chore(repo): untrack editor artifacts and add .gitignore rules
docs(roadmap): check off Phase 1 tasks 7-9
test(frontend): add scamDetection and job-utils unit tests
ci(backend): add Python 3.11 lint + pytest + model-load gate
```

### AI-assisted commits

Commits and PRs created with AI assistance include a trailer:

```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

## Pull requests

- Keep PRs small and focused on one logical change.
- Both CI jobs (`frontend`, `backend`) must pass before merge.
- Backend tests live in `packages/backend/tests/`; frontend tests beside the
  code (`*.test.ts(x)`).
- PR titles should also follow the commit convention (e.g.
  `feat(search): …`).

## Local checks before pushing

```bash
# Backend (from packages/backend)
python -m ruff check .
python -m pytest -q

# Frontend
yarn workspace frontend typecheck
yarn workspace frontend test
```
