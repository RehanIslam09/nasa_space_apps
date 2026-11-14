import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.catalog import NASA_CATALOG
from app.api.schemas.models import (
    GenerateSonificationRequest,
    GenerateSonificationResponse,
    CompareRequest,
    CompareResponse,
    LayerCustomization,
    LayerUpdateRequest,
    LayerConfigResponse
)
from app.services.ingestion_service import IngestionService
from app.services.sonification_engine import SonificationEngine
from app.services.audio_generator import AudioGenerator
from app.services.comparison_engine import ComparisonEngine
from app.services.description_service import DescriptionService
from app.models.db import (
    save_generated_audio_record,
    get_audio_record,
    get_comparison_record,
    get_latest_audio_for_dataset,
    upsert_layer_config,
    get_layer_config,
    list_layer_configs
)

router = APIRouter(prefix="/sonification", tags=["Soundscape Generation & Audio Synthesis"])

@router.post("/generate", response_model=GenerateSonificationResponse)
def generate_sonification(request: GenerateSonificationRequest):
    """
    Synthesizes a high-fidelity 16-bit PCM Stereo WAV soundscape from NASA data.
    """
    if request.dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{request.dataset_id}' not found.")
        
    catalog_entry = NASA_CATALOG[request.dataset_id]
    features = IngestionService.get_or_ingest_features(request.dataset_id)
    
    sonifier = SonificationEngine(sample_rate=request.sample_rate)
    synth = AudioGenerator(sample_rate=request.sample_rate)

    # Route to specialized sonifier for all 11 official NASA Space Apps Challenge datasets
    if request.dataset_id == "geos-aerosols":
        mix_l, mix_r, active_layers = sonifier.sonify_geos_aerosols(
            features,
            duration=request.duration_seconds,
            custom_layers=request.layers
        )
        musical_key = "A Aeolian / Pentatonic (Warm Earth Frequency)"
    elif request.dataset_id == "ocean-currents-temp":
        mix_l, mix_r, active_layers = sonifier.sonify_ocean_currents(
            features,
            duration=request.duration_seconds,
            custom_layers=request.layers
        )
        musical_key = "Dorian Oceanic Mode (Fluid Harmonic Motion)"
    elif request.dataset_id == "night-lights":
        mix_l, mix_r, active_layers = sonifier.sonify_night_lights(
            features,
            duration=request.duration_seconds
        )
        musical_key = "C Lydian Electrified (Bright Urban Radiance)"
    elif request.dataset_id == "lightning-iss":
        mix_l, mix_r, active_layers = sonifier.sonify_lightning(
            features,
            duration=request.duration_seconds
        )
        musical_key = "Acoustic Impulse / Percussive Transients"
    elif request.dataset_id == "air-quality":
        mix_l, mix_r, active_layers = sonifier.sonify_air_quality(
            features,
            duration=request.duration_seconds
        )
        musical_key = "F Locrian / Detuned Diatonic (Atmospheric Friction)"
    elif request.dataset_id == "perpetual-ocean":
        mix_l, mix_r, active_layers = sonifier.sonify_perpetual_ocean(
            features,
            duration=request.duration_seconds
        )
        musical_key = "G Mixolydian Hydrodynamic (Vorticity Circulation)"
    elif request.dataset_id == "dyamond-co2":
        mix_l, mix_r, active_layers = sonifier.sonify_co2(
            features,
            duration=request.duration_seconds
        )
        musical_key = "Bb Natural Minor Carbon Baseline (55Hz Fundamental)"
    elif request.dataset_id == "atmospheric-river":
        mix_l, mix_r, active_layers = sonifier.sonify_atmospheric_river(
            features,
            duration=request.duration_seconds
        )
        musical_key = "Eb Major / 174Hz Solfeggio Fluid Flow"
    elif request.dataset_id == "gedi-forest":
        mix_l, mix_r, active_layers = sonifier.sonify_gedi_forest(
            features,
            duration=request.duration_seconds
        )
        musical_key = "C Harmonic Overtone Marimba (Canopy Elevation)"
    elif request.dataset_id == "caldwell-73":
        mix_l, mix_r, active_layers = sonifier.sonify_caldwell_73(
            features,
            duration=request.duration_seconds
        )
        musical_key = "E Phrygian Cosmic Chimes (Hubble Resonance)"
    elif request.dataset_id == "earth-info-center":
        mix_l, mix_r, active_layers = sonifier.sonify_earth_info_center(
            features,
            duration=request.duration_seconds
        )
        musical_key = "136.10 Hz Year Tone Drone (Artistic Orbital Transposition)"
    else:
        mix_l, mix_r, active_layers = sonifier.sonify_generic_dataset(
            request.dataset_id,
            features,
            duration=request.duration_seconds
        )
        musical_key = "C Major Natural Overtone Series"

    audio_id = f"{request.dataset_id}_{uuid.uuid4().hex[:10]}"
    output_path = settings.AUDIO_DIR / f"{audio_id}.wav"
    synth.export_wav(mix_l, mix_r, output_path)

    # Descriptive narrative
    narrative_obj = DescriptionService.get_accessibility_narrative(request.dataset_id, features)

    # Record in database
    save_generated_audio_record(
        audio_id=audio_id,
        dataset_id=request.dataset_id,
        title=f"{catalog_entry.title} Sonification",
        file_path=str(output_path),
        duration=request.duration_seconds,
        sample_rate=request.sample_rate,
        channels=2,
        mapping_preset=request.preset,
        layers_config={"layers": [l.dict() for l in request.layers]} if request.layers else {"preset": request.preset},
        visual_metrics=features.get("global_metrics", {})
    )

    return GenerateSonificationResponse(
        audio_id=audio_id,
        dataset_id=request.dataset_id,
        title=catalog_entry.title,
        duration=request.duration_seconds,
        sample_rate=request.sample_rate,
        audio_url=f"/api/sonification/{audio_id}",
        download_url=f"/api/sonification/{audio_id}/download",
        layers_active=active_layers,
        accessibility_narrative=narrative_obj.plain_language_summary,
        musical_key=musical_key
    )

@router.get("/layers", response_model=List[LayerConfigResponse])
def get_layers(dataset_id: Optional[str] = None):
    """
    Returns all configurable sound layers across datasets, or filtered by dataset_id.
    """
    db_layers = list_layer_configs(dataset_id=dataset_id)
    if db_layers:
        return [LayerConfigResponse(**l) for l in db_layers]

    # Seed from NASA_CATALOG if empty
    seeded = []
    targets = [dataset_id] if dataset_id and dataset_id in NASA_CATALOG else list(NASA_CATALOG.keys())
    for did in targets:
        ds = NASA_CATALOG[did]
        for rule in ds.sonification_rules:
            lid = f"{did}:{rule.layer_name.lower().replace(' ', '_')}"
            layer_obj = upsert_layer_config(
                layer_id=lid,
                dataset_id=did,
                layer_name=rule.layer_name,
                variable_mapped=rule.variable_mapped,
                audio_parameter=rule.audio_parameter,
                synthesis_mode=rule.synthesis_mode,
                volume=0.8,
                pan=0.0,
                enabled=True,
                frequency_range=rule.mapping_range
            )
            seeded.append(layer_obj)
    return [LayerConfigResponse(**l) for l in seeded]

@router.post("/layers")
def preview_layers(request: GenerateSonificationRequest):
    """Returns isolated layer soundscapes for individual variable auditioning."""
    return generate_sonification(request)

@router.patch("/layers/{layer_id}", response_model=LayerConfigResponse)
def update_layer(layer_id: str, update: LayerUpdateRequest):
    """
    Updates volume, stereo pan, and enabled state for an acoustic sound layer.
    """
    existing = get_layer_config(layer_id)
    if not existing:
        # If not yet seeded in DB, try to find in catalog
        parts = layer_id.split(":", 1)
        if len(parts) == 2 and parts[0] in NASA_CATALOG:
            did = parts[0]
            for rule in NASA_CATALOG[did].sonification_rules:
                if rule.layer_name.lower().replace(" ", "_") == parts[1]:
                    existing = upsert_layer_config(
                        layer_id=layer_id,
                        dataset_id=did,
                        layer_name=rule.layer_name,
                        variable_mapped=rule.variable_mapped,
                        audio_parameter=rule.audio_parameter,
                        synthesis_mode=rule.synthesis_mode,
                        frequency_range=rule.mapping_range
                    )
                    break
    if not existing:
        raise HTTPException(status_code=404, detail=f"Layer '{layer_id}' not found.")

    new_vol = update.volume if update.volume is not None else existing.get("volume", 0.8)
    new_pan = update.pan if update.pan is not None else existing.get("pan", 0.0)
    new_enabled = update.enabled if update.enabled is not None else existing.get("enabled", True)

    updated = upsert_layer_config(
        layer_id=layer_id,
        dataset_id=existing["dataset_id"],
        layer_name=existing["layer_name"],
        variable_mapped=existing.get("variable_mapped"),
        audio_parameter=existing.get("audio_parameter"),
        synthesis_mode=existing.get("synthesis_mode"),
        volume=new_vol,
        pan=new_pan,
        enabled=new_enabled,
        frequency_range=existing.get("frequency_range")
    )
    return LayerConfigResponse(**updated)

@router.get("/{audio_id}")
def get_audio_info(audio_id: str):
    """Retrieves metadata and status of generated audio file."""
    record = get_audio_record(audio_id)
    if not record:
        wav_file = settings.AUDIO_DIR / f"{audio_id}.wav"
        if wav_file.exists():
            return {
                "audio_id": audio_id,
                "file_path": str(wav_file),
                "file_size_bytes": wav_file.stat().st_size,
                "download_url": f"/api/sonification/{audio_id}/download"
            }
        raise HTTPException(status_code=404, detail="Audio file not found.")
    record["download_url"] = f"/api/sonification/{audio_id}/download"
    return record

@router.get("/{audio_id}/download")
def download_audio_file(audio_id: str):
    """Streams or downloads the synthesized WAV audio file, resolving by audio_id or dataset_id."""
    audio_headers = {"Cache-Control": "public, max-age=86400", "Accept-Ranges": "bytes"}

    # 1. Direct audio_id file check
    wav_path = settings.AUDIO_DIR / f"{audio_id}.wav"
    if wav_path.exists():
        return FileResponse(
            path=str(wav_path),
            media_type="audio/wav",
            filename=f"{audio_id}.wav",
            headers=audio_headers
        )

    # 2. Check if audio_id is a known dataset_id in NASA_CATALOG
    if audio_id in NASA_CATALOG:
        dataset_id = audio_id
        # A. Flagship pre-synthesized audio
        flagship_path = settings.AUDIO_DIR / f"flagship_{dataset_id.replace('-', '_')}.wav"
        if flagship_path.exists():
            return FileResponse(
                path=str(flagship_path),
                media_type="audio/wav",
                filename=f"{dataset_id}.wav",
                headers=audio_headers
            )

        # B. Latest generated audio from DB registry
        latest = get_latest_audio_for_dataset(dataset_id)
        if latest and Path(latest["file_path"]).exists():
            return FileResponse(
                path=latest["file_path"],
                media_type="audio/wav",
                filename=f"{dataset_id}.wav",
                headers=audio_headers
            )

        # C. Any existing generated file matching this dataset on disk
        matches = sorted(settings.AUDIO_DIR.glob(f"{dataset_id}_*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)
        if matches and matches[0].exists():
            return FileResponse(
                path=str(matches[0]),
                media_type="audio/wav",
                filename=f"{dataset_id}.wav",
                headers=audio_headers
            )

        # D. Synthesize on-demand using domain sonification rules
        req = GenerateSonificationRequest(dataset_id=dataset_id, duration_seconds=10.0, sample_rate=44100)
        res = generate_sonification(req)
        gen_path = settings.AUDIO_DIR / f"{res.audio_id}.wav"
        if gen_path.exists():
            return FileResponse(
                path=str(gen_path),
                media_type="audio/wav",
                filename=f"{dataset_id}.wav",
                headers=audio_headers
            )

    raise HTTPException(status_code=404, detail=f"Audio file '{audio_id}.wav' does not exist on disk.")

@router.get("/{audio_id}/metadata")
def get_audio_metadata(audio_id: str):
    """Returns technical synthesis parameters and layer details."""
    record = get_audio_record(audio_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Audio metadata for '{audio_id}' not found.")
    return record

@router.get("/{audio_id}/description")
def get_audio_description(audio_id: str):
    """
    Returns plain-language acoustic interpretation, screen-reader legend,
    and scientific variable mapping for a generated audio file or dataset.
    """
    record = get_audio_record(audio_id)
    dataset_id = record["dataset_id"] if record else audio_id
    if dataset_id not in NASA_CATALOG:
        for k in NASA_CATALOG:
            if audio_id.startswith(k):
                dataset_id = k
                break

    if dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"No dataset or audio record found for '{audio_id}'.")

    features = IngestionService.get_or_ingest_features(dataset_id)
    narrative = DescriptionService.get_accessibility_narrative(dataset_id, features)
    return {
        "audio_id": audio_id,
        "dataset_id": dataset_id,
        "title": narrative.title,
        "plain_language_summary": narrative.plain_language_summary,
        "screen_reader_legend": narrative.screen_reader_legend,
        "audio_guide": narrative.audio_guide,
        "tactile_equivalent_guidance": narrative.tactile_equivalent_guidance
    }

@router.post("/compare", response_model=CompareResponse)
def compare_periods(request: CompareRequest):
    """
    Then vs Now: Synthesizes dual-phase comparative soundscape from genuine independent NASA observations.
    """
    if request.dataset_id not in NASA_CATALOG:
        raise HTTPException(status_code=404, detail=f"Dataset '{request.dataset_id}' not found.")

    comparator = ComparisonEngine(sample_rate=44100)
    features_a, features_b, provenance_meta = comparator.get_or_ingest_temporal_observations(
        dataset_id=request.dataset_id,
        period_a=request.period_a,
        period_b=request.period_b
    )

    res = comparator.create_comparison(
        dataset_id=request.dataset_id,
        period_a=request.period_a,
        period_b=request.period_b,
        features_a=features_a,
        features_b=features_b,
        duration=request.duration_seconds,
        provenance_meta=provenance_meta
    )
    return CompareResponse(**res)
