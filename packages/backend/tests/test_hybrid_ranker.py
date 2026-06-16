"""
Tests for Hybrid Ranker

Tests keyword scoring, signal boosting, hard exclusion filtering,
hybrid ranking, reranking, and confidence assessment.
"""

from app.services.hybrid_ranker import (
    keyword_score,
    signal_boost,
    violates_hard_exclusions,
    apply_hard_exclusions,
    rank_jobs,
    rerank_results,
    assess_confidence,
    suggest_refinements,
    tokenize,
)
from app.services.search_schemas import SearchSignals


# =============================================================================
# Tokenisation
# =============================================================================

class TestTokenize:
    def test_removes_stopwords(self):
        tokens = tokenize("looking for a senior python developer in Toronto")
        assert "looking" not in tokens
        assert "for" not in tokens
        assert "a" not in tokens
        assert "senior" in tokens
        assert "python" in tokens
        assert "developer" in tokens
        assert "toronto" in tokens

    def test_empty_string(self):
        assert tokenize("") == []


# =============================================================================
# Keyword Scoring
# =============================================================================

class TestKeywordScore:
    def test_full_coverage(self):
        score = keyword_score("senior python developer", ["senior", "python", "developer"])
        assert score == 1.0

    def test_partial_coverage(self):
        score = keyword_score("senior python developer", ["senior", "golang", "developer"])
        assert abs(score - 2 / 3) < 0.01

    def test_no_coverage(self):
        score = keyword_score("senior python developer", ["golang", "rust"])
        assert score == 0.0

    def test_empty_keywords(self):
        score = keyword_score("some text", [])
        assert score == 0.0

    def test_case_insensitive(self):
        score = keyword_score("Senior Python Developer", ["senior", "python"])
        assert score == 1.0


# =============================================================================
# Signal Boost
# =============================================================================

class TestSignalBoost:
    def test_remote_boost(self):
        job = {"title": "Remote Python Dev", "company": "", "location": "", "description": ""}
        signals = SearchSignals(keywords=["python"], remote=True)
        boost, matched = signal_boost(job, signals)
        assert boost > 0
        assert "remote" in matched

    def test_seniority_boost(self):
        job = {"title": "Senior Engineer", "company": "", "location": "", "description": ""}
        signals = SearchSignals(keywords=["engineer"], seniority="senior")
        boost, matched = signal_boost(job, signals)
        assert boost > 0
        assert "senior" in matched

    def test_no_match(self):
        job = {"title": "Junior Dev", "company": "", "location": "", "description": ""}
        signals = SearchSignals(keywords=["dev"], remote=True, seniority="senior")
        boost, matched = signal_boost(job, signals)
        # remote not in title, senior not in title
        assert "remote" not in matched
        assert "senior" not in matched

    def test_freshness_boost(self):
        job = {"title": "Dev", "company": "", "location": "", "description": "", "days_ago": 1}
        signals = SearchSignals(keywords=["dev"])
        boost, matched = signal_boost(job, signals)
        assert any("fresh" in m for m in matched)

    def test_negation_penalty(self):
        job = {"title": "Engineering Manager", "company": "", "location": "", "description": ""}
        signals = SearchSignals(keywords=["engineer"], excluded_keywords=["manager"])
        boost, matched = signal_boost(job, signals)
        assert boost < 0  # Net negative due to penalty


# =============================================================================
# Hard Exclusion Filtering
# =============================================================================

class TestHardExclusions:
    def test_detects_excluded_term(self):
        job = {"title": "Engineering Manager", "company": "", "location": "", "description": ""}
        assert violates_hard_exclusions(job, ["manager"]) is True

    def test_detects_variant(self):
        job = {"title": "VP of Engineering", "company": "", "location": "", "description": ""}
        assert violates_hard_exclusions(job, ["executive"]) is True  # VP is a variant

    def test_no_match(self):
        job = {"title": "Software Engineer", "company": "", "location": "", "description": ""}
        assert violates_hard_exclusions(job, ["manager"]) is False

    def test_empty_exclusions(self):
        job = {"title": "Whatever", "company": "", "location": "", "description": ""}
        assert violates_hard_exclusions(job, []) is False

    def test_apply_filters(self):
        jobs = [
            {"id": 1, "title": "Software Engineer", "company": "", "location": "", "description": ""},
            {"id": 2, "title": "Engineering Manager", "company": "", "location": "", "description": ""},
            {"id": 3, "title": "Senior Developer", "company": "", "location": "", "description": ""},
        ]
        signals = SearchSignals(keywords=["engineer"], excluded_keywords=["manager"])
        kept, excluded = apply_hard_exclusions(jobs, signals)
        assert excluded == 1
        assert len(kept) == 2
        assert all(j["id"] != 2 for j in kept)


# =============================================================================
# Ranking
# =============================================================================

class TestRankJobs:
    def test_ranks_by_final_score(self):
        jobs = [
            {"id": "a", "title": "Junior Dev", "description": "Python"},
            {"id": "b", "title": "Senior Python Developer", "description": "Python expert"},
        ]
        signals = SearchSignals(keywords=["python", "developer"], seniority="senior")
        ranked = rank_jobs(
            jobs, signals,
            embedding_scores={"a": 0.3, "b": 0.9},
            truescore_map={"a": 60, "b": 85},
        )
        assert ranked[0]["id"] == "b"
        assert ranked[0]["final_score"] > ranked[1]["final_score"]

    def test_includes_score_breakdown(self):
        jobs = [{"id": "x", "title": "Dev", "description": "Code"}]
        signals = SearchSignals(keywords=["dev"])
        ranked = rank_jobs(jobs, signals)
        assert "score_breakdown" in ranked[0]
        bd = ranked[0]["score_breakdown"]
        assert "relevance" in bd
        assert "truescore" in bd
        assert "final_score" in bd

    def test_includes_matched_signals(self):
        jobs = [{"id": "x", "title": "Remote Senior Dev", "description": "", "company": "", "location": ""}]
        signals = SearchSignals(keywords=["dev"], remote=True, seniority="senior")
        ranked = rank_jobs(jobs, signals)
        assert "remote" in ranked[0]["matched_signals"]
        assert "senior" in ranked[0]["matched_signals"]


# =============================================================================
# Reranking
# =============================================================================

class TestReranking:
    def test_rerank_adjusts_scores(self):
        jobs = [
            {"id": "a", "title": "Python Developer", "description": "Python expert", "company": "", "location": "",
             "final_score": 0.8, "matched_signals": [], "score_breakdown": {"relevance": {}, "final_score": 0.8}},
            {"id": "b", "title": "Java Engineer", "description": "Java code", "company": "", "location": "",
             "final_score": 0.7, "matched_signals": [], "score_breakdown": {"relevance": {}, "final_score": 0.7}},
        ]
        reranked = rerank_results(jobs, "python developer")
        # "Python Developer" should get a higher rerank score than "Java Engineer"
        assert reranked[0]["final_score"] >= 0.8

    def test_empty_jobs(self):
        assert rerank_results([], "query") == []


# =============================================================================
# Confidence Assessment
# =============================================================================

class TestConfidence:
    def test_empty_results_low_confidence(self):
        conf = assess_confidence([])
        assert conf.is_low_confidence is True

    def test_good_spread(self):
        jobs = [
            {"final_score": 0.9},
            {"final_score": 0.7},
            {"final_score": 0.5},
            {"final_score": 0.3},
            {"final_score": 0.1},
        ]
        conf = assess_confidence(jobs)
        assert conf.is_low_confidence is False
        assert conf.top_score == 0.9
        assert conf.spread > 0.0

    def test_flat_scores_low_confidence(self):
        jobs = [{"final_score": 0.01} for _ in range(5)]
        conf = assess_confidence(jobs)
        assert conf.is_low_confidence is True


# =============================================================================
# Refinement Suggestions
# =============================================================================

class TestRefinementSuggestions:
    def test_suggests_when_missing(self):
        signals = SearchSignals(keywords=["python"])
        suggestions = suggest_refinements(signals)
        dimensions = {s.dimension for s in suggestions}
        assert "remote" in dimensions
        assert "seniority" in dimensions
        assert "location" in dimensions

    def test_no_remote_suggestion_when_present(self):
        signals = SearchSignals(keywords=["python"], remote=True)
        suggestions = suggest_refinements(signals)
        dimensions = {s.dimension for s in suggestions}
        assert "remote" not in dimensions

    def test_max_four(self):
        signals = SearchSignals(keywords=["python"])
        suggestions = suggest_refinements(signals)
        assert len(suggestions) <= 4
