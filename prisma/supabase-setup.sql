-- Supabase-specific setup for TimeMedic
-- Run these commands in Supabase SQL Editor after initial migration

-- Enable Row Level Security on sensitive tables
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dosage_takings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "allergies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "adverse_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient data access
-- Only allow patients to access their own data
CREATE POLICY "Patients can view own data" ON "patients" 
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Patients can update own data" ON "patients" 
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Prescriptions access: patients can view their own, doctors can view/modify their prescriptions
CREATE POLICY "Patients can view own prescriptions" ON "prescriptions" 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "patients" p 
      WHERE p.id = "prescriptions"."patientId" 
      AND p."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Prescribers can manage their prescriptions" ON "prescriptions" 
  FOR ALL USING (auth.uid()::text = "userId");

-- Dosage takings: only patient can access their own records
CREATE POLICY "Patients can manage own dosage takings" ON "dosage_takings" 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "patients" p 
      WHERE p.id = "dosage_takings"."patientId" 
      AND p."userId" = auth.uid()::text
    )
  );

-- Allergies: patients can view/manage their own, doctors can view
CREATE POLICY "Patients can manage own allergies" ON "allergies" 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "patients" p 
      WHERE p.id = "allergies"."patientId" 
      AND p."userId" = auth.uid()::text
    )
  );

-- Adverse events: patients can report, healthcare providers can view
CREATE POLICY "Patients can manage own adverse events" ON "adverse_events" 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "patients" p 
      WHERE p.id = "adverse_events"."patientId" 
      AND p."userId" = auth.uid()::text
    )
  );

-- Audit logs: system only, no user access
CREATE POLICY "System only audit access" ON "audit_logs" 
  FOR ALL USING (false);

-- Create indexes for better performance on Supabase
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_user_id ON "patients"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_patient_id ON "prescriptions"("patientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_user_id ON "prescriptions"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dosage_takings_patient_id ON "dosage_takings"("patientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dosage_takings_scheduled_time ON "dosage_takings"("scheduledTime");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergies_patient_id ON "allergies"("patientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adverse_events_patient_id ON "adverse_events"("patientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor_id ON "audit_logs"("actorId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON "audit_logs"("createdAt");

-- Create function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables with updatedAt column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON "patients" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON "medications" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON "prescriptions" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dosage_schedules_updated_at BEFORE UPDATE ON "dosage_schedules" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dosage_takings_updated_at BEFORE UPDATE ON "dosage_takings" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON "allergies" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_interactions_updated_at BEFORE UPDATE ON "drug_interactions" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adverse_events_updated_at BEFORE UPDATE ON "adverse_events" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON "system_config" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for LGPD compliance - data anonymization
CREATE OR REPLACE FUNCTION anonymize_patient_data(patient_id_param text)
RETURNS void AS $$
BEGIN
    -- Anonymize PII data
    UPDATE "patients" 
    SET 
        "encryptedPii" = NULL,
        "emergencyContact" = NULL,
        "dateOfBirth" = NULL
    WHERE id = patient_id_param;
    
    -- Anonymize audit logs
    UPDATE "audit_logs" 
    SET 
        "ipAddress" = '0.0.0.0',
        "userAgent" = 'anonymized'
    WHERE "actorId" IN (
        SELECT "userId" FROM "patients" WHERE id = patient_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for health check
CREATE OR REPLACE FUNCTION health_check()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', CURRENT_TIMESTAMP,
        'database', 'postgresql',
        'tables_count', (
            SELECT count(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ),
        'total_users', (SELECT count(*) FROM "users"),
        'total_patients', (SELECT count(*) FROM "patients"),
        'active_prescriptions', (
            SELECT count(*) 
            FROM "prescriptions" 
            WHERE "isActive" = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anon to read public medication data
GRANT SELECT ON "medications" TO anon;
GRANT SELECT ON "drug_interactions" TO anon;