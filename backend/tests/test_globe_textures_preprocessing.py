"""
PRANA — 3D INTERACTIVE EARTH
MILESTONE 1 AUTOMATED TEST SUITE: NASA GEOGRAPHIC ASSET VALIDATION & PREPROCESSING

Validates:
- Authentic NASA SVS source asset existence and SHA-256 integrity
- Exact 2:1 Equirectangular (Plate Carrée) aspect ratio
- Verified crop coordinates (0, 240, 7680, 4080)
- Desktop (4096x2048) and Mobile (2048x1024) output dimensions
- 2012 vs 2023 geographic co-registration and spatial alignment
- Safe masking of presentation watermark in deep South Atlantic
- Machine-readable manifest integrity and checksum recording
- Zero modification to original 8K NASA source assets
- Robust handling of missing or invalid input paths
"""

import os
import json
import hashlib
from pathlib import Path
import pytest
from PIL import Image

from app.core.config import settings
from scripts.preprocess_globe_textures import (
    SOURCE_ASSETS,
    CROP_BOUNDS,
    WATERMARK_BOX,
    TARGET_RESOLUTIONS,
    calculate_sha256,
    validate_source_asset,
    mask_watermark,
    DEFAULT_SOURCE_DIR,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_MANIFEST_PATH,
    run_preprocessing
)


@pytest.fixture(scope="module")
def manifest_data():
    """Loads the generated preprocessing manifest."""
    assert DEFAULT_MANIFEST_PATH.exists(), f"Manifest missing at {DEFAULT_MANIFEST_PATH}"
    with open(DEFAULT_MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_source_assets_exist_and_unmodified():
    """
    Verifies that the authentic NASA SVS #5276 / #5313 source assets exist,
    have exact 7680x4320 dimensions, and match known authoritative SHA-256 hashes.
    """
    for year, meta in SOURCE_ASSETS.items():
        src_path = DEFAULT_SOURCE_DIR / meta["filename"]
        assert src_path.exists(), f"Original NASA asset missing: {src_path}"
        
        valid, msg, actual_info = validate_source_asset(src_path, meta)
        assert valid is True, f"Validation failed for {year}: {msg}"
        assert actual_info["dimensions"] == (7680, 4320), f"Invalid dimensions for {year}"
        assert actual_info["sha256"] == meta["expected_sha256"], f"SHA-256 altered for {year} original asset!"


def test_crop_boundaries_mathematical_precision():
    """
    Verifies that the crop bounds yield an exact 2:1 equirectangular map:
    - Width = 7680
    - Height = 3840
    - Top offset = 240
    - Bottom offset = 240
    - Equator exactly centered at Y = 1920
    """
    w = CROP_BOUNDS["width"]
    h = CROP_BOUNDS["height"]
    assert w == 7680
    assert h == 3840
    assert w / h == 2.0
    assert (CROP_BOUNDS["y_max"] - CROP_BOUNDS["y_min"]) == h
    assert (CROP_BOUNDS["x_max"] - CROP_BOUNDS["x_min"]) == w
    
    # In 4320 height: Equator is at 2160. Cropped Y = 2160 - 240 = 1920.
    equator_cropped_y = 2160 - CROP_BOUNDS["y_min"]
    assert equator_cropped_y == h // 2, "Equator must be exact vertical center of cropped map."


def test_output_assets_exist_with_exact_dimensions():
    """
    Verifies all 8 target output assets (2012/2023, 4K/2K, WebP/JPG) exist,
    are non-empty, and match target resolutions and 2:1 aspect ratio.
    """
    assert DEFAULT_OUTPUT_DIR.exists(), f"Output dir missing: {DEFAULT_OUTPUT_DIR}"
    
    expected_files = [
        ("nightlights-2012-4k.webp", (4096, 2048)),
        ("nightlights-2012-4k.jpg", (4096, 2048)),
        ("nightlights-2012-2k.webp", (2048, 1024)),
        ("nightlights-2012-2k.jpg", (2048, 1024)),
        ("nightlights-2023-4k.webp", (4096, 2048)),
        ("nightlights-2023-4k.jpg", (4096, 2048)),
        ("nightlights-2023-2k.webp", (2048, 1024)),
        ("nightlights-2023-2k.jpg", (2048, 1024)),
    ]
    
    for filename, (target_w, target_h) in expected_files:
        file_path = DEFAULT_OUTPUT_DIR / filename
        assert file_path.exists(), f"Expected texture missing: {file_path}"
        assert file_path.stat().st_size > 10000, f"Texture is suspiciously small: {file_path}"
        
        with Image.open(file_path) as img:
            assert img.size == (target_w, target_h), f"Dimension mismatch in {filename}: {img.size}"
            aspect = img.width / img.height
            assert abs(aspect - 2.0) < 1e-6, f"Aspect ratio must be exact 2.0 in {filename}"


def test_manifest_integrity(manifest_data):
    """
    Verifies the schema, projection documentation, and checksum recordings in the manifest.
    """
    assert manifest_data["schema_version"] == "1.0.0"
    assert manifest_data["milestone"] == "MILESTONE_1_TEXTURE_PREPROCESSING"
    assert "Plate Carrée Equirectangular" in manifest_data["projection"]["name"]
    assert manifest_data["projection"]["aspect_ratio"] == 2.0
    assert manifest_data["co_registration_metrics"]["co_registered"] is True
    assert manifest_data["co_registration_metrics"]["mean_sample_l1_diff"] < 10.0
    
    # Check that recorded checksums match actual files on disk
    for yr in ["2012", "2023"]:
        out_files = manifest_data["assets"][yr]["processing_report"]["output_files"]
        for key, info in out_files.items():
            disk_path = Path(info["path"])
            assert disk_path.exists(), f"Recorded file does not exist: {disk_path}"
            current_sha = calculate_sha256(disk_path)
            assert current_sha == info["sha256"], f"Checksum mismatch for {key}: {current_sha} vs {info['sha256']}"


def test_watermark_masking_in_output():
    """
    Verifies that the South Atlantic presentation watermark ('2012' / '2023')
    has been replaced by deep ocean background in the processed textures.
    """
    # Test on 4K 2012 texture
    tex_path = DEFAULT_OUTPUT_DIR / "nightlights-2012-4k.jpg"
    with Image.open(tex_path) as img:
        # In 4K (4096x2048):
        # Cropped master was 7680x3840. Scale factor = 4096 / 7680 = 0.5333
        # Watermark X in cropped: [3345..3685] -> in 4K: [1784..1965]
        # Watermark Y in cropped: [2410..2526] -> in 4K: [1285..1347]
        scale_x = 4096.0 / 7680.0
        scale_y = 2048.0 / 3840.0
        
        test_x = int(3515 * scale_x)
        test_y = int((2708 - 240) * scale_y)
        
        p = img.getpixel((test_x, test_y))
        lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
        # Watermark text had lum > 100 in original. Masked ocean should be < 15.
        assert lum < 20.0, f"Watermark still visible at ({test_x}, {test_y}) in 4K texture! Lum={lum}"


def test_co_registration_between_2012_and_2023():
    """
    Verifies that 2012 and 2023 4K textures are co-registered with identical framing.
    Tests fixed coastal control points to guarantee zero horizontal or vertical drift.
    """
    p12_path = DEFAULT_OUTPUT_DIR / "nightlights-2012-4k.jpg"
    p23_path = DEFAULT_OUTPUT_DIR / "nightlights-2023-4k.jpg"
    
    with Image.open(p12_path) as im12, Image.open(p23_path) as im23:
        assert im12.size == im23.size == (4096, 2048)
        
        # Test anchors in 4K coordinates:
        # Gibraltar: (lon -5.35, lat 36.14) -> x = 1987, y = 612
        # Cape of Good Hope: (lon 18.42, lat -33.92) -> x = 2257, y = 1410
        # Suez Canal: (lon 32.30, lat 31.26) -> x = 2415, y = 668
        anchors = [(1987, 612), (2257, 1410), (2415, 668)]
        
        for ax, ay in anchors:
            c12 = im12.getpixel((ax, ay))
            c23 = im23.getpixel((ax, ay))
            l1_diff = sum(abs(a - b) for a, b in zip(c12, c23))
            # Coastal pixels between 2012 and 2023 should have minimal drift (<= 25 L1 diff)
            assert l1_diff < 25, f"Co-registration shift at anchor ({ax}, {ay}): 2012={c12}, 2023={c23}, diff={l1_diff}"


def test_missing_source_asset_graceful_handling(tmp_path):
    """
    Verifies that validate_source_asset returns (False, msg, ...) on missing or corrupted input.
    """
    missing_file = tmp_path / "non_existent.jpg"
    meta = SOURCE_ASSETS["2012"]
    valid, msg, info = validate_source_asset(missing_file, meta)
    assert valid is False
    assert "not found" in msg.lower()


def test_original_source_assets_never_modified():
    """
    Strict safety check: Proves that original 8K files in backend/storage/nasa_assets/night-lights/
    were never overwritten, truncated, or modified in any way.
    """
    for year, meta in SOURCE_ASSETS.items():
        src_path = DEFAULT_SOURCE_DIR / meta["filename"]
        current_sha = calculate_sha256(src_path)
        assert current_sha == meta["expected_sha256"], f"Original {year} source asset was modified!"
        assert src_path.stat().st_size > 2_000_000, f"Original {year} source asset corrupted!"
