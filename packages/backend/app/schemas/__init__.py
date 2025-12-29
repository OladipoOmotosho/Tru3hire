# Schemas Module - Pydantic Models for API Request/Response
from .analysis import (
    AnalysisRequest,
    AnalysisResponse,
    TrueScoreBreakdown,
    Insight,
    Recommendation,
    CompanyInfo,
    HealthResponse,
)
from .report import (
    ScamReportRequest,
    ScamReportResponse,
    ScamReportStats,
)
from .history import (
    HistoryItem,
    HistoryResponse,
    UserStats,
    StatsResponse,
)
