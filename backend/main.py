"""
Todo Evolution API - FastAPI Backend
Deployed on Render with Neon PostgreSQL
"""
import os
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import environment variables
from dotenv import load_dotenv
load_dotenv()

# Health check response model
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"
    environment: str

# Application state
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Log environment info
    environment = os.getenv("ENVIRONMENT", "development")
    print(f"Starting Todo Evolution API in {environment} mode")
    print(f"Python version: {__import__('sys').version}")
    yield
    # Shutdown
    print("Shutting down Todo Evolution API")

# Create FastAPI application
app = FastAPI(
    title="Todo Evolution API",
    description="REST API for Todo Evolution application with FastAPI and SQLModel",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/red",
)

# CORS Configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://*.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health Check Endpoint (Render Health Check)
# ============================================
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint for Render deployment.
    Used by Render's health check system to verify the service is running.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development")
    )


# ============================================
# Root Endpoint
# ============================================
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning API information."""
    return {
        "name": "Todo Evolution API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================
# Example Todo Models (placeholder for future implementation)
# ============================================
class TodoCreate(BaseModel):
    title: str
    description: str | None = None


class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None


class TodoResponse(BaseModel):
    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Example Todo Endpoints (ready for Phase 4 implementation)
# ============================================
# TODO: Implement CRUD endpoints with SQLModel and JWT authentication
# - GET /todos - List all todos
# - POST /todos - Create new todo
# - GET /todos/{id} - Get specific todo
# - PUT /todos/{id} - Update todo
# - DELETE /todos/{id} - Delete todo

@app.get("/todos", tags=["Todos"])
async def list_todos():
    """List all todos - Placeholder for Phase 4 implementation."""
    return {"message": "Todo endpoints ready for Phase 4 implementation"}


@app.post("/todos", tags=["Todos"], status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoCreate):
    """Create a new todo - Placeholder for Phase 4 implementation."""
    return {"message": "Todo creation ready for Phase 4 implementation", "todo": todo}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
