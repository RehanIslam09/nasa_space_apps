# NASA Space Apps — Asset Registry & Manifest

This manifest catalogs visual, auditory, and 3D assets used within the experience.

---

## 1. Asset Storage Strategy

All static binary assets must be placed in their respective `public/` directories:

- `public/models/`: GLTF / GLB 3D models (draco compressed preferred).
- `public/textures/`: Texture maps (diffuse, roughness, normal, displacement).
- `public/images/`: Optimized WebP / AVIF photographic and UI imagery.
- `public/videos/`: MP4 / WebM background loops.
- `public/sequences/`: Pre-rendered high-resolution frame sequences for canvas scrubbing.
- `public/audio/`: Ambient space audio, UI interaction sounds, sound effects.

---

## 2. Registry Table

| Asset ID  | File Path           | Type            | Optimization / Compression | Target Experience                | Status            |
| :-------- | :------------------ | :-------------- | :------------------------- | :------------------------------- | :---------------- |
| _pending_ | `public/models/*`   | `.glb`          | Draco / Meshopt            | 3D Spacecraft / Celestial bodies | Awaiting Phase 02 |
| _pending_ | `public/textures/*` | `.webp`         | Power-of-two (1024/2048)   | Surface shaders                  | Awaiting Phase 02 |
| _pending_ | `public/audio/*`    | `.mp3` / `.ogg` | High bitrate, loopable     | Ambient soundscapes              | Awaiting Phase 02 |
