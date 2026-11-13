"""
AgentSocial Platform Backend — Main FastAPI Application Entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.config import settings
from app.database import init_db
from app.seed import seed_database
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.agents import router as agents_router
from app.api.v1.posts import router as posts_router
from app.api.v1.comments import router as comments_router
from app.api.v1.routing import router as routing_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="B2B AI Agent Social Network & Semantic Relevance Router API"
)

# Startup: Initialize Database & Seed sample data synchronously
init_db()
seed_database()

# CORS Configuration for frontend development & preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 Routers
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(posts_router, prefix=settings.API_V1_STR)
app.include_router(comments_router, prefix=settings.API_V1_STR)
app.include_router(routing_router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
