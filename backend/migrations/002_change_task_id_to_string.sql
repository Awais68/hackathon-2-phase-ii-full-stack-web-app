-- Migration: Change TaskDB.id and user_id to VARCHAR/String type
-- This enables UUID string IDs for tasks to match frontend conventions

-- Drop existing tables (data will be lost - backup first if needed)
DROP TABLE IF EXISTS trash CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with VARCHAR id (already compatible with UUIDs)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table with VARCHAR id and user_id (for UUID compatibility)
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    user_id VARCHAR(255) INDEX,
    recursion VARCHAR(50),
    category VARCHAR(100) DEFAULT 'General',
    tags TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- Create trash table for soft-deleted tasks
CREATE TABLE trash (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) INDEX,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    created_at TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) INDEX,
    recursion VARCHAR(50),
    category VARCHAR(100),
    tags TEXT,
    due_date TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_trash_user_id ON trash(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX INDEX_tasks_priority ON tasks(priority);
