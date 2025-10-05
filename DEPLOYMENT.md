# 🚀 Job Hunt - Complete Deployment Guide

This guide covers everything needed to deploy the Job Hunt application to a new environment.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### For Windows (PowerShell)
```powershell
# Run automated deployment script
.\deploy-db.ps1

# Or manually:
cd apps\web
npm run db:setup
npm run dev
```

### For Linux/Mac (Bash)
```bash
# Run automated deployment script
chmod +x deploy-db.sh
./deploy-db.sh

# Or manually:
cd apps/web
npm run db:setup
npm run dev
```

---

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 5.7+ or MariaDB 10.2+ ([Download](https://dev.mysql.com/downloads/))
- **Git** (for cloning repository)

### Verify Installation
```bash
node --version  # Should be v18 or higher
npm --version   # Should be 9 or higher
mysql --version # Should be 5.7 or higher
```

---

## Database Setup

### Option 1: Automated Setup (Recommended)

#### Windows
```powershell
.\deploy-db.ps1
```

#### Linux/Mac
```bash
chmod +x deploy-db.sh
./deploy-db.sh
```

The script will:
1. Test database connection
2. Create database if needed
3. Create .env file with credentials
4. Run all migrations automatically

### Option 2: Manual Setup

#### Step 1: Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE jobhunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON jobhunt.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
exit;
```

#### Step 2: Configure Connection

Edit `apps/web/src/lib/database.ts`:
```typescript
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'jobhunt',
  port: 3306
})
```

Or create `apps/web/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=jobhunt
```

#### Step 3: Run Migrations
```bash
cd apps/web

# Check migration status
npm run db:status

# Run migrations
npm run db:setup
```

---

## Application Deployment

### 1. Install Dependencies
```bash
# From project root
npm install

# Or from apps/web
cd apps/web
npm install
```

### 2. Build Application (Production)
```bash
cd apps/web
npm run build
```

### 3. Start Application

#### Development Mode
```bash
npm run dev
```
Application will be available at: http://localhost:3000

#### Production Mode
```bash
npm run build
npm run start
```

---

## Configuration

### Essential Configuration

#### 1. Database Connection
Location: `apps/web/src/lib/database.ts` or `.env`

```typescript
// Production settings
{
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'jobhunt',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  connectionLimit: 10  // For production load
}
```

#### 2. Authentication (NextAuth)
Location: `apps/web/.env`

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Generate secret:
```bash
openssl rand -base64 32
```

### Optional Configuration

#### Environment Variables
Create `apps/web/.env.local`:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=jobhunt_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=jobhunt

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (if configured)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@yourdomain.com
```

---

## Database Commands Reference

```bash
# Check migration status
npm run db:status

# Run pending migrations
npm run db:migrate

# Complete database setup (first time)
npm run db:setup

# Fresh install - WARNING: Deletes all data!
npm run db:setup:fresh

# Setup with seed data
npm run db:setup:seed

# Complete reset (fresh + seed)
npm run db:reset

# Force re-run all migrations (use with caution!)
npm run db:migrate:force
```

---

## Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
cd apps/web
pm2 start npm --name "job-hunt" -- start

# Auto-restart on system reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs job-hunt
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY . .

RUN cd apps/web && npm run build

EXPOSE 3000

CMD ["npm", "run", "start", "--prefix", "apps/web"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: jobhunt
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_HOST: mysql
      DATABASE_USER: root
      DATABASE_PASSWORD: rootpassword
      DATABASE_NAME: jobhunt
    depends_on:
      - mysql

volumes:
  mysql_data:
```

Deploy:
```bash
docker-compose up -d
docker-compose exec app npm run db:setup
```

### Using VPS (Ubuntu/Debian)

```bash
# 1. Update system
sudo apt update
sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 4. Clone repository
git clone https://github.com/your-repo/job-hunt.git
cd job-hunt

# 5. Install dependencies
npm install
cd apps/web
npm install

# 6. Setup database
npm run db:setup

# 7. Build application
npm run build

# 8. Start with PM2
pm2 start npm --name "job-hunt" -- start
pm2 startup
pm2 save

# 9. Setup Nginx reverse proxy (optional)
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/job-hunt

# Add:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/job-hunt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Troubleshooting

### Database Connection Issues

**Error**: `ECONNREFUSED 127.0.0.1:3306`

Solution:
```bash
# Check if MySQL is running
sudo systemctl status mysql     # Linux
Get-Service MySQL               # Windows PowerShell

# Start MySQL
sudo systemctl start mysql      # Linux
Start-Service MySQL             # Windows PowerShell
```

**Error**: `Access denied for user 'root'@'localhost'`

Solution:
```sql
-- Reset MySQL root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Migration Issues

**Error**: `Table already exists`

Solution:
```bash
# Check what migrations have run
npm run db:status

# If needed, manually mark migration as complete
mysql -u root -p jobhunt
INSERT INTO migrations (name) VALUES ('001_initial_schema');
```

**Error**: `Migration failed mid-way`

Solution:
```bash
# 1. Check status
npm run db:status

# 2. Manually fix database issue

# 3. Force re-run if needed (CAUTION!)
npm run db:migrate:force
```

### Application Issues

**Error**: `Module not found`

Solution:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Port 3000 already in use`

Solution:
```bash
# Find and kill process using port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill

# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

---

## Health Checks

### Database Health
```bash
# Test connection
mysql -h localhost -u root -p jobhunt -e "SELECT 1;"

# Check tables
mysql -h localhost -u root -p jobhunt -e "SHOW TABLES;"

# Check migrations
npm run db:status
```

### Application Health
```bash
# Development
curl http://localhost:3000

# Production
curl https://yourdomain.com
```

---

## Backup & Recovery

### Backup Database
```bash
# Full backup
mysqldump -u root -p jobhunt > backup_$(date +%Y%m%d).sql

# Structure only
mysqldump -u root -p --no-data jobhunt > structure_only.sql

# Automated daily backup (Linux cron)
0 2 * * * mysqldump -u root -pYOUR_PASSWORD jobhunt > /backups/job hunt_$(date +\%Y\%m\%d).sql
```

### Restore Database
```bash
# Full restore
mysql -u root -p jobhunt < backup_20251005.sql

# Specific table
mysql -u root -p jobhunt < table_backup.sql
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Use environment variables for sensitive data
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Enable HTTPS in production
- [ ] Restrict database access to localhost (if possible)
- [ ] Regular security updates: `npm audit fix`
- [ ] Implement rate limiting
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Use prepared statements (already implemented)

---

## Support

For detailed database documentation: See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

For issues:
1. Check logs: `pm2 logs job-hunt`
2. Verify database: `npm run db:status`
3. Test connection: `mysql -u root -p jobhunt`
4. Review error messages

---

**Last Updated**: October 5, 2025
