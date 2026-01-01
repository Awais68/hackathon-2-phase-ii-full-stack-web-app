"""
CORS middleware configuration for frontend access.
"""
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from src.core.config import settings


def configure_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware for the application.

    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
