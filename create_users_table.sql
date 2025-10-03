-- Create users table for Google OAuth authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    providerId VARCHAR(255),
    lastLoginAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Update job_board_config table to properly reference users
-- (This assumes you already have the job_board_config table)
-- ALTER TABLE job_board_config ADD FOREIGN KEY (userId) REFERENCES users(id);
-- Sample data check
SELECT 'Users table created successfully' as status;