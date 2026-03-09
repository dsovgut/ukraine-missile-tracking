import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .data_sync import sync_data
from .scheduler import start_scheduler, stop_scheduler
from .routes import router

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(name)s: %(message)s")
logger = logging.getLogger(__name__)

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Ukraine Missile Tracker…")
    init_db()
    # Only run sync + scheduler in the first worker to avoid duplicate work
    _lock_path = os.path.join(os.getenv("DATA_DIR", "/tmp"), ".sync_lock")
    _is_primary = False
    try:
        # Non-blocking lock: first worker wins
        _lock_fd = open(_lock_path, "w")
        import fcntl
        fcntl.flock(_lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        _is_primary = True
        logger.info("Primary worker — running initial data sync")
        sync_data()
        start_scheduler()
    except (IOError, OSError):
        logger.info("Secondary worker — skipping sync/scheduler")
    yield
    if _is_primary:
        stop_scheduler()
    logger.info("Shutdown complete.")


app = FastAPI(title="Ukraine Missile Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Serve React SPA in production
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Serve actual files from dist/ if they exist (favicon.svg, manifest.json, etc.)
        if full_path:
            file_path = os.path.join(FRONTEND_DIST, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
        # Fall back to SPA index.html for client-side routing
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "Ukraine Missile Tracker API — frontend not yet built"}
