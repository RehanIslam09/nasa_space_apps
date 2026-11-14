from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, RedirectResponse
from typing import List, Optional
from pathlib import Path
from app.core.catalog import NASA_CATALOG
from app.api.schemas.models import DatasetMetadata, IngestResponse, JobStatusResponse
from app.services.ingestion_service import IngestionService
from app.models.db import create_job, get_latest_job_for_dataset, get_job

router = APIRouter(prefix="/datasets", tags=["NASA Dataset Catalog & Ingestion"])

@router.get("", response_model=List[DatasetMetadata])
def list_datasets(category: Optional[str] = None):
    """Returns all registered NASA datasets in PRANA."""
    datasets = list(NASA_CATALOG.values())
    if category:
        datasets = [d for d in datasets if category.lower() in d.category.lower()]
    return datasets

@router.get("/{dataset_id}", response_model=DatasetMetadata)
def get_dataset(dataset_id: str):
    """Returns complete catalog metadata for a specific NASA dataset."""
    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found in catalog.")
    return NASA_CATALOG[dataset_id]

@router.get("/{dataset_id}/metadata")
def get_dataset_metadata(dataset_id: str):
    """Returns detailed scientific provenance, variables, and units."""
    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
    ds = NASA_CATALOG[dataset_id]
    return {
        "id": ds.id,
        "title": ds.title,
        "provenance": ds.data_provenance,
        "category": ds.category,
        "nasa_source_url": ds.nasa_url,
        "svs_id": ds.svs_id,
        "spatial_coverage": ds.spatial_coverage,
        "temporal_coverage": ds.temporal_coverage,
        "variables": [v.dict() for v in ds.scientific_variables],
        "sonification_rules": [r.dict() for r in ds.sonification_rules]
    }

@router.get("/{dataset_id}/image")
def get_dataset_image(dataset_id: str, period: Optional[str] = None):
    """Serves the real NASA visualization frame for this dataset or specific temporal period."""
    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    storage_dir = IngestionService.get_dataset_storage_dir(dataset_id)

    # 1. Check temporal observation frame if period is specified
    cache_headers = {"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"}
    if period:
        candidates = [
            storage_dir / f"nightlights_{period}.jpg",
            storage_dir / f"nightlights_{period}.png",
            storage_dir / f"observation_{period}.jpg",
            storage_dir / f"observation_{period}.png",
            storage_dir / f"{dataset_id}_{period}.jpg",
            storage_dir / f"{dataset_id}_{period}.png",
        ]
        for cand in candidates:
            if cand.exists() and cand.stat().st_size > 1000:
                media = "image/png" if cand.suffix.lower() == ".png" else "image/jpeg"
                return FileResponse(path=str(cand), media_type=media, headers=cache_headers)

    # 2. Check local sample images (png or jpg)
    for ext in ["_sample.png", "_sample.jpg", ".png", ".jpg"]:
        local_p = storage_dir / f"{dataset_id}{ext}"
        if local_p.exists() and local_p.stat().st_size > 1000:
            media = "image/png" if local_p.suffix.lower() == ".png" else "image/jpeg"
            return FileResponse(path=str(local_p), media_type=media, headers=cache_headers)

    # 3. Check any image in storage dir
    for f in storage_dir.glob("*.*"):
        if f.suffix.lower() in [".png", ".jpg", ".jpeg"] and f.stat().st_size > 1000:
            media = "image/png" if f.suffix.lower() == ".png" else "image/jpeg"
            return FileResponse(path=str(f), media_type=media, headers=cache_headers)

    # 4. If not on disk, check if sample_asset_url exists in catalog
    cat = NASA_CATALOG[dataset_id]
    if cat.sample_asset_url:
        return RedirectResponse(url=cat.sample_asset_url)

    raise HTTPException(status_code=404, detail=f"Image for dataset '{dataset_id}' not found.")

@router.post("/{dataset_id}/ingest", response_model=IngestResponse)
def trigger_ingest(dataset_id: str, background_tasks: BackgroundTasks, force_refresh: bool = False):
    """Triggers public NASA resource ingestion and feature extraction with force_refresh support."""
    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
        
    job_id = create_job(dataset_id, "ingestion")
    # Run ingestion as background task
    background_tasks.add_task(IngestionService.ingest_dataset_sync, dataset_id, job_id, force_refresh=force_refresh)
    
    return IngestResponse(
        job_id=job_id,
        dataset_id=dataset_id,
        status="queued",
        message=f"NASA asset ingestion scheduled (force_refresh={force_refresh})."
    )

@router.get("/{dataset_id}/status", response_model=JobStatusResponse)
def get_dataset_status(dataset_id: str):
    """Checks the latest processing status of a dataset."""
    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
        
    job = get_latest_job_for_dataset(dataset_id)
    if not job:
        # If no explicit job has run, check if cached features exist
        try:
            features = IngestionService.get_or_ingest_features(dataset_id)
            return JobStatusResponse(
                job_id="cached_auto",
                dataset_id=dataset_id,
                job_type="ingestion",
                status="completed",
                progress=1.0,
                result_data={"features_summary": features.get("global_metrics", {})}
            )
        except Exception:
            return JobStatusResponse(
                job_id="none",
                dataset_id=dataset_id,
                job_type="ingestion",
                status="idle",
                progress=0.0
            )

    return JobStatusResponse(
        job_id=job["job_id"],
        dataset_id=job["dataset_id"],
        job_type=job["job_type"],
        status=job["status"],
        progress=job["progress"],
        result_data=job["result_data"],
        error_message=job["error_message"]
    )
