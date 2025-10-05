# Job Hunt - Database Deployment Script (PowerShell)
# This script helps deploy the database to a new environment on Windows

Write-Host "🚀 Job Hunt - Database Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "❌ Error: MySQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install MySQL first: https://dev.mysql.com/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL found" -ForegroundColor Green
Write-Host ""

# Get database credentials
$DB_HOST = Read-Host "Database host [localhost]"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Database port [3306]"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "3306" }

$DB_NAME = Read-Host "Database name [jobhunt]"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "jobhunt" }

$DB_USER = Read-Host "Database user [root]"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "root" }

$SecurePassword = Read-Host "Database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""

# Test connection
Write-Host "🔌 Testing database connection..." -ForegroundColor Cyan
$testResult = & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" -e "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Could not connect to database" -ForegroundColor Red
    Write-Host "Please check your credentials and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Database connection successful" -ForegroundColor Green
Write-Host ""

# Check if database exists
$dbExists = & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>&1 | Select-String $DB_NAME

if (-not $dbExists) {
    Write-Host "📦 Database '$DB_NAME' does not exist" -ForegroundColor Yellow
    $createDb = Read-Host "Create database '$DB_NAME'? (y/n)"
    
    if ($createDb -eq "y") {
        & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error: Could not create database" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Database required to continue. Exiting." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Database '$DB_NAME' exists" -ForegroundColor Green
}

Write-Host ""

# Update database configuration
Write-Host "📝 Updating database configuration..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "apps\web\src\lib\database.ts")) {
    Write-Host "❌ Error: database.ts not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path "apps\web\.env")) {
    $envContent = @"
DATABASE_HOST=$DB_HOST
DATABASE_PORT=$DB_PORT
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_NAME=$DB_NAME
"@
    $envContent | Out-File -FilePath "apps\web\.env" -Encoding UTF8
    Write-Host "✅ Created .env file with database credentials" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists - please update manually if needed" -ForegroundColor Yellow
}

Write-Host ""

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
Set-Location apps\web

npm run db:setup

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "✅ Database deployment completed!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Start the application: npm run dev" -ForegroundColor White
    Write-Host "   2. Visit http://localhost:3000" -ForegroundColor White
    Write-Host "   3. Configure your job board settings" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Error: Migration failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}
