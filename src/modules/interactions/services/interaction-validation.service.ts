import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { InteractionSeverity, EvidenceLevel } from '@prisma/client';

export interface InteractionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class InteractionValidationService {
  private readonly logger = new Logger(InteractionValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida dados de interação antes da criação/atualização
   */
  async validateInteractionData(interactionData: any): Promise<InteractionValidationResult> {
    const result: InteractionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validação básica de dados obrigatórios
    this.validateBasicData(interactionData, result);

    // Validação de duplicação
    if (interactionData.medicationAId && interactionData.medicationBId) {
      await this.validateDuplication(interactionData, result);
    }

    // Validação de consistência clínica
    this.validateClinicalConsistency(interactionData, result);

    // Validação de evidências
    this.validateEvidence(interactionData, result);

    return result;
  }

  private validateBasicData(interactionData: any, result: InteractionValidationResult): void {
    if (!interactionData.medicationAId || !interactionData.medicationBId) {
      result.isValid = false;
      result.errors.push('IDs dos medicamentos são obrigatórios');
    }

    if (interactionData.medicationAId === interactionData.medicationBId) {
      result.isValid = false;
      result.errors.push('Não é possível criar interação de um medicamento consigo mesmo');
    }

    if (!interactionData.mechanism || interactionData.mechanism.trim().length < 10) {
      result.isValid = false;
      result.errors.push('Mecanismo deve ter pelo menos 10 caracteres');
    }

    if (!interactionData.clinicalEffect || interactionData.clinicalEffect.trim().length < 10) {
      result.isValid = false;
      result.errors.push('Efeito clínico deve ter pelo menos 10 caracteres');
    }

    if (!Object.values(InteractionSeverity).includes(interactionData.severity)) {
      result.isValid = false;
      result.errors.push('Severidade inválida');
    }

    if (!Object.values(EvidenceLevel).includes(interactionData.evidenceLevel)) {
      result.isValid = false;
      result.errors.push('Nível de evidência inválido');
    }
  }

  private async validateDuplication(
    interactionData: any,
    result: InteractionValidationResult,
  ): Promise<void> {
    try {
      const existingInteraction = await this.prisma.drugInteraction.findFirst({
        where: {
          OR: [
            {
              medicationAId: interactionData.medicationAId,
              medicationBId: interactionData.medicationBId,
            },
            {
              medicationAId: interactionData.medicationBId,
              medicationBId: interactionData.medicationAId,
            },
          ],
        },
      });

      if (existingInteraction) {
        result.isValid = false;
        result.errors.push('Interação já existe entre estes medicamentos');
      }
    } catch (error) {
      this.logger.error('Erro ao validar duplicação:', error);
      result.warnings.push('Não foi possível verificar duplicação');
    }
  }

  private validateClinicalConsistency(interactionData: any, result: InteractionValidationResult): void {
    const severity = interactionData.severity;
    const mechanism = interactionData.mechanism?.toLowerCase() || '';
    const effect = interactionData.clinicalEffect?.toLowerCase() || '';

    // Validação de consistência entre severidade e efeito
    if (severity === InteractionSeverity.CONTRAINDICATED) {
      const contraTerms = ['morte', 'fatal', 'letal', 'grave', 'severo'];
      const hasContraTerms = contraTerms.some(term => effect.includes(term));
      
      if (!hasContraTerms) {
        result.warnings.push(
          'Interação contraindicada deveria ter efeito clínico mais severo'
        );
      }
    }

    if (severity === InteractionSeverity.MINOR) {
      const severeTerms = ['morte', 'fatal', 'grave', 'hospitalização'];
      const hasSevereTerms = severeTerms.some(term => effect.includes(term));
      
      if (hasSevereTerms) {
        result.warnings.push(
          'Efeito parece mais severo que a classificação de interação menor'
        );
      }
    }

    // Validação de mecanismo
    if (mechanism.includes('inibição') && !mechanism.includes('enzima') && !mechanism.includes('receptor')) {
      result.warnings.push('Mecanismo de inibição deveria especificar enzima ou receptor');
    }
  }

  private validateEvidence(interactionData: any, result: InteractionValidationResult): void {
    const evidenceLevel = interactionData.evidenceLevel;
    const references = interactionData.references;
    const confidenceLevel = interactionData.confidenceLevel;

    // Validação de consistência entre evidência e referências
    if (evidenceLevel === EvidenceLevel.A && (!references || references.length === 0)) {
      result.warnings.push(
        'Evidência nível A deveria ter referências bibliográficas'
      );
    }

    if (evidenceLevel === EvidenceLevel.D && references && references.length > 0) {
      result.warnings.push(
        'Evidência nível D com muitas referências - verificar classificação'
      );
    }

    // Validação de confiança
    if (confidenceLevel !== undefined) {
      if (confidenceLevel < 1 || confidenceLevel > 5) {
        result.errors.push('Nível de confiança deve estar entre 1 e 5');
      }

      if (evidenceLevel === EvidenceLevel.A && confidenceLevel < 4) {
        result.warnings.push('Evidência A deveria ter alta confiança (4-5)');
      }

      if (evidenceLevel === EvidenceLevel.D && confidenceLevel > 2) {
        result.warnings.push('Evidência D deveria ter baixa confiança (1-2)');
      }
    }

    // Validação de referências
    if (references && Array.isArray(references)) {
      for (const ref of references) {
        if (!ref.title || !ref.authors || !ref.source) {
          result.errors.push('Referências devem ter título, autores e fonte');
        }
      }
    }
  }
}