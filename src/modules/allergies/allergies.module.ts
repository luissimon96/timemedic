import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { AllergiesController } from './allergies.controller';
import { AllergiesService } from './allergies.service';
import { AllergyValidationService } from './services/allergy-validation.service';
import { AllergyCheckingService } from './services/allergy-checking.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
  ],
  controllers: [AllergiesController],
  providers: [
    AllergiesService,
    AllergyValidationService,
    AllergyCheckingService,
  ],
  exports: [
    AllergiesService,
    AllergyValidationService,
    AllergyCheckingService,
  ],
})
export class AllergiesModule {}