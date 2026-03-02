# Fake Job Posting Tracker - Testing Guide

This document outlines how to verify the correctness of the Fake Job Posting Tracker application.

## Backend Tests

The backend uses `pytest` for unit and integration testing. Tests are located in `packages/backend/tests`.

### Running Tests

To run the entire test suite, change into the backend directory and run:

```bash
cd packages/backend
pytest
```

To run a specific test file:

```bash
pytest tests/test_hybrid_ranker.py
```

## Frontend Tests

Currently, the frontend relies on TypeScript compiler checks (`npx tsc --noEmit`) to verify type correctness and static analysis via ESLint. Visual inspection and manual testing are performed for the frontend UI/UX in a local development environment.

To run the type checker:

```bash
cd packages/frontend
npx tsc --noEmit
```
