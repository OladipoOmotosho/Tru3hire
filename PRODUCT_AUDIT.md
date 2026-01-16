# TrueHire Product Audit

> **Note:** This document is for internal planning only - do not push to public git.

## Executive Summary

TrueHire helps job applicants filter noise and find jobs with the highest interview probability. This audit identifies gaps and proposes improvements to transform from **job quality scoring** to **interview probability prediction**.

---

## Current Strengths

| Feature                   | Value                              |
| ------------------------- | ---------------------------------- |
| Weighted TrueScore        | Single actionable metric           |
| Authenticity detection    | Catches scams                      |
| Semantic resume matching  | Personalized fit with AI           |
| Real market data (Adzuna) | Grounds hiring activity in reality |
| Skills gap analysis       | Actionable feedback                |

---

## Critical Gaps

### 1. Scoring Job Quality vs Interview Probability

**Current:** Evaluates if job is "real" and "good fit"  
**Missing:** Predicting if user will actually get a response

Key predictors not tracked:

- Application competition (# of applicants)
- Company response rate
- Application timing (first 48 hours = 8x response rate)

### 2. No Recency Emphasis

Jobs < 48 hours old have dramatically higher response rates. Currently recency is 0% of TrueScore.

### 3. No Company Response Intelligence

Some companies are "black holes" - never respond. Others respond 80% of the time. We don't track this.

### 4. No Feedback Loop

We never learn which jobs led to interviews. Without this data, scoring remains theoretical.

### 5. Weak Ghost Job Detection

Missing patterns:

- Reposted jobs (same description, different dates)
- No named recruiter
- Compliance-only postings

---

## Proposed Solution: Interview Probability Score

Replace TrueScore with actionable prediction:

```
Interview Probability =
  (Resume Match × 25%) +
  (Recency Factor × 25%) +
  (Company Response Rate × 25%) +
  (Competition Level × 15%) +
  (Authenticity × 10%)
```

**User sees:**

> "72% Interview Likelihood - 18 applicants, company responds in 2 days"

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 weeks)

- Boost recency weight to 20%
- Add "Apply Early" badge for jobs < 48 hours
- Detect reposted job patterns
- Estimate application count

### Phase 2: Response Intelligence (2-3 weeks)

- Post-application feedback collection
- Company response rate aggregation
- Response time estimates

### Phase 3: Interview Probability (3-4 weeks)

- New scoring algorithm
- Smart application guidance
- "Skip/Apply/Follow-up" recommendations

### Phase 4: Learning System (ongoing)

- Tune weights from real outcome data
- A/B test scoring approaches

---

## Success Metrics

| Metric                        | Current | Target       |
| ----------------------------- | ------- | ------------ |
| User interview rate           | Unknown | 30%+         |
| Application-to-response ratio | Unknown | 40%+         |
| Time saved per user           | Unknown | 10+ hrs/week |

---

## Resources Required

All features achievable with free tiers:

- **Gemini Pro** - Semantic matching (have)
- **Supabase Free** - PostgreSQL for feedback data
- **Vercel Free** - Hosting
- **GitHub Actions** - CI/CD
