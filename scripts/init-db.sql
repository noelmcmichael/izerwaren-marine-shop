-- Database initialization script for Docker PostgreSQL
-- This script runs when the database container starts for the first time

-- Create development database if it doesn't exist
SELECT 'CREATE DATABASE izerwaren_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'izerwaren_dev')\gexec

-- Create test database for testing
SELECT 'CREATE DATABASE izerwaren_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'izerwaren_test')\gexec

-- Set up basic permissions
\c izerwaren_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Switch to test database and set up extensions
\c izerwaren_test;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Return to default database
\c postgres;