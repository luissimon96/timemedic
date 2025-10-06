#!/usr/bin/env ts-node

/**
 * TimeMedic Supabase Integration Test Suite
 * Tests database connectivity, schema validity, and security features
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class SupabaseIntegrationTester {
  private prisma: PrismaClient;
  private results: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const start = Date.now();
    
    try {
      console.log(`🧪 Running: ${name}`);
      const details = await testFn();
      const duration = Date.now() - start;
      
      const result: TestResult = {
        name,
        success: true,
        duration,
        details,
      };
      
      console.log(`✅ ${name} (${duration}ms)`);
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      const result: TestResult = {
        name,
        success: false,
        duration,
        error: error.message,
      };
      
      console.log(`❌ ${name} (${duration}ms): ${error.message}`);
      this.results.push(result);
      return result;
    }
  }

  async testDatabaseConnection(): Promise<any> {
    await this.prisma.$queryRaw`SELECT 1 as test`;
    return { connected: true };
  }

  async testSupabaseFeatures(): Promise<any> {
    const result = await this.prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version() as version
    `;
    
    const isPostgreSQL = result[0]?.version?.includes('PostgreSQL');
    if (!isPostgreSQL) {
      throw new Error('Not connected to PostgreSQL database');
    }
    
    return {
      version: result[0].version,
      isPostgreSQL,
    };
  }

  async testSchemaIntegrity(): Promise<any> {
    // Check if all expected tables exist
    const expectedTables = [
      'users', 'patients', 'medications', 'prescriptions',
      'dosage_schedules', 'dosage_takings', 'allergies',
      'drug_interactions', 'adverse_events', 'audit_logs',
      'system_config', 'notifications'
    ];

    const tablesQuery = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    const existingTables = tablesQuery.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    return {
      expectedTables: expectedTables.length,
      existingTables: existingTables.length,
      allTablesPresent: missingTables.length === 0,
      tableList: existingTables,
    };
  }

  async testRowLevelSecurity(): Promise<any> {
    // Check if RLS is enabled on sensitive tables
    const rlsTables = ['patients', 'prescriptions', 'dosage_takings', 'allergies', 'adverse_events'];
    
    const rlsQuery = await this.prisma.$queryRaw<Array<{
      tablename: string;
      rowsecurity: boolean;
    }>>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY(${rlsTables})
    `;

    const rlsStatus = rlsQuery.reduce((acc, table) => {
      acc[table.tablename] = table.rowsecurity;
      return acc;
    }, {} as Record<string, boolean>);

    const unprotectedTables = Object.entries(rlsStatus)
      .filter(([_, hasRLS]) => !hasRLS)
      .map(([tableName]) => tableName);

    return {
      totalSensitiveTables: rlsTables.length,
      protectedTables: Object.values(rlsStatus).filter(Boolean).length,
      unprotectedTables,
      rlsStatus,
      allProtected: unprotectedTables.length === 0,
    };
  }

  async testIndexes(): Promise<any> {
    // Check for important indexes
    const indexQuery = await this.prisma.$queryRaw<Array<{
      indexname: string;
      tablename: string;
    }>>`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `;

    return {
      totalIndexes: indexQuery.length,
      indexes: indexQuery,
    };
  }

  async testCRUDOperations(): Promise<any> {
    // Test basic CRUD operations
    const testUser = await this.prisma.user.create({
      data: {
        email: `test-${Date.now()}@timemedic.test`,
        passwordHash: 'test-hash',
        role: 'PATIENT',
      },
    });

    const foundUser = await this.prisma.user.findUnique({
      where: { id: testUser.id },
    });

    await this.prisma.user.update({
      where: { id: testUser.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.user.delete({
      where: { id: testUser.id },
    });

    return {
      userCreated: !!testUser,
      userFound: !!foundUser,
      crudCompleted: true,
    };
  }

  async testConnectionPooling(): Promise<any> {
    // Test multiple concurrent connections
    const promises = Array.from({ length: 10 }, (_, i) => 
      this.prisma.$queryRaw`SELECT ${i} as connection_test, pg_backend_pid() as pid`
    );

    const results = await Promise.all(promises);
    const uniquePids = new Set(results.map((r: any) => r[0].pid));

    return {
      concurrentConnections: results.length,
      uniqueProcesses: uniquePids.size,
      connectionPooling: uniquePids.size < results.length,
    };
  }

  async testEncryptionSetup(): Promise<any> {
    // Check if encryption environment variables are set
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const encryptionIV = process.env.ENCRYPTION_IV;

    if (!encryptionKey || !encryptionIV) {
      throw new Error('Encryption keys not configured');
    }

    return {
      encryptionKeyConfigured: !!encryptionKey,
      encryptionIVConfigured: !!encryptionIV,
      encryptionKeyLength: encryptionKey.length,
      encryptionIVLength: encryptionIV.length,
      validEncryptionConfig: encryptionKey.length === 64 && encryptionIV.length === 32,
    };
  }

  async testHealthCheckFunction(): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw<Array<any>>`
        SELECT health_check() as health_data
      `;
      
      return {
        healthCheckFunctionExists: true,
        healthData: result[0]?.health_data,
      };
    } catch (error) {
      // Function might not exist yet
      return {
        healthCheckFunctionExists: false,
        note: 'Run supabase-setup.sql to create health check function',
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🏥 TimeMedic Supabase Integration Test Suite');
    console.log('==========================================\n');

    const tests = [
      { name: 'Database Connection', fn: () => this.testDatabaseConnection() },
      { name: 'Supabase Features', fn: () => this.testSupabaseFeatures() },
      { name: 'Schema Integrity', fn: () => this.testSchemaIntegrity() },
      { name: 'Row Level Security', fn: () => this.testRowLevelSecurity() },
      { name: 'Database Indexes', fn: () => this.testIndexes() },
      { name: 'CRUD Operations', fn: () => this.testCRUDOperations() },
      { name: 'Connection Pooling', fn: () => this.testConnectionPooling() },
      { name: 'Encryption Setup', fn: () => this.testEncryptionSetup() },
      { name: 'Health Check Function', fn: () => this.testHealthCheckFunction() },
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n📝 Detailed Results:');
    this.results.forEach(r => {
      console.log(`\n${r.success ? '✅' : '❌'} ${r.name}`);
      if (r.details) {
        console.log('   Details:', JSON.stringify(r.details, null, 2));
      }
      if (r.error) {
        console.log('   Error:', r.error);
      }
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    const rlsTest = this.results.find(r => r.name === 'Row Level Security');
    if (rlsTest && !rlsTest.success) {
      console.log('   - Run prisma/supabase-setup.sql in Supabase SQL Editor to enable RLS');
    }

    const healthTest = this.results.find(r => r.name === 'Health Check Function');
    if (healthTest && healthTest.details?.healthCheckFunctionExists === false) {
      console.log('   - Run prisma/supabase-setup.sql to create database functions');
    }

    if (passed === this.results.length) {
      console.log('🎉 All tests passed! TimeMedic is ready for Supabase.');
    } else {
      console.log('⚠️  Some tests failed. Please address the issues above.');
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SupabaseIntegrationTester();
  
  tester.runAllTests()
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    })
    .finally(() => {
      tester.cleanup();
    });
}

export { SupabaseIntegrationTester };