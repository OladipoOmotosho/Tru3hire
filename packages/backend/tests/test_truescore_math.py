"""Tests for canonical TrueScore math model."""

from app.services.scorer import TrueScoreAggregator


def test_effective_weights_sum_to_one_with_resume():
    aggregator = TrueScoreAggregator()
    weights = aggregator._effective_weights(has_resume=True)

    assert set(weights.keys()) == {
        "resume_match",
        "recency",
        "authenticity",
        "hiring_activity",
        "company_reputation",
    }
    assert abs(sum(weights.values()) - 1.0) < 1e-9


def test_effective_weights_sum_to_one_without_resume():
    aggregator = TrueScoreAggregator()
    weights = aggregator._effective_weights(has_resume=False)

    assert "resume_match" not in weights
    assert set(weights.keys()) == {
        "recency",
        "authenticity",
        "hiring_activity",
        "company_reputation",
    }
    assert abs(sum(weights.values()) - 1.0) < 1e-9


def test_calculate_true_score_with_resume_uses_base_weights():
    aggregator = TrueScoreAggregator()

    score = aggregator.calculate_true_score(
        authenticity=80,
        hiring_activity=70,
        resume_match=90,
        company_reputation=60,
        recency=100,
        has_resume=True,
    )

    expected = round(
        (90 * 0.30)
        + (100 * 0.15)
        + (80 * 0.25)
        + (70 * 0.20)
        + (60 * 0.10)
    )
    assert score == expected


def test_calculate_true_score_without_resume_re_normalizes_weights():
    aggregator = TrueScoreAggregator()

    score = aggregator.calculate_true_score(
        authenticity=80,
        hiring_activity=70,
        resume_match=0,
        company_reputation=60,
        recency=100,
        has_resume=False,
    )

    # Re-normalized from base weights without resume_match:
    # recency: 0.15/0.70, authenticity: 0.25/0.70,
    # hiring_activity: 0.20/0.70, company_reputation: 0.10/0.70
    expected = round(
        (100 * (0.15 / 0.70))
        + (80 * (0.25 / 0.70))
        + (70 * (0.20 / 0.70))
        + (60 * (0.10 / 0.70))
    )
    assert score == expected


def test_calculate_true_score_clamps_inputs_and_output_bounds():
    aggregator = TrueScoreAggregator()

    score = aggregator.calculate_true_score(
        authenticity=999,
        hiring_activity=-50,
        resume_match=250,
        company_reputation=-1,
        recency=500,
        has_resume=True,
    )

    assert 0 <= score <= 100
