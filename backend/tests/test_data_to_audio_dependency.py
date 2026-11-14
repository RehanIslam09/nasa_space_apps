import hashlib
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.services.computer_vision import ComputerVisionEngine
from app.services.sonification_engine import SonificationEngine
from app.services.audio_generator import AudioGenerator
from app.services.comparison_engine import ComparisonEngine
from app.services.ingestion_service import IngestionService

@pytest.fixture
def client():
    return TestClient(app)

def test_deterministic_sonification_output(tmp_path):
    """
    Verifies that identical input features and parameters produce
    100% bitwise deterministic audio output (identical SHA-256 checksums).
    """
    sonifier = SonificationEngine(sample_rate=44100)
    synth = AudioGenerator(sample_rate=44100)

    # Deterministic fixture features
    frame_a, _, _ = ComputerVisionEngine.create_synthetic_frame(128, 64)
    features = ComputerVisionEngine.extract_features(frame_a, dataset_category="aerosols")

    # Run 1
    l1, r1, _ = sonifier.sonify_geos_aerosols(features, duration=3.0)
    p1 = tmp_path / "run1.wav"
    synth.export_wav(l1, r1, p1)
    sha1 = hashlib.sha256(p1.read_bytes()).hexdigest()

    # Run 2
    l2, r2, _ = sonifier.sonify_geos_aerosols(features, duration=3.0)
    p2 = tmp_path / "run2.wav"
    synth.export_wav(l2, r2, p2)
    sha2 = hashlib.sha256(p2.read_bytes()).hexdigest()

    assert sha1 == sha2, "Sonification engine must be 100% deterministic for identical inputs."

def test_complete_data_to_audio_dependency(tmp_path):
    """
    Acceptance Test for Objective C:
    Proves: NASA source asset changes -> extracted features change -> generated audio changes.
    """
    sonifier = SonificationEngine(sample_rate=44100)
    synth = AudioGenerator(sample_rate=44100)

    # 1. Observation A: Baseline aerosol state (clean atmosphere)
    frame_a, w, h = ComputerVisionEngine.create_synthetic_frame(128, 64)
    features_a = ComputerVisionEngine.extract_features(frame_a, dataset_category="aerosols")
    
    path_wav_a = tmp_path / "observation_a.wav"
    la, ra, _ = sonifier.sonify_geos_aerosols(features_a, duration=4.0)
    synth.export_wav(la, ra, path_wav_a)
    sha_wav_a = hashlib.sha256(path_wav_a.read_bytes()).hexdigest()

    # 2. Observation B: Distinct atmospheric event (intense Saharan mineral dust plume)
    # Modify pixels to simulate dense red-spectrum dust optical depth
    frame_b = []
    for row in frame_a:
        new_row = []
        for (r, g, b) in row:
            # Shift heavily into dust spectrum (high red, attenuated blue)
            new_row.append((min(255, r + 90), int(g * 0.7), int(b * 0.4)))
        frame_b.append(new_row)

    features_b = ComputerVisionEngine.extract_features(frame_b, dataset_category="aerosols")
    
    path_wav_b = tmp_path / "observation_b.wav"
    lb, rb, _ = sonifier.sonify_geos_aerosols(features_b, duration=4.0)
    synth.export_wav(lb, rb, path_wav_b)
    sha_wav_b = hashlib.sha256(path_wav_b.read_bytes()).hexdigest()

    # 3. Assertions proving strict causal linkage:
    # A. Features changed as a direct consequence of source asset changes
    assert features_a["global_metrics"]["mean_brightness"] != features_b["global_metrics"]["mean_brightness"], \
        "Features must diverge when source observation content changes."
    assert features_a["global_metrics"]["aerosol_constituents"]["dust"] != features_b["global_metrics"]["aerosol_constituents"]["dust"], \
        "Dust constituent metric must reflect changed mineral plume data."

    # B. Audio checksum changed as a direct consequence of feature changes
    assert sha_wav_a != sha_wav_b, \
        "Generated audio WAV checksum must change when input data changes."

def test_night_lights_genuine_temporal_comparison(client):
    """
    Acceptance Test for Objective A:
    Verifies that Then vs Now comparison uses independently sourced NASA observations
    without synthetic feature drift, returning valid provenance and URLs.
    """
    res = client.post("/api/sonification/compare", json={
        "dataset_id": "night-lights",
        "period_a": "2012",
        "period_b": "2023",
        "duration_seconds": 12.0
    })

    assert res.status_code == 200
    data = res.json()

    # Verify structural and provenance fields
    assert data["dataset_id"] == "night-lights"
    assert data["period_a"] == "2012"
    assert data["period_b"] == "2023"
    assert data["observation_date_a"] is not None
    assert data["observation_date_b"] is not None
    assert data["source_asset_a_url"] is not None
    assert data["source_asset_b_url"] is not None
    assert data["source_asset_a_checksum"] is not None
    assert data["source_asset_b_checksum"] is not None
    assert data["audio_diff_checksum"] is not None

    # Prove source assets are independent observations with distinct checksums
    assert data["source_asset_a_checksum"] != data["source_asset_b_checksum"], \
        "2012 and 2023 source assets must be distinct NASA observations."

    # Verify audio download URLs resolve
    for url_key in ["audio_a_url", "audio_b_url", "audio_diff_url"]:
        audio_url = data[url_key]
        assert audio_url.endswith("/download")
        audio_res = client.get(audio_url)
        assert audio_res.status_code == 200
        assert audio_res.headers["content-type"] == "audio/wav"
        assert len(audio_res.content) > 100000

    # Verify visual observation frames resolve
    img_a_res = client.get(data["image_a_url"])
    assert img_a_res.status_code == 200
    assert img_a_res.headers["content-type"] in ["image/jpeg", "image/png"]

    img_b_res = client.get(data["image_b_url"])
    assert img_b_res.status_code == 200
    assert img_b_res.headers["content-type"] in ["image/jpeg", "image/png"]

def test_dataset_ingestion_force_refresh_contract(client):
    """
    Acceptance Test for Objective B:
    Verifies that force_refresh parameter is accepted by the ingestion endpoint
    and behaves according to specification.
    """
    # Test normal ingestion (force_refresh=False)
    res_false = client.post("/api/datasets/geos-aerosols/ingest?force_refresh=false")
    assert res_false.status_code == 200
    assert res_false.json()["status"] == "queued"
    assert "force_refresh=False" in res_false.json()["message"]

    # Test forced ingestion (force_refresh=True)
    res_true = client.post("/api/datasets/geos-aerosols/ingest?force_refresh=true")
    assert res_true.status_code == 200
    assert res_true.json()["status"] == "queued"
    assert "force_refresh=True" in res_true.json()["message"]
