import math
import uuid
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.catalog import NASA_CATALOG
from app.services.ingestion_service import IngestionService
from app.services.sonification_engine import SonificationEngine
from app.services.audio_generator import AudioGenerator
from app.api.schemas.models import CompositionTrackConfig, CreateCompositionRequest
from app.models.db import save_composition_record, get_composition_record

class CompositionEngine:
    """
    Multi-Track Composition Engine for 'Create Your Own Earthsong'.
    Synthesizes authentic multi-dataset NASA environmental soundscapes
    combining atmospheric, oceanic, biospheric, and cosmic sonification layers.
    """

    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.sonifier = SonificationEngine(sample_rate=sample_rate)
        self.synth = AudioGenerator(sample_rate=sample_rate)

    def render_composition(self, request: CreateCompositionRequest) -> Dict[str, Any]:
        """
        Renders a multi-dataset composition from user-configured track layers.
        """
        composition_id = f"comp_{uuid.uuid4().hex[:12]}"
        total_samples = int(request.duration_seconds * self.sample_rate)
        
        master_l = [0.0] * total_samples
        master_r = [0.0] * total_samples
        
        active_dataset_ids: List[str] = []
        applied_tracks_meta: List[Dict[str, Any]] = []

        for track in request.tracks:
            if not track.enabled:
                continue

            if track.dataset_id not in NASA_CATALOG:
                continue

            # Ingest/retrieve authentic features
            features = IngestionService.get_or_ingest_features(track.dataset_id)
            
            # Synthesize individual dataset soundscape
            track_l, track_r = self._render_dataset_soundscape(
                dataset_id=track.dataset_id,
                features=features,
                duration=request.duration_seconds
            )

            # Apply pan and volume (constant power stereo panning)
            # pan in [-1.0, 1.0] -> angle in [0, pi/2]
            pan_norm = max(-1.0, min(1.0, track.pan))
            angle = (pan_norm + 1.0) * (math.pi / 4.0)
            left_gain = track.volume * math.cos(angle)
            right_gain = track.volume * math.sin(angle)

            # Accumulate into master bus
            for i in range(total_samples):
                if i < len(track_l) and i < len(track_r):
                    master_l[i] += track_l[i] * left_gain
                    master_r[i] += track_r[i] * right_gain

            active_dataset_ids.append(track.dataset_id)
            applied_tracks_meta.append({
                "dataset_id": track.dataset_id,
                "title": NASA_CATALOG[track.dataset_id].title,
                "volume": track.volume,
                "pan": track.pan,
                "left_gain": round(left_gain, 3),
                "right_gain": round(right_gain, 3)
            })

        # Master bus saturation limiter (tanh) and peak normalization
        master_gain = request.master_volume
        # Soft-clip saturation to guarantee 0 dBFS ceiling without harsh digital clipping
        for i in range(total_samples):
            master_l[i] = math.tanh(master_l[i] * master_gain)
            master_r[i] = math.tanh(master_r[i] * master_gain)

        # Export high-fidelity 16-bit PCM WAV
        output_path = settings.AUDIO_DIR / f"{composition_id}.wav"
        self.synth.export_wav(master_l, master_r, output_path)

        # Calculate SHA-256 checksum
        hasher = hashlib.sha256()
        with open(output_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        checksum = hasher.hexdigest()

        # Save to database
        save_composition_record(
            composition_id=composition_id,
            title=request.title,
            dataset_ids=active_dataset_ids,
            layers_config=[t.dict() for t in request.tracks],
            duration=request.duration_seconds,
            sample_rate=self.sample_rate,
            file_path=str(output_path),
            description=request.description or f"Custom Earthsong combining {len(active_dataset_ids)} NASA datasets",
            musical_key=request.musical_scale or "Unified Global Harmonic",
            checksum=checksum
        )

        return {
            "composition_id": composition_id,
            "title": request.title,
            "description": request.description,
            "duration": request.duration_seconds,
            "sample_rate": self.sample_rate,
            "audio_url": f"/api/compositions/{composition_id}",
            "download_url": f"/api/compositions/{composition_id}/download",
            "dataset_ids": active_dataset_ids,
            "active_tracks_count": len(active_dataset_ids),
            "musical_key": request.musical_scale or "Unified Global Harmonic",
            "tracks": applied_tracks_meta,
            "checksum": checksum,
            "created_at": get_composition_record(composition_id)["created_at"]
        }

    def _render_dataset_soundscape(
        self,
        dataset_id: str,
        features: Dict[str, Any],
        duration: float
    ) -> Tuple[List[float], List[float]]:
        """Routes dataset to its verified domain sonifier."""
        if dataset_id == "geos-aerosols":
            l, r, _ = self.sonifier.sonify_geos_aerosols(features, duration=duration)
        elif dataset_id == "ocean-currents-temp":
            l, r, _ = self.sonifier.sonify_ocean_currents(features, duration=duration)
        elif dataset_id == "night-lights":
            l, r, _ = self.sonifier.sonify_night_lights(features, duration=duration)
        elif dataset_id == "lightning-iss":
            l, r, _ = self.sonifier.sonify_lightning(features, duration=duration)
        elif dataset_id == "air-quality":
            l, r, _ = self.sonifier.sonify_air_quality(features, duration=duration)
        elif dataset_id == "perpetual-ocean":
            l, r, _ = self.sonifier.sonify_perpetual_ocean(features, duration=duration)
        elif dataset_id == "dyamond-co2":
            l, r, _ = self.sonifier.sonify_co2(features, duration=duration)
        elif dataset_id == "atmospheric-river":
            l, r, _ = self.sonifier.sonify_atmospheric_river(features, duration=duration)
        elif dataset_id == "gedi-forest":
            l, r, _ = self.sonifier.sonify_gedi_forest(features, duration=duration)
        elif dataset_id == "caldwell-73":
            l, r, _ = self.sonifier.sonify_caldwell_73(features, duration=duration)
        elif dataset_id == "earth-info-center":
            l, r, _ = self.sonifier.sonify_earth_info_center(features, duration=duration)
        else:
            l, r, _ = self.sonifier.sonify_generic_dataset(dataset_id, features, duration=duration)

        return l, r
