import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MedicationValidationContext {
  patientId?: string;
  prescribedBy?: string;
  indication?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
}

@Injectable()
export class MedicationValidationService {
  private readonly logger = new Logger(MedicationValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida se um medicamento pode ser prescrito para um paciente
   */
  async validateMedicationForPatient(
    medicationId: string,
    patientId: string,
    context?: MedicationValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Busca dados do medicamento e paciente
      const [medication, patient] = await Promise.all([
        this.prisma.medication.findUnique({
          where: { id: medicationId },
          include: {
            interactionsA: {
              include: { medicationB: true },
            },
            interactionsB: {
              include: { medicationA: true },
            },
          },
        }),
        this.prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            allergies: {
              where: { isActive: true },
              include: { medication: true },
            },
            prescriptions: {
              where: { isActive: true },
              include: { medication: true },
            },
          },
        }),
      ]);

      if (!medication) {
        result.isValid = false;
        result.errors.push('Medicamento não encontrado');
        return result;
      }

      if (!patient) {
        result.isValid = false;
        result.errors.push('Paciente não encontrado');
        return result;
      }

      // Validação de alergias
      await this.validateAllergies(medication, patient, result);

      // Validação de interações medicamentosas
      await this.validateDrugInteractions(medication, patient, result);

      // Validação de contraindicações
      await this.validateContraindications(medication, patient, result, context);

      // Validação de duplicação terapêutica
      await this.validateTherapeuticDuplication(medication, patient, result);

      // Validação específica por idade/condições
      await this.validatePatientConditions(medication, patient, result, context);

    } catch (error) {
      this.logger.error('Erro na validação de medicamento:', error);
      result.isValid = false;
      result.errors.push('Erro interno na validação');
    }

    return result;
  }

  /**
   * Valida alergias do paciente
   */
  private async validateAllergies(medication: any, patient: any, result: ValidationResult): Promise<void> {
    const medicationAllergies = patient.allergies.filter(
      (allergy: any) => 
        allergy.allergyType === 'DRUG' && 
        (allergy.medicationId === medication.id || 
         this.checkActiveSubstanceAllergy(allergy.allergen, medication.activeSubstance))
    );

    for (const allergy of medicationAllergies) {
      const severity = allergy.severity;
      const message = `Paciente possui alergia ${severity.toLowerCase()} a ${allergy.allergen}`;

      if (severity === 'ANAPHYLACTIC' || severity === 'SEVERE') {
        result.isValid = false;
        result.errors.push(`CONTRAINDICAÇÃO ABSOLUTA: ${message}`);
      } else {
        result.warnings.push(`CUIDADO: ${message}`);
      }

      this.logger.warn(`Alergia detectada - Paciente: ${patient.id}, Medicamento: ${medication.commercialName}, Alérgeno: ${allergy.allergen}`);
    }
  }

  /**
   * Valida interações medicamentosas
   */
  private async validateDrugInteractions(medication: any, patient: any, result: ValidationResult): Promise<void> {
    const currentMedications = patient.prescriptions.map((p: any) => p.medication);
    
    for (const currentMed of currentMedications) {
      const interactions = [
        ...medication.interactionsA.filter((i: any) => i.medicationB.id === currentMed.id),
        ...medication.interactionsB.filter((i: any) => i.medicationA.id === currentMed.id),
      ];

      for (const interaction of interactions) {
        const severity = interaction.severity;
        const message = `Interação ${severity.toLowerCase()} entre ${medication.commercialName} e ${currentMed.commercialName}: ${interaction.clinicalEffect}`;

        if (severity === 'CONTRAINDICATED') {
          result.isValid = false;
          result.errors.push(`CONTRAINDICAÇÃO: ${message}`);
        } else if (severity === 'MAJOR') {
          result.warnings.push(`INTERAÇÃO IMPORTANTE: ${message} - ${interaction.recommendation}`);
        } else if (severity === 'MODERATE') {
          result.warnings.push(`INTERAÇÃO MODERADA: ${message} - ${interaction.recommendation}`);
        }

        this.logger.warn(`Interação detectada - ${severity}: ${medication.commercialName} + ${currentMed.commercialName}`);
      }
    }
  }

  /**
   * Valida contraindicações
   */
  private async validateContraindications(
    medication: any, 
    patient: any, 
    result: ValidationResult,
    context?: MedicationValidationContext,
  ): Promise<void> {
    if (!medication.contraindications) return;

    const contraindications = Array.isArray(medication.contraindications) 
      ? medication.contraindications 
      : [medication.contraindications];

    // Validação baseada na idade
    const age = this.calculateAge(patient.dateOfBirth);
    
    for (const contraindication of contraindications) {
      const contraindicationLower = contraindication.toLowerCase();
      
      // Contraindicações por idade
      if (age < 18 && (contraindicationLower.includes('criança') || contraindicationLower.includes('pediátrico'))) {
        result.warnings.push(`CUIDADO: ${contraindication} - Paciente menor de idade`);
      }
      
      if (age >= 65 && (contraindicationLower.includes('idoso') || contraindicationLower.includes('geriátrico'))) {
        result.warnings.push(`CUIDADO: ${contraindication} - Paciente idoso`);
      }

      // Contraindicações por condições (dados do chronicConditions)
      if (patient.chronicConditions) {
        const conditions = Array.isArray(patient.chronicConditions) 
          ? patient.chronicConditions 
          : Object.values(patient.chronicConditions);
        
        for (const condition of conditions) {
          if (typeof condition === 'string' && 
              contraindicationLower.includes(condition.toLowerCase())) {
            result.isValid = false;
            result.errors.push(`CONTRAINDICAÇÃO: ${contraindication} - Paciente possui: ${condition}`);
          }
        }
      }

      // Contraindicações por função renal/hepática
      if (patient.renalFunction && 
          contraindicationLower.includes('renal') && 
          patient.renalFunction.toLowerCase().includes('insuficiência')) {
        result.warnings.push(`CUIDADO: ${contraindication} - Paciente com insuficiência renal`);
      }

      if (patient.hepaticFunction && 
          contraindicationLower.includes('hepática') && 
          patient.hepaticFunction.toLowerCase().includes('insuficiência')) {
        result.warnings.push(`CUIDADO: ${contraindication} - Paciente com insuficiência hepática`);
      }
    }
  }

  /**
   * Valida duplicação terapêutica
   */
  private async validateTherapeuticDuplication(medication: any, patient: any, result: ValidationResult): Promise<void> {
    const currentMedications = patient.prescriptions.map((p: any) => p.medication);
    
    for (const currentMed of currentMedications) {
      // Verifica se é o mesmo medicamento
      if (currentMed.id === medication.id) {
        result.warnings.push(`DUPLICAÇÃO: Paciente já possui prescrição ativa de ${medication.commercialName}`);
        continue;
      }

      // Verifica se têm a mesma classe terapêutica
      if (currentMed.therapeuticClass === medication.therapeuticClass) {
        result.warnings.push(`DUPLICAÇÃO TERAPÊUTICA: ${medication.commercialName} e ${currentMed.commercialName} pertencem à mesma classe: ${medication.therapeuticClass}`);
      }

      // Verifica se têm o mesmo princípio ativo
      const hasSharedActiveSubstance = this.checkSharedActiveSubstance(
        medication.activeSubstance,
        currentMed.activeSubstance
      );

      if (hasSharedActiveSubstance) {
        result.warnings.push(`MESMO PRINCÍPIO ATIVO: ${medication.commercialName} e ${currentMed.commercialName} contêm o mesmo princípio ativo`);
      }
    }
  }

  /**
   * Validações específicas por condições do paciente
   */
  private async validatePatientConditions(
    medication: any,
    patient: any,
    result: ValidationResult,
    context?: MedicationValidationContext,
  ): Promise<void> {
    const age = this.calculateAge(patient.dateOfBirth);

    // Validações para idosos (Critérios de Beers)
    if (age >= 65) {
      await this.validateElderlyMedication(medication, patient, result);
    }

    // Validações pediátricas
    if (age < 18) {
      await this.validatePediatricMedication(medication, patient, result, age);
    }

    // Validações por peso (se disponível)
    if (patient.weight && context?.dosage) {
      await this.validateDosageByWeight(medication, patient, result, context);
    }

    // Validações de gravidez (se aplicável)
    if (patient.gender === 'F' && age >= 12 && age <= 50) {
      await this.validatePregnancySafety(medication, patient, result);
    }
  }

  /**
   * Validações específicas para idosos
   */
  private async validateElderlyMedication(medication: any, patient: any, result: ValidationResult): Promise<void> {
    // Lista simplificada de medicamentos potencialmente inadequados para idosos
    const elderlyInappropriateMedications = [
      'dipirona em altas doses',
      'benzodiazepínicos de ação longa',
      'antihistamínicos de primeira geração',
      'relaxantes musculares',
    ];

    const medicationName = medication.commercialName.toLowerCase();
    const activeSubstances = medication.activeSubstance.map((as: any) => as.name.toLowerCase());

    for (const inappropriate of elderlyInappropriateMedications) {
      if (medicationName.includes(inappropriate) || 
          activeSubstances.some((as: string) => inappropriate.includes(as))) {
        result.warnings.push(`CUIDADO GERIÁTRICO: ${medication.commercialName} pode ser inadequado para idosos`);
      }
    }
  }

  /**
   * Validações pediátricas
   */
  private async validatePediatricMedication(
    medication: any, 
    patient: any, 
    result: ValidationResult, 
    age: number,
  ): Promise<void> {
    // Verificações específicas para crianças
    if (age < 2) {
      result.warnings.push('ATENÇÃO NEONATAL: Verificar dosagem e segurança para lactentes');
    }

    // Medicamentos contraindicados em crianças
    const pediatricContraindicated = ['ácido acetilsalicílico', 'aspirina', 'tetraciclina'];
    const activeSubstances = medication.activeSubstance.map((as: any) => as.name.toLowerCase());

    for (const contraindicated of pediatricContraindicated) {
      if (activeSubstances.some((as: string) => as.includes(contraindicated))) {
        result.isValid = false;
        result.errors.push(`CONTRAINDICAÇÃO PEDIÁTRICA: ${medication.commercialName} não deve ser usado em crianças`);
      }
    }
  }

  /**
   * Validação de dosagem por peso
   */
  private async validateDosageByWeight(
    medication: any,
    patient: any,
    result: ValidationResult,
    context: MedicationValidationContext,
  ): Promise<void> {
    // Esta validação seria mais complexa em um sistema real
    if (patient.weight < 50 && context.dosage) {
      result.warnings.push(`DOSAGEM: Verificar se a dosagem está adequada para paciente com ${patient.weight}kg`);
    }
  }

  /**
   * Validação de segurança na gravidez
   */
  private async validatePregnancySafety(medication: any, patient: any, result: ValidationResult): Promise<void> {
    // Em um sistema real, haveria uma base de dados de categorias de risco na gravidez
    result.warnings.push('GRAVIDEZ: Verificar categoria de risco na gravidez antes da prescrição');
  }

  /**
   * Utilitários
   */
  private calculateAge(dateOfBirth: Date): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private checkActiveSubstanceAllergy(allergen: string, activeSubstances: any[]): boolean {
    if (!activeSubstances || !Array.isArray(activeSubstances)) return false;
    
    const allergenLower = allergen.toLowerCase();
    return activeSubstances.some(substance => 
      substance.name.toLowerCase().includes(allergenLower) ||
      allergenLower.includes(substance.name.toLowerCase())
    );
  }

  private checkSharedActiveSubstance(activeSubstances1: any[], activeSubstances2: any[]): boolean {
    if (!activeSubstances1 || !activeSubstances2) return false;
    
    const substances1 = activeSubstances1.map(as => as.name.toLowerCase());
    const substances2 = activeSubstances2.map(as => as.name.toLowerCase());
    
    return substances1.some(s1 => substances2.includes(s1));
  }

  /**
   * Valida estrutura de dados do medicamento
   */
  async validateMedicationData(medicationData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validação de código ANVISA
    if (!medicationData.anvisaCode || !/^\d{13}$/.test(medicationData.anvisaCode)) {
      result.isValid = false;
      result.errors.push('Código ANVISA deve ter 13 dígitos');
    }

    // Validação de princípios ativos
    if (!medicationData.activeSubstance || !Array.isArray(medicationData.activeSubstance) || medicationData.activeSubstance.length === 0) {
      result.isValid = false;
      result.errors.push('Medicamento deve ter pelo menos um princípio ativo');
    }

    // Validação de nome comercial
    if (!medicationData.commercialName || medicationData.commercialName.trim().length < 2) {
      result.isValid = false;
      result.errors.push('Nome comercial é obrigatório e deve ter pelo menos 2 caracteres');
    }

    // Validação de fabricante
    if (!medicationData.manufacturer || medicationData.manufacturer.trim().length < 3) {
      result.isValid = false;
      result.errors.push('Fabricante é obrigatório');
    }

    return result;
  }
}