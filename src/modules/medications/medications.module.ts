import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { AnvisaService } from './services/anvisa.service';
import { MedicationValidationService } from './services/medication-validation.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
  ],
  controllers: [MedicationsController],
  providers: [
    MedicationsService,
    AnvisaService,
    MedicationValidationService,
  ],
  exports: [
    MedicationsService,
    AnvisaService,
    MedicationValidationService,
  ],
})
export class MedicationsModule {}