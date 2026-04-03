---
description: Add a new test file for a backend service or route
---

# Add a New Test

Guide for writing and running a new backend test.

## Steps

### 1. Create Test File

Create `packages/backend/tests/test_<name>.py`:

```python
"""Tests for <service/feature name>."""
import pytest
from app.services.<module> import <function_to_test>


class TestFeatureName:
    """Test suite for <feature>."""

    def test_happy_path(self):
        """Verify expected behavior with valid input."""
        result = function_to_test(valid_input)
        assert result == expected_output

    def test_edge_case(self):
        """Verify behavior at boundaries."""
        result = function_to_test(edge_input)
        assert result is not None

    def test_error_handling(self):
        """Verify graceful failure with bad input."""
        with pytest.raises(ValueError):
            function_to_test(bad_input)
```

### 2. Run the New Test

// turbo
```bash
cd packages/backend && python -m pytest tests/test_<name>.py -v
```

### 3. Run Full Suite to Check for Regressions

// turbo
```bash
cd packages/backend && python -m pytest tests/ -v --tb=short
```

## Test Naming Conventions

- File: `test_<module_name>.py`
- Class: `TestFeatureName`
- Method: `test_<what_it_verifies>`
- Use descriptive assertion messages where the failure cause is not obvious
