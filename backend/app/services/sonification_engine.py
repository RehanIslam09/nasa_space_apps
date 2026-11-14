import math
import uuid
import random
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from app.core.config import settings
from app.services.audio_generator import AudioGenerator
from app.api.schemas.models import LayerCustomization

class SonificationEngine:
    """
    Translates extracted NASA features and scientific variables into coherent,
    scientifically documented, musically organized soundscapes.
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.synth = AudioGenerator(sample_rate=sample_rate)

    def sonify_geos_aerosols(
        self,
        features: Dict[str, Any],
        duration: float = 10.0,
        custom_layers: Optional[List[LayerCustomization]] = None
    ) -> Tuple[List[float], List[float], List[str]]:
        """
        Flagship 1: Synthesizes GEOS Aerosols soundscape.
        Separates into 4 constituent layers: Dust, Sea Salt, Smoke, Sulfate.
        """
        glob = features.get("global_metrics", {})
        constituents = glob.get("aerosol_constituents", {})
        
        dust_val = constituents.get("dust", 0.35)
        salt_val = constituents.get("sea_salt", 0.45)
        smoke_val = constituents.get("smoke", 0.25)
        sulfate_val = constituents.get("sulfate", 0.20)
        
        # Parse customization overrides if supplied
        layer_settings = {
            "dust": {"enabled": True, "vol": 0.8, "pan": -0.3},
            "sea_salt": {"enabled": True, "vol": 0.7, "pan": 0.4},
            "smoke": {"enabled": True, "vol": 0.65, "pan": 0.1},
            "sulfate": {"enabled": True, "vol": 0.5, "pan": -0.1}
        }
        if custom_layers:
            for cl in custom_layers:
                lname = cl.name.lower().replace(" ", "_")
                for key in layer_settings:
                    if key in lname:
                        layer_settings[key]["enabled"] = cl.enabled
                        layer_settings[key]["vol"] = cl.volume
                        layer_settings[key]["pan"] = cl.pan

        active_layers_rendered = []
        sound_layers = []

        # 1. Dust Storm Layer: Low-mid earthy saw-harmonic drone
        if layer_settings["dust"]["enabled"] and dust_val > 0.01:
            dust_vol = layer_settings["dust"]["vol"] * (0.3 + 0.7 * dust_val)
            # A2 base (110 Hz) elevated by optical depth
            freq = 110.0 + (dust_val * 55.0) 
            l, r = self.synth.generate_harmonic_pad(
                base_freq=freq,
                duration=duration,
                harmonics=[1.0, 0.7, 0.4, 0.2],
                volume=dust_vol,
                pan=layer_settings["dust"]["pan"],
                lfo_rate=0.15 # Slow desert wind swell
            )
            sound_layers.append((l, r))
            active_layers_rendered.append(f"Dust Storm Drone ({round(freq, 1)} Hz, Vol {round(dust_vol, 2)})")

        # 2. Sea Salt Layer: Airy wind texture and oceanic shimmer
        if layer_settings["sea_salt"]["enabled"] and salt_val > 0.01:
            salt_vol = layer_settings["sea_salt"]["vol"] * (0.3 + 0.7 * salt_val)
            # Resonant noise at 1200 Hz for marine wind shear
            noise_l, noise_r = self.synth.generate_filtered_noise(
                duration=duration,
                center_freq=950.0 + (salt_val * 400.0),
                q=3.5,
                volume=salt_vol * 0.45,
                pan=layer_settings["sea_salt"]["pan"]
            )
            # High shimmering chime
            bell_l, bell_r = self.synth.generate_fm_bell(
                carrier_freq=880.0,
                modulator_ratio=1.5,
                mod_index=2.0,
                duration=duration,
                volume=salt_vol * 0.35,
                pan=layer_settings["sea_salt"]["pan"]
            )
            # Combine
            comb_l = [nl + bl for nl, bl in zip(noise_l, bell_l)]
            comb_r = [nr + br for nr, br in zip(noise_r, bell_r)]
            sound_layers.append((comb_l, comb_r))
            active_layers_rendered.append(f"Sea Salt Marine Shimmer (Vol {round(salt_vol, 2)})")

        # 3. Wildfire Smoke Layer: Dynamic crackle / harmonic tension
        if layer_settings["smoke"]["enabled"] and smoke_val > 0.01:
            smoke_vol = layer_settings["smoke"]["vol"] * (0.3 + 0.7 * smoke_val)
            # Strike rhythm based on fire hotspot density
            num_ticks = max(2, int(duration * (2.0 + smoke_val * 4.0)))
            tick_times = [i * (duration / num_ticks) for i in range(num_ticks)]
            l, r = self.synth.generate_percussive_strike(
                duration=duration,
                hit_times=tick_times,
                base_freq=220.0,
                volume=smoke_vol * 0.5
            )
            sound_layers.append((l, r))
            active_layers_rendered.append(f"Wildfire Smoke Pulses ({num_ticks} events, Vol {round(smoke_vol, 2)})")

        # 4. Sulfate Haze Layer: Crystalline pure high-frequency pad (Albedo cooling)
        if layer_settings["sulfate"]["enabled"] and sulfate_val > 0.01:
            sulf_vol = layer_settings["sulfate"]["vol"] * (0.25 + 0.75 * sulfate_val)
            freq = 660.0 # E5 pure tone
            l, r = self.synth.generate_sine_wave(
                freq=freq,
                duration=duration,
                volume=sulf_vol * 0.4,
                pan=layer_settings["sulfate"]["pan"]
            )
            sound_layers.append((l, r))
            active_layers_rendered.append(f"Sulfate Solar-Reflective Tone ({freq} Hz, Vol {round(sulf_vol, 2)})")

        mix_l, mix_r = self.synth.mix_and_normalize(sound_layers, master_volume=0.88)
        return mix_l, mix_r, active_layers_rendered

    def sonify_ocean_currents(
        self,
        features: Dict[str, Any],
        duration: float = 10.0,
        custom_layers: Optional[List[LayerCustomization]] = None
    ) -> Tuple[List[float], List[float], List[str]]:
        """
        Flagship 2: Global Sea Surface Currents & Temperature (ECCO2).
        Translates temperature into pitch contour and current velocity into rhythmic kinetic modulation.
        """
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.45)
        channels = glob.get("channel_distribution", {})
        
        # In ECCO2 SST: Red/Yellow = warm (>25°C), Blue/Dark = cold (<10°C)
        red_ratio = channels.get("red", 0.33)
        blue_ratio = channels.get("blue", 0.33)
        
        # Estimate global mean SST: range 0°C to 30°C
        est_temp_c = 4.0 + (red_ratio / max(0.01, red_ratio + blue_ratio)) * 26.0
        
        # Pitch mapping: 65 Hz (cold C2) to 440 Hz (warm A4)
        base_pitch = 65.0 + (est_temp_c / 30.0) * 375.0
        
        # Current velocity mapped from density / contrast
        density = glob.get("spatial_density", 0.5)
        mod_rate = 1.0 + density * 8.0 # 1Hz to 9Hz kinetic flutter
        
        sound_layers = []
        active_layers_rendered = []

        # 1. Thermal Pitch Contour Layer (Continuous ocean voice)
        num_samples = int(self.sample_rate * duration)
        freq_mod = [
            math.sin(2.0 * math.pi * mod_rate * (i / self.sample_rate)) * 15.0
            for i in range(num_samples)
        ]
        l, r = self.synth.generate_sine_wave(
            freq=base_pitch,
            duration=duration,
            volume=0.75,
            pan=0.0,
            freq_modulation=freq_mod
        )
        sound_layers.append((l, r))
        active_layers_rendered.append(f"Thermal SST Contour ({round(base_pitch, 1)} Hz, Est Temp {round(est_temp_c, 1)}°C)")

        # 2. Boundary Current Kinetic Layer (Modulated harmonic pad)
        pad_l, pad_r = self.synth.generate_harmonic_pad(
            base_freq=base_pitch * 1.5, # Perfect fifth above
            duration=duration,
            harmonics=[0.6, 0.4, 0.2],
            volume=0.55,
            pan=0.25,
            lfo_rate=mod_rate * 0.25
        )
        sound_layers.append((pad_l, pad_r))
        active_layers_rendered.append(f"Boundary Velocity Flow ({round(mod_rate, 1)} Hz Kinetic Flutter)")

        # 3. Deep Abyss Low Drone
        drone_l, drone_r = self.synth.generate_sine_wave(
            freq=55.0, # Sub A1
            duration=duration,
            volume=0.4,
            pan=-0.2
        )
        sound_layers.append((drone_l, drone_r))
        active_layers_rendered.append("Abyssal Sub-Current Foundation (55 Hz)")

        mix_l, mix_r = self.synth.mix_and_normalize(sound_layers, master_volume=0.85)
        return mix_l, mix_r, active_layers_rendered

    def sonify_night_lights(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Change in Night Lights (2012–2023) sonification."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.3)
        density = glob.get("spatial_density", 0.4)
        
        sound_layers = []
        active_layers = []
        
        # Urban illumination bell chimes
        chime_freq = 330.0 + mean_b * 550.0
        chime_l, chime_r = self.synth.generate_fm_bell(
            carrier_freq=chime_freq,
            modulator_ratio=2.0,
            mod_index=3.0,
            duration=duration,
            volume=0.7,
            pan=0.2
        )
        sound_layers.append((chime_l, chime_r))
        active_layers.append(f"Urban Radiancy Chimes ({round(chime_freq, 1)} Hz)")
        
        # Grid electrification rhythmic clicks
        hit_count = max(4, int(duration * (density * 5.0)))
        hits = [i * (duration / hit_count) for i in range(hit_count)]
        click_l, click_r = self.synth.generate_percussive_strike(
            duration=duration,
            hit_times=hits,
            base_freq=440.0,
            volume=0.45
        )
        sound_layers.append((click_l, click_r))
        active_layers.append(f"Grid Electrification Pulses ({hit_count} events)")
        
        mix_l, mix_r = self.synth.mix_and_normalize(sound_layers, master_volume=0.85)
        return mix_l, mix_r, active_layers

    def sonify_lightning(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Lightning Events Detected from ISS sonification."""
        glob = features.get("global_metrics", {})
        density = glob.get("spatial_density", 0.3)
        mean_b = glob.get("mean_brightness", 0.4)
        
        # Seeded deterministic flash timing
        seed = int(density * 10000) + int(mean_b * 100) + 42
        rng = random.Random(seed)
        num_strikes = max(6, int(duration * (4.0 + density * 12.0)))
        strike_times = [rng.uniform(0.1, duration - 0.2) for _ in range(num_strikes)]
        strike_times.sort()
        
        l, r = self.synth.generate_percussive_strike(
            duration=duration,
            hit_times=strike_times,
            base_freq=90.0 + mean_b * 60.0,
            volume=0.85,
            seed=seed
        )
        # Background atmospheric electrostatic hum
        hum_l, hum_r = self.synth.generate_sine_wave(
            freq=60.0,
            duration=duration,
            volume=0.25,
            pan=0.0
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(l, r), (hum_l, hum_r)], master_volume=0.88)
        active = [f"ISS Optical Flash Strikes ({num_strikes} discharges, 60Hz electrostatic hum)"]
        return mix_l, mix_r, active

    def sonify_air_quality(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Air Quality Model Runs (Surface NO2 & Ozone)."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.35)
        density = glob.get("spatial_density", 0.4)
        
        base_freq = 146.83 # D3
        beat_freq = base_freq * (1.0 + 0.05946 * (0.5 + 0.5 * mean_b))
        
        pad_l, pad_r = self.synth.generate_harmonic_pad(
            base_freq=base_freq,
            duration=duration,
            harmonics=[1.0, 0.7, 0.5, 0.3],
            volume=0.65,
            pan=-0.2,
            lfo_rate=0.3
        )
        detune_l, detune_r = self.synth.generate_sine_wave(
            freq=beat_freq,
            duration=duration,
            volume=0.55 * (0.4 + 0.6 * density),
            pan=0.25
        )
        noise_l, noise_r = self.synth.generate_filtered_noise(
            duration=duration,
            center_freq=500.0 + mean_b * 600.0,
            q=2.5,
            volume=0.3 * density,
            pan=0.0
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(pad_l, pad_r), (detune_l, detune_r), (noise_l, noise_r)], master_volume=0.85)
        active = [f"Tropospheric Column Tension ({round(base_freq, 1)} Hz / {round(beat_freq, 1)} Hz Acoustic Friction)"]
        return mix_l, mix_r, active

    def sonify_perpetual_ocean(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Perpetual Ocean 2: Western Boundary Currents (Eddy Kinetic Energy)."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.42)
        density = glob.get("spatial_density", 0.55)
        
        eddy_rate = 0.5 + density * 3.5 # 0.5 Hz to 4.0 Hz rotation
        base_freq = 82.41 + mean_b * 110.0 # E2 to A2
        
        num_samples = int(self.sample_rate * duration)
        two_pi = 2.0 * math.pi
        freq_mod = [
            math.sin(two_pi * eddy_rate * (i / self.sample_rate)) * 12.0
            for i in range(num_samples)
        ]
        
        eddy_l, eddy_r = self.synth.generate_sine_wave(
            freq=base_freq,
            duration=duration,
            volume=0.75,
            pan=0.0,
            freq_modulation=freq_mod
        )
        shimmer_l, shimmer_r = self.synth.generate_fm_bell(
            carrier_freq=base_freq * 3.0,
            modulator_ratio=1.5,
            mod_index=2.5,
            duration=duration,
            volume=0.45,
            pan=0.3
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(eddy_l, eddy_r), (shimmer_l, shimmer_r)], master_volume=0.86)
        active = [f"Mesoscale Eddy Swirl ({round(eddy_rate, 2)} Hz Vorticity Cycle)"]
        return mix_l, mix_r, active

    def sonify_co2(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """DYAMOND Global Carbon Dioxide Transport."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.48)
        density = glob.get("spatial_density", 0.6)
        
        co2_base = 55.0 + mean_b * 55.0 # A1 to A2
        organ_l, organ_r = self.synth.generate_harmonic_pad(
            base_freq=co2_base,
            duration=duration,
            harmonics=[1.0, 0.8, 0.6, 0.4, 0.25],
            volume=0.82,
            pan=0.0,
            lfo_rate=0.08
        )
        diffuse_l, diffuse_r = self.synth.generate_filtered_noise(
            duration=duration,
            center_freq=420.0 + mean_b * 200.0,
            q=4.0,
            volume=0.25 * density,
            pan=0.1
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(organ_l, organ_r), (diffuse_l, diffuse_r)], master_volume=0.88)
        active = [f"Atmospheric CO2 Foundation Drone ({round(co2_base, 1)} Hz Fundamental)"]
        return mix_l, mix_r, active

    def sonify_atmospheric_river(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Atmospheric River — Pacific Moisture Plumes (Total Precipitable Water)."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.5)
        density = glob.get("spatial_density", 0.55)
        
        center_sweep = 350.0 + mean_b * 1200.0
        river_l, river_r = self.synth.generate_filtered_noise(
            duration=duration,
            center_freq=center_sweep,
            q=2.8,
            volume=0.75,
            pan=-0.15
        )
        flow_l, flow_r = self.synth.generate_sine_wave(
            freq=174.61, # F3
            duration=duration,
            volume=0.55,
            pan=0.2
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(river_l, river_r), (flow_l, flow_r)], master_volume=0.85)
        active = [f"Precipitable Water Vapor Flow (Resonant Bandwidth at {round(center_sweep, 1)} Hz)"]
        return mix_l, mix_r, active

    def sonify_gedi_forest(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """GEDI Forest Canopy Height (Lidar Vertical Architecture)."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.45)
        density = glob.get("spatial_density", 0.5)
        
        est_canopy_m = 10.0 + mean_b * 60.0
        ladder_pitches = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00]
        active_voice_count = max(2, min(len(ladder_pitches), int(2 + density * 4.0)))
        
        chords = []
        for i in range(active_voice_count):
            p = ladder_pitches[i]
            pan_val = ((i / max(1, active_voice_count - 1)) * 1.6) - 0.8
            l, r = self.synth.generate_sine_wave(
                freq=p,
                duration=duration,
                volume=0.45 / math.sqrt(active_voice_count),
                pan=pan_val
            )
            chords.append((l, r))
            
        bell_l, bell_r = self.synth.generate_fm_bell(
            carrier_freq=523.25 + mean_b * 523.25,
            modulator_ratio=2.0,
            mod_index=2.0,
            duration=duration,
            volume=0.35,
            pan=0.1
        )
        chords.append((bell_l, bell_r))
        
        mix_l, mix_r = self.synth.mix_and_normalize(chords, master_volume=0.86)
        active = [f"Canopy Top Height Harmonic Ladder (Est Height {round(est_canopy_m, 1)}m, {active_voice_count} Lidar Layers)"]
        return mix_l, mix_r, active

    def sonify_caldwell_73(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Data Sonification: Caldwell 73 (NGC 1851 Globular Cluster Reference)."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.5)
        
        core_chime_l, core_chime_r = self.synth.generate_fm_bell(
            carrier_freq=440.0 + mean_b * 660.0,
            modulator_ratio=2.5,
            mod_index=3.0,
            duration=duration,
            volume=0.8,
            pan=0.0
        )
        pad_l, pad_r = self.synth.generate_harmonic_pad(
            base_freq=220.0,
            duration=duration,
            harmonics=[1.0, 0.5, 0.25],
            volume=0.45,
            pan=0.25,
            lfo_rate=0.2
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(core_chime_l, core_chime_r), (pad_l, pad_r)], master_volume=0.85)
        active = ["Stellar Core Radial Sweep (Hubble Benchmark Sonification)"]
        return mix_l, mix_r, active

    def sonify_earth_info_center(
        self,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Earth Information Center Content Database: The Living Breath of Earth."""
        breath_l, breath_r = self.synth.generate_harmonic_pad(
            base_freq=136.1, # Artistic Year Tone transposition (Earth 365.25d orbital period up 32 octaves)
            duration=duration,
            harmonics=[1.0, 0.7, 0.5, 0.35, 0.2],
            volume=0.85,
            pan=0.0,
            lfo_rate=0.1 # Artistic 10s atmospheric turnover envelope
        )
        sub_l, sub_r = self.synth.generate_sine_wave(
            freq=68.05,
            duration=duration,
            volume=0.6,
            pan=0.0
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(breath_l, breath_r), (sub_l, sub_r)], master_volume=0.9)
        active = ["Composite Planetary Vital Signs (136.1 Hz Year Tone Transposition)"]
        return mix_l, mix_r, active

    def sonify_generic_dataset(
        self,
        dataset_id: str,
        features: Dict[str, Any],
        duration: float = 10.0
    ) -> Tuple[List[float], List[float], List[str]]:
        """Fallback sonification for other registered NASA catalog datasets."""
        glob = features.get("global_metrics", {})
        mean_b = glob.get("mean_brightness", 0.4)
        density = glob.get("spatial_density", 0.5)
        
        base_freq = 130.81 + (mean_b * 261.63) # C3 to C4
        pad_l, pad_r = self.synth.generate_harmonic_pad(
            base_freq=base_freq,
            duration=duration,
            harmonics=[1.0, 0.6, 0.3],
            volume=0.75,
            pan=0.0
        )
        noise_l, noise_r = self.synth.generate_filtered_noise(
            duration=duration,
            center_freq=800.0,
            volume=0.25 * density
        )
        mix_l, mix_r = self.synth.mix_and_normalize([(pad_l, pad_r), (noise_l, noise_r)])
        active = [f"{dataset_id} Harmonic Layer ({round(base_freq, 1)} Hz)"]
        return mix_l, mix_r, active
