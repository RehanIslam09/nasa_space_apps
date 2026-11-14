import unittest
import math
import wave
import struct
import tempfile
from pathlib import Path
from starlette.testclient import TestClient

from app.main import app
from app.services.scientific_data import ScientificDataEngine
from app.services.computer_vision import ComputerVisionEngine
from app.services.audio_generator import AudioGenerator
from app.services.sonification_engine import SonificationEngine
from app.core.catalog import NASA_CATALOG

class TestPranaBackend(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)

    # 1. Scientific Data Engine Tests
    def test_missing_value_imputation(self):
        data = [10.0, None, 30.0, None, 50.0]
        cleaned = ScientificDataEngine.handle_missing_values(data, strategy="interpolate")
        self.assertEqual(len(cleaned), 5)
        self.assertAlmostEqual(cleaned[1], 20.0) # (10 + 30) / 2

    def test_normalization_min_max(self):
        data = [10.0, 20.0, 30.0, 40.0, 50.0]
        norm = ScientificDataEngine.normalize_min_max(data)
        self.assertEqual(norm[0], 0.0)
        self.assertEqual(norm[-1], 1.0)
        self.assertAlmostEqual(norm[2], 0.5)

    def test_constant_value_normalization_edge_case(self):
        data = [42.0, 42.0, 42.0]
        norm = ScientificDataEngine.normalize_min_max(data)
        self.assertEqual(norm, [0.5, 0.5, 0.5])

    def test_percentile_normalization(self):
        data = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 100.0]
        norm = ScientificDataEngine.normalize_percentile(data, p_low=10.0, p_high=90.0)
        self.assertEqual(len(norm), 10)
        self.assertTrue(all(0.0 <= x <= 1.0 for x in norm))

    def test_statistical_summaries(self):
        data = [10.0, 20.0, 30.0, 40.0, 50.0]
        stats = ScientificDataEngine.compute_summary_statistics(data, "Aerosol Optical Depth", "AOD")
        self.assertEqual(stats["count"], 5)
        self.assertEqual(stats["mean"], 30.0)
        self.assertEqual(stats["median"], 30.0)
        self.assertEqual(stats["trend_direction"], "increasing")

    # 2. Computer Vision Engine Tests
    def test_synthetic_frame_extraction(self):
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(64, 32)
        self.assertEqual(w, 64)
        self.assertEqual(h, 32)
        self.assertEqual(len(matrix), 32)
        self.assertEqual(len(matrix[0]), 64)

    def test_mask_legends_and_borders(self):
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(100, 100)
        clean = ComputerVisionEngine.mask_legends_and_borders(matrix, top_crop_pct=0.1, bottom_crop_pct=0.1, side_crop_pct=0.1)
        self.assertEqual(len(clean), 80)
        self.assertEqual(len(clean[0]), 80)

    def test_feature_extraction(self):
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(64, 32)
        features = ComputerVisionEngine.extract_features(matrix, dataset_category="aerosols", num_spatial_regions=8)
        self.assertIn("global_metrics", features)
        self.assertIn("regional_slices", features)
        self.assertEqual(len(features["regional_slices"]), 8)
        constituents = features["global_metrics"]["aerosol_constituents"]
        self.assertIn("dust", constituents)
        self.assertIn("sea_salt", constituents)

    def test_temporal_delta(self):
        feat_a = {"global_metrics": {"mean_brightness": 0.40, "spatial_density": 0.50, "aerosol_constituents": {"dust": 0.3}}}
        feat_b = {"global_metrics": {"mean_brightness": 0.48, "spatial_density": 0.55, "aerosol_constituents": {"dust": 0.4}}}
        delta = ComputerVisionEngine.calculate_temporal_delta(feat_a, feat_b)
        self.assertAlmostEqual(delta["brightness_delta"], 0.08)
        self.assertAlmostEqual(delta["brightness_percent_change"], 20.0)

    # 3. Audio Synthesis & Determinism Tests
    def test_audio_generator_wav_export(self):
        synth = AudioGenerator(sample_rate=44100)
        left, right = synth.generate_sine_wave(freq=440.0, duration=0.5, volume=0.5)
        self.assertEqual(len(left), int(44100 * 0.5))
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            
        try:
            exported = synth.export_wav(left, right, tmp_path)
            self.assertTrue(exported.exists())
            self.assertGreater(exported.stat().st_size, 1000)
            
            # Verify WAV headers
            with wave.open(str(exported), 'rb') as wf:
                self.assertEqual(wf.getnchannels(), 2) # Stereo
                self.assertEqual(wf.getsampwidth(), 2) # 16-bit
                self.assertEqual(wf.getframerate(), 44100)
                self.assertEqual(wf.getnframes(), int(44100 * 0.5))
        finally:
            if tmp_path.exists():
                tmp_path.unlink()

    def test_audio_determinism(self):
        synth = AudioGenerator(sample_rate=22050)
        l1, r1 = synth.generate_harmonic_pad(base_freq=220.0, duration=0.2)
        l2, r2 = synth.generate_harmonic_pad(base_freq=220.0, duration=0.2)
        self.assertEqual(l1, l2)
        self.assertEqual(r1, r2)

    # 4. Sonification Engine Tests
    def test_geos_aerosol_sonification(self):
        engine = SonificationEngine(sample_rate=22050)
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(32, 16)
        features = ComputerVisionEngine.extract_features(matrix)
        l, r, active_layers = engine.sonify_geos_aerosols(features, duration=1.0)
        self.assertEqual(len(l), int(22050 * 1.0))
        self.assertGreaterEqual(len(active_layers), 2)

    def test_ocean_currents_sonification(self):
        engine = SonificationEngine(sample_rate=22050)
        matrix, w, h = ComputerVisionEngine.create_synthetic_frame(32, 16)
        features = ComputerVisionEngine.extract_features(matrix)
        l, r, active_layers = engine.sonify_ocean_currents(features, duration=1.0)
        self.assertEqual(len(l), int(22050 * 1.0))
        self.assertIn("Thermal SST Contour", active_layers[0])

    # 5. REST API Endpoint Tests
    def test_api_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["services"]["total_nasa_datasets_cataloged"], 11)

    def test_api_list_datasets(self):
        res = self.client.get("/api/datasets")
        self.assertEqual(res.status_code, 200)
        datasets = res.json()
        self.assertEqual(len(datasets), 11)
        ids = [d["id"] for d in datasets]
        self.assertIn("geos-aerosols", ids)
        self.assertIn("ocean-currents-temp", ids)

    def test_api_get_single_dataset(self):
        res = self.client.get("/api/datasets/geos-aerosols")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], "geos-aerosols")
        self.assertEqual(data["svs_id"], 5669)

    def test_api_get_nonexistent_dataset_404(self):
        res = self.client.get("/api/datasets/nonexistent-dataset-id")
        self.assertEqual(res.status_code, 404)

    def test_api_generate_sonification(self):
        payload = {
            "dataset_id": "geos-aerosols",
            "duration_seconds": 3.0,
            "sample_rate": 22050
        }
        res = self.client.post("/api/sonification/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("audio_id", data)
        self.assertEqual(data["dataset_id"], "geos-aerosols")
        self.assertIn("/download", data["download_url"])

        # Test download endpoint
        audio_id = data["audio_id"]
        dl_res = self.client.get(f"/api/sonification/{audio_id}/download")
        self.assertEqual(dl_res.status_code, 200)
        self.assertEqual(dl_res.headers["content-type"], "audio/wav")
        self.assertGreater(len(dl_res.content), 1000)

    def test_api_insights(self):
        res = self.client.get("/api/insights/geos-aerosols")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("mean_intensity", data)
        self.assertIn("dominant_layer", data)
        self.assertIn("regional_breakdown", data)

    def test_api_accessibility_descriptions(self):
        res = self.client.get("/api/descriptions/geos-aerosols")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("plain_language_summary", data)
        self.assertIn("screen_reader_legend", data)
        self.assertIn("audio_guide", data)

if __name__ == "__main__":
    unittest.main()
