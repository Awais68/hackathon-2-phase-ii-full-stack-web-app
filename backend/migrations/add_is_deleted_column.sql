-- Migration to add is_deleted and deleted_at columns to tasks table
-- Run this against your Neon PostgreSQL database

ALTER TABLE tasks ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP;

-- Also add the columns to users table if needed
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
