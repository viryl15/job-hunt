#!/bin/bash

# Job Hunt - Database Deployment Script
# This script helps deploy the database to a new environment

echo "🚀 Job Hunt - Database Deployment"
echo "=================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ Error: MySQL is not installed or not in PATH"
    echo "Please install MySQL first: https://dev.mysql.com/downloads/"
    exit 1
fi

echo "✅ MySQL found"
echo ""

# Get database credentials
read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "Database name [jobhunt]: " DB_NAME
DB_NAME=${DB_NAME:-jobhunt}

read -p "Database user [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Database password: " DB_PASSWORD
echo ""
echo ""

# Test connection
echo "🔌 Testing database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error: Could not connect to database"
    echo "Please check your credentials and try again"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Check if database exists
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" | grep "$DB_NAME")

if [ -z "$DB_EXISTS" ]; then
    echo "📦 Database '$DB_NAME' does not exist"
    read -p "Create database '$DB_NAME'? (y/n): " CREATE_DB
    
    if [ "$CREATE_DB" = "y" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        
        if [ $? -eq 0 ]; then
            echo "✅ Database created successfully"
        else
            echo "❌ Error: Could not create database"
            exit 1
        fi
    else
        echo "❌ Database required to continue. Exiting."
        exit 1
    fi
else
    echo "✅ Database '$DB_NAME' exists"
fi

echo ""

# Update database configuration
echo "📝 Updating database configuration..."

# Check if we're in the right directory
if [ ! -f "apps/web/src/lib/database.ts" ]; then
    echo "❌ Error: database.ts not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "apps/web/.env" ]; then
    cat > apps/web/.env << EOF
DATABASE_HOST=$DB_HOST
DATABASE_PORT=$DB_PORT
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_NAME=$DB_NAME
EOF
    echo "✅ Created .env file with database credentials"
else
    echo "⚠️  .env file already exists - please update manually if needed"
fi

echo ""

# Run migrations
echo "🔄 Running database migrations..."
cd apps/web

npm run db:setup

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ Database deployment completed!"
    echo "=================================="
    echo ""
    echo "📝 Next steps:"
    echo "   1. Start the application: npm run dev"
    echo "   2. Visit http://localhost:3000"
    echo "   3. Configure your job board settings"
    echo ""
else
    echo "❌ Error: Migration failed"
    echo "Please check the error messages above"
    exit 1
fi
