"""
Unit tests for seniority scoring (Task 10.1).

Regression target: an "intern" search used to score senior roles 0.5 (neutral)
because `contrary_levels` had no entry for intern/mid/principal. A contrary
level must now score low (0.05); an exact level match scores 1.0.
"""

import pytest

from app.services.job_ranker import _calculate_seniority_score

EXACT = 1.0
CONTRARY = 0.05
NEUTRAL = 0.5


class TestSeniorityScoring:
    def test_no_target_is_neutral(self):
        assert _calculate_seniority_score("Senior Software Engineer", None) == NEUTRAL

    @pytest.mark.parametrize(
        "target,title,expected",
        [
            # intern (the reported bug)
            ("intern", "Software Engineer Intern", EXACT),
            ("intern", "Senior Software Engineer", CONTRARY),
            ("intern", "Lead Software Engineer", CONTRARY),
            ("intern", "Principal Engineer", CONTRARY),
            ("intern", "Engineering Manager", CONTRARY),
            ("intern", "Software Engineer", NEUTRAL),  # unspecified level
            # senior
            ("senior", "Senior Software Engineer", EXACT),
            ("senior", "Software Engineer Intern", CONTRARY),
            ("senior", "Junior Developer", CONTRARY),
            ("senior", "New Grad Software Engineer", CONTRARY),
            ("senior", "Software Engineer", NEUTRAL),
            # mid
            ("mid", "Mid-Level Software Engineer", EXACT),
            ("mid", "Principal Engineer", CONTRARY),
            ("mid", "Software Engineer Intern", CONTRARY),
            # principal
            ("principal", "Principal Engineer", EXACT),
            ("principal", "Junior Engineer", CONTRARY),
            # junior
            ("junior", "Junior Developer", EXACT),
            ("junior", "Senior Staff Engineer", CONTRARY),
        ],
    )
    def test_levels(self, target, title, expected):
        assert _calculate_seniority_score(title, target) == expected

    def test_intern_does_not_false_match_international(self):
        # 'intern' must not match inside 'international' (word-boundary guard),
        # and no contrary term is present → neutral, not an exact 1.0 match.
        score = _calculate_seniority_score(
            "International Logistics Coordinator", "intern"
        )
        assert score == NEUTRAL

    def test_contrary_beats_neutral_for_ranking(self):
        # A senior role must score strictly lower than an unspecified role
        # when the user asked for an intern.
        senior = _calculate_seniority_score("Senior Software Engineer", "intern")
        plain = _calculate_seniority_score("Software Engineer", "intern")
        intern = _calculate_seniority_score("Software Engineer Intern", "intern")
        assert intern > plain > senior
