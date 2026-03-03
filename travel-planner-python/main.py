from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import json
import re
from pathlib import Path

from database import init_db
from auth import router as auth_router, get_current_user
from trips import router as trips_router
from expenses import router as expenses_router
from dashboard import router as dashboard_router

from dotenv import load_dotenv
load_dotenv()
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Smart Travel Planner", lifespan=lifespan)

# API routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(trips_router, prefix="/api/trips", tags=["trips"])
app.include_router(expenses_router, prefix="/api/expenses", tags=["expenses"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])

# Serve React frontend (after build)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index = frontend_dist / "index.html"
        return FileResponse(str(index))
