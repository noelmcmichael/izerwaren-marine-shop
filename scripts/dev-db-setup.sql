-- Development-specific database setup
-- Additional configuration for development environment

-- Enable additional logging for development
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_min_duration_statement = 0;

-- Reload configuration
SELECT pg_reload_conf();

-- Create development-specific schemas or data if needed
-- (This script runs after the main init-db.sql script)