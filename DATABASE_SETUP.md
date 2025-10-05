# Database Setup & Deployment Guide

This guide explains how to set up the database for the Job Hunt application, whether for local development or deployment to a new environment.

## Quick Start

### 1. Prerequisites
- MySQL 5.7+ or MariaDB 10.2+
- Node.js 18+
- Database credentials (host, user, password)

### 2. Configure Database Connection

Edit `apps/web/src/lib/database.ts` or create a `.env` file:

```typescript
// database.ts
const connection = await mysql.createConnection({
  host: 'localhost',      // or your database host
  user: 'root',           // your database user
  password: '',           // your database password
  database: 'jobhunt',    // database name
  port: 3306              // database port
})
```

Or use environment variables in `.env`:
```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=jobhunt
DATABASE_PORT=3306
```

### 3. Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE jobhunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 4. Run Database Setup

```bash
cd apps/web

# Option 1: Quick setup (recommended for first time)
npm run db:setup

# Option 2: Fresh install (WARNING: deletes all data!)
npm run db:setup:fresh
```

## Available Commands

### Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Force re-run all migrations (use with caution!)
npm run db:migrate:force

# Check migration status
npm run db:status

# Full database setup (recommended for deployment)
npm run db:setup

# Fresh install - drops all tables and recreates (DESTRUCTIVE!)
npm run db:setup:fresh

# Setup with seed data
npm run db:setup:seed

# Complete reset - fresh install + seed data
npm run db:reset
```

## Migration System

### How It Works

1. **Migration Files**: Located in `apps/web/src/lib/migrations/`
   - Named with prefixes: `001_initial_schema.sql`, `002_add_feature.sql`, etc.
   - Executed in alphabetical order
   - Tracked in `migrations` table to prevent re-execution

2. **Migration Tracking**:
   - Each migration is recorded in the `migrations` table
   - Already-executed migrations are automatically skipped
   - Use `npm run db:status` to see what's been run

3. **Migration Runner**: `migrate.ts`
   - Automatically finds and executes SQL files
   - Handles transaction-like execution
   - Records successful migrations

### Creating a New Migration

1. Create a new SQL file in `apps/web/src/lib/migrations/`:

```sql
-- Migration 002: Add user preferences
-- Created: 2025-10-05
-- Description: Adds preferences column to users table

ALTER TABLE users ADD COLUMN preferences JSON DEFAULT NULL;

-- Record this migration
INSERT INTO migrations (name) VALUES ('002_add_user_preferences')
ON DUPLICATE KEY UPDATE name=name;
```

2. Name it with sequential numbering: `002_add_user_preferences.sql`

3. Run the migration:
```bash
npm run db:migrate
```

## Database Schema

The application uses the following tables:

### Core Tables
- **users** / **user**: User accounts and profiles
- **account**: OAuth provider accounts
- **session**: User sessions
- **verificationtoken**: Email verification tokens

### Application Tables
- **job_board_config**: Job board automation configurations
- **job**: Job listings scraped from job boards
- **application**: Job applications submitted by users
- **application_log**: Detailed logs of application attempts

### System Tables
- **migrations**: Tracks executed database migrations

## Deployment

### Deploy to a New Environment

1. **Set up database**:
```bash
# On the server
mysql -u root -p
CREATE DATABASE jobhunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON jobhunt.* TO 'your_user'@'localhost';
exit;
```

2. **Configure connection**:
Update `database.ts` or environment variables with production credentials.

3. **Run setup**:
```bash
cd apps/web
npm run db:setup
```

4. **Verify**:
```bash
npm run db:status
```

### Using Docker

If you prefer Docker for database:

```bash
# Start MySQL container
docker run -d \
  --name jobhunt-mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=jobhunt \
  -p 3306:3306 \
  mysql:8.0

# Run migrations
npm run db:setup
```

### Production Checklist

- [ ] Database created with proper character set (utf8mb4)
- [ ] Database user has necessary privileges
- [ ] Connection credentials configured (env variables or database.ts)
- [ ] Migrations executed successfully (`npm run db:status`)
- [ ] Backup strategy in place
- [ ] Connection pooling configured for production load

## Backup & Restore

### Create Backup

```bash
# Structure only
mysqldump -u root -p --no-data jobhunt > backup_structure.sql

# Structure + data
mysqldump -u root -p jobhunt > backup_full.sql

# Specific table
mysqldump -u root -p jobhunt users > backup_users.sql
```

### Restore Backup

```bash
mysql -u root -p jobhunt < backup_full.sql
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: 
- Ensure MySQL is running: `sudo systemctl start mysql` (Linux) or check Services (Windows)
- Verify port 3306 is not blocked by firewall

### Access Denied
```
Error: Access denied for user 'root'@'localhost'
```
**Solution**:
- Check username/password in `database.ts`
- Grant proper privileges: `GRANT ALL PRIVILEGES ON jobhunt.* TO 'user'@'localhost';`

### Unknown Database
```
Error: Unknown database 'jobhunt'
```
**Solution**:
- Create database: `CREATE DATABASE jobhunt;`

### Table Already Exists
```
Error: Table 'users' already exists
```
**Solution**:
- Check migration status: `npm run db:status`
- Migrations use `CREATE TABLE IF NOT EXISTS` to prevent conflicts

### Migration Failed Mid-way
**Solution**:
1. Check which migrations have run: `npm run db:status`
2. Manually fix the issue in database
3. Either:
   - Mark migration as complete in `migrations` table, or
   - Use `npm run db:migrate:force` (WARNING: re-runs all migrations)

## Advanced

### Manual Migration Execution

If you need to run migrations manually:

```bash
cd apps/web
npx tsx src/lib/migrations/migrate.ts
```

### Check Migration Status Programmatically

```typescript
import { showMigrationStatus } from './lib/migrations/migrate'

await showMigrationStatus()
```

### Database Configuration Options

Update `database.ts` for advanced configuration:

```typescript
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'jobhunt',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  // Connection pool settings
  connectionLimit: 10,
  // Timezone
  timezone: '+00:00',
  // Charset
  charset: 'utf8mb4'
})
```

## Support

For issues:
1. Check migration status: `npm run db:status`
2. Review logs for error messages
3. Verify database connection manually: `mysql -u root -p jobhunt`
4. Check that all prerequisites are installed

## Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| `001_initial_schema.sql` | Initial database schema with all core tables | 2025-10-05 |

---

**Note**: Always backup your database before running migrations in production!
