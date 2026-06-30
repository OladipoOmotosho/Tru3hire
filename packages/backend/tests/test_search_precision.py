"""
Search precision tests (Task 10.2 / 10.3).

Covers the two orchestrator-level guarantees for an explicit-seniority query:
- retrieval uses a broad primary (recall) + a seniority-targeted rewrite (10.2)
- the hard seniority filter drops contrary-titled results, with a safety net (10.3)

Note: precision for an explicit level no longer comes from forcing the seniority
word into every retrieval query (that collapsed recall — see the recall fix).
It comes from the contrary-seniority filter below plus the ranker; the broad
primary maximizes the candidate pool.
"""

from app.services.query_resolver import ParsedJobQuery
from app.services.search_orchestrator import (
    _build_retrieval_queries,
    _filter_contrary_seniority,
)


class TestRetrievalQueriesTargetSeniority:
    def test_broad_primary_plus_seniority_targeted_rewrite(self):
        pq = ParsedJobQuery(
            keywords=["software", "engineer", "python"],
            seniority="intern",
            role_title="software engineer",
            original_query="software engineer intern python",
        )
        queries = _build_retrieval_queries(pq, "software engineer intern python")
        assert len(queries) >= 2
        # Recall: the primary query is broad — no seniority baked in.
        assert "intern" not in queries[0].lower(), queries
        # Precision: a dedicated rewrite targets the level so those roles still
        # enter the pool; wrong-level results are removed downstream by
        # _filter_contrary_seniority (see TestHardSeniorityFilter).
        assert any("intern" in q.lower() for q in queries[1:]), queries

    def test_no_seniority_unaffected(self):
        pq = ParsedJobQuery(
            keywords=["data", "analyst"],
            role_title="data analyst",
            original_query="data analyst",
        )
        queries = _build_retrieval_queries(pq, "data analyst")
        assert queries  # still produces queries, just none forced to a level


class TestHardSeniorityFilter:
    def _jobs(self):
        return [
            {"id": "1", "title": "Software Engineer Intern"},
            {"id": "2", "title": "Senior Software Engineer"},
            {"id": "3", "title": "Software Engineer"},  # unspecified
            {"id": "4", "title": "Lead Software Engineer"},
            {"id": "5", "title": "Software Engineering Intern (Summer)"},
        ]

    def test_intern_query_drops_senior_and_lead(self):
        kept, removed = _filter_contrary_seniority(self._jobs(), "intern")
        titles = [j["title"] for j in kept]
        assert "Senior Software Engineer" not in titles
        assert "Lead Software Engineer" not in titles
        # interns and the unspecified role survive
        assert "Software Engineer Intern" in titles
        assert "Software Engineer" in titles
        assert removed == 2

    def test_no_seniority_is_a_noop(self):
        jobs = self._jobs()
        kept, removed = _filter_contrary_seniority(jobs, None)
        assert kept == jobs
        assert removed == 0

    def test_safety_net_when_all_contrary(self):
        # If every result is contrary, return them all rather than nothing.
        all_senior = [
            {"id": "1", "title": "Senior Engineer"},
            {"id": "2", "title": "Principal Engineer"},
        ]
        kept, removed = _filter_contrary_seniority(all_senior, "intern")
        assert kept == all_senior
        assert removed == 0

    def test_intern_not_falsely_dropped_by_international(self):
        jobs = [{"id": "1", "title": "International Software Engineer Intern"}]
        kept, _ = _filter_contrary_seniority(jobs, "intern")
        assert len(kept) == 1  # 'international' is not a contrary level
