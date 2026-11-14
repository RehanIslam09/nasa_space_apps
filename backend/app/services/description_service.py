from typing import Dict, Any, List
from app.core.catalog import NASA_CATALOG
from app.api.schemas.models import AccessibilityResponse

class DescriptionService:
    """
    Generates screen-reader-friendly narratives, audio legends, and plain-language
    scientific interpretations for blind, low-vision, and neurodiverse users.
    """

    @classmethod
    def get_accessibility_narrative(cls, dataset_id: str, features: Dict[str, Any]) -> AccessibilityResponse:
        if dataset_id not in NASA_CATALOG:
            raise ValueError(f"Unknown dataset: {dataset_id}")
            
        entry = NASA_CATALOG[dataset_id]
        glob = features.get("global_metrics", {})
        constituents = glob.get("aerosol_constituents", {})
        
        # Build variable-by-variable audio legend
        legend: List[Dict[str, str]] = []
        for rule in entry.sonification_rules:
            legend.append({
                "layer_name": rule.layer_name,
                "scientific_variable": rule.variable_mapped,
                "audio_characteristic": rule.audio_parameter,
                "pitch_range": rule.mapping_range,
                "synthesis_timbre": rule.synthesis_mode,
                "scientific_reasoning": rule.scientific_rationale
            })

        # Dataset-specific plain language summary
        if dataset_id == "geos-aerosols":
            dust = constituents.get("dust", 0.0)
            salt = constituents.get("sea_salt", 0.0)
            smoke = constituents.get("smoke", 0.0)
            sulfate = constituents.get("sulfate", 0.0)
            
            dominant = max([("Desert Dust", dust), ("Sea Salt Spray", salt), ("Biomass Smoke", smoke), ("Industrial Sulfate", sulfate)], key=lambda x: x[1])[0]
            
            plain_summary = (
                f"You are listening to an atmospheric simulation of global aerosols from NASA's Goddard Earth Observing System (GEOS) model. "
                f"In this observation, {dominant} is the most prominent particulate layer. "
                f"The deep, warm rumble in your lower hearing range (110–220 Hz) corresponds to mineral dust sweeping across transatlantic corridors. "
                f"The lighter, airy shimmer (950–1350 Hz noise with an 880 Hz chime) corresponds to marine sea salt lifted by ocean winds. "
                f"Intermittent rhythmic pops (220 Hz) indicate wildfire smoke plumes, while a smooth high-pitched tone (660 Hz) reflects sunlight bouncing off industrial sulfate hazes."
            )
            audio_guide = (
                "Listen for four distinct sonic constituent layers: "
                "1) Low-frequency saw drone (110–220 Hz) = Desert Dust optical depth. "
                "2) Panning resonant noise and high bell shimmer = Marine Sea Salt wind shear. "
                "3) Rhythmic pulses and mid-range clicks = Wildfire Smoke biomass burning. "
                "4) Crystalline high sine tone (660 Hz) = Industrial Sulfate solar reflection."
            )
            tactile_guidance = (
                "Audio is generated as standard stereo PCM. If you connect an external tactile transducer or low-frequency bass shaker: "
                "sub-bass pressure waves (50–120 Hz) will physically vibrate to communicate heavy mineral dust concentration, "
                "while higher frequency textures remain audible through your headphones."
            )
        elif dataset_id == "ocean-currents-temp":
            plain_summary = (
                "You are listening to global ocean circulation and sea surface temperatures from the NASA Estimating the Circulation and Climate of the Ocean (ECCO) model. "
                "Musical pitch maps sea surface temperature: lower tones represent cold polar and abyssal waters, while higher-pitched tones "
                "represent warm equatorial currents such as the Gulf Stream. Kinetic modulation flutter reflects visual velocity gradients derived from the model."
            )
            audio_guide = (
                "Thermal Pitch: Higher musical pitch (65–320 Hz) = warmer surface water. "
                "Kinetic Modulation: Faster pulsing (0.5–4.0 Hz) = faster boundary current velocity. "
                "Spatial Panning: Audio moving left-to-right indicates zonal eastward circulation. "
                "(Note: Pixel density and gradients represent visual flow fields derived from the ECCO model, not direct in-situ current meters.)"
            )
            tactile_guidance = (
                "When paired with an external tactile audio transducer: steady low vibrations (55 Hz) signify cold deep-ocean water masses, "
                "while rhythmic kinetic pulses convey swift surface current jets."
            )
        elif dataset_id == "night-lights":
            mean_b = glob.get("mean_brightness", 0.05)
            density = glob.get("spatial_density", 0.28)
            plain_summary = (
                "You are listening to nighttime satellite observations from the NASA Black Marble product (Suomi NPP and NOAA-20 VIIRS Day/Night Band). "
                "Urban radiance is translated into melodic bell chimes (330–880 Hz), where brighter human settlements produce higher chiming frequencies. "
                "Rhythmic electrification pulses communicate spatial lighting density across global landmasses."
            )
            audio_guide = (
                f"Urban Radiance: Bell pitch ({round(330 + mean_b * 550, 1)} Hz) reflects satellite photometric luminosity. "
                f"Electrification Pulses: Pulse frequency ({max(4, int(10 * density * 5))} events) reflects the spatial footprint of illuminated grid cells. "
                "Visual-Derived Distinction: Features represent visual photometric radiance from VIIRS Day/Night Band satellite composites, "
                "distinguishing electrified urban centers from unlit rural landscapes."
            )
            tactile_guidance = (
                "External tactile transducers will deliver brief transient pulses corresponding to illuminated urban clusters, "
                "with vibrational frequency tracking municipal electrification density."
            )
        elif dataset_id == "lightning-iss":
            plain_summary = (
                "You are listening to spaceborne optical lightning event recordings from the Lightning Imaging Sensor (LIS) on the International Space Station. "
                "Electrostatic discharges trigger transient percussive impulses across the stereo soundstage, followed by low-frequency acoustic thunder "
                "reverberation (40–180 Hz) and rapid high-voltage crackles that track geographic lightning flash density."
            )
            audio_guide = (
                "Orbital Passes: Left-to-right stereo panning tracks the ISS orbital swath passage. "
                "Flash Transients: Sharp acoustic clicks correspond to instantaneous optical lightning triggers. "
                "Thunder Decay: Rolling low-frequency envelopes reflect the acoustic dissipation of atmospheric shockwaves."
            )
            tactile_guidance = (
                "Tactile transducers deliver sharp physical impulses when lightning strikes occur, accompanied by sustained "
                "sub-bass vibration (40–90 Hz) that replicates physical thunder pressure."
            )
        elif dataset_id == "air-quality":
            plain_summary = (
                "You are listening to atmospheric chemical transport simulations from NASA's GMAO. Atmospheric pollutants "
                "(tropospheric nitrogen dioxide and ozone) create harmonic acoustic friction: clean air produces consonant harmonic fifths, "
                "while concentrated NO2 plumes introduce detuned minor-second friction and high-frequency (500–1100 Hz) bandpass distortion."
            )
            audio_guide = (
                "Tropospheric Tension: Consonant harmonic drone = clean atmospheric column. "
                "Pollutant Friction: Gritty, detuned harmonic clash and bandpass noise = dense urban nitrogen dioxide plumes."
            )
            tactile_guidance = (
                "Clean air generates smooth, calming vibrations (110 Hz), while high pollutant concentrations "
                "induce rough, agitated, high-frequency tactile buzzing."
            )
        elif dataset_id == "perpetual-ocean":
            plain_summary = (
                "You are listening to Western Boundary ocean currents and mesoscale eddy vorticity from NASA's ECCO-2 ocean circulation model. "
                "Circular stereo quadrature modulation (0.5–4.0 Hz) communicates swirling cyclonic and anticyclonic eddies peeling off the Gulf Stream, "
                "grounded by a deep 75 Hz sub-bass foundation representing oceanic volume transport."
            )
            audio_guide = (
                "Hydrodynamic Vorticity: Swirling stereo rotary motion reflects mesoscale eddy kinetic energy. "
                "Current Velocity: Dynamic FM shimmer frequency accelerates with stream speed. "
                "Transport Volume: Sustained 75 Hz sub-bass tone signifies deep baroclinic water mass movement."
            )
            tactile_guidance = (
                "Slow undulating rolling waves on tactile seats represent deep oceanic swells, transitioning to brisk "
                "rotary vibrational pulses when boundary current jets intensify."
            )
        elif dataset_id == "dyamond-co2":
            plain_summary = (
                "You are listening to the DYAMOND ultra-high-resolution global carbon dioxide atmospheric model. Atmospheric carbon "
                "concentration provides a foundational 55–110 Hz sub-bass drone, modulated by a slow 0.2 Hz LFO envelope that mirrors "
                "the planetary seasonal breathing cycle (spring photosynthetic drawdown versus autumn biospheric respiration)."
            )
            audio_guide = (
                "Atmospheric Foundation: Deep 55 Hz drone represents baseline tropospheric CO2 mixing ratio. "
                "Planetary Breathing: Slow rhythmic volume and harmonic swells translate the seasonal photosynthetic carbon cycle."
            )
            tactile_guidance = (
                "Provides a continuous, comforting low-frequency hum (55 Hz) in tactile transducers, allowing deaf and hard-of-hearing "
                "users to physically feel Earth's atmospheric blanket."
            )
        elif dataset_id == "atmospheric-river":
            plain_summary = (
                "You are listening to a 3D Earth System Model simulation of a Pacific Atmospheric River. High total precipitable water "
                "is conveyed through a warm 174.61 Hz Solfeggio fundamental tone, while dynamic tropospheric moisture flux drives "
                "cascading resonant noise sweeps (350–1550 Hz) as moisture-laden air masses hit coastal topography."
            )
            audio_guide = (
                "Precipitable Water: Deep fluid sine tone (174.61 Hz) reflects total tropospheric moisture content. "
                "Vapor Transport Flux: Resonant sweeping noise textures represent rushing atmospheric vapor corridors."
            )
            tactile_guidance = (
                "Dynamic wave-like vibrational sweeps across tactile surfaces simulate the surging arrival of atmospheric moisture filaments."
            )
        elif dataset_id == "gedi-forest":
            plain_summary = (
                "You are listening to spaceborne lidar canopy height profiles from the GEDI instrument on the International Space Station. "
                "Lidar return waveforms are mapped to an ascending wooden marimba ladder (C3–G4), where canopy top height dictates pitch elevation, "
                "forest biomass dictates harmonic density, and emergent crown foliage chimes as high glockenspiel overtones."
            )
            audio_guide = (
                "Canopy Top Height: Higher marimba notes (C4–G4) represent tall forest canopies exceeding 35 meters. "
                "Biomass Density: Dense chordal accompaniment reflects multi-layered tropical and temperate forest structure. "
                "Crown Foliage: High crystal glockenspiel chimes (523–1046 Hz) indicate emergent foliage piercing the canopy."
            )
            tactile_guidance = (
                "Percussive rhythmic pulses communicate forest vertical profile: solid, deep impulses for trunk/understory, "
                "and crisp light vibrations for top canopy leaves."
            )
        elif dataset_id == "caldwell-73":
            plain_summary = (
                "You are listening to Hubble Space Telescope sonification benchmark observations of Caldwell 73 (NGC 1851), a distant globular cluster. "
                "Radial distance from the dense stellar core translates to luminous FM chimes (440–1100 Hz), where individual stars sparkle over "
                "a warm galactic ambient pad."
            )
            audio_guide = (
                "Core Radial Distance: Higher pitched chimes correspond to stars in the dense galactic cluster nucleus. "
                "Celestial Pad: Warm ambient pad provides spatial cosmic depth."
            )
            tactile_guidance = (
                "Delicate high-frequency micro-haptics reflect dense stellar groupings in the cluster core."
            )
        elif dataset_id == "earth-info-center":
            plain_summary = (
                "You are listening to composite planetary vital signs synthesized from NASA Earth Information Center indicators. "
                "The soundscape uses an artistic sonification reference: the 136.10 Hz 'Year Tone' (Earth's 365.25-day orbital period transposed up 32 octaves into human hearing) "
                "and an artistic 0.1 Hz cyclic envelope modeling atmospheric and oceanic turnover, giving voice to NASA satellite observations of climate indicators."
            )
            audio_guide = (
                "Orbital Transposition: 136.10 Hz drone is an artistic musical convention representing Earth's annual orbit transposed into the audible spectrum. "
                "Atmospheric Turnover: 0.1 Hz cyclic envelope models global planetary circulation; soundscape dynamics reflect NASA EIC vital sign indices."
            )
            tactile_guidance = (
                "Sub-bass tactile vibrations (68 Hz and 136 Hz) translate composite planetary vital signs for haptic exploration."
            )
        else:
            plain_summary = f"Sonification of NASA dataset '{entry.title}'. The audio transforms spatial and numerical measurements into harmonic soundscapes."
            audio_guide = "Higher frequencies represent higher measured values; louder passages indicate higher density."
            tactile_guidance = "When using tactile transducers, vibrational intensity reflects data concentration."

        return AccessibilityResponse(
            dataset_id=dataset_id,
            title=entry.title,
            plain_language_summary=plain_summary,
            screen_reader_legend=legend,
            audio_guide=audio_guide,
            tactile_equivalent_guidance=tactile_guidance
        )
