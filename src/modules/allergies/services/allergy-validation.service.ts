import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AllergyType, AllergySeverity } from '@prisma/client';

export interface AllergyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class AllergyValidationService {
  private readonly logger = new Logger(AllergyValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida dados de alergia antes da criação/atualização
   */
  async validateAllergyData(allergyData: any, patientId?: string): Promise<AllergyValidationResult> {
    const result: AllergyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validação básica de dados obrigatórios
    this.validateBasicData(allergyData, result);

    // Validação de duplicação
    if (patientId && allergyData.allergen) {
      await this.validateDuplication(patientId, allergyData.allergen, allergyData.allergyType, result);
    }

    // Validação de medicamento (se aplicável)
    if (allergyData.allergyType === AllergyType.DRUG) {
      await this.validateMedicationAllergy(allergyData, result);
    }

    // Validação de consistência clínica
    this.validateClinicalConsistency(allergyData, result);

    // Validação de testes laboratoriais
    if (allergyData.laboratoryTests) {
      this.validateLaboratoryTests(allergyData.laboratoryTests, result);
    }

    // Validação de confiabilidade
    this.validateReliability(allergyData, result);

    return result;
  }

  /**
   * Validação básica de dados obrigatórios
   */
  private validateBasicData(allergyData: any, result: AllergyValidationResult): void {
    if (!allergyData.patientId) {
      result.isValid = false;
      result.errors.push('ID do paciente é obrigatório');
    }

    if (!allergyData.allergen || allergyData.allergen.trim().length < 2) {
      result.isValid = false;
      result.errors.push('Nome do alérgeno deve ter pelo menos 2 caracteres');
    }

    if (!Object.values(AllergyType).includes(allergyData.allergyType)) {
      result.isValid = false;
      result.errors.push('Tipo de alergia inválido');
    }

    if (!Object.values(AllergySeverity).includes(allergyData.severity)) {
      result.isValid = false;
      result.errors.push('Severidade de alergia inválida');
    }

    // Validação de data de início
    if (allergyData.onsetDate) {
      const onsetDate = new Date(allergyData.onsetDate);
      const now = new Date();
      
      if (onsetDate > now) {
        result.isValid = false;
        result.errors.push('Data de início não pode ser no futuro');
      }

      // Verifica se não é muito antiga (mais de 120 anos)
      const maxAge = new Date();
      maxAge.setFullYear(maxAge.getFullYear() - 120);
      
      if (onsetDate < maxAge) {
        result.warnings.push('Data de início muito antiga - verificar se está correta');
      }
    }
  }

  /**
   * Validação de duplicação de alergias
   */
  private async validateDuplication(
    patientId: string,
    allergen: string,
    allergyType: AllergyType,
    result: AllergyValidationResult,
  ): Promise<void> {
    try {
      const existingAllergy = await this.prisma.allergy.findFirst({
        where: {
          patientId,
          allergen: {
            equals: allergen,
            mode: 'insensitive',
          },
          allergyType,
          isActive: true,
        },
      });

      if (existingAllergy) {
        result.warnings.push(`Paciente já possui alergia registrada para: ${allergen}`);
      }

      // Verifica alergias similares (variações do nome)
      const similarAllergies = await this.prisma.allergy.findMany({
        where: {
          patientId,
          allergen: {
            contains: allergen.substring(0, Math.min(allergen.length, 5)),
            mode: 'insensitive',
          },
          allergyType,
          isActive: true,
        },
        select: {
          allergen: true,
          severity: true,
        },
      });

      if (similarAllergies.length > 0) {
        const similarNames = similarAllergies.map(a => a.allergen).join(', ');
        result.warnings.push(`Alergias similares encontradas: ${similarNames}`);
      }
    } catch (error) {
      this.logger.error('Erro ao validar duplicação de alergia:', error);
      result.warnings.push('Não foi possível verificar duplicação de alergias');
    }
  }

  /**
   * Validação específica para alergias medicamentosas
   */
  private async validateMedicationAllergy(allergyData: any, result: AllergyValidationResult): Promise<void> {
    // Se é alergia medicamentosa, deve ter medicationId ou alérgeno relacionado a medicamento
    if (allergyData.allergyType === AllergyType.DRUG) {
      if (!allergyData.medicationId && !allergyData.allergen) {
        result.isValid = false;
        result.errors.push('Alergia medicamentosa deve especificar medicamento ou alérgeno');
        return;
      }

      // Se medicationId foi fornecido, verifica se existe
      if (allergyData.medicationId) {
        try {
          const medication = await this.prisma.medication.findUnique({
            where: { id: allergyData.medicationId },
            select: {
              commercialName: true,
              activeSubstance: true,
            },
          });

          if (!medication) {
            result.isValid = false;
            result.errors.push('Medicamento especificado não encontrado');
          } else {
            // Verifica consistência entre alérgeno e medicamento
            const allergenLower = allergyData.allergen.toLowerCase();
            const commercialNameLower = medication.commercialName.toLowerCase();
            
            if (!allergenLower.includes(commercialNameLower) && !commercialNameLower.includes(allergenLower)) {
              // Verifica princípios ativos
              const activeSubstances = medication.activeSubstance as any[];
              const hasMatchingSubstance = activeSubstances?.some(
                (substance: any) => 
                  allergenLower.includes(substance.name.toLowerCase()) ||
                  substance.name.toLowerCase().includes(allergenLower)
              );

              if (!hasMatchingSubstance) {
                result.warnings.push('Alérgeno pode não corresponder ao medicamento selecionado');
              }
            }
          }
        } catch (error) {
          this.logger.error('Erro ao validar medicamento da alergia:', error);
          result.warnings.push('Não foi possível validar medicamento');
        }
      }

      // Validações específicas para alergias medicamentosas severas
      if (allergyData.severity === AllergySeverity.ANAPHYLACTIC) {
        if (!allergyData.clinicalEvidence && !allergyData.laboratoryTests?.length) {
          result.warnings.push(
            'Alergia anafilática deve ter evidência clínica detalhada ou testes laboratoriais'
          );
        }
      }
    }
  }

  /**
   * Validação de consistência clínica
   */
  private validateClinicalConsistency(allergyData: any, result: AllergyValidationResult): void {
    const severity = allergyData.severity;
    const reaction = allergyData.reaction?.toLowerCase() || '';

    // Validação de consistência entre severidade e reação
    if (severity === AllergySeverity.ANAPHYLACTIC) {
      const anaphylacticTerms = ['anafilaxia', 'choque', 'broncoespasmo', 'angioedema', 'hipotensão'];
      const hasAnaphylacticTerms = anaphylacticTerms.some(term => reaction.includes(term));
      
      if (reaction && !hasAnaphylacticTerms) {
        result.warnings.push(
          'Reação descrita pode não ser consistente com severidade anafilática'
        );
      }
    }

    if (severity === AllergySeverity.MILD) {
      const severeTerms = ['choque', 'anafilaxia', 'broncoespasmo severo', 'edema de glote'];
      const hasSevereTerms = severeTerms.some(term => reaction.includes(term));
      
      if (hasSevereTerms) {
        result.warnings.push(
          'Reação descrita parece mais severa que a classificação indicada'
        );
      }
    }

    // Validação de tempo de início vs. tipo de reação
    if (allergyData.onsetDate && allergyData.reaction) {
      // Esta validação seria mais complexa em um sistema real
      if (reaction.includes('imediata') && severity === AllergySeverity.MILD) {
        result.warnings.push(
          'Reações imediatas geralmente são de severidade moderada ou alta'
        );
      }
    }
  }

  /**
   * Validação de testes laboratoriais
   */
  private validateLaboratoryTests(laboratoryTests: any[], result: AllergyValidationResult): void {
    for (const test of laboratoryTests) {
      if (!test.testName || test.testName.trim().length < 3) {
        result.errors.push('Nome do teste laboratorial deve ter pelo menos 3 caracteres');
      }

      if (!test.result || test.result.trim().length < 2) {
        result.errors.push('Resultado do teste laboratorial é obrigatório');
      }

      if (!test.testDate) {
        result.errors.push('Data do teste laboratorial é obrigatória');
      } else {
        const testDate = new Date(test.testDate);
        const now = new Date();
        
        if (testDate > now) {
          result.errors.push('Data do teste laboratorial não pode ser no futuro');
        }

        // Teste muito antigo (mais de 10 anos)
        const maxAge = new Date();
        maxAge.setFullYear(maxAge.getFullYear() - 10);
        
        if (testDate < maxAge) {
          result.warnings.push('Teste laboratorial muito antigo - considerar repetição');
        }
      }

      // Validação de consistência do resultado
      const resultLower = test.result.toLowerCase();
      if (resultLower.includes('negativo') || resultLower.includes('normal')) {
        result.warnings.push(
          `Teste "${test.testName}" com resultado negativo/normal - verificar relevância para alergia`
        );
      }
    }
  }

  /**
   * Validação de confiabilidade da informação
   */
  private validateReliability(allergyData: any, result: AllergyValidationResult): void {
    const reliability = allergyData.reliability;
    const source = allergyData.informationSource?.toLowerCase() || '';
    const hasEvidence = allergyData.clinicalEvidence || allergyData.laboratoryTests?.length > 0;

    if (reliability !== undefined) {
      if (reliability < 1 || reliability > 5) {
        result.errors.push('Confiabilidade deve estar entre 1 e 5');
      }

      // Validação de consistência entre confiabilidade e evidências
      if (reliability >= 4 && !hasEvidence) {
        result.warnings.push(
          'Alta confiabilidade deveria ser acompanhada de evidência clínica ou laboratorial'
        );
      }

      if (reliability <= 2 && hasEvidence) {
        result.warnings.push(
          'Baixa confiabilidade inconsistente com evidências disponíveis'
        );
      }
    }

    // Validação de fonte de informação
    if (source) {
      if (source.includes('paciente') || source.includes('relato')) {
        if (!allergyData.reliability || allergyData.reliability > 3) {
          result.warnings.push(
            'Relato do paciente deveria ter confiabilidade moderada (2-3)'
          );
        }
      }

      if (source.includes('médico') || source.includes('prontuário')) {
        if (allergyData.reliability && allergyData.reliability < 3) {
          result.warnings.push(
            'Informação médica/prontuário deveria ter maior confiabilidade'
          );
        }
      }
    }
  }

  /**
   * Valida se uma alergia pode ser inativada
   */
  async validateInactivation(allergyId: string): Promise<AllergyValidationResult> {
    const result: AllergyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const allergy = await this.prisma.allergy.findUnique({
        where: { id: allergyId },
        include: {
          patient: {
            include: {
              prescriptions: {
                where: { isActive: true },
                include: { medication: true },
              },
            },
          },
        },
      });

      if (!allergy) {
        result.isValid = false;
        result.errors.push('Alergia não encontrada');
        return result;
      }

      if (!allergy.isActive) {
        result.warnings.push('Alergia já está inativa');
        return result;
      }

      // Se é alergia severa, adiciona warning
      if (allergy.severity === AllergySeverity.ANAPHYLACTIC || allergy.severity === AllergySeverity.SEVERE) {
        result.warnings.push(
          'Atenção: Inativando alergia severa/anafilática - verificar se há evidência de tolerância'
        );
      }

      // Verifica se há prescrições ativas que poderiam ser afetadas
      if (allergy.allergyType === AllergyType.DRUG && allergy.patient.prescriptions.length > 0) {
        const allergenLower = allergy.allergen.toLowerCase();
        const conflictingPrescriptions = allergy.patient.prescriptions.filter(p => {
          const medicationName = p.medication.commercialName.toLowerCase();
          const activeSubstances = p.medication.activeSubstance as any[];
          
          return medicationName.includes(allergenLower) ||
                 allergenLower.includes(medicationName) ||
                 activeSubstances?.some((substance: any) => 
                   substance.name.toLowerCase().includes(allergenLower) ||
                   allergenLower.includes(substance.name.toLowerCase())
                 );
        });

        if (conflictingPrescriptions.length > 0) {
          result.warnings.push(
            `Paciente possui ${conflictingPrescriptions.length} prescrição(ões) ativa(s) que pode(m) estar relacionada(s) a este alérgeno`
          );
        }
      }

    } catch (error) {
      this.logger.error('Erro ao validar inativação de alergia:', error);
      result.isValid = false;
      result.errors.push('Erro interno na validação');
    }

    return result;
  }
}