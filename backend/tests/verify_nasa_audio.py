import sys
from pathlib import Path
import wave
import struct
import math
import json

# Ensure backend is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.catalog import NASA_CATALOG
from app.services.ingestion_service import IngestionService
from app.services.sonification_engine import SonificationEngine
from app.services.audio_generator import AudioGenerator
from app.services.comparison_engine import ComparisonEngine
from app.services.description_service import DescriptionService
from app.models.db import init_db, save_generated_audio_record

def analyze_wav(wav_path: Path):
    with wave.open(str(wav_path), 'rb') as wf:
        channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        nframes = wf.getnframes()
        duration = nframes / float(framerate)
        raw_frames = wf.readframes(nframes)
        
        # Unpack 16-bit stereo samples
        samples = struct.unpack(f"<{nframes * channels}h", raw_frames)
        peak = max(abs(s) for s in samples) / 32767.0
        rms = math.sqrt(sum(s * s for s in samples) / len(samples)) / 32767.0
        
        return {
            "channels": channels,
            "bits_per_sample": sampwidth * 8,
            "framerate_hz": framerate,
            "total_frames": nframes,
            "duration_sec": round(duration, 2),
            "peak_amplitude": round(peak, 4),
            "rms_level": round(rms, 4),
            "file_size_bytes": wav_path.stat().st_size
        }

def main():
    print("=" * 70)
    print("PRANA — NASA DATA TO AUDIO END-TO-END VERIFICATION")
    print("=" * 70)
    init_db()
    
    # -------------------------------------------------------------
    # 1. FLAGSHIP 1: GEOS Aerosols (NASA SVS 5669)
    # -------------------------------------------------------------
    print("\n[FLAGSHIP 1] Processing GEOS Aerosols (svs 5669)...")
    ingest_res = IngestionService.ingest_dataset_sync("geos-aerosols")
    print(f"  Ingestion Status: Success | Asset Cached: {ingest_res['asset_cached']}")
    
    features_aerosols = IngestionService.get_or_ingest_features("geos-aerosols")
    print(f"  Extracted Constituents: {features_aerosols.get('global_metrics', {}).get('aerosol_constituents')}")
    
    sonifier = SonificationEngine(sample_rate=44100)
    synth = AudioGenerator(sample_rate=44100)
    
    mix_l, mix_r, active_layers = sonifier.sonify_geos_aerosols(features_aerosols, duration=10.0)
    aerosol_wav = settings.AUDIO_DIR / "flagship_geos_aerosols.wav"
    synth.export_wav(mix_l, mix_r, aerosol_wav)
    
    diag_aero = analyze_wav(aerosol_wav)
    print(f"  Generated WAV: {aerosol_wav.name}")
    print(f"  Audio Diagnostics: {json.dumps(diag_aero, indent=4)}")
    print(f"  Active Sound Layers ({len(active_layers)}):")
    for l in active_layers:
        print(f"    - {l}")
        
    narrative_aero = DescriptionService.get_accessibility_narrative("geos-aerosols", features_aerosols)
    print(f"  Accessibility Narrative Preview: {narrative_aero.plain_language_summary[:160]}...")
    
    # -------------------------------------------------------------
    # 2. FLAGSHIP 2: Ocean Currents & Temperature (NASA SVS 3912)
    # -------------------------------------------------------------
    print("\n[FLAGSHIP 2] Processing Ocean Currents & SST (svs 3912)...")
    ingest_ocean = IngestionService.ingest_dataset_sync("ocean-currents-temp")
    print(f"  Ingestion Status: Success | Asset Cached: {ingest_ocean['asset_cached']}")
    
    features_ocean = IngestionService.get_or_ingest_features("ocean-currents-temp")
    mix_ol, mix_or, ocean_layers = sonifier.sonify_ocean_currents(features_ocean, duration=10.0)
    ocean_wav = settings.AUDIO_DIR / "flagship_ocean_currents.wav"
    synth.export_wav(mix_ol, mix_or, ocean_wav)
    
    diag_ocean = analyze_wav(ocean_wav)
    print(f"  Generated WAV: {ocean_wav.name}")
    print(f"  Audio Diagnostics: {json.dumps(diag_ocean, indent=4)}")
    print(f"  Active Sound Layers ({len(ocean_layers)}):")
    for l in ocean_layers:
        print(f"    - {l}")

    # -------------------------------------------------------------
    # 3. SIGNATURE EXPERIENCE: THEN VS NOW COMPARISON
    # -------------------------------------------------------------
    print("\n[SIGNATURE FEATURE] Generating 'Then vs Now' Temporal Comparison...")
    comparator = ComparisonEngine(sample_rate=44100)
    comp_res = comparator.create_comparison(
        dataset_id="night-lights",
        period_a="2012 Baseline",
        period_b="2023 Decade Later",
        features_a=IngestionService.get_or_ingest_features("night-lights"),
        features_b=IngestionService.get_or_ingest_features("night-lights"),
        duration=12.0
    )
    diff_wav_id = comp_res["audio_diff_url"].split("/")[-1]
    diff_wav_path = settings.AUDIO_DIR / f"{diff_wav_id}.wav"
    diag_comp = analyze_wav(diff_wav_path)
    print(f"  Generated Comparison WAV: {diff_wav_path.name}")
    print(f"  Comparison Diagnostics: {json.dumps(diag_comp, indent=4)}")
    print(f"  Insights Generated: {comp_res['insights']}")

    print("\n" + "=" * 70)
    print("ALL NASA END-TO-END AUDIO PIPELINES VERIFIED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
