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
}