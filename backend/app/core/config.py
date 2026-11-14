import os
from pathlib import Path
from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PRANA — The Living Breath of Earth"
    PROJECT_SUBTITLE: str = "NASA Earth Information Jukebox & Scientific Sonification Engine"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    ASSETS_DIR: Path = STORAGE_DIR / "nasa_assets"
    FRAMES_DIR: Path = STORAGE_DIR / "extracted_frames"
    FEATURES_DIR: Path = STORAGE_DIR / "processed_features"
    AUDIO_DIR: Path = STORAGE_DIR / "generated_audio"
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    DB_PATH: Path = STORAGE_DIR / "prana.db"
    
    # Audio Defaults
    DEFAULT_SAMPLE_RATE: int = 44100
    DEFAULT_AUDIO_DURATION: float = 10.0
    MAX_AUDIO_DURATION: float = 60.0
    
    # NASA SVS APIs
    NASA_SVS_API_BASE: str = "https://svs.gsfc.nasa.gov/api"
    NASA_TIMEOUT_SECONDS: int = 30
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for folder in [
    settings.STORAGE_DIR,
    settings.ASSETS_DIR,
    settings.FRAMES_DIR,
    settings.FEATURES_DIR,
    settings.AUDIO_DIR,
    settings.DATA_DIR,
]:
    folder.mkdir(parents=True, exist_ok=True)
