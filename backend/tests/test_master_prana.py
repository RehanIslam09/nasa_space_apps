import wave
import struct
import math
import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from app.main import app
from app.core.catalog import NASA_CATALOG
from app.core.config import settings

client = TestClient(app)

OFFICIAL_DATASET_IDS = [
    "earth-info-center",
    "caldwell-73",
    "night-lights",
    "ocean-currents-temp",
    "geos-aerosols",
    "air-quality",
    "perpetual-ocean",
    "dyamond-co2",
    "lightning-iss",
    "atmospheric-river",
    "gedi-forest"
]

def test_catalog_all_11_nasa_resources():
    """Verifies that all 11 official NASA Space Apps Challenge resources are registered with scientific provenance."""
    assert len(NASA_CATALOG) == 11
    for did in OFFICIAL_DATASET_IDS:
        assert did in NASA_CATALOG, f"Dataset '{did}' missing from catalog"
        entry = NASA_CATALOG[did]
        assert entry.title and len(entry.title) > 0
        assert entry.category and len(entry.category) > 0
        assert entry.nasa_url.startswith("https://")
        assert len(entry.scientific_variables) > 0
        assert len(entry.sonification_rules) > 0

def test_dataset_status_endpoint_all_11():
    """Verifies GET /api/datasets/{dataset_id}/status for all 11 datasets."""
    for did in OFFICIAL_DATASET_IDS:
        res = client.get(f"/api/datasets/{did}/status")
        assert res.status_code == 200, f"Status failed for {did}: {res.text}"
        data = res.json()
        assert data["dataset_id"] == did
        assert data["status"] in ["completed", "idle", "queued", "processing"]

@pytest.mark.parametrize("dataset_id", OFFICIAL_DATASET_IDS)
def test_sonification_and_audio_validity(dataset_id: str):
    """
    Verifies end-to-end sonification, WAV export, and technical audio validity
    for every single official NASA dataset.
    """
    req_payload = {
        "dataset_id": dataset_id,
        "duration_seconds": 2.5,
        "sample_rate": 44100
    }
    gen_res = client.post("/api/sonification/generate", json=req_payload)
    assert gen_res.status_code == 200, f"Sonification generation failed for {dataset_id}: {gen_res.text}"
    gen_data = gen_res.json()
    
    assert gen_data["dataset_id"] == dataset_id
    assert "audio_id" in gen_data
    assert gen_data["duration"] == 2.5
    assert gen_data["sample_rate"] == 44100
    assert len(gen_data["layers_active"]) > 0
    assert len(gen_data["accessibility_narrative"]) > 10
    assert len(gen_data["musical_key"]) > 0

    audio_id = gen_data["audio_id"]

    # Verify download endpoint returns valid 16-bit PCM Stereo WAV
    dl_res = client.get(f"/api/sonification/{audio_id}/download")
    assert dl_res.status_code == 200, f"Download failed for {audio_id}: {dl_res.status_code}"
    assert dl_res.headers.get("content-type") == "audio/wav"

    wav_path = settings.AUDIO_DIR / f"{audio_id}.wav"
    assert wav_path.exists(), f"Audio file not found on disk: {wav_path}"

    with wave.open(str(wav_path), "rb") as w:
        nchannels = w.getnchannels()
        sampwidth = w.getsampwidth()
        framerate = w.getframerate()
        nframes = w.getnframes()
        duration = nframes / framerate

        assert nchannels == 2, f"Expected stereo 2 channels, got {nchannels}"
        assert sampwidth == 2, f"Expected 16-bit audio (2 bytes), got {sampwidth}"
        assert framerate == 44100, f"Expected 44100 Hz sample rate, got {framerate}"
        assert math.isclose(duration, 2.5, rel_tol=0.05), f"Duration mismatch: {duration} vs 2.5s"

        frames = w.readframes(nframes)
        samples = struct.unpack(f"<{len(frames)//2}h", frames)
        rms = math.sqrt(sum(s * s for s in samples) / max(len(samples), 1))
        assert rms > 0.0, f"Silent audio produced for {dataset_id} (RMS=0)"

def test_audio_description_endpoint():
    """Verifies GET /api/sonification/{audio_id}/description returns rich accessibility metadata."""
    for did in ["geos-aerosols", "lightning-iss", "dyamond-co2"]:
        res = client.get(f"/api/sonification/{did}/description")
        assert res.status_code == 200, f"Audio description failed for {did}: {res.text}"
        data = res.json()
        assert data["dataset_id"] == did
        assert len(data["plain_language_summary"]) > 20
        assert len(data["screen_reader_legend"]) > 0
        assert len(data["audio_guide"]) > 10
        assert len(data["tactile_equivalent_guidance"]) > 10

def test_insights_and_descriptions_all_11():
    """Verifies GET /api/insights and GET /api/descriptions for all 11 datasets."""
    for did in OFFICIAL_DATASET_IDS:
        r_ins = client.get(f"/api/insights/{did}")
        assert r_ins.status_code == 200, f"Insights failed for {did}: {r_ins.text}"
        d_ins = r_ins.json()
        assert d_ins["dataset_id"] == did
        assert len(d_ins["scientific_interpretation"]) > 20

        r_desc = client.get(f"/api/descriptions/{did}")
        assert r_desc.status_code == 200, f"Descriptions failed for {did}: {r_desc.text}"
        d_desc = r_desc.json()
        assert d_desc["dataset_id"] == did
        assert len(d_desc["plain_language_summary"]) > 20

def test_composition_engine_multi_track():
    """
    Verifies Part 11: Create Your Own Earthsong multi-track composition engine.
    Renders, retrieves, and streams a multi-dataset composition.
    """
    comp_payload = {
        "title": "Biosphere & Ocean Harmony",
        "description": "Multi-dataset test composition",
        "tracks": [
            {"dataset_id": "geos-aerosols", "volume": 0.8, "pan": -0.4, "enabled": True},
            {"dataset_id": "perpetual-ocean", "volume": 0.7, "pan": 0.4, "enabled": True},
            {"dataset_id": "dyamond-co2", "volume": 0.9, "pan": 0.0, "enabled": True}
        ],
        "duration_seconds": 3.0,
        "sample_rate": 44100,
        "master_volume": 0.85
    }
    
    # 1. Create composition
    create_res = client.post("/api/compositions", json=comp_payload)
    assert create_res.status_code == 200, f"Create composition failed: {create_res.text}"
    comp_data = create_res.json()
    cid = comp_data["composition_id"]
    assert cid.startswith("comp_")
    assert comp_data["active_tracks_count"] == 3
    assert comp_data["duration"] == 3.0

    # 2. Get composition metadata
    get_res = client.get(f"/api/compositions/{cid}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Biosphere & Ocean Harmony"

    # 3. Download composition WAV
    dl_res = client.get(f"/api/compositions/{cid}/download")
    assert dl_res.status_code == 200
    assert dl_res.headers.get("content-type") == "audio/wav"
    assert len(dl_res.content) > 10000

    # 4. List compositions
    list_res = client.get("/api/compositions")
    assert list_res.status_code == 200
    assert any(c["composition_id"] == cid for c in list_res.json())

def test_sound_layers_get_and_patch():
    """
    Verifies Part 12: Sound Layer Engine.
    Queries active layers and updates volume and stereo pan.
    """
    layers_res = client.get("/api/sonification/layers")
    assert layers_res.status_code == 200, f"Get layers failed: {layers_res.text}"
    layers = layers_res.json()
    assert len(layers) > 0

    first_layer = layers[0]
    lid = first_layer["layer_id"]

    patch_res = client.patch(f"/api/sonification/layers/{lid}", json={"volume": 0.92, "pan": -0.35, "enabled": True})
    assert patch_res.status_code == 200, f"Patch layer failed: {patch_res.text}"
    updated = patch_res.json()
    assert updated["layer_id"] == lid
    assert math.isclose(updated["volume"], 0.92, rel_tol=1e-3)
    assert math.isclose(updated["pan"], -0.35, rel_tol=1e-3)
    assert updated["enabled"] is True

def test_then_vs_now_comparison_retrieval():
    """
    Verifies Then vs Now temporal comparison generation and retrieval via GET /api/comparison/{id}.
    """
    comp_req = {
        "dataset_id": "night-lights",
        "period_a": "2012",
        "period_b": "2023",
        "duration_seconds": 4.0
    }
    gen_res = client.post("/api/sonification/compare", json=comp_req)
    assert gen_res.status_code == 200, f"Comparison failed: {gen_res.text}"
    data = gen_res.json()
    cid = data["comparison_id"]

    # Retrieve via GET /api/comparison/{comparison_id}
    fetch_res = client.get(f"/api/comparison/{cid}")
    assert fetch_res.status_code == 200, f"Get comparison failed: {fetch_res.text}"
    record = fetch_res.json()
    assert record["comparison_id"] == cid
    assert record["dataset_id"] == "night-lights"
    assert record["period_a"] == "2012"
    assert record["period_b"] == "2023"

def test_jobs_status_endpoint():
    """Verifies GET /api/jobs/{job_id} returns job metadata."""
    ingest_res = client.post("/api/datasets/air-quality/ingest?force_refresh=false")
    assert ingest_res.status_code == 200
    jid = ingest_res.json()["job_id"]

    job_res = client.get(f"/api/jobs/{jid}")
    assert job_res.status_code == 200
    job_data = job_res.json()
    assert job_data["job_id"] == jid
    assert job_data["dataset_id"] == "air-quality"
    assert job_data["status"] in ["queued", "completed", "processing"]
