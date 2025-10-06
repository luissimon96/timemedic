# TimeMedic + Supabase Integration Guide

## Overview

This guide walks you through integrating TimeMedic with Supabase, ensuring LGPD compliance, data security, and optimal performance for healthcare data management.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier available)
- Git for version control

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `timemedic-production` (or `timemedic-dev` for development)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `South America (São Paulo)` for Brazil)
5. Click "Create new project"
6. Wait 2-3 minutes for initialization

### 2. Configure Environment Variables

1. In Supabase Dashboard → Settings → Database, copy your connection strings:
   - **URI** (for DATABASE_URL - pooler connection)
   - **Direct connection** (for DIRECT_URL)

2. Update your `.env` file:

```env
# Replace with your actual Supabase credentials
DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project-ref:your-password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase Project Details (from Settings → API)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Generate secure keys for production
JWT_SECRET="your-super-secure-jwt-secret-min-256-bits"
ENCRYPTION_KEY="your-256-bit-encryption-key-for-pii-data"
ENCRYPTION_IV="your-128-bit-initialization-vector"
```

### 3. Deploy Database Schema

Run the automated deployment script:

```bash
# Windows
npm run supabase:deploy

# Or manually:
npx prisma generate
npx prisma migrate deploy
```

### 4. Configure Supabase Security Features

1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `prisma/supabase-setup.sql`
3. This enables:
   - Row Level Security (RLS) policies
   - Database indexes for performance
   - Healthcare-specific functions
   - LGPD compliance features

### 5. Test the Integration

```bash
npm run supabase:test
```

This comprehensive test suite verifies:
- ✅ Database connectivity
- ✅ Schema integrity
- ✅ Security policies
- ✅ Performance indexes
- ✅ CRUD operations
- ✅ Encryption setup

## 🔐 Security Features

### Row Level Security (RLS)

All sensitive tables have RLS enabled:
- **Patients**: Users can only access their own data
- **Prescriptions**: Patients see their own, doctors see their prescriptions
- **Medical Records**: Strict access control based on user roles
- **Audit Logs**: System-only access

### Data Encryption

- **PII Data**: Patient names, CPF, contact info encrypted at application level
- **Database**: TLS encryption in transit
- **Passwords**: bcrypt hashing with salt

### LGPD Compliance

- **Data Retention**: Configurable retention periods
- **Right to Erasure**: `anonymize_patient_data()` function
- **Audit Trail**: Complete audit logging for all data access
- **Data Minimization**: Only collect necessary healthcare data

## 🏥 Healthcare-Specific Features

### ANVISA Integration Ready

- Medication catalog with ANVISA codes
- Drug interaction checking
- Adverse event reporting (VigiMed compatible)

### Brazilian Regulatory Compliance

- Timezone: America/Sao_Paulo
- Locale: pt-BR
- ANVISA and VigiMed API integration points

### Patient Safety Features

- Drug allergy checking
- Medication interaction analysis
- Dosage scheduling with safety checks
- Emergency contact encryption

## 📊 Performance Optimizations

### Connection Pooling

- **Transaction Pooler**: For application connections (configured)
- **Session Pooler**: For long-running connections (available)
- **Connection Limits**: Optimized for Supabase (20 connections)

### Database Indexes

Automatically created indexes for:
- Patient lookups by user ID
- Prescription queries by patient/doctor
- Dosage schedule time-based queries
- Audit log chronological access

### Caching Strategy

- **Redis**: Session caching and rate limiting
- **Prisma**: Query result caching
- **Application**: Response caching for public data

## 🔧 Maintenance

### Regular Tasks

1. **Database Backups**: Automatic via Supabase (Point-in-time recovery)
2. **Audit Log Rotation**: Set up automatic cleanup (7 years retention)
3. **Performance Monitoring**: Use Supabase metrics dashboard
4. **Security Updates**: Regular dependency updates

### Monitoring

Monitor these key metrics:
- Database connection pool usage
- Query performance (Supabase dashboard)
- Error rates in application logs
- RLS policy effectiveness

## 🚨 Troubleshooting

### Common Issues

**Connection Timeout**
```bash
# Check if DATABASE_URL is correct
npm run db:test
```

**Migration Failures**
```bash
# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate deploy
```

**RLS Policy Issues**
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Performance Issues**
```bash
# Run performance analysis
npm run supabase:test
```

### Support Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Prisma Supabase Guide**: [prisma.io/docs/orm/overview/databases/supabase](https://www.prisma.io/docs/orm/overview/databases/supabase)
- **TimeMedic Issues**: Check GitHub issues for common problems

## 📈 Scaling Considerations

### Database Scaling

- **Read Replicas**: Available on Supabase Pro+ plans
- **Connection Pooling**: Already configured for high concurrency
- **Query Optimization**: Indexes created for common access patterns

### Application Scaling

- **Horizontal Scaling**: Stateless NestJS design
- **Load Balancing**: Ready for multiple instances
- **Cache Optimization**: Redis configured for session management

## 🎯 Next Steps

After successful setup:

1. **Test Core Functionality**: Run full test suite
2. **Configure Monitoring**: Set up alerts in Supabase
3. **Setup CI/CD**: Automate deployments with GitHub Actions
4. **Performance Testing**: Load test with realistic healthcare data
5. **Security Audit**: Review RLS policies and access patterns

---

## 📋 Deployment Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies applied
- [ ] Security features enabled
- [ ] Test suite passing
- [ ] Monitoring configured
- [ ] Backup strategy confirmed
- [ ] LGPD compliance verified
- [ ] Performance optimized

**🎉 Congratulations! TimeMedic is now integrated with Supabase and ready for secure healthcare data management.**