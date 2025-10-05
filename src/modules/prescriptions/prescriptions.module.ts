import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { AllergiesModule } from '../allergies/allergies.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionValidationService } from './services/prescription-validation.service';
import { PrescriptionConflictService } from './services/prescription-conflict.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
    AllergiesModule,
    InteractionsModule,
  ],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    PrescriptionValidationService,
    PrescriptionConflictService,
  ],
  exports: [
    PrescriptionsService,
    PrescriptionValidationService,
    PrescriptionConflictService,
  ],
})
export class PrescriptionsModule {}