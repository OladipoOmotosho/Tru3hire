---
description: Run all test suites (backend pytest + frontend typecheck)
---

# Run All Tests

Run the full test suite to verify nothing is broken.

## Steps

1. Run backend pytest suite (TrueScore math, contracts, facets, geo, etc.):
// turbo
```bash
cd packages/backend && python -m pytest tests/ -v --tb=short
```

2. Run the focused TrueScore contract tests:
// turbo
```bash
yarn test:truescore
```

3. Run frontend TypeScript type-check:
// turbo
```bash
yarn typecheck
```

## Notes

- If a specific test file is failing, run it in isolation:
  ```bash
  cd packages/backend && python -m pytest tests/test_<name>.py -v
  ```
- Always run this workflow before pushing to `main` or opening a PR.
