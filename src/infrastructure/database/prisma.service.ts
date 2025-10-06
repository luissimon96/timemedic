import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      // Supabase-optimized configuration
      engine: {
        // Connection pooling configuration
        connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 20),
        poolTimeout: configService.get<number>('DB_POOL_TIMEOUT', 10000),
        statementTimeout: configService.get<number>('DB_STATEMENT_TIMEOUT', 30000),
        // Retry configuration for Supabase connection pooling
        connectTimeout: 10000,
        acquireTimeout: 10000,
        idleTimeout: 60000,
        maxLifetime: 300000,
      },
    });

    // Log de queries em desenvolvimento
    if (configService.get<string>('NODE_ENV') === 'development') {
      this.$on('query', (e) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log de erros em todos os ambientes
    this.$on('error', (e) => {
      this.logger.error(`Database error: ${e.message}`);
    });

    this.$on('info', (e) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Teste de conectividade
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database health check passed');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database connection closed');
  }

  /**
   * Executa uma transação com retry automático
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Transaction attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );

        if (attempt === maxRetries) {
          this.logger.error('Transaction failed after all retries', error);
          throw lastError;
        }

        // Aguarda antes de tentar novamente (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw lastError;
  }

  /**
   * Verifica a saúde da conexão com o banco
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    
    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Obtém estatísticas de conexão
   */
  async getConnectionStats() {
    try {
      const result = await this.$queryRaw<Array<{
        state: string;
        count: number;
      }>>`
        SELECT state, count(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      return result;
    } catch (error) {
      this.logger.error('Failed to get connection stats', error);
      return [];
    }
  }

  /**
   * Verifica se está conectado ao Supabase
   */
  async isSupabaseConnection(): Promise<boolean> {
    try {
      const result = await this.$queryRaw<Array<{ version: string }>>`
        SELECT version() as version
      `;
      
      return result[0]?.version?.includes('PostgreSQL') || false;
    } catch (error) {
      this.logger.error('Failed to check Supabase connection', error);
      return false;
    }
  }

  /**
   * Obtém informações detalhadas do Supabase
   */
  async getSupabaseInfo() {
    try {
      const [
        version,
        connectionCount,
        databaseSize,
        tableCount
      ] = await Promise.all([
        this.$queryRaw<Array<{ version: string }>>`SELECT version() as version`,
        this.$queryRaw<Array<{ count: number }>>`
          SELECT count(*) as count FROM pg_stat_activity 
          WHERE datname = current_database()
        `,
        this.$queryRaw<Array<{ size: string }>>`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `,
        this.$queryRaw<Array<{ count: number }>>`
          SELECT count(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `
      ]);

      return {
        version: version[0]?.version || 'Unknown',
        activeConnections: connectionCount[0]?.count || 0,
        databaseSize: databaseSize[0]?.size || 'Unknown',
        tableCount: tableCount[0]?.count || 0,
        isSupabase: await this.isSupabaseConnection(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get Supabase info', error);
      return {
        version: 'Error',
        activeConnections: 0,
        databaseSize: 'Error',
        tableCount: 0,
        isSupabase: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Executa uma query de health check específica para Supabase
   */
  async supabaseHealthCheck() {
    try {
      const result = await this.$queryRaw<Array<{ 
        status: string; 
        timestamp: Date; 
        database: string;
        tables_count: number;
        total_users: number;
        total_patients: number;
        active_prescriptions: number;
      }>>`
        SELECT 
          'healthy' as status,
          CURRENT_TIMESTAMP as timestamp,
          'postgresql' as database,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count,
          (SELECT count(*) FROM "users") as total_users,
          (SELECT count(*) FROM "patients") as total_patients,
          (SELECT count(*) FROM "prescriptions" WHERE "isActive" = true) as active_prescriptions
      `;

      return result[0] || { status: 'unhealthy' };
    } catch (error) {
      this.logger.error('Supabase health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Testa conectividade específica para Supabase com retry
   */
  async testSupabaseConnectivity(maxRetries = 3): Promise<{
    success: boolean;
    latency: number;
    retries: number;
    error?: string;
  }> {
    let retries = 0;
    
    while (retries < maxRetries) {
      const start = Date.now();
      
      try {
        await this.$queryRaw`SELECT 1 as test, CURRENT_TIMESTAMP as timestamp`;
        const latency = Date.now() - start;
        
        return {
          success: true,
          latency,
          retries,
        };
      } catch (error) {
        retries++;
        this.logger.warn(
          `Supabase connectivity test failed (attempt ${retries}/${maxRetries}): ${error.message}`
        );
        
        if (retries === maxRetries) {
          return {
            success: false,
            latency: Date.now() - start,
            retries,
            error: error.message,
          };
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
      }
    }
  }
}