"""
Resume API Routes

Endpoint for parsing uploaded resume files.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import parse_resume, is_valid_pdf

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Parse an uploaded resume file and extract structured data.
    
    Supports: PDF, DOCX, DOC
    Max size: 5MB
    
    Returns extracted data:
    - name, email, phone, linkedin, location
    - skills (list)
    - experience (list of job entries)
    - education (list of education entries)
    - years_of_experience (estimated)
    """
    # Validate file type
    filename = file.filename or "resume"
    allowed_extensions = ('.pdf', '.docx', '.doc')
    
    if not filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Check file size (3MB max)
    if len(content) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size: 3MB")
    
    # Validate PDF if PDF file
    if filename.lower().endswith('.pdf') and not is_valid_pdf(content):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    # Parse resume
    try:
        parsed_data = parse_resume(content, filename)
        return {
            "success": True,
            "data": parsed_data,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
