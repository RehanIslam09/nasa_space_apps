from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path
from app.api.schemas.models import (
    CreateCompositionRequest,
    CompositionResponse
)
from app.services.composition_engine import CompositionEngine
from app.models.db import get_composition_record, list_composition_records
from app.core.config import settings

router = APIRouter(prefix="/compositions", tags=["Create Your Own Earthsong - Multi-Dataset Composition"])

@router.post("", response_model=CompositionResponse)
def create_composition(request: CreateCompositionRequest):
    """
    Renders a multi-dataset Earthsong composition.
    Combines independent NASA-derived sound layers into a unified stereo acoustic tapestry.
    """
    if not request.tracks:
        raise HTTPException(status_code=400, detail="At least one sound layer track is required.")

    engine = CompositionEngine(sample_rate=request.sample_rate)
    result = engine.render_composition(request)
    return CompositionResponse(**result)

@router.get("", response_model=List[CompositionResponse])
def list_compositions(limit: int = 20):
    """Lists saved user compositions."""
    records = list_composition_records(limit=limit)
    response_list = []
    for r in records:
        response_list.append(CompositionResponse(
            composition_id=r["composition_id"],
            title=r["title"],
            description=r.get("description"),
            duration=r["duration"],
            sample_rate=r["sample_rate"],
            audio_url=f"/api/compositions/{r['composition_id']}",
            download_url=f"/api/compositions/{r['composition_id']}/download",
            dataset_ids=r.get("dataset_ids", []),
            active_tracks_count=len(r.get("dataset_ids", [])),
            musical_key=r.get("musical_key", "Omni-Harmonic Earth Synthesis"),
            created_at=r["created_at"]
        ))
    return response_list

@router.get("/{composition_id}", response_model=CompositionResponse)
def get_composition(composition_id: str):
    """Retrieves metadata and track configurations for a saved composition."""
    record = get_composition_record(composition_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Composition '{composition_id}' not found.")
    
    return CompositionResponse(
        composition_id=record["composition_id"],
        title=record["title"],
        description=record.get("description"),
        duration=record["duration"],
        sample_rate=record["sample_rate"],
        audio_url=f"/api/compositions/{record['composition_id']}",
        download_url=f"/api/compositions/{record['composition_id']}/download",
        dataset_ids=record.get("dataset_ids", []),
        active_tracks_count=len(record.get("dataset_ids", [])),
        musical_key=record.get("musical_key", "Omni-Harmonic Earth Synthesis"),
        created_at=record["created_at"]
    )

@router.get("/{composition_id}/download")
def download_composition(composition_id: str):
    """Streams the synthesized multi-layer composition WAV file."""
    record = get_composition_record(composition_id)
    wav_path = None
    if record and record.get("file_path"):
        wav_path = Path(record["file_path"])
    
    if not wav_path or not wav_path.exists():
        fallback_path = settings.AUDIO_DIR / f"{composition_id}.wav"
        if fallback_path.exists():
            wav_path = fallback_path

    if not wav_path or not wav_path.exists():
        raise HTTPException(status_code=404, detail=f"Audio file for composition '{composition_id}' not found.")

    return FileResponse(
        path=str(wav_path),
        media_type="audio/wav",
        filename=f"{composition_id}.wav",
        headers={"Cache-Control": "public, max-age=86400", "Accept-Ranges": "bytes"}
    )
