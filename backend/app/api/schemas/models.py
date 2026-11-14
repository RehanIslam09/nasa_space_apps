from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ScientificVariable(BaseModel):
    name: str
    unit: str
    description: str
    typical_range: List[float] = Field(default_factory=lambda: [0.0, 1.0])
    is_visual_derived: bool = False

class SonificationLayerRule(BaseModel):
    layer_name: str
    variable_mapped: str
    audio_parameter: str # e.g. "Pitch", "Volume", "Filter Cutoff", "Stereo Pan", "Pulse Rate"
    mapping_range: str # e.g. "120Hz - 600Hz", "-1.0 to +1.0"
    synthesis_mode: str # e.g. "Sub-bass Drone", "Resonant Shimmer", "Granular Percussion"
    scientific_rationale: str

class DatasetMetadata(BaseModel):
    id: str
    title: str
    description: str
    category: str
    nasa_url: str
    svs_id: Optional[int] = None
    scientific_variables: List[ScientificVariable]
    spatial_coverage: str
    temporal_coverage: str
    data_provenance: str
    sonification_rules: List[SonificationLayerRule]
    available_media: List[str]
    sample_asset_url: Optional[str] = None
    color_scale_url: Optional[str] = None
    processing_status: str = "available"

class IngestRequest(BaseModel):
    dataset_id: str
    force_refresh: bool = False
    sample_rate_frames: int = 1

class IngestResponse(BaseModel):
    job_id: str
    dataset_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    dataset_id: str
    job_type: str
    status: str
    progress: float
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class LayerCustomization(BaseModel):
    name: str
    enabled: bool = True
    volume: float = Field(default=0.8, ge=0.0, le=1.0)
    pan: float = Field(default=0.0, ge=-1.0, le=1.0)
    base_freq: Optional[float] = None
    synthesis_type: Optional[str] = None

class GenerateSonificationRequest(BaseModel):
    dataset_id: str
    duration_seconds: float = Field(default=10.0, ge=2.0, le=60.0)
    sample_rate: int = 44100
    preset: str = "balanced"
    layers: Optional[List[LayerCustomization]] = None
    loop_seamless: bool = True

class GenerateSonificationResponse(BaseModel):
    audio_id: str
    dataset_id: str
    title: str
    duration: float
    sample_rate: int
    audio_url: str
    download_url: str
    layers_active: List[str]
    accessibility_narrative: str
    musical_key: str

class CompareRequest(BaseModel):
    dataset_id: str
    period_a: str # e.g. "2012" or "Baseline"
    period_b: str # e.g. "2023" or "Current"
    duration_seconds: float = Field(default=12.0, ge=4.0, le=60.0)

class CompareResponse(BaseModel):
    comparison_id: str
    dataset_id: str
    period_a: str
    period_b: str
    audio_a_url: str
    audio_b_url: str
    audio_diff_url: str
    metrics: Dict[str, Any]
    insights: List[str]
    accessibility_summary: str
    # Milestone 2 Additive Provenance and Visualization Fields
    observation_date_a: Optional[str] = None
    observation_date_b: Optional[str] = None
    source_asset_a_url: Optional[str] = None
    source_asset_b_url: Optional[str] = None
    image_a_url: Optional[str] = None
    image_b_url: Optional[str] = None
    source_asset_a_checksum: Optional[str] = None
    source_asset_b_checksum: Optional[str] = None
    audio_diff_checksum: Optional[str] = None
    comparison_method: Optional[str] = None
    retrieved_at: Optional[str] = None
    feature_version: Optional[str] = None

class InsightsResponse(BaseModel):
    dataset_id: str
    title: str
    mean_intensity: float
    max_intensity: float
    min_intensity: float
    dominant_layer: str
    spatial_distribution_entropy: float
    regional_breakdown: List[Dict[str, Any]]
    scientific_interpretation: str

class AccessibilityResponse(BaseModel):
    dataset_id: str
    title: str
    plain_language_summary: str
    screen_reader_legend: List[Dict[str, str]]
    audio_guide: str
    tactile_equivalent_guidance: str

class CompositionTrackConfig(BaseModel):
    dataset_id: str
    volume: float = Field(default=0.8, ge=0.0, le=1.5)
    pan: float = Field(default=0.0, ge=-1.0, le=1.0)
    enabled: bool = True
    pitch_shift_semitones: float = Field(default=0.0, ge=-24.0, le=24.0)
    synthesis_profile: Optional[str] = None

class CreateCompositionRequest(BaseModel):
    title: str = Field(default="My Custom Earthsong", max_length=120)
    description: Optional[str] = None
    tracks: List[CompositionTrackConfig] = Field(..., min_items=1)
    duration_seconds: float = Field(default=12.0, ge=3.0, le=60.0)
    sample_rate: int = 44100
    master_volume: float = Field(default=0.9, ge=0.0, le=1.0)
    musical_scale: Optional[str] = "Unified Global Harmonic"

class CompositionResponse(BaseModel):
    composition_id: str
    title: str
    description: Optional[str] = None
    duration: float
    sample_rate: int
    audio_url: str
    download_url: str
    dataset_ids: List[str]
    active_tracks_count: int
    musical_key: str
    created_at: str

class LayerUpdateRequest(BaseModel):
    volume: Optional[float] = Field(default=None, ge=0.0, le=1.5)
    pan: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    enabled: Optional[bool] = None

class LayerConfigResponse(BaseModel):
    layer_id: str
    dataset_id: str
    layer_name: str
    variable_mapped: Optional[str] = None
    audio_parameter: Optional[str] = None
    synthesis_mode: Optional[str] = None
    volume: float = 0.8
    pan: float = 0.0
    enabled: bool = True
    frequency_range: Optional[str] = None
    updated_at: Optional[str] = None
