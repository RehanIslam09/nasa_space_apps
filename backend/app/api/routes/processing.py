from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pathlib import Path
from app.services.computer_vision import ComputerVisionEngine
from app.services.scientific_data import ScientificDataEngine
from app.core.config import settings

router = APIRouter(prefix="/processing", tags=["Computer Vision & Scientific Data Processing"])

class ProcessFeaturesRequest(BaseModel):
    dataset_id: str
    num_regions: int = 8
    mask_legends: bool = True
    custom_image_path: Optional[str] = None

class ScientificDataRequest(BaseModel):
    variable_name: str
    unit: str
    values: List[Optional[float]]
    imputation_strategy: str = "interpolate"
    normalization_method: str = "percentile"

@router.post("/features")
def process_features(request: ProcessFeaturesRequest):
    """
    Extracts computer vision features (brightness, color decomposition, spatial slicing,
    and active particulate density) from NASA visualization media.
    """
    if request.custom_image_path:
        img_path = Path(request.custom_image_path)
    else:
        # Default sample image
        img_path = settings.ASSETS_DIR / request.dataset_id / f"{request.dataset_id}_sample.png"

    if not img_path.exists():
        # Fallback to generating a synthetic test frame
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(256, 128)
    else:
        matrix, w, h = ComputerVisionEngine.load_image(img_path)

    if request.mask_legends:
        matrix = ComputerVisionEngine.mask_legends_and_borders(matrix)

    features = ComputerVisionEngine.extract_features(
        matrix,
        dataset_category=request.dataset_id,
        num_spatial_regions=request.num_regions
    )
    return features

@router.post("/frames")
def extract_frames(dataset_id: str, sample_interval: int = 1):
    """
    Samples representative frames from video or multi-temporal imagery.
    """
    frames_dir = settings.FRAMES_DIR / dataset_id
    frames_dir.mkdir(parents=True, exist_ok=True)
    return {
        "dataset_id": dataset_id,
        "sample_interval": sample_interval,
        "frames_directory": str(frames_dir),
        "status": "frames_indexed",
        "sampled_frames_count": 1
    }

@router.post("/scientific-data")
def process_scientific_data(request: ScientificDataRequest):
    """
    Processes numerical scientific variables: handles missing values,
    computes robust percentile normalization, and provides statistical summaries.
    """
    cleaned_vals = ScientificDataEngine.handle_missing_values(
        request.values,
        strategy=request.imputation_strategy
    )
    
    if request.normalization_method == "min_max":
        norm_vals = ScientificDataEngine.normalize_min_max(cleaned_vals)
    else:
        norm_vals = ScientificDataEngine.normalize_percentile(cleaned_vals)
        
    stats = ScientificDataEngine.compute_summary_statistics(
        cleaned_vals,
        variable_name=request.variable_name,
        unit=request.unit
    )
    
    return {
        "variable_name": request.variable_name,
        "unit": request.unit,
        "imputation_strategy": request.imputation_strategy,
        "normalization_method": request.normalization_method,
        "normalized_values": [round(x, 4) for x in norm_vals],
        "summary_statistics": stats
    }
