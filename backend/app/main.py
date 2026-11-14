from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.models.db import init_db

# Import routers
from app.api.routes.health import router as health_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.processing import router as processing_router
from app.api.routes.sonification import router as sonification_router
from app.api.routes.insights import router as insights_router
from app.api.routes.compositions import router as compositions_router
from app.api.routes.comparison import router as comparison_router
from app.api.routes.jobs import router as jobs_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "**PRANA: The Living Breath of Earth** is an interactive Earth Information Jukebox "
        "and scientific data sonification platform for the 2026 NASA Space Apps Challenge.\n\n"
        "Translates NASA Earth Science visualizations, atmospheric aerosols, ocean currents, "
        "night lights, and biospheric data into explainable, multi-layer acoustic soundscapes."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup lifecycle: initialize database tables
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API Routers under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(datasets_router, prefix=settings.API_PREFIX)
app.include_router(processing_router, prefix=settings.API_PREFIX)
app.include_router(sonification_router, prefix=settings.API_PREFIX)
app.include_router(insights_router, prefix=settings.API_PREFIX)
app.include_router(compositions_router, prefix=settings.API_PREFIX)
app.include_router(comparison_router, prefix=settings.API_PREFIX)
app.include_router(jobs_router, prefix=settings.API_PREFIX)

@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "What if we could hear the Earth breathe?",
        "challenge": "2026 NASA Space Apps Challenge",
        "documentation": "/docs",
        "health_check": f"{settings.API_PREFIX}/health",
        "datasets": f"{settings.API_PREFIX}/datasets",
        "flagship_dataset": "geos-aerosols"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
