from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.models.db import get_comparison_record
from app.api.schemas.models import CompareResponse

router = APIRouter(prefix="/comparison", tags=["Then vs Now - Temporal Comparisons"])

@router.get("/{comparison_id}", response_model=CompareResponse)
def get_comparison(comparison_id: str):
    """
    Retrieves a previously computed Then vs Now dual-phase comparison record.
    """
    record = get_comparison_record(comparison_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Comparison '{comparison_id}' not found.")

    return CompareResponse(
        comparison_id=record["comparison_id"],
        dataset_id=record["dataset_id"],
        period_a=record["period_a"],
        period_b=record["period_b"],
        audio_a_url=f"/api/sonification/{record.get('audio_id_a')}",
        audio_b_url=f"/api/sonification/{record.get('audio_id_b')}",
        audio_diff_url=f"/api/sonification/{record.get('audio_id_diff')}",
        metrics=record.get("comparison_metrics", {}),
        insights=record.get("insights", []),
        accessibility_summary=record.get("insights", ["Comparison completed."])[0] if record.get("insights") else "Comparison completed.",
        observation_date_a=record.get("observation_date_a"),
        observation_date_b=record.get("observation_date_b"),
        source_asset_a_url=record.get("source_asset_a_url"),
        source_asset_b_url=record.get("source_asset_b_url"),
        source_asset_a_checksum=record.get("source_asset_a_checksum"),
        source_asset_b_checksum=record.get("source_asset_b_checksum"),
        audio_diff_checksum=record.get("audio_diff_checksum"),
        comparison_method=record.get("comparison_method")
    )
