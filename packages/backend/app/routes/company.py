"""
Company Verification API Routes

Endpoints for checking company trustworthiness and reporting companies.
"""

from fastapi import APIRouter, Query, HTTPException, File, UploadFile, Depends
from pydantic import BaseModel
from typing import Optional, List
import csv
import json
import logging

logger = logging.getLogger(__name__)

from app.services.company_db import (
    check_company, 
    report_company, 
    get_company_db,
    CompanyStatus
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/company", tags=["company"])


class CompanyCheckResponse(BaseModel):
    """Response for company check endpoint."""
    company_name: str
    status: str
    status_label: str
    confidence: float
    match_type: str
    matched_name: Optional[str] = None
    scam_reports: int = 0
    legit_reports: int = 0
    notes: Optional[str] = None
    risk_level: str  # "low", "medium", "high", "unknown"


class ReportRequest(BaseModel):
    """Request body for reporting a company."""
    company_name: str
    is_scam: bool
    notes: Optional[str] = None


class ReportResponse(BaseModel):
    """Response for report endpoint."""
    success: bool
    message: str


def _get_status_label(status: CompanyStatus) -> str:
    """Get human-readable status label."""
    labels = {
        CompanyStatus.VERIFIED_LEGIT: "Verified Legitimate",
        CompanyStatus.LIKELY_LEGIT: "Likely Legitimate",
        CompanyStatus.UNKNOWN: "Unknown",
        CompanyStatus.SUSPICIOUS: "Suspicious",
        CompanyStatus.KNOWN_SCAM: "Known Scam",
    }
    return labels.get(status, "Unknown")


def _get_risk_level(status: CompanyStatus) -> str:
    """Get risk level from status."""
    risk_map = {
        CompanyStatus.VERIFIED_LEGIT: "low",
        CompanyStatus.LIKELY_LEGIT: "low",
        CompanyStatus.UNKNOWN: "unknown",
        CompanyStatus.SUSPICIOUS: "medium",
        CompanyStatus.KNOWN_SCAM: "high",
    }
    return risk_map.get(status, "unknown")


@router.get("/check", response_model=CompanyCheckResponse)
async def check_company_endpoint(
    name: str = Query(..., min_length=1, description="Company name to check"),
    use_api: bool = Query(False, description="Use external APIs for real-time verification if not found locally")
):
    """
    Check if a company is known and trustworthy.
    
    Uses fuzzy matching to handle typos and variations.
    If use_api=true, will query external APIs (OpenCorporates, Wikidata) for unknown companies.
    
    Returns:
    - status: verified_legit, likely_legit, unknown, suspicious, known_scam
    - confidence: 0.0 to 1.0 (how confident we are in the match)
    - risk_level: low, medium, high, unknown
    - match_type: exact, fuzzy, api, pattern, none
    """
    db = get_company_db()
    
    if use_api:
        # Use async API verification
        result = await db.check_company_async(name, use_api=True)
    else:
        # Fast local-only check
        result = check_company(name)
    
    return CompanyCheckResponse(
        company_name=result.company_name,
        status=result.status.value,
        status_label=_get_status_label(result.status),
        confidence=result.confidence,
        match_type=result.match_type,
        matched_name=result.matched_name,
        scam_reports=result.scam_reports,
        legit_reports=result.legit_reports,
        notes=result.notes,
        risk_level=_get_risk_level(result.status)
    )


@router.post("/report", response_model=ReportResponse)
async def report_company_endpoint(request: ReportRequest, user_id: str = Depends(get_current_user)):
    """
    Submit a user report about a company.
    
    Reports are aggregated to determine company trustworthiness.
    Multiple reports are required to change a company's status.
    """
    if len(request.company_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Company name too short")
    
    success = report_company(
        company_name=request.company_name,
        is_scam=request.is_scam,
        notes=request.notes
    )
    
    report_type = "scam" if request.is_scam else "legitimate"
    
    return ReportResponse(
        success=success,
        message=f"Thank you for reporting {request.company_name} as {report_type}."
    )


@router.get("/stats")
async def get_company_stats():
    """
    Get statistics about the company database.
    
    Returns total companies, breakdown by status, and feature flags.
    """
    db = get_company_db()
    return db.get_stats()


class BulkImportRequest(BaseModel):
    """Request body for bulk importing companies."""
    companies: List[str]
    status: str = "verified_legit"  # verified_legit, likely_legit, etc.
    source: str = "api_import"
    notes: Optional[str] = None


class BulkImportResponse(BaseModel):
    """Response for bulk import endpoint."""
    success: bool
    imported: int
    skipped: int
    total_processed: int
    message: str


@router.post("/bulk-import", response_model=BulkImportResponse)
async def bulk_import_companies(request: BulkImportRequest, user_id: str = Depends(get_current_user)):
    """
    Bulk import companies into the database.
    
    Accepts a list of company names and imports them with the specified status.
    Useful for populating the database with verified companies.
    """
    try:
        # Convert status string to enum
        status_map = {
            "verified_legit": CompanyStatus.VERIFIED_LEGIT,
            "likely_legit": CompanyStatus.LIKELY_LEGIT,
            "unknown": CompanyStatus.UNKNOWN,
            "suspicious": CompanyStatus.SUSPICIOUS,
            "known_scam": CompanyStatus.KNOWN_SCAM,
        }
        if request.status not in status_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid company status: '{request.status}'. Valid values are: {', '.join(status_map.keys())}"
            )
        status = status_map[request.status]
        
        db = get_company_db()
        result = db.bulk_import_companies(
            companies=request.companies,
            status=status,
            source=request.source,
            notes=request.notes
        )
        
        return BulkImportResponse(
            success=True,
            imported=result["imported"],
            skipped=result["skipped"],
            total_processed=result["total_processed"],
            message=f"Successfully imported {result['imported']} companies. {result['skipped']} duplicates skipped."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/import-file")
async def import_companies_from_file(
    file: UploadFile = File(...),
    status: str = Query("verified_legit", description="Status to assign: verified_legit, likely_legit, etc."),
    user_id: str = Depends(get_current_user),
):
    """
    Import companies from a text file (one company per line) or CSV file.
    
    Supported formats:
    - .txt: One company name per line
    - .csv: First column should contain company names
    """
    try:
        logger.info("Company file import initiated by user=%s, filename=%s", user_id, file.filename)
        # Read file content
        content = await file.read()
        if '.' in file.filename:
            file_extension = file.filename.rsplit('.', 1)[-1].lower()
        else:
            file_extension = 'txt'
        
        companies = []
        
        if file_extension == 'csv':
            # Parse CSV
            content_str = content.decode('utf-8')
            csv_reader = csv.reader(content_str.splitlines())
            for row in csv_reader:
                if row and row[0].strip():  # First column
                    companies.append(row[0].strip())
        elif file_extension == 'json':
            # Parse JSON array
            content_str = content.decode('utf-8')
            data = json.loads(content_str)
            if isinstance(data, list):
                companies = [str(item).strip() for item in data if item]
            elif isinstance(data, dict) and 'companies' in data:
                companies = [str(item).strip() for item in data['companies'] if item]
        else:
            # Parse as text file (one per line)
            content_str = content.decode('utf-8')
            companies = [line.strip() for line in content_str.splitlines() if line.strip()]
        
        if not companies:
            raise HTTPException(status_code=400, detail="No companies found in file")
        
        # Convert status string to enum
        status_map = {
            "verified_legit": CompanyStatus.VERIFIED_LEGIT,
            "likely_legit": CompanyStatus.LIKELY_LEGIT,
            "unknown": CompanyStatus.UNKNOWN,
            "suspicious": CompanyStatus.SUSPICIOUS,
            "known_scam": CompanyStatus.KNOWN_SCAM,
        }
        if status not in status_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid company status: '{status}'. Valid values are: {', '.join(status_map.keys())}"
            )
        status_enum = status_map[status]
        
        db = get_company_db()
        result = db.bulk_import_companies(
            companies=companies,
            status=status_enum,
            source="file_upload",
            notes=f"Imported from {file.filename}"
        )
        
        return {
            "success": True,
            "imported": result["imported"],
            "skipped": result["skipped"],
            "total_processed": result["total_processed"],
            "message": f"Successfully imported {result['imported']} companies from {file.filename}"
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
