import os
import json
import urllib.request
import urllib.error
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.catalog import NASA_CATALOG
from app.models.db import create_job, update_job, get_job, save_cached_asset_record, save_generated_audio_record
from app.services.computer_vision import ComputerVisionEngine
from app.services.sonification_engine import SonificationEngine
from app.services.audio_generator import AudioGenerator

class IngestionService:
    """
    Retrieves, caches, and processes NASA scientific visualizations and media assets.
    """

    @classmethod
    def get_dataset_storage_dir(cls, dataset_id: str) -> Path:
        p = settings.ASSETS_DIR / dataset_id
        p.mkdir(parents=True, exist_ok=True)
        return p

    @classmethod
    def fetch_svs_metadata(cls, svs_id: int) -> Optional[Dict[str, Any]]:
        """Queries the official NASA SVS JSON API for up-to-date metadata."""
        url = f"{settings.NASA_SVS_API_BASE}/{svs_id}"
        req = urllib.request.Request(url, headers={"User-Agent": "PRANA-Earth-Jukebox/1.0 (NASA SpaceApps)"})
        try:
            with urllib.request.urlopen(req, timeout=settings.NASA_TIMEOUT_SECONDS) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f"Warning: NASA SVS API unreachable for id {svs_id}: {e}")
        return None

    @classmethod
    def download_asset(cls, url: str, target_path: Path, force_refresh: bool = False) -> bool:
        """Downloads a public NASA asset with caching and optional force refresh."""
        if not force_refresh and target_path.exists() and target_path.stat().st_size > 1000:
            return True # Already cached
            
        req = urllib.request.Request(url, headers={"User-Agent": "PRANA-Earth-Jukebox/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=settings.NASA_TIMEOUT_SECONDS) as resp:
                if resp.status == 200:
                    content = resp.read()
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(target_path, "wb") as f:
                        f.write(content)
                    return True
        except Exception as e:
            print(f"Failed to download asset from {url}: {e}")
            
        return False

    @classmethod
    def ingest_dataset_sync(cls, dataset_id: str, job_id: Optional[str] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion pipeline:
        1. Look up catalog definition
        2. Query NASA SVS metadata
        3. Download asset / sample frame (from catalog or SVS main_image)
        4. Run Computer Vision feature extraction
        5. Cache extracted feature vectors
        """
        if dataset_id not in NASA_CATALOG:
            raise ValueError(f"Unknown dataset ID: {dataset_id}")
            
        catalog_entry = NASA_CATALOG[dataset_id]
        storage_dir = cls.get_dataset_storage_dir(dataset_id)
        
        if job_id:
            update_job(job_id, status="downloading", progress=0.2)

        # 1. Fetch metadata if SVS ID exists
        svs_meta = None
        if catalog_entry.svs_id:
            svs_meta = cls.fetch_svs_metadata(catalog_entry.svs_id)
            if svs_meta:
                meta_file = storage_dir / "svs_metadata.json"
                with open(meta_file, "w", encoding="utf-8") as f:
                    json.dump(svs_meta, f, indent=2)

        # 2. Identify target asset URL: check catalog first, then SVS main_image
        target_url = catalog_entry.sample_asset_url
        if not target_url and svs_meta and svs_meta.get("main_image", {}).get("url"):
            target_url = svs_meta["main_image"]["url"]

        ext = ".png"
        if target_url and any(target_url.lower().endswith(x) for x in [".jpg", ".jpeg"]):
            ext = ".jpg"
        local_asset_path = storage_dir / f"{dataset_id}_sample{ext}"
        
        # Check existing asset checksum
        existing_checksum = None
        if local_asset_path.exists():
            try:
                existing_checksum = hashlib.sha256(local_asset_path.read_bytes()).hexdigest()
            except Exception:
                pass

        download_success = False
        content_changed = False
        asset_checksum = existing_checksum
        retrieval_time = datetime.now(timezone.utc).isoformat()

        if not force_refresh and local_asset_path.exists() and local_asset_path.stat().st_size > 1000:
            download_success = True
            content_changed = False
        else:
            # Download to a temporary staging file to protect cache on failure
            if target_url:
                staging_path = local_asset_path.with_suffix(".tmp_download")
                req = urllib.request.Request(target_url, headers={"User-Agent": "PRANA-Earth-Jukebox/1.0"})
                try:
                    with urllib.request.urlopen(req, timeout=settings.NASA_TIMEOUT_SECONDS) as resp:
                        if resp.status == 200:
                            content = resp.read()
                            if len(content) > 1000:
                                with open(staging_path, "wb") as f:
                                    f.write(content)
                                new_checksum = hashlib.sha256(content).hexdigest()
                                if new_checksum == existing_checksum:
                                    # Content identical; do not invalidate downstream
                                    content_changed = False
                                    asset_checksum = existing_checksum
                                    staging_path.unlink(missing_ok=True)
                                else:
                                    staging_path.replace(local_asset_path)
                                    asset_checksum = new_checksum
                                    content_changed = True
                                download_success = True
                except Exception as e:
                    print(f"Warning: NASA refresh failed from {target_url}: {e}")
                    staging_path.unlink(missing_ok=True)
                    if local_asset_path.exists():
                        download_success = True
                        content_changed = False

        if job_id:
            update_job(job_id, status="processing", progress=0.5)

        features_file = settings.FEATURES_DIR / f"{dataset_id}_features.json"
        
        # 3. Process image via Computer Vision Engine if content changed or features missing
        if content_changed or not features_file.exists():
            if download_success and local_asset_path.exists():
                try:
                    matrix, w, h = ComputerVisionEngine.load_image(local_asset_path)
                except Exception as e:
                    print(f"Error decoding downloaded asset, using synthetic fallback: {e}")
                    matrix, w, h = ComputerVisionEngine.create_synthetic_frame(256, 128)
            else:
                matrix, w, h = ComputerVisionEngine.create_synthetic_frame(256, 128)

            clean_matrix = ComputerVisionEngine.mask_legends_and_borders(matrix)
            features = ComputerVisionEngine.extract_features(clean_matrix, dataset_category=catalog_entry.category)
            with open(features_file, "w", encoding="utf-8") as f:
                json.dump(features, f, indent=2)
        else:
            with open(features_file, "r", encoding="utf-8") as f:
                features = json.load(f)

        # 4. Record provenance in SQLite cached_assets
        if local_asset_path.exists():
            save_cached_asset_record(
                asset_id=f"{dataset_id}_sample",
                dataset_id=dataset_id,
                source_url=target_url or catalog_entry.nasa_url,
                local_path=str(local_asset_path),
                media_type="image/jpeg" if ext == ".jpg" else "image/png",
                file_size=local_asset_path.stat().st_size,
                checksum=asset_checksum,
                observation_date=catalog_entry.temporal_coverage,
                retrieved_at=retrieval_time
            )

        # 5. Regenerate audio if content changed
        audio_id = None
        if content_changed:
            try:
                sonifier = SonificationEngine(sample_rate=44100)
                synth = AudioGenerator(sample_rate=44100)
                if dataset_id == "geos-aerosols":
                    l, r, active = sonifier.sonify_geos_aerosols(features, duration=10.0)
                elif dataset_id == "ocean-currents-temp":
                    l, r, active = sonifier.sonify_ocean_currents(features, duration=10.0)
                elif dataset_id == "night-lights":
                    l, r, active = sonifier.sonify_night_lights(features, duration=10.0)
                else:
                    l, r, active = sonifier.sonify_generic_dataset(dataset_id, features, duration=10.0)
                
                audio_id = f"{dataset_id}_{asset_checksum[:8] if asset_checksum else 'latest'}"
                audio_path = settings.AUDIO_DIR / f"{audio_id}.wav"
                synth.export_wav(l, r, audio_path)
                wav_checksum = hashlib.sha256(audio_path.read_bytes()).hexdigest()
                save_generated_audio_record(
                    audio_id=audio_id,
                    dataset_id=dataset_id,
                    title=catalog_entry.title,
                    file_path=str(audio_path),
                    duration=10.0,
                    sample_rate=44100,
                    channels=2,
                    mapping_preset="default",
                    layers_config={"layers": active},
                    visual_metrics=features.get("global_metrics", {}),
                    checksum=wav_checksum,
                    source_asset_checksum=asset_checksum,
                    feature_version="1.0.0",
                    mapping_version="1.0.0"
                )
            except Exception as e:
                print(f"Warning: Audio regeneration failed on ingest: {e}")

        result_payload = {
            "dataset_id": dataset_id,
            "title": catalog_entry.title,
            "source_url": target_url or catalog_entry.nasa_url,
            "asset_cached": download_success,
            "asset_checksum": asset_checksum,
            "content_changed": content_changed,
            "features_path": str(features_file),
            "features_summary": features.get("global_metrics", {}),
            "regenerated_audio_id": audio_id,
            "retrieved_at": retrieval_time
        }

        if job_id:
            update_job(job_id, status="completed", progress=1.0, result_data=result_payload)

        return result_payload

    @classmethod
    def get_or_ingest_features(cls, dataset_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        """Returns cached features or runs ingestion if not yet cached or force_refresh is True."""
        features_file = settings.FEATURES_DIR / f"{dataset_id}_features.json"
        if not force_refresh and features_file.exists():
            try:
                with open(features_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
                
        # Run ingestion
        res = cls.ingest_dataset_sync(dataset_id, force_refresh=force_refresh)
        with open(features_file, "r", encoding="utf-8") as f:
            return json.load(f)
