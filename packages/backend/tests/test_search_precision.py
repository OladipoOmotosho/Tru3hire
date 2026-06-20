"""
Search precision tests (Task 10.2 / 10.3).

Covers the two orchestrator-level guarantees for an explicit-seniority query:
- retrieval rewrites keep the seniority qualifier (10.2)
- the hard seniority filter drops contrary-titled results, with a safety net (10.3)
"""

from app.services.query_resolver import ParsedJobQuery
from app.services.search_orchestrator import (
    _build_retrieval_queries,
    _filter_contrary_seniority,
)


class TestRetrievalQueriesKeepSeniority:
    def test_all_rewrites_keep_explicit_seniority(self):
        pq = ParsedJobQuery(
            keywords=["software", "engineer", "python"],
            seniority="intern",
            role_title="software engineer",
            original_query="software engineer intern python",
        )
        queries = _build_retrieval_queries(pq, "software engineer intern python")
        assert len(queries) >= 2
        # Every retrieval query must still carry the qualifier — broadening it
        # away is what let senior roles flood an "intern" search.
        assert all("intern" in q.lower() for q in queries), queries

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
