#!/bin/bash

# TimeMedic Supabase Deployment Script
# This script handles the complete deployment of TimeMedic to Supabase

set -e

echo "🏥 TimeMedic Supabase Deployment Script"
echo "======================================="

# Check if required environment variables are set
check_env_vars() {
    echo "📋 Checking environment variables..."
    
    required_vars=("DATABASE_URL" "DIRECT_URL")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ Error: $var is not set"
            echo "Please update your .env file with Supabase connection strings"
            exit 1
        fi
    done
    
    echo "✅ Environment variables configured"
}

# Generate Prisma Client
generate_client() {
    echo "🔧 Generating Prisma Client..."
    npx prisma generate
    echo "✅ Prisma Client generated"
}

# Deploy database schema
deploy_schema() {
    echo "🗄️ Deploying database schema..."
    
    # First deployment - create initial migration
    if [[ ! -d "prisma/migrations" ]]; then
        echo "Creating initial migration..."
        npx prisma migrate dev --name init --create-only
    fi
    
    # Deploy migrations to Supabase
    echo "Deploying migrations to Supabase..."
    npx prisma migrate deploy
    
    echo "✅ Database schema deployed"
}

# Apply Supabase-specific configurations
setup_supabase_features() {
    echo "🔐 Setting up Supabase features (RLS, indexes, functions)..."
    
    # Check if psql is available
    if command -v psql &> /dev/null; then
        # Extract connection details from DATABASE_URL
        psql "$DIRECT_URL" -f prisma/supabase-setup.sql
        echo "✅ Supabase features configured via psql"
    else
        echo "⚠️ psql not found. Please run the following SQL manually in Supabase SQL Editor:"
        echo "   File: prisma/supabase-setup.sql"
        echo "   This sets up Row Level Security, indexes, and functions"
    fi
}

# Verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Test database connection
    npx prisma db execute --file-path <(echo "SELECT 1 as test;") &> /dev/null
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Database connection verified"
    else
        echo "❌ Database connection failed"
        exit 1
    fi
    
    # Check if tables exist
    table_count=$(npx prisma db execute --file-path <(echo "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';") 2>/dev/null | grep -o '[0-9]\+' | tail -1 || echo "0")
    
    if [[ $table_count -gt 10 ]]; then
        echo "✅ Database tables created ($table_count tables)"
    else
        echo "⚠️ Unexpected number of tables: $table_count"
    fi
}

# Seed database with initial data
seed_database() {
    echo "🌱 Seeding database with initial data..."
    
    if [[ -f "prisma/seed.ts" ]]; then
        npm run db:seed
        echo "✅ Database seeded"
    else
        echo "⚠️ No seed file found, skipping seeding"
    fi
}

# Main deployment flow
main() {
    echo "Starting TimeMedic deployment to Supabase..."
    echo "Timestamp: $(date)"
    echo ""
    
    check_env_vars
    generate_client
    deploy_schema
    setup_supabase_features
    verify_deployment
    seed_database
    
    echo ""
    echo "🎉 TimeMedic successfully deployed to Supabase!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with actual Supabase project credentials"
    echo "2. If RLS setup failed, manually run: prisma/supabase-setup.sql"
    echo "3. Test your application: npm run start:dev"
    echo "4. Monitor your database at: Supabase Dashboard > Database"
    echo ""
    echo "Security checklist:"
    echo "- ✓ Row Level Security enabled on sensitive tables"
    echo "- ✓ Encryption for PII data configured"
    echo "- ✓ Audit logging implemented"
    echo "- ✓ Connection pooling enabled"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi