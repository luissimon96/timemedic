import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { DrugInteractionAnalysisService } from './services/drug-interaction-analysis.service';
import { InteractionValidationService } from './services/interaction-validation.service';
import { ElderlyInteractionService } from './services/elderly-interaction.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule,
  ],
  controllers: [InteractionsController],
  providers: [
    InteractionsService,
    DrugInteractionAnalysisService,
    InteractionValidationService,
    ElderlyInteractionService,
  ],
  exports: [
    InteractionsService,
    DrugInteractionAnalysisService,
    InteractionValidationService,
    ElderlyInteractionService,
  ],
})
export class InteractionsModule {}