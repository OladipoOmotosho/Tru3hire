"""
Search Orchestrator

Main entry-point for the enhanced search pipeline. Wires together:
- Signal extraction + query resolution (existing)
- Multi-query retrieval via Adzuna API
- Embedding-based similarity scoring
- Hybrid ranking (embedding + keyword + signal + TrueScore)
- Lightweight reranking
- Confidence-based retry
- Refinement suggestions

Adapted from HiringCafe's search.py for TrueHire's architecture.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
import threading
import copy
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict
from typing import Any, Dict, List, Optional

from app.services.search_constants import (
    ABBREVIATION_EXPANSIONS,
    MAX_MULTI_QUERIES,
    STOPWORDS,
)
from app.services.search_schemas import (
    ConfidenceMetrics,
    EnhancedSearchResponse,
    SearchContext,
    SearchSignals,
)
from app.services.embedding_service import embed_text, cosine_similarity
from app.services.hybrid_ranker import (
    apply_hard_exclusions,
    assess_confidence,
    rank_jobs,
    rerank_results,
    suggest_refinements,
    tokenize,
)
from app.services.signal_extractor import extract_signals
from app.services.query_resolver import resolve_signals, ParsedJobQuery
from app.services.refinement_analyzer import analyze_results
from app.services.jobs import search_jobs
from app.services.scorer import true_score_aggregator

logger = logging.getLogger(__name__)


# =============================================================================
# Pipeline Response Cache — avoid re-calling Gemini for identical searches
# =============================================================================

_pipeline_cache: OrderedDict = OrderedDict()   # key → (response_dict, timestamp)
_pipeline_cache_lock = asyncio.Lock()
_PIPELINE_CACHE_MAX = 200
_PIPELINE_CACHE_TTL = 600  # 10 minutes


def _make_pipeline_cache_key(
    query: str,
    refinements: List[str],
    page: int,
    limit: int,
    province: str,
    city: str,
    context: Optional[SearchContext] = None,
) -> str:
    """Deterministic cache key for a discover pipeline request."""
    context_dict = None
    if context:
        context_dict = context.model_dump() if hasattr(context, "model_dump") else context.dict()

    raw = json.dumps(
        {
            "q": query.strip().lower(),
            "r": [r.strip().lower() for r in refinements],
            "p": page,
            "l": limit,
            "prov": province.strip().lower(),
            "city": city.strip().lower(),
            "ctx": context_dict,
        },
        sort_keys=True,
    )
    return hashlib.md5(raw.encode()).hexdigest()


async def _get_cached_pipeline_response(key: str) -> Optional[EnhancedSearchResponse]:
    """Return cached response if present and fresh."""
    async with _pipeline_cache_lock:
        if key in _pipeline_cache:
            resp, ts = _pipeline_cache[key]
            if time.time() - ts < _PIPELINE_CACHE_TTL:
                _pipeline_cache.move_to_end(key)
                logger.info("Pipeline cache HIT for key=%s", key[:8])
                return copy.deepcopy(resp)
            else:
                del _pipeline_cache[key]
    return None


async def _set_cached_pipeline_response(key: str, response: EnhancedSearchResponse) -> None:
    """Store a pipeline response in the cache."""
    async with _pipeline_cache_lock:
        _pipeline_cache[key] = (copy.deepcopy(response), time.time())
        _pipeline_cache.move_to_end(key)
        while len(_pipeline_cache) > _PIPELINE_CACHE_MAX:
            _pipeline_cache.popitem(last=False)


async def get_pipeline_cache_stats() -> Dict[str, Any]:
    """Return pipeline cache stats for the health endpoint."""
    async with _pipeline_cache_lock:
        return {
            "size": len(_pipeline_cache),
            "max_size": _PIPELINE_CACHE_MAX,
            "ttl_seconds": _PIPELINE_CACHE_TTL,
        }


# =============================================================================
# Query Rewriting — multi-query expansion for broader recall
# =============================================================================

def _expand_abbreviations(text: str) -> str:
    """Replace known abbreviations with their full forms."""
    words = text.lower().split()
    expanded = []
    for word in words:
        if word in ABBREVIATION_EXPANSIONS:
            expanded.append(ABBREVIATION_EXPANSIONS[word])
        else:
            expanded.append(word)
    return " ".join(expanded)


def _build_retrieval_queries(
    parsed_query: ParsedJobQuery, original_query: str
) -> List[str]:
    """Generate multiple retrieval queries for broader recall.

    HiringCafe pattern: send N distinct queries and merge results.
    For Adzuna we send the primary query + 1-2 rewrites.

    Returns:
        List of distinct query strings (max MAX_MULTI_QUERIES).
    """
    queries: List[str] = []

    # Primary query: role_title or keywords with seniority prefix
    if parsed_query.role_title:
        primary = parsed_query.role_title
    elif parsed_query.keywords:
        primary = " ".join(parsed_query.keywords)
    else:
        # Clean up original query
        words = original_query.lower().split()
        clean = [w for w in words if w not in STOPWORDS]
        primary = " ".join(clean) if clean else original_query
    
    primary = _expand_abbreviations(primary)

    if parsed_query.seniority and parsed_query.seniority.lower() not in primary.lower():
        primary = f"{parsed_query.seniority} {primary}"

    queries.append(primary)

    # Rewrite 1: keyword-focused (drop seniority, add industry if available)
    if parsed_query.keywords and len(parsed_query.keywords) > 1:
        kw_query = " ".join(parsed_query.keywords[:4])
        kw_query = _expand_abbreviations(kw_query)
        if parsed_query.industry_preferences:
            kw_query = f"{kw_query} {parsed_query.industry_preferences[0]}"
        if kw_query not in queries:
            queries.append(kw_query)

    # Rewrite 2: concise role-only (just the title)
    if parsed_query.role_title and len(queries) < MAX_MULTI_QUERIES:
        concise = _expand_abbreviations(parsed_query.role_title)
        if concise not in queries:
            queries.append(concise)

    return queries[:MAX_MULTI_QUERIES]


def _build_focused_retry_query(parsed_query: ParsedJobQuery) -> str:
    """Build a narrower query for confidence retry.

    When the initial results are low-confidence, strip signal noise and
    return just the core role + seniority.
    """
    parts = []
    if parsed_query.seniority:
        parts.append(parsed_query.seniority)
    if parsed_query.role_title:
        parts.append(parsed_query.role_title)
    elif parsed_query.keywords:
        parts.append(parsed_query.keywords[0])
    return " ".join(parts) if parts else parsed_query.original_query


# =============================================================================
# Multi-query Adzuna Retrieval
# =============================================================================

async def _fetch_multi_query(
    queries: List[str],
    province: str,
    city: str,
    page: int,
    results_per_page: int,
    job_type: str,
) -> tuple[List[Dict[str, Any]], int]:
    """Fetch from Adzuna with multiple queries and merge/dedup results.

    Returns:
        (merged_jobs, approximate_total)
    """
    seen_ids: set = set()
    merged: List[Dict[str, Any]] = []
    total = 0

    # Primary query gets full page size; rewrites get less
    for i, query in enumerate(queries):
        per_page = results_per_page if i == 0 else max(results_per_page // 2, 10)
        try:
            result = await search_jobs(
                query=query,
                province=province,
                city=city,
                page=page,
                results_per_page=per_page,
                job_type=job_type,
            )
            if result.get("error"):
                logger.warning("Adzuna query %d failed: %s", i, result.get("error"))
                continue

            for job in result.get("jobs", []):
                job_id = str(job.get("id", ""))

                # Fallback to computing a deterministic hash if adzuna doesn't provide an ID
                if not job_id:
                    title = job.get("title", "")
                    company = job.get("company", {}).get("display_name", "") if isinstance(job.get("company"), dict) else str(job.get("company", ""))
                    loc = job.get("location", {}).get("display_name", "") if isinstance(job.get("location"), dict) else str(job.get("location", ""))
                    job_id = hashlib.md5(f"{title}:{company}:{loc}".encode()).hexdigest()
                    job["id"] = job_id  # inject so frontend has a stable key

                if job_id not in seen_ids:
                    seen_ids.add(job_id)
                    merged.append(job)

            total = max(total, result.get("total", 0))

        except Exception as exc:
            logger.exception("Multi-query fetch %d failed: %s", i, exc)

    return merged, total


# =============================================================================
# Embedding Similarity Scoring
# =============================================================================

# Job Embedding Cache
_job_embedding_cache: OrderedDict = OrderedDict()
_job_embedding_cache_lock = threading.Lock()
_JOB_EMBED_CACHE_MAX = 5000

# Shared bounded executor & semaphore — prevents quota exhaustion from ad-hoc
# ThreadPoolExecutor(max_workers=10) spawning unlimited parallel API calls.
_SHARED_MAX_WORKERS = 5
_shared_executor = ThreadPoolExecutor(max_workers=_SHARED_MAX_WORKERS)
_api_semaphore = threading.Semaphore(_SHARED_MAX_WORKERS)

def _compute_embedding_scores(
    query: str, jobs: List[Dict[str, Any]]
) -> Dict[Any, float]:
    """Compute cosine similarity between the query embedding and each job.

    Returns:
        {job_id: similarity_score} dict.
    """
    query_vec, _ = embed_text(query)
    if query_vec is None:
        return {job.get("id", ""): 0.0 for job in jobs}

    scores: Dict[Any, float] = {}
    jobs_to_embed = []
    
    with _job_embedding_cache_lock:
        for job in jobs:
            job_id = job.get("id", "")
            if job_id in _job_embedding_cache:
                job_vec = _job_embedding_cache[job_id]
                _job_embedding_cache.move_to_end(job_id)
                if job_vec is not None and len(job_vec) == len(query_vec):
                    scores[job_id] = cosine_similarity(query_vec, job_vec)
                else:
                    scores[job_id] = 0.0
            else:
                jobs_to_embed.append(job)

    def _embed_job(job):
        job_id = job.get("id", "")
        job_text = f"{job.get('title', '')} {job.get('company', '')} {job.get('description', '')}"
        acquired = _api_semaphore.acquire(timeout=10)
        if not acquired:
            logger.debug("Embedding semaphore timeout for job %s, using neutral score", job_id)
            return job_id, []
        try:
            job_vec, _ = embed_text(job_text[:2000])
        finally:
            _api_semaphore.release()
        return job_id, job_vec

    if jobs_to_embed:
        for job_id, job_vec in _shared_executor.map(_embed_job, jobs_to_embed):
            with _job_embedding_cache_lock:
                _job_embedding_cache[job_id] = job_vec
                _job_embedding_cache.move_to_end(job_id)
                while len(_job_embedding_cache) > _JOB_EMBED_CACHE_MAX:
                    _job_embedding_cache.popitem(last=False)
            
            if job_vec is not None and len(job_vec) == len(query_vec):
                scores[job_id] = cosine_similarity(query_vec, job_vec)
            else:
                scores[job_id] = 0.0

    for job in jobs:
        jid = job.get("id", "")
        if jid not in scores:
            scores[jid] = 0.0

    return scores


async def _compute_embedding_scores_async(
    query: str, jobs: List[Dict[str, Any]]
) -> Dict[Any, float]:
    """Async wrapper — runs blocking embedding computation in a thread."""
    return await asyncio.to_thread(_compute_embedding_scores, query, jobs)


# =============================================================================
# TrueScore Computation
# =============================================================================

def _compute_truescores(
    jobs: List[Dict[str, Any]]
) -> Dict[Any, Dict[str, Any]]:
    """Run TrueScore analysis concurrently on each job and return results map.

    Returns:
        {job_id: {"true_score": int, "risk_level": str, "breakdown": dict}}
    """
    results: Dict[Any, Dict[str, Any]] = {}
    
    def _analyze_job(job):
        job_id = job.get("id", "")
        job_text = f"Title: {job.get('title', '')} at {job.get('company', '')}\nLocation: {job.get('location', '')}\n{job.get('description', '')}"
        try:
            analysis = true_score_aggregator.analyze(job_text=job_text)
            return job_id, {
                "true_score": analysis.true_score,
                "risk_level": analysis.risk_level,
                "breakdown": {
                    "authenticity": analysis.breakdown.authenticity,
                    "hiring_activity": analysis.breakdown.hiring_activity,
                    "hiring_likelihood": analysis.breakdown.hiring_likelihood,
                    "resume_match": analysis.breakdown.resume_match,
                    "company_reputation": analysis.breakdown.company_reputation,
                    "recency": analysis.breakdown.recency,
                },
                "friction_signals": getattr(analysis, "friction_signals", []),
            }
        except Exception as exc:
            logger.exception("TrueScore failed for job %s: %s", job_id, exc)
            return job_id, {
                "true_score": 70,
                "risk_level": "caution",
                "breakdown": {
                    "authenticity": 70,
                    "hiring_activity": 60,
                    "hiring_likelihood": 60,
                    "resume_match": 50,
                    "company_reputation": 70,
                    "recency": 70,
                },
                "friction_signals": [],
            }

    for job_id, data in _shared_executor.map(_analyze_job, jobs):
        results[job_id] = data

    return results


async def _compute_truescores_async(
    jobs: List[Dict[str, Any]]
) -> Dict[Any, Dict[str, Any]]:
    """Async wrapper — runs blocking TrueScore computation in a thread."""
    return await asyncio.to_thread(_compute_truescores, jobs)


# =============================================================================
# Merge signals for multi-turn refinement
# =============================================================================

def merge_signals(base: SearchSignals, new: SearchSignals) -> SearchSignals:
    """Merge two signal sets for multi-turn refinement.

    Union keywords and exclusions, prefer new values for seniority/remote.
    """
    merged_kw = list(dict.fromkeys(base.keywords + new.keywords))
    merged_excl = list(dict.fromkeys(base.excluded_keywords + new.excluded_keywords))
    merged_loc = list(dict.fromkeys(base.location_terms + new.location_terms))
    merged_ind = list(dict.fromkeys(base.industry_prefs + new.industry_prefs))
    merged_org = list(dict.fromkeys(base.org_types + new.org_types))
    merged_traits = list(dict.fromkeys(base.company_traits + new.company_traits))

    return SearchSignals(
        keywords=merged_kw,
        excluded_keywords=merged_excl,
        remote=new.remote or base.remote,
        seniority=new.seniority or base.seniority,
        org_types=merged_org,
        location_terms=merged_loc,
        industry_prefs=merged_ind,
        job_type=new.job_type or base.job_type,
        company_traits=merged_traits,
        role_title=new.role_title or base.role_title,
    )


# =============================================================================
# Main Search Pipeline
# =============================================================================

async def enhanced_search(
    query: str,
    refinements: Optional[List[str]] = None,
    context: Optional[SearchContext] = None,
    page: int = 1,
    limit: int = 40,
    province: str = "",
    city: str = "",
) -> EnhancedSearchResponse:
    """Run the enhanced search pipeline.

    Pipeline:
    1. Parse query → signals (merge with prior context if multi-turn)
    2. Build retrieval queries (multi-query rewrites)
    3. Fetch from Adzuna using primary + rewritten queries
    4. Apply hard exclusions
    5. Compute TrueScores
    6. Compute embedding similarities
    7. Rank with hybrid formula
    8. Rerank top-N
    9. Confidence check → auto-retry if flat
    10. Generate refinement suggestions
    11. Return EnhancedSearchResponse
    """
    refinements = refinements or []

    # Check pipeline cache first
    cache_key = _make_pipeline_cache_key(
        query, refinements, page, limit, province, city, context
    )
    cached = await _get_cached_pipeline_response(cache_key)
    if cached is not None:
        return cached

    # Step 1: Extract and resolve signals
    full_query = query
    if refinements:
        full_query = f"{query}, {', '.join(refinements)}"

    extraction_result = await extract_signals(full_query)
    signals_raw = extraction_result.signals

    parsed_query = resolve_signals(signals_raw, query)

    # Convert ParsedJobQuery to SearchSignals for the ranker
    current_signals = SearchSignals(
        keywords=parsed_query.keywords,
        excluded_keywords=parsed_query.exclude_terms,
        remote=(parsed_query.job_type == "remote"),
        seniority=parsed_query.seniority,
        org_types=[],
        location_terms=[loc for loc in [parsed_query.location_preference, parsed_query.city_preference] if loc],
        industry_prefs=parsed_query.industry_preferences,
        job_type=parsed_query.job_type,
        company_traits=parsed_query.company_traits,
        role_title=parsed_query.role_title,
    )

    # Merge with context if multi-turn
    if context and context.signals:
        current_signals = merge_signals(context.signals, current_signals)

    # Step 2: Build retrieval queries
    retrieval_queries = _build_retrieval_queries(parsed_query, query)
    logger.info("Retrieval queries: %s", retrieval_queries)

    # Step 3: Fetch from Adzuna (multi-query)
    fetch_limit = min(limit * 2, 50)
    jobs, total = await _fetch_multi_query(
        queries=retrieval_queries,
        province=province or (parsed_query.location_preference or ""),
        city=city or (parsed_query.city_preference or ""),
        page=page,
        results_per_page=fetch_limit,
        job_type=parsed_query.job_type or "all",
    )

    if not jobs:
        return EnhancedSearchResponse(
            query=query,
            jobs=[],
            total=0,
            page=page,
            parsed_query=parsed_query.model_dump(),
            suggestions=[],
            facet_suggestions=[],
            excluded_count=0,
            confidence=ConfidenceMetrics(is_low_confidence=True),
            debug={"retrieval_queries": retrieval_queries, "fallback_used": extraction_result.fallback_used},
        )

    # Step 4: Apply hard exclusions
    jobs, excluded_count = apply_hard_exclusions(jobs, current_signals)

    # Step 5: Compute TrueScores
    truescore_data = await _compute_truescores_async(jobs)
    truescore_map = {jid: data["true_score"] for jid, data in truescore_data.items()}

    # Attach TrueScore data to jobs
    for job in jobs:
        jid = job.get("id", "")
        if jid in truescore_data:
            job.update(truescore_data[jid])

    # Step 6: Compute embedding similarities
    embedding_scores = await _compute_embedding_scores_async(query, jobs)

    # Step 7: Rank with hybrid formula
    ranked_jobs = rank_jobs(
        jobs=jobs,
        signals=current_signals,
        embedding_scores=embedding_scores,
        truescore_map=truescore_map,
    )

    # Step 8: Rerank top-N
    ranked_jobs = rerank_results(ranked_jobs, query)

    # Step 9: Confidence check + retry
    confidence = assess_confidence(ranked_jobs)
    retry_used = False

    if confidence.is_low_confidence and len(retrieval_queries) < MAX_MULTI_QUERIES:
        retry_query = _build_focused_retry_query(parsed_query)
        logger.info("Low confidence detected — retrying with focused query: %s", retry_query)

        try:
            retry_result = await search_jobs(
                query=retry_query,
                province=province or (parsed_query.location_preference or ""),
                city=city or (parsed_query.city_preference or ""),
                page=page,
                results_per_page=min(limit, 50),
                job_type=parsed_query.job_type or "all",
            )
            retry_jobs = retry_result.get("jobs", [])
            if retry_jobs:
                # Dedup
                existing_ids = {j.get("id") for j in ranked_jobs}
                new_jobs = [j for j in retry_jobs if j.get("id") not in existing_ids]
                if new_jobs:
                    # Score, rank, and merge new jobs
                    retry_ts = await _compute_truescores_async(new_jobs)
                    for j in new_jobs:
                        jid = j.get("id", "")
                        if jid in retry_ts:
                            j.update(retry_ts[jid])
                    retry_embed = await _compute_embedding_scores_async(query, new_jobs)
                    retry_ts_map = {jid: d["true_score"] for jid, d in retry_ts.items()}
                    retry_ranked = rank_jobs(new_jobs, current_signals, retry_embed, retry_ts_map)
                    ranked_jobs.extend(retry_ranked)
                    ranked_jobs.sort(key=lambda r: r.get("final_score", 0.0), reverse=True)
                    confidence = assess_confidence(ranked_jobs)
                    retry_used = True
        except Exception as exc:
            logger.exception("Confidence retry failed: %s", exc)

    confidence.retry_used = retry_used

    # Trim to requested limit
    ranked_jobs = ranked_jobs[:limit]

    # Step 10: Analyze for refinement suggestions
    analysis = analyze_results(ranked_jobs, parsed_query)
    signal_gap_suggestions = suggest_refinements(current_signals)

    # Build context for multi-turn
    MAX_HISTORY = 10  # Prevent unbounded history growth
    prev_history = (context.history if context else [])
    new_context = SearchContext(
        query=query,
        signals=current_signals,
        refinements=refinements,
        history=(prev_history + [query])[-MAX_HISTORY:],
    )

    response = EnhancedSearchResponse(
        query=query,
        jobs=ranked_jobs,
        total=total,
        page=page,
        parsed_query=parsed_query.model_dump(),
        suggestions=[s.model_dump() for s in analysis.suggestions]
                     + [s.model_dump() for s in signal_gap_suggestions],
        facet_suggestions=analysis.facet_suggestions,
        excluded_count=excluded_count,
        confidence=confidence,
        context=new_context,
        debug={
            "retrieval_queries": retrieval_queries,
            "fallback_used": extraction_result.fallback_used,
            "distribution": analysis.distribution,
            "embedding_scores_sample": dict(list(embedding_scores.items())[:3]),
            "retry_used": retry_used,
        },
    )

    # Cache the response for future identical requests
    await _set_cached_pipeline_response(cache_key, response)

    return response
