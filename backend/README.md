# PRANA — The Living Breath of Earth
## Backend Architecture, Data Ingestion & Sonification Engine
**2026 NASA Space Apps Challenge**

---

## 1. Product Overview

**PRANA** transforms NASA's Earth science visualizations and environmental data into immersive, interactive, scientifically transparent soundscapes.

> *"What if we could hear the Earth breathe?"*

PRANA enables users, scientists, and educators to explore diverse planetary systems—from atmospheric particulate transport and oceanic circulation to decadal night light shifts and forest canopy architecture—through multi-layer sound compositions directly derived from NASA data.

---

## 2. Technology Stack & Architectural Principles

- **Framework**: Python 3.11+ / 3.12, FastAPI, Uvicorn, Starlette
- **Data Validation & Contracts**: Pydantic schemas, OpenAPI 3.0 (Interactive Swagger at `/docs`)
- **Computer Vision & Ingestion**: PyPNG, Pillow, Windows GDI+/System.Drawing bridge, NASA SVS REST APIs
- **Audio Processing & Synthesis**: Pure mathematical digital signal processing (DSP), 16-bit PCM Stereo WAV encoding (`wave`, `struct`, `math`)
- **Scientific Statistics & Normalization**: Custom percentile normalization, outlier rejection, spatial slicing, and temporal delta metrics
- **Persistence & Caching**: SQLite (`storage/prana.db`) tracking job queues, asset downloads, and audio registries

```
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py           # /api/health system diagnostics
│   │   │   ├── datasets.py         # /api/datasets catalog & ingestion triggers
│   │   │   ├── processing.py       # /api/processing computer vision & scientific data
│   │   │   ├── sonification.py     # /api/sonification audio synthesis & downloads
│   │   │   └── insights.py         # /api/insights & /api/descriptions accessibility
│   │   └── schemas/
│   │       └── models.py           # Pydantic data schemas
│   ├── core/
│   │   ├── config.py               # Central configuration & storage paths
│   │   └── catalog.py              # Official NASA 11-dataset scientific catalog
│   ├── models/
│   │   └── db.py                   # SQLite tables (jobs, audio, comparisons)
│   └── services/
│       ├── ingestion_service.py    # NASA SVS asset fetcher & cache manager
│       ├── computer_vision.py      # Color decomposition, border masking & 8-region slicing
│       ├── scientific_data.py      # Percentile normalization & statistical metrics
│       ├── audio_generator.py      # 16-bit PCM stereo WAV synthesis & DSP oscillators
│       ├── sonification_engine.py  # Scientific variable-to-sound mapping engine
│       ├── comparison_engine.py    # "Then vs Now" dual-phase temporal comparison
│       └── description_service.py  # Screen-reader legends & plain-language guides
├── storage/
│   ├── nasa_assets/                # Cached NASA SVS imagery and metadata
│   ├── extracted_frames/           # Video frames & spatial region slices
│   ├── processed_features/         # Extracted JSON feature vectors
│   └── generated_audio/            # Synthesized 16-bit PCM WAV audio files
├── tests/
│   ├── test_prana.py               # Unit and integration test suite (20 tests)
│   └── verify_nasa_audio.py        # End-to-end verification script for flagship audio
├── requirements.txt
├── .env.example
└── README.md
```

---

## 3. NASA Data Sources & Attribution

PRANA integrates 11 official NASA scientific resources:

| ID | NASA Dataset / Visualization | SVS ID | Category | Key Variables |
|---|---|---|---|---|
| `geos-aerosols` **(Flagship 1)** | GEOS Aerosols (2025) | 5669 | Atmosphere | Dust, Sea Salt, Smoke, Sulfate Optical Depth |
| `ocean-currents-temp` **(Flagship 2)** | Sea Surface Currents & Temperature (ECCO2) | 3912 | Oceans | SST (°C), Current Velocity (m/s), Vorticity |
| `night-lights` | Change in Night Lights (2012–2023) | 5313 | Human Impact | Top-of-atmosphere Radiance, Urban Footprint |
| `air-quality` | Air Quality Model Runs | 5533 | Atmospheric Chemistry | Tropospheric Nitrogen Dioxide ($10^{15}\text{ molec/cm}^2$) |
| `perpetual-ocean` | Perpetual Ocean 2: Western Boundary Currents | 5425 | Ocean Circulation | Eddy Kinetic Energy ($\text{cm}^2/\text{s}^2$) |
| `dyamond-co2` | DYAMOND Global Carbon Dioxide | 5196 | Carbon Cycle | Total Column $\text{CO}_2$ Mole Fraction (ppm) |
| `lightning-iss` | Lightning Events Detected from ISS (2017–2023) | 5011 | Electrodynamics | Flash Density Rate, Optical Radiant Energy |
| `atmospheric-river` | Atmospheric River Pacific Plume | 4960 | Hydrology | Total Precipitable Water Vapor (mm) |
| `gedi-forest` | GEDI Forest Canopy Height | 4950 | Biosphere | Canopy Height RH98 (m), Foliage Density |
| `caldwell-73` | Data Sonification: Caldwell 73 (NGC 1851) | 13786 | Sonification Benchmark | Apparent Magnitude, Core Radial Distance |
| `earth-info-center` | Earth Information Center Database | Gallery | Planetary Overview | Composite Vital Signs Index |

---

## 4. Scientific Sonification Methodology

Every sound in PRANA has a documented, mathematically deterministic, and scientifically explainable relationship with the underlying NASA data:

### Flagship 1: GEOS Aerosols
- **Dust Storms (Orange/Red tones)**: Mapped to a warm, resonant sub-bass drone ($110\text{ Hz} - 220\text{ Hz}$, A2–A3) with earthy bandpass filtering, reflecting the heavy kinetic mass of Saharan mineral dust crossing the Atlantic.
- **Sea Salt Spray (Blue/Cyan tones)**: Mapped to airy, sweeping bandpass noise and high FM bell shimmers ($880\text{ Hz} - 1800\text{ Hz}$) with spatial stereo motion, reflecting wind shear across ocean surfaces.
- **Wildfire Smoke (Yellow/Green tones)**: Mapped to rhythmic percussive transient clicks ($220\text{ Hz}$ fundamental), conveying dynamic fire hotspots and episodic smoke release.
- **Sulfate Hazes (White/Gray tones)**: Mapped to a pure crystalline sine pad ($660\text{ Hz}$, E5), reflecting the solar-reflective cooling effect (albedo) of atmospheric sulfates.

### Flagship 2: Ocean Currents & Temperature (ECCO2)
- **Sea Surface Temperature (SST)**: Mapped to continuous pitch contours ($65\text{ Hz}$ sub-bass C2 for polar ice waters up to $523\text{ Hz}$ C5 for tropical warm pools).
- **Current Velocity**: Mapped to kinetic amplitude and frequency modulation flutter ($1\text{ Hz} - 9\text{ Hz}$).
- **Flow Direction**: Mapped to binaural spatial stereo positioning ($-1.0$ full left for westward flow to $+1.0$ full right for eastward flow).

### Signature Experience: "Then vs Now — Hear the Difference"
- Compares baseline vs modern observations (e.g. Night Lights 2012 vs 2023 or seasonal aerosol anomalies).
- Synthesizes a unified audio track:
  1. Period A audio plays (first half)
  2. Gentle musical transition cue ($587\text{ Hz}$ D5 chime)
  3. Period B audio plays (second half)
- Accompanied by percentage change metrics and plain-language scientific insight summaries.

---

## 5. Audio Generation Specifications

- **Format**: 16-bit PCM Linear WAV (`audio/wav`)
- **Sample Rate**: $44,100\text{ Hz}$ (or configurable $22,050\text{ Hz}$)
- **Channels**: 2 (Stereo)
- **Dynamic Range**: Peak-normalized with soft-knee $\tanh$ limiting to guarantee 0% digital clipping or distortion.
- **Reproducibility**: Deterministic output given the same input parameters.

---

## 6. API Reference

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### Core Endpoints

#### System Diagnostics
- `GET /api/health`: System health, synthesis engine status, and catalog count.

#### Dataset Catalog & Ingestion
- `GET /api/datasets`: List all 11 cataloged NASA datasets.
- `GET /api/datasets/{dataset_id}`: Detailed metadata for a specific dataset.
- `GET /api/datasets/{dataset_id}/metadata`: Scientific variables, units, and provenance.
- `POST /api/datasets/{dataset_id}/ingest`: Ingest public NASA assets and compute feature vectors.
- `GET /api/datasets/{dataset_id}/status`: Check status of ingestion or processing jobs.

#### Computer Vision & Feature Extraction
- `POST /api/processing/features`: Extract brightness, color constituents, and 8 spatial regions from media.
- `POST /api/processing/frames`: Video frame sampling index.
- `POST /api/processing/scientific-data`: Impute missing values, percentile normalization, and statistical summaries.

#### Sonification & Audio Generation
- `POST /api/sonification/generate`: Synthesizes a multi-layer WAV audio file and returns metadata.
- `GET /api/sonification/{audio_id}`: Technical metadata for a generated soundscape.
- `GET /api/sonification/{audio_id}/download`: Download/stream the 16-bit PCM Stereo WAV file.
- `GET /api/sonification/{audio_id}/metadata`: Synthesis parameters, musical key, and active layers.
- `POST /api/sonification/compare`: Generates a "Then vs Now" comparative soundscape.
- `POST /api/sonification/layers`: Individual layer auditioning and customization.

#### Insights & Accessibility
- `GET /api/insights/{dataset_id}`: Spatial entropy, dominant layer, and scientific takeaways.
- `GET /api/descriptions/{dataset_id}`: Screen-reader-friendly text summaries, audio legends, and tactile guidance.

---

## 7. How to Start the Server

```bash
# Set PYTHONPATH to backend directory
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Or from the workspace root:
```powershell
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Visit:
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`
- Dataset Catalog: `http://localhost:8000/api/datasets`

---

## 8. Running Tests

Run the complete test suite (20 tests covering normalization, computer vision, audio synthesis, determinism, and API endpoints):

```powershell
$env:PYTHONPATH="backend"
python -m unittest backend/tests/test_prana.py
```

Run end-to-end verification of real NASA audio generation:

```powershell
python backend/tests/verify_nasa_audio.py
```
