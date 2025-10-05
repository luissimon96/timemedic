import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { AllergiesModule } from '../allergies/allergies.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DosagesController } from './dosages.controller';
import { DosagesService } from './dosages.service';
import { SchedulingService } from './scheduling.service';
import { AdherenceService } from './adherence.service';
import { ReminderService } from './reminder.service';
import { DosageValidationService } from './services/dosage-validation.service';
import { ConflictDetectionService } from './services/conflict-detection.service';
import { SafetyCheckService } from './services/safety-check.service';
import { TimezoneService } from './services/timezone.service';
import { PatternAnalysisService } from './services/pattern-analysis.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
    AllergiesModule,
    InteractionsModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'dosage-reminders',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'adherence-analysis',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [DosagesController],
  providers: [
    DosagesService,
    SchedulingService,
    AdherenceService,
    ReminderService,
    DosageValidationService,
    ConflictDetectionService,
    SafetyCheckService,
    TimezoneService,
    PatternAnalysisService,
  ],
  exports: [
    DosagesService,
    SchedulingService,
    AdherenceService,
    ReminderService,
    DosageValidationService,
    ConflictDetectionService,
    SafetyCheckService,
  ],
})
export class DosagesModule {}