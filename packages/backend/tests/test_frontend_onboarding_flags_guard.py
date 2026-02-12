"""Guard tests for frontend onboarding-flag compatibility.

These tests ensure we keep supporting both onboarding metadata keys:
- onboardingComplete
- hasCompletedOnboarding
"""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _read(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def test_onboarding_page_writes_both_onboarding_flags():
    content = _read("packages/frontend/src/pages/OnboardingPage.tsx")

    assert "onboardingComplete: true" in content
    assert "hasCompletedOnboarding: true" in content


def test_results_page_accepts_either_onboarding_flag():
    content = _read("packages/frontend/src/pages/ResultsPage.tsx")

    assert "meta.hasCompletedOnboarding === true" in content
    assert "meta.onboardingComplete === true" in content


def test_protected_route_accepts_either_onboarding_flag():
    content = _read("packages/frontend/src/components/ProtectedRoute.tsx")

    assert "user?.unsafeMetadata?.onboardingComplete === true" in content
    assert "user?.unsafeMetadata?.hasCompletedOnboarding === true" in content
