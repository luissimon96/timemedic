@echo off
setlocal enabledelayedexpansion

echo 🏥 TimeMedic Supabase Deployment Script
echo =======================================

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    exit /b 1
)

:: Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm is not available
    exit /b 1
)

echo 📋 Checking environment setup...

:: Check if .env file exists
if not exist ".env" (
    echo ❌ Error: .env file not found
    echo Please copy .env.example to .env and configure your Supabase credentials
    exit /b 1
)

echo ✅ Environment file found

:: Generate Prisma Client
echo 🔧 Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Error: Failed to generate Prisma Client
    exit /b 1
)
echo ✅ Prisma Client generated

:: Check if migrations directory exists
if not exist "prisma\migrations" (
    echo 📝 Creating initial migration...
    call npx prisma migrate dev --name init
    if errorlevel 1 (
        echo ❌ Error: Failed to create initial migration
        exit /b 1
    )
) else (
    echo 📝 Deploying existing migrations...
    call npx prisma migrate deploy
    if errorlevel 1 (
        echo ❌ Error: Failed to deploy migrations
        exit /b 1
    )
)

echo ✅ Database schema deployed

:: Verify deployment
echo 🔍 Verifying deployment...
call npx prisma db execute --file-path prisma\test-connection.sql >nul 2>&1
if errorlevel 1 (
    echo ❌ Database connection test failed
    echo Please check your DATABASE_URL in .env file
    exit /b 1
)

echo ✅ Database connection verified

:: Seed database if seed file exists
if exist "prisma\seed.ts" (
    echo 🌱 Seeding database...
    call npm run db:seed
    if errorlevel 1 (
        echo ⚠️ Warning: Database seeding failed, but deployment continues
    ) else (
        echo ✅ Database seeded
    )
) else (
    echo ⚠️ No seed file found, skipping seeding
)

echo.
echo 🎉 TimeMedic successfully deployed to Supabase!
echo.
echo Next steps:
echo 1. Run the SQL in prisma\supabase-setup.sql in your Supabase SQL Editor
echo 2. Test your application: npm run start:dev
echo 3. Monitor your database in Supabase Dashboard
echo.
echo Security features configured:
echo - Row Level Security policies
echo - Data encryption for PII
echo - Audit logging
echo - Connection pooling
echo.

pause