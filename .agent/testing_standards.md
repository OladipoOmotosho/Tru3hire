---
inclusion: always
---

# Testing Standards

## 1. Test Philosophy

- **Test behavior, not implementation.** Tests should describe what the system does, not how it does it.
- **Every bug gets a test.** When a bug is found, write a failing test first, then fix it. This prevents regressions.
- **Tests are documentation.** Someone reading your tests should understand the feature's expected behavior.

## 2. Backend Testing (pytest)

### Structure

```
packages/backend/tests/
├── test_truescore_math.py        # Unit: scoring algorithms
├── test_hybrid_ranker.py         # Unit: search ranking
├── test_facet_engine.py          # Unit: facet computation
├── test_geo_filter.py            # Unit: geo matching
├── test_nonsense_detection.py    # Unit: input validation
├── test_negation_extraction.py   # Unit: NLP extraction
├── test_application_tracking.py  # Integration: app tracking flow
└── ...
```

### Naming

- File: `test_<module>.py`
- Class: `Test<Feature>` (group related tests)
- Method: `test_<what_it_verifies>` (descriptive, reads like a sentence)

```python
class TestTrueScore:
    def test_perfect_job_returns_high_score(self): ...
    def test_empty_description_returns_zero(self): ...
    def test_missing_salary_penalizes_score(self): ...
```

### Coverage Guidelines

- **Critical services** (scorer, search, auth): aim for 80%+ coverage.
- Always test: happy path, edge cases, error conditions, boundary values.
- **Mock external services** (Gemini API, Clerk, HTTP calls) to keep tests fast and deterministic.

### Assertions

```python
# GOOD: Specific assertion with message
assert score >= 0.0, f"Score must be non-negative, got {score}"
assert len(results) == 5, f"Expected 5 results, got {len(results)}"

# BAD: Bare assert with no context
assert score >= 0
```

## 3. Frontend Testing

### TypeScript Type-Check

The primary frontend "test" is the TypeScript compiler:
```bash
yarn typecheck
```

All components, hooks, and pages must pass strict type checking with:
- No `any` types
- Explicit prop interfaces
- Strict null checks

### Manual Testing Checklist

For UI changes, verify:
- [ ] Renders correctly on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Loading states are shown during API calls
- [ ] Error states display user-friendly messages
- [ ] Protected pages redirect to login when unauthenticated
- [ ] Keyboard navigation works for interactive elements

## 4. Pre-Push Gate

Before pushing any code, run:
1. `yarn typecheck` — Frontend types
2. `python -m pytest tests/ -v` — Backend tests
3. `yarn build` — Frontend builds without errors
