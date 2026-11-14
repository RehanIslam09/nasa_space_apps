from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.api.schemas.models import JobStatusResponse
from app.models.db import get_job

router = APIRouter(prefix="/jobs", tags=["Background Tasks & Ingestion Jobs"])

@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """
    Retrieves the status, measurable progress, and result metadata of a background processing job.
    Supports states: queued, downloading, processing, generating, completed, failed.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return JobStatusResponse(
        job_id=job["job_id"],
        dataset_id=job["dataset_id"],
        job_type=job["job_type"],
        status=job["status"],
        progress=job.get("progress", 0.0),
        result_data=job.get("result_data"),
        error_message=job.get("error_message")
    )
