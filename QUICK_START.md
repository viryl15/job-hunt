# 🎯 Job Hunt - Quick Reference

## One-Command Deployment

### Windows
```powershell
.\deploy-db.ps1
```

### Linux/Mac
```bash
chmod +x deploy-db.sh && ./deploy-db.sh
```

---

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:status` | Check migration status |
| `npm run db:setup` | Setup database (first time) |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:setup:fresh` | ⚠️ Fresh install (deletes data!) |
| `npm run db:reset` | ⚠️ Reset + seed data |

---

## Application Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run linter |

---

## First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/your-repo/job-hunt.git
cd job-hunt

# 2. Install dependencies
npm install

# 3. Create database
mysql -u root -p -e "CREATE DATABASE jobhunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Configure database
# Edit apps/web/src/lib/database.ts OR create apps/web/.env

# 5. Run migrations
cd apps/web
npm run db:setup

# 6. Start application
npm run dev

# 7. Open browser
# http://localhost:3000
```

---

## Environment Variables

Create `apps/web/.env`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=jobhunt

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Troubleshooting Quick Fixes

```bash
# MySQL not running
sudo systemctl start mysql              # Linux
Start-Service MySQL                     # Windows

# Port 3000 in use
lsof -ti:3000 | xargs kill             # Linux/Mac
Get-NetTCPConnection -LocalPort 3000   # Windows

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Reset database (CAUTION!)
npm run db:setup:fresh
```

---

## Production Deployment

```bash
# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "job-hunt" -- start
pm2 startup
pm2 save
```

---

## Daily Backup (Linux Cron)

```bash
# Edit crontab
crontab -e

# Add daily 2 AM backup
0 2 * * * mysqldump -u root -pYOURPASSWORD jobhunt > /backups/jobhunt_$(date +\%Y\%m\%d).sql
```

---

## Useful Links

- **Database Setup**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Application URL**: http://localhost:3000

---

**Pro Tip**: Always run `npm run db:status` before migrations to avoid re-running completed migrations!
