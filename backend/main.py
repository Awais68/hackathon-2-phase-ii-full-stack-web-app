"""
Todo Evolution API - FastAPI Backend
Deployed on Render with Neon PostgreSQL
"""
import os
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Import environment variables
from dotenv import load_dotenv
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
Base = declarative_base()

# Database Models
class TaskDB(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="pending")
    priority = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    user_id = Column(String, default="placeholder-user")

# Create tables
if engine:
    # Drop existing tasks table if it has old schema
    try:
        Base.metadata.drop_all(bind=engine, tables=[TaskDB.__table__])
        print("Dropped old tasks table")
    except Exception as e:
        print(f"No existing table to drop: {e}")
    
    # Create tables with new schema
    Base.metadata.create_all(bind=engine)
    print("Created tasks table with new schema")

# Dependency to get DB session
def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
# Allow all localhost ports for development and Vercel for production
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005"
).split(",")

# Add wildcard support for Vercel
if os.getenv("ENVIRONMENT", "development") == "production":
    CORS_ORIGINS.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if os.getenv("ENVIRONMENT") != "production" else ["*"],
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
# Example Task Endpoints (ready for Phase 4 implementation)
# ============================================
# TODO: Implement CRUD endpoints with SQLModel and JWT authentication
# - GET /tasks/ - List all tasks
# - POST /tasks/ - Create new task
# - GET /tasks/{id} - Get specific task
# - PUT /tasks/{id} - Update task
# - DELETE /tasks/{id} - Delete task

@app.get("/tasks/", tags=["Tasks"])
async def list_tasks(db: Session = Depends(get_db)):
    """List all tasks from database."""
    tasks = db.query(TaskDB).all()
    return tasks


@app.post("/tasks/", tags=["Tasks"], status_code=status.HTTP_201_CREATED)
async def create_task(todo: TodoCreate, db: Session = Depends(get_db)):
    """Create a new task and save to database."""
    import uuid
    
    # Create task in database
    db_task = TaskDB(
        id=str(uuid.uuid4()),
        title=todo.title,
        description=todo.description,
        status="pending",
        priority="medium",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Return task data
    return {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description,
        "status": db_task.status,
        "priority": db_task.priority,
        "created_at": db_task.created_at.isoformat(),
        "updated_at": db_task.updated_at.isoformat(),
        "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
        "user_id": db_task.user_id
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
