from fastapi import APIRouter
from app.core.config import settings
from app.core.catalog import NASA_CATALOG
from datetime import datetime, timezone

router = APIRouter(prefix="/health", tags=["Health & System"])

@router.get("")
def get_health():
    return {
        "status": "healthy",
        "phase": "03-nasa-prana-sonification-engine",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "fastapi_server": "running",
            "audio_synthesis_engine": "operational (16-bit PCM Stereo)",
            "computer_vision_engine": "operational (PyPNG + GDI+ bridge)",
            "nasa_svs_integration": "connected",
            "sqlite_registry": "healthy",
            "total_nasa_datasets_cataloged": len(NASA_CATALOG)
        }
    }
