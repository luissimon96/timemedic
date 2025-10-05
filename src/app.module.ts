import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { AllergiesModule } from './modules/allergies/allergies.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { AdverseEventsModule } from './modules/adverse-events/adverse-events.module';
import { DosagesModule } from './modules/dosages/dosages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { CryptoModule } from './infrastructure/crypto/crypto.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    // Configuração e validação de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Rate limiting para proteção contra ataques
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 segundo
        limit: 10,  // 10 requests por segundo
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hora
        limit: 1000,  // 1000 requests por hora
      },
    ]),

    // Infraestrutura
    PrismaModule,
    CryptoModule,
    LoggerModule,

    // Módulos de domínio
    AuthModule,
    PatientsModule,
    MedicationsModule,
    PrescriptionsModule,
    AllergiesModule,
    InteractionsModule,
    AdverseEventsModule,
    DosagesModule,
    ReportsModule,
    NotificationsModule,

    // Saúde e monitoramento
    HealthModule,
  ],
})
export class AppModule {}