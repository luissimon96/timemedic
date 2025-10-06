-- Create TimeMedic database schema
-- Generated from Prisma schema for direct SQL execution

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'PHYSICIAN', 'PHARMACIST', 'ADMIN');
CREATE TYPE "InteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED');
CREATE TYPE "AdverseEventSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING');
CREATE TYPE "EventType" AS ENUM ('SIDE_EFFECT', 'ADVERSE_REACTION', 'ADVERSE_EVENT');
CREATE TYPE "AllergyType" AS ENUM ('DRUG', 'FOOD', 'ENVIRONMENTAL');
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC');
CREATE TYPE "DosageStatus" AS ENUM ('SCHEDULED', 'TAKEN', 'MISSED', 'DELAYED', 'SKIPPED');
CREATE TYPE "EvidenceLevel" AS ENUM ('A', 'B', 'C', 'D');

-- Users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataRetentionUntil" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Patients table
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "encryptedPii" BYTEA,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "chronicConditions" JSONB,
    "renalFunction" TEXT,
    "hepaticFunction" TEXT,
    "emergencyContact" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- Medications table
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "anvisaCode" TEXT NOT NULL,
    "commercialName" TEXT NOT NULL,
    "activeSubstance" JSONB NOT NULL,
    "pharmaceuticalForm" TEXT NOT NULL,
    "therapeuticClass" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "packageInfo" JSONB,
    "contraindications" JSONB,
    "sideEffects" JSONB,
    "dosageGuidelines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- Prescriptions table
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "instructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "indication" TEXT,
    "prescribedBy" TEXT,
    "prescriptionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- Dosage schedules table
CREATE TABLE "dosage_schedules" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "dosage" TEXT NOT NULL,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosage_schedules_pkey" PRIMARY KEY ("id")
);

-- Dosage takings table
CREATE TABLE "dosage_takings" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "status" "DosageStatus" NOT NULL,
    "notes" TEXT,
    "delayReason" TEXT,
    "symptoms" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosage_takings_pkey" PRIMARY KEY ("id")
);

-- Allergies table
CREATE TABLE "allergies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationId" TEXT,
    "allergen" TEXT NOT NULL,
    "allergyType" "AllergyType" NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "reaction" TEXT,
    "onsetDate" TIMESTAMP(3),
    "clinicalEvidence" TEXT,
    "laboratoryTests" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- Drug interactions table
CREATE TABLE "drug_interactions" (
    "id" TEXT NOT NULL,
    "medicationAId" TEXT NOT NULL,
    "medicationBId" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "mechanism" TEXT NOT NULL,
    "clinicalEffect" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "evidenceLevel" "EvidenceLevel" NOT NULL,
    "references" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- Adverse events table
CREATE TABLE "adverse_events" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationId" TEXT,
    "eventType" "EventType" NOT NULL,
    "severity" "AdverseEventSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "onsetDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "outcome" TEXT,
    "reporterType" TEXT,
    "vigimedReported" BOOLEAN NOT NULL DEFAULT false,
    "vigimedCaseId" TEXT,
    "vigimedReportedAt" TIMESTAMP(3),
    "concomitantMeds" JSONB,
    "medicalHistory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adverse_events_pkey" PRIMARY KEY ("id")
);

-- Audit logs table
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- System config table
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- Notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");
CREATE UNIQUE INDEX "patients_externalId_key" ON "patients"("externalId");
CREATE UNIQUE INDEX "medications_anvisaCode_key" ON "medications"("anvisaCode");
CREATE UNIQUE INDEX "drug_interactions_medicationAId_medicationBId_key" ON "drug_interactions"("medicationAId", "medicationBId");
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- Add Foreign Key Constraints
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dosage_schedules" ADD CONSTRAINT "dosage_schedules_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dosage_takings" ADD CONSTRAINT "dosage_takings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dosage_takings" ADD CONSTRAINT "dosage_takings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "dosage_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_medicationAId_fkey" FOREIGN KEY ("medicationAId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_medicationBId_fkey" FOREIGN KEY ("medicationBId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "adverse_events" ADD CONSTRAINT "adverse_events_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "adverse_events" ADD CONSTRAINT "adverse_events_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;