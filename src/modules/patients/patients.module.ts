import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { CryptoModule } from '../../infrastructure/crypto/crypto.module';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientEncryptionService } from './services/patient-encryption.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
    CryptoModule,
  ],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    PatientEncryptionService,
  ],
  exports: [
    PatientsService,
    PatientEncryptionService,
  ],
})
export class PatientsModule {}
