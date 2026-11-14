import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.core.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Jobs / Tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        progress REAL DEFAULT 0.0,
        result_data TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Cached Assets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cached_assets (
        asset_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        source_url TEXT NOT NULL,
        local_path TEXT NOT NULL,
        media_type TEXT NOT NULL,
        file_size INTEGER,
        created_at TEXT NOT NULL
    )
    """)
    
    # Generated Audio Registry
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS generated_audio (
        audio_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration REAL NOT NULL,
        sample_rate INTEGER NOT NULL,
        channels INTEGER NOT NULL,
        mapping_preset TEXT,
        layers_config TEXT,
        visual_metrics TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # Comparisons table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comparisons (
        comparison_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        title TEXT NOT NULL,
        period_a TEXT NOT NULL,
        period_b TEXT NOT NULL,
        audio_id_a TEXT,
        audio_id_b TEXT,
        audio_id_diff TEXT,
        comparison_metrics TEXT,
        insights TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Compositions table (Part 11 - Create Your Own Earthsong)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compositions (
        composition_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        dataset_ids TEXT NOT NULL,
        layers_config TEXT NOT NULL,
        musical_key TEXT,
        duration REAL NOT NULL,
        sample_rate INTEGER NOT NULL,
        channels INTEGER DEFAULT 2,
        file_path TEXT NOT NULL,
        checksum TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Sound Layer State table (Part 12 - Sound Layer Engine)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS layer_configs (
        layer_id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        layer_name TEXT NOT NULL,
        variable_mapped TEXT,
        audio_parameter TEXT,
        synthesis_mode TEXT,
        volume REAL DEFAULT 0.8,
        pan REAL DEFAULT 0.0,
        enabled INTEGER DEFAULT 1,
        frequency_range TEXT,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Safe schema migrations for additive columns
    for col, col_type in [
        ("checksum", "TEXT"),
        ("observation_date", "TEXT"),
        ("retrieved_at", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE cached_assets ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass

    for col, col_type in [
        ("checksum", "TEXT"),
        ("source_asset_checksum", "TEXT"),
        ("feature_version", "TEXT"),
        ("mapping_version", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE generated_audio ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass

    for col, col_type in [
        ("observation_date_a", "TEXT"),
        ("observation_date_b", "TEXT"),
        ("source_asset_a_url", "TEXT"),
        ("source_asset_b_url", "TEXT"),
        ("source_asset_a_checksum", "TEXT"),
        ("source_asset_b_checksum", "TEXT"),
        ("audio_diff_checksum", "TEXT"),
        ("comparison_method", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE comparisons ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()

# Auto-initialize tables on module load
init_db()

# Database CRUD Helper Functions
def create_job(dataset_id: str, job_type: str) -> str:
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO jobs (job_id, dataset_id, job_type, status, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (job_id, dataset_id, job_type, "queued", 0.0, now, now)
    )
    conn.commit()
    conn.close()
    return job_id

def update_job(job_id: str, status: str, progress: float = 0.0, result_data: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    result_str = json.dumps(result_data) if result_data is not None else None
    conn.execute(
        "UPDATE jobs SET status = ?, progress = ?, result_data = ?, error_message = ?, updated_at = ? WHERE job_id = ?",
        (status, progress, result_str, error_message, now, job_id)
    )
    conn.commit()
    conn.close()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d["result_data"]:
        try:
            d["result_data"] = json.loads(d["result_data"])
        except Exception:
            pass
    return d

def get_latest_job_for_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM jobs WHERE dataset_id = ? ORDER BY created_at DESC LIMIT 1", (dataset_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d["result_data"]:
        try:
            d["result_data"] = json.loads(d["result_data"])
        except Exception:
            pass
    return d

def save_cached_asset_record(
    asset_id: str,
    dataset_id: str,
    source_url: str,
    local_path: str,
    media_type: str,
    file_size: int,
    checksum: Optional[str] = None,
    observation_date: Optional[str] = None,
    retrieved_at: Optional[str] = None
) -> None:
    now = retrieved_at or datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO cached_assets
        (asset_id, dataset_id, source_url, local_path, media_type, file_size, checksum, observation_date, retrieved_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (asset_id, dataset_id, source_url, local_path, media_type, file_size, checksum, observation_date, now, now)
    )
    conn.commit()
    conn.close()

def get_cached_asset_record(dataset_id: str, observation_date: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    if observation_date:
        row = conn.execute(
            "SELECT * FROM cached_assets WHERE dataset_id = ? AND observation_date = ? ORDER BY created_at DESC LIMIT 1",
            (dataset_id, observation_date)
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT * FROM cached_assets WHERE dataset_id = ? ORDER BY created_at DESC LIMIT 1",
            (dataset_id,)
        ).fetchone()
    conn.close()
    return dict(row) if row else None

def save_generated_audio_record(
    audio_id: str,
    dataset_id: str,
    title: str,
    file_path: str,
    duration: float,
    sample_rate: int,
    channels: int,
    mapping_preset: str,
    layers_config: Dict[str, Any],
    visual_metrics: Optional[Dict[str, Any]] = None,
    checksum: Optional[str] = None,
    source_asset_checksum: Optional[str] = None,
    feature_version: str = "1.0.0",
    mapping_version: str = "1.0.0"
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO generated_audio 
        (audio_id, dataset_id, title, file_path, duration, sample_rate, channels, mapping_preset, layers_config, visual_metrics, checksum, source_asset_checksum, feature_version, mapping_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            audio_id,
            dataset_id,
            title,
            file_path,
            duration,
            sample_rate,
            channels,
            mapping_preset,
            json.dumps(layers_config),
            json.dumps(visual_metrics) if visual_metrics else None,
            checksum,
            source_asset_checksum,
            feature_version,
            mapping_version,
            now
        )
    )
    conn.commit()
    conn.close()

def get_audio_record(audio_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM generated_audio WHERE audio_id = ?", (audio_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("layers_config"):
        d["layers_config"] = json.loads(d["layers_config"])
    if d.get("visual_metrics"):
        d["visual_metrics"] = json.loads(d["visual_metrics"])
    return d

def get_latest_audio_for_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM generated_audio WHERE dataset_id = ? ORDER BY created_at DESC LIMIT 1",
        (dataset_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("layers_config"):
        try:
            d["layers_config"] = json.loads(d["layers_config"])
        except Exception:
            pass
    if d.get("visual_metrics"):
        try:
            d["visual_metrics"] = json.loads(d["visual_metrics"])
        except Exception:
            pass
    return d

def save_comparison_record(
    comparison_id: str,
    dataset_id: str,
    title: str,
    period_a: str,
    period_b: str,
    audio_id_a: str,
    audio_id_b: str,
    audio_id_diff: str,
    comparison_metrics: Dict[str, Any],
    insights: List[str],
    observation_date_a: Optional[str] = None,
    observation_date_b: Optional[str] = None,
    source_asset_a_url: Optional[str] = None,
    source_asset_b_url: Optional[str] = None,
    source_asset_a_checksum: Optional[str] = None,
    source_asset_b_checksum: Optional[str] = None,
    audio_diff_checksum: Optional[str] = None,
    comparison_method: str = "Dual-Observation Radiometric Delta"
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO comparisons
        (comparison_id, dataset_id, title, period_a, period_b, audio_id_a, audio_id_b, audio_id_diff, comparison_metrics, insights,
         observation_date_a, observation_date_b, source_asset_a_url, source_asset_b_url, source_asset_a_checksum, source_asset_b_checksum, audio_diff_checksum, comparison_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            comparison_id,
            dataset_id,
            title,
            period_a,
            period_b,
            audio_id_a,
            audio_id_b,
            audio_id_diff,
            json.dumps(comparison_metrics),
            json.dumps(insights),
            observation_date_a,
            observation_date_b,
            source_asset_a_url,
            source_asset_b_url,
            source_asset_a_checksum,
            source_asset_b_checksum,
            audio_diff_checksum,
            comparison_method,
            now
        )
    )
    conn.commit()
    conn.close()

def get_comparison_record(comparison_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM comparisons WHERE comparison_id = ?", (comparison_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("comparison_metrics"):
        d["comparison_metrics"] = json.loads(d["comparison_metrics"])
    if d.get("insights"):
        d["insights"] = json.loads(d["insights"])
    return d

def save_composition_record(
    composition_id: str,
    title: str,
    dataset_ids: List[str],
    layers_config: List[Dict[str, Any]],
    duration: float,
    sample_rate: int,
    file_path: str,
    description: Optional[str] = None,
    musical_key: Optional[str] = None,
    checksum: Optional[str] = None
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO compositions
        (composition_id, title, description, dataset_ids, layers_config, musical_key, duration, sample_rate, channels, file_path, checksum, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            composition_id,
            title,
            description or f"Multi-Dataset Composition ({len(dataset_ids)} tracks)",
            json.dumps(dataset_ids),
            json.dumps(layers_config),
            musical_key or "Omni-Harmonic Earth Synthesis",
            duration,
            sample_rate,
            2,
            file_path,
            checksum,
            now
        )
    )
    conn.commit()
    conn.close()

def get_composition_record(composition_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM compositions WHERE composition_id = ?", (composition_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("dataset_ids"):
        try:
            d["dataset_ids"] = json.loads(d["dataset_ids"])
        except Exception:
            pass
    if d.get("layers_config"):
        try:
            d["layers_config"] = json.loads(d["layers_config"])
        except Exception:
            pass
    return d

def list_composition_records(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM compositions ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        if d.get("dataset_ids"):
            try:
                d["dataset_ids"] = json.loads(d["dataset_ids"])
            except Exception:
                pass
        if d.get("layers_config"):
            try:
                d["layers_config"] = json.loads(d["layers_config"])
            except Exception:
                pass
        results.append(d)
    return results

def upsert_layer_config(
    layer_id: str,
    dataset_id: str,
    layer_name: str,
    variable_mapped: Optional[str] = None,
    audio_parameter: Optional[str] = None,
    synthesis_mode: Optional[str] = None,
    volume: float = 0.8,
    pan: float = 0.0,
    enabled: bool = True,
    frequency_range: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO layer_configs
        (layer_id, dataset_id, layer_name, variable_mapped, audio_parameter, synthesis_mode, volume, pan, enabled, frequency_range, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            layer_id,
            dataset_id,
            layer_name,
            variable_mapped,
            audio_parameter,
            synthesis_mode,
            volume,
            pan,
            1 if enabled else 0,
            frequency_range,
            now
        )
    )
    conn.commit()
    conn.close()
    return {
        "layer_id": layer_id,
        "dataset_id": dataset_id,
        "layer_name": layer_name,
        "variable_mapped": variable_mapped,
        "audio_parameter": audio_parameter,
        "synthesis_mode": synthesis_mode,
        "volume": volume,
        "pan": pan,
        "enabled": enabled,
        "frequency_range": frequency_range,
        "updated_at": now
    }

def get_layer_config(layer_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM layer_configs WHERE layer_id = ?", (layer_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["enabled"] = bool(d["enabled"])
    return d

def list_layer_configs(dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if dataset_id:
        rows = conn.execute("SELECT * FROM layer_configs WHERE dataset_id = ? ORDER BY layer_name", (dataset_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM layer_configs ORDER BY dataset_id, layer_name").fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["enabled"] = bool(d["enabled"])
        results.append(d)
    return results
