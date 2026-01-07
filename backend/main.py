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
    user_id = Column(String, index=True)
    recursion = Column(String, nullable=True)  # daily, weekly, monthly
    category = Column(String, default="General")
    tags = Column(String, nullable=True)  # comma-separated tags

# Create tables
if engine:
    Base.metadata.create_all(bind=engine)
    print("Database tables ready")

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
    priority: str = "medium"
    status: str = "pending"
    due_date: str | None = None
    recursion: str | None = None
    category: str = "General"
    tags: List[str] = []
    user_id: str | None = None


class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None
    recursion: str | None = None
    category: str | None = None
    tags: List[str] | None = None


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
async def list_tasks(
    user_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    """List all tasks from database with optional filters."""
    query = db.query(TaskDB)
    
    # Filter by user_id
    if user_id:
        query = query.filter(TaskDB.user_id == user_id)
    
    # Filter by status
    if status:
        query = query.filter(TaskDB.status == status)
    
    # Filter by priority
    if priority:
        query = query.filter(TaskDB.priority == priority)
    
    # Sort
    if sort_by == "created_at":
        if order == "desc":
            query = query.order_by(TaskDB.created_at.desc())
        else:
            query = query.order_by(TaskDB.created_at.asc())
    elif sort_by == "due_date":
        if order == "desc":
            query = query.order_by(TaskDB.due_date.desc())
        else:
            query = query.order_by(TaskDB.due_date.asc())
    elif sort_by == "priority":
        # Custom priority order
        query = query.order_by(TaskDB.priority)
    
    tasks = query.all()
    
    # Convert to response format
    result = []
    for task in tasks:
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "createdAt": task.created_at.isoformat() if task.created_at else None,
            "updatedAt": task.updated_at.isoformat() if task.updated_at else None,
            "dueDate": task.due_date.isoformat() if task.due_date else None,
            "userId": task.user_id,
            "recursion": task.recursion,
            "category": task.category or "General",
            "tags": task.tags.split(",") if task.tags else []
        })
    
    return result


@app.post("/tasks/", tags=["Tasks"], status_code=status.HTTP_201_CREATED)
async def create_task(todo: TodoCreate, db: Session = Depends(get_db)):
    """Create a new task and save to database."""
    import uuid
    
    # Parse due_date if provided
    due_date = None
    if todo.due_date:
        try:
            due_date = datetime.fromisoformat(todo.due_date.replace('Z', '+00:00'))
        except:
            pass
    
    # Create task in database
    db_task = TaskDB(
        id=str(uuid.uuid4()),
        title=todo.title,
        description=todo.description,
        status=todo.status,
        priority=todo.priority,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        due_date=due_date,
        user_id=todo.user_id or "anonymous",
        recursion=todo.recursion,
        category=todo.category,
        tags=",".join(todo.tags) if todo.tags else None
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
        "createdAt": db_task.created_at.isoformat(),
        "updatedAt": db_task.updated_at.isoformat(),
        "dueDate": db_task.due_date.isoformat() if db_task.due_date else None,
        "userId": db_task.user_id,
        "recursion": db_task.recursion,
        "category": db_task.category,
        "tags": db_task.tags.split(",") if db_task.tags else []
    }


@app.get("/tasks/{task_id}", tags=["Tasks"])
async def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get a specific task by ID."""
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "createdAt": task.created_at.isoformat() if task.created_at else None,
        "updatedAt": task.updated_at.isoformat() if task.updated_at else None,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "userId": task.user_id,
        "recursion": task.recursion,
        "category": task.category,
        "tags": task.tags.split(",") if task.tags else []
    }


@app.put("/tasks/{task_id}", tags=["Tasks"])
async def update_task(task_id: str, todo: TodoUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields if provided
    if todo.title is not None:
        task.title = todo.title
    if todo.description is not None:
        task.description = todo.description
    if todo.status is not None:
        task.status = todo.status
    if todo.completed is not None:
        task.status = "completed" if todo.completed else "pending"
    if todo.priority is not None:
        task.priority = todo.priority
    if todo.due_date is not None:
        try:
            task.due_date = datetime.fromisoformat(todo.due_date.replace('Z', '+00:00'))
        except:
            pass
    if todo.recursion is not None:
        task.recursion = todo.recursion
    if todo.category is not None:
        task.category = todo.category
    if todo.tags is not None:
        task.tags = ",".join(todo.tags)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "createdAt": task.created_at.isoformat() if task.created_at else None,
        "updatedAt": task.updated_at.isoformat() if task.updated_at else None,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "userId": task.user_id,
        "recursion": task.recursion,
        "category": task.category,
        "tags": task.tags.split(",") if task.tags else []
    }


@app.delete("/tasks/{task_id}", tags=["Tasks"])
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted successfully", "id": task_id}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
