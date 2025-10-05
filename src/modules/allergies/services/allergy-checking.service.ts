import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AllergyType, AllergySeverity } from '@prisma/client';

export interface AllergyCheckOptions {
  checkCrossReactivity?: boolean;
  includeInactive?: boolean;
  minimumSeverity?: AllergySeverity;
}

export interface AllergyConflict {
  allergy: any;
  conflictType: 'DIRECT' | 'CROSS_REACTIVE' | 'SAME_CLASS' | 'SIMILAR_SUBSTANCE';
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  explanation: string;
  recommendations: string[];
}

export interface AllergyCheckResult {
  hasConflict: boolean;
  conflicts: AllergyConflict[];
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  summary: string;
  blockPrescription: boolean;
}

@Injectable()
export class AllergyCheckingService {
  private readonly logger = new Logger(AllergyCheckingService.name);

  // Mapeamento de reações cruzadas conhecidas
  private readonly crossReactivityMap = new Map<string, string[]>([
    ['penicilina', ['amoxicilina', 'ampicilina', 'cefalexina', 'cefazolina']],
    ['sulfa', ['sulfametoxazol', 'sulfadiazina', 'sulfasalazina']],
    ['aspirina', ['ácido acetilsalicílico', 'salicilatos', 'diclofenaco', 'ibuprofeno']],
    ['dipirona', ['metamizol', 'novalgina']],
    ['contraste iodado', ['iodo', 'gadolínio']],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica conflitos de alergia para um medicamento específico
   */
  async checkMedicationAllergy(
    patientId: string,
    medicationId: string,
    options: AllergyCheckOptions = {},
  ): Promise<AllergyCheckResult> {
    this.logger.debug(`Verificando alergias - Paciente: ${patientId}, Medicamento: ${medicationId}`);

    try {
      // Busca dados do paciente e medicamento
      const [patient, medication] = await Promise.all([
        this.prisma.patient.findUnique({
          where: { id: patientId },
          include: {
            allergies: {
              where: {
                isActive: options.includeInactive ? undefined : true,
                severity: options.minimumSeverity ? {
                  in: this.getSeverityLevelsFromMinimum(options.minimumSeverity),
                } : undefined,
              },
            },
          },
        }),
        this.prisma.medication.findUnique({
          where: { id: medicationId },
        }),
      ]);

      if (!patient || !medication) {
        throw new Error('Paciente ou medicamento não encontrado');
      }

      const conflicts: AllergyConflict[] = [];

      // Verifica cada alergia do paciente
      for (const allergy of patient.allergies) {
        const conflict = await this.checkSingleAllergy(allergy, medication, options);
        if (conflict) {
          conflicts.push(conflict);
        }
      }

      return this.buildCheckResult(conflicts);
    } catch (error) {
      this.logger.error('Erro na verificação de alergias:', error);
      throw error;
    }
  }

  /**
   * Verifica conflitos por nome do alérgeno
   */
  async checkAllergenByName(
    patientId: string,
    allergenName: string,
    options: AllergyCheckOptions = {},
  ): Promise<AllergyCheckResult> {
    this.logger.debug(`Verificando alérgeno por nome - Paciente: ${patientId}, Alérgeno: ${allergenName}`);

    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          allergies: {
            where: {
              isActive: options.includeInactive ? undefined : true,
              severity: options.minimumSeverity ? {
                in: this.getSeverityLevelsFromMinimum(options.minimumSeverity),
              } : undefined,
            },
          },
        },
      });

      if (!patient) {
        throw new Error('Paciente não encontrado');
      }

      const conflicts: AllergyConflict[] = [];

      for (const allergy of patient.allergies) {
        const conflict = this.checkAllergenMatch(allergy, allergenName, options);
        if (conflict) {
          conflicts.push(conflict);
        }
      }

      return this.buildCheckResult(conflicts);
    } catch (error) {
      this.logger.error('Erro na verificação de alérgeno:', error);
      throw error;
    }
  }

  /**
   * Verifica uma alergia específica contra um medicamento
   */
  private async checkSingleAllergy(
    allergy: any,
    medication: any,
    options: AllergyCheckOptions,
  ): Promise<AllergyConflict | null> {
    const allergenLower = allergy.allergen.toLowerCase();
    const medicationNameLower = medication.commercialName.toLowerCase();
    const activeSubstances = medication.activeSubstance as any[];

    // Verificação direta - nome comercial
    if (medicationNameLower.includes(allergenLower) || allergenLower.includes(medicationNameLower)) {
      return {
        allergy,
        conflictType: 'DIRECT',
        riskLevel: this.getRiskLevelFromSeverity(allergy.severity),
        explanation: `Alergia direta ao medicamento ${medication.commercialName}`,
        recommendations: this.getRecommendationsForDirectConflict(allergy.severity),
      };
    }

    // Verificação por princípio ativo
    for (const substance of activeSubstances || []) {
      const substanceLower = substance.name.toLowerCase();
      
      if (substanceLower.includes(allergenLower) || allergenLower.includes(substanceLower)) {
        return {
          allergy,
          conflictType: 'SIMILAR_SUBSTANCE',
          riskLevel: this.getRiskLevelFromSeverity(allergy.severity),
          explanation: `Alergia ao princípio ativo ${substance.name} presente em ${medication.commercialName}`,
          recommendations: this.getRecommendationsForSubstanceConflict(allergy.severity),
        };
      }
    }

    // Verificação de reatividade cruzada
    if (options.checkCrossReactivity !== false) {
      const crossReactiveConflict = this.checkCrossReactivity(allergy, medication);
      if (crossReactiveConflict) {
        return crossReactiveConflict;
      }
    }

    return null;
  }

  /**
   * Verifica correspondência por nome do alérgeno
   */
  private checkAllergenMatch(
    allergy: any,
    allergenName: string,
    options: AllergyCheckOptions,
  ): AllergyConflict | null {
    const allergyLower = allergy.allergen.toLowerCase();
    const searchLower = allergenName.toLowerCase();

    // Correspondência exata ou parcial
    if (allergyLower.includes(searchLower) || searchLower.includes(allergyLower)) {
      return {
        allergy,
        conflictType: 'DIRECT',
        riskLevel: this.getRiskLevelFromSeverity(allergy.severity),
        explanation: `Alergia registrada para ${allergy.allergen}`,
        recommendations: this.getRecommendationsForDirectConflict(allergy.severity),
      };
    }

    // Verificação de reatividade cruzada por nome
    if (options.checkCrossReactivity !== false) {
      const crossReactive = this.findCrossReactiveSubstances(allergyLower);
      if (crossReactive.some(substance => searchLower.includes(substance) || substance.includes(searchLower))) {
        return {
          allergy,
          conflictType: 'CROSS_REACTIVE',
          riskLevel: this.adjustRiskLevelForCrossReactivity(allergy.severity),
          explanation: `Possível reação cruzada com ${allergy.allergen}`,
          recommendations: this.getRecommendationsForCrossReactivity(allergy.severity),
        };
      }
    }

    return null;
  }

  /**
   * Verifica reatividade cruzada
   */
  private checkCrossReactivity(allergy: any, medication: any): AllergyConflict | null {
    const allergenLower = allergy.allergen.toLowerCase();
    const medicationNameLower = medication.commercialName.toLowerCase();
    const activeSubstances = medication.activeSubstance as any[];

    const crossReactiveSubstances = this.findCrossReactiveSubstances(allergenLower);

    // Verifica nome comercial
    for (const substance of crossReactiveSubstances) {
      if (medicationNameLower.includes(substance) || substance.includes(medicationNameLower)) {
        return {
          allergy,
          conflictType: 'CROSS_REACTIVE',
          riskLevel: this.adjustRiskLevelForCrossReactivity(allergy.severity),
          explanation: `Possível reação cruzada entre ${allergy.allergen} e ${medication.commercialName}`,
          recommendations: this.getRecommendationsForCrossReactivity(allergy.severity),
        };
      }
    }

    // Verifica princípios ativos
    for (const activeSubstance of activeSubstances || []) {
      const substanceLower = activeSubstance.name.toLowerCase();
      
      for (const crossReactive of crossReactiveSubstances) {
        if (substanceLower.includes(crossReactive) || crossReactive.includes(substanceLower)) {
          return {
            allergy,
            conflictType: 'CROSS_REACTIVE',
            riskLevel: this.adjustRiskLevelForCrossReactivity(allergy.severity),
            explanation: `Possível reação cruzada entre ${allergy.allergen} e ${activeSubstance.name}`,
            recommendations: this.getRecommendationsForCrossReactivity(allergy.severity),
          };
        }
      }
    }

    return null;
  }

  /**
   * Encontra substâncias com reatividade cruzada conhecida
   */
  private findCrossReactiveSubstances(allergen: string): string[] {
    const crossReactive: string[] = [];

    for (const [baseAllergen, relatedSubstances] of this.crossReactivityMap.entries()) {
      if (allergen.includes(baseAllergen) || baseAllergen.includes(allergen)) {
        crossReactive.push(...relatedSubstances);
      }
      
      if (relatedSubstances.some(substance => 
        allergen.includes(substance) || substance.includes(allergen)
      )) {
        crossReactive.push(baseAllergen);
        crossReactive.push(...relatedSubstances.filter(s => s !== allergen));
      }
    }

    return [...new Set(crossReactive)]; // Remove duplicatas
  }

  /**
   * Constrói resultado final da verificação
   */
  private buildCheckResult(conflicts: AllergyConflict[]): AllergyCheckResult {
    const hasConflict = conflicts.length > 0;
    
    let overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let blockPrescription = false;

    if (hasConflict) {
      // Determina o maior nível de risco
      const riskLevels = conflicts.map(c => c.riskLevel);
      
      if (riskLevels.includes('CRITICAL')) {
        overallRiskLevel = 'CRITICAL';
        blockPrescription = true;
      } else if (riskLevels.includes('HIGH')) {
        overallRiskLevel = 'HIGH';
        blockPrescription = true;
      } else if (riskLevels.includes('MODERATE')) {
        overallRiskLevel = 'MODERATE';
      }
    }

    const summary = this.generateSummary(conflicts, overallRiskLevel);

    return {
      hasConflict,
      conflicts,
      overallRiskLevel,
      summary,
      blockPrescription,
    };
  }

  /**
   * Gera resumo da verificação
   */
  private generateSummary(conflicts: AllergyConflict[], riskLevel: string): string {
    if (conflicts.length === 0) {
      return 'Nenhum conflito de alergia identificado';
    }

    const directConflicts = conflicts.filter(c => c.conflictType === 'DIRECT' || c.conflictType === 'SIMILAR_SUBSTANCE');
    const crossReactiveConflicts = conflicts.filter(c => c.conflictType === 'CROSS_REACTIVE');

    let summary = '';

    if (directConflicts.length > 0) {
      summary += `${directConflicts.length} conflito(s) direto(s) de alergia identificado(s). `;
    }

    if (crossReactiveConflicts.length > 0) {
      summary += `${crossReactiveConflicts.length} possível(is) reação(ões) cruzada(s) identificada(s). `;
    }

    summary += `Nível de risco: ${riskLevel}.`;

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      summary += ' PRESCRIÇÃO BLOQUEADA - buscar alternativa terapêutica.';
    } else if (riskLevel === 'MODERATE') {
      summary += ' Prescrição com cautela - monitorar paciente.';
    }

    return summary;
  }

  /**
   * Utilitários para mapeamento de severidade e risco
   */
  private getRiskLevelFromSeverity(severity: AllergySeverity): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    switch (severity) {
      case AllergySeverity.MILD:
        return 'MODERATE';
      case AllergySeverity.MODERATE:
        return 'HIGH';
      case AllergySeverity.SEVERE:
        return 'CRITICAL';
      case AllergySeverity.ANAPHYLACTIC:
        return 'CRITICAL';
      default:
        return 'MODERATE';
    }
  }

  private adjustRiskLevelForCrossReactivity(severity: AllergySeverity): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    // Reatividade cruzada tem risco ligeiramente menor
    switch (severity) {
      case AllergySeverity.MILD:
        return 'LOW';
      case AllergySeverity.MODERATE:
        return 'MODERATE';
      case AllergySeverity.SEVERE:
        return 'HIGH';
      case AllergySeverity.ANAPHYLACTIC:
        return 'HIGH'; // Reduz de CRITICAL para HIGH em reações cruzadas
      default:
        return 'LOW';
    }
  }

  private getSeverityLevelsFromMinimum(minSeverity: AllergySeverity): AllergySeverity[] {
    const allSeverities = [
      AllergySeverity.MILD,
      AllergySeverity.MODERATE,
      AllergySeverity.SEVERE,
      AllergySeverity.ANAPHYLACTIC,
    ];

    const minIndex = allSeverities.indexOf(minSeverity);
    return allSeverities.slice(minIndex);
  }

  private getRecommendationsForDirectConflict(severity: AllergySeverity): string[] {
    const base = ['Contraindicação absoluta', 'Buscar medicamento alternativo'];
    
    if (severity === AllergySeverity.ANAPHYLACTIC || severity === AllergySeverity.SEVERE) {
      return [
        ...base,
        'Alertar toda equipe médica',
        'Documentar em prontuário com destaque',
        'Orientar paciente sobre uso de identificação médica',
      ];
    }
    
    return base;
  }

  private getRecommendationsForSubstanceConflict(severity: AllergySeverity): string[] {
    return [
      'Evitar medicamento com princípio ativo alergênico',
      'Buscar alternativa com mecanismo de ação diferente',
      ...(severity === AllergySeverity.SEVERE || severity === AllergySeverity.ANAPHYLACTIC 
        ? ['Consultar alergista/imunologista'] 
        : []
      ),
    ];
  }

  private getRecommendationsForCrossReactivity(severity: AllergySeverity): string[] {
    const base = [
      'Avaliar risco-benefício cuidadosamente',
      'Considerar alternativa terapêutica',
      'Se necessário usar, fazer com monitorização rigorosa',
    ];

    if (severity === AllergySeverity.SEVERE || severity === AllergySeverity.ANAPHYLACTIC) {
      return [
        ...base,
        'Pré-medicação antialérgica se uso for essencial',
        'Ambiente hospitalar para primeira dose',
        'Consultar especialista',
      ];
    }

    return base;
  }

  /**
   * Verifica múltiplos medicamentos de uma só vez
   */
  async checkMultipleMedications(
    patientId: string,
    medicationIds: string[],
    options: AllergyCheckOptions = {},
  ): Promise<Map<string, AllergyCheckResult>> {
    const results = new Map<string, AllergyCheckResult>();

    for (const medicationId of medicationIds) {
      try {
        const result = await this.checkMedicationAllergy(patientId, medicationId, options);
        results.set(medicationId, result);
      } catch (error) {
        this.logger.error(`Erro ao verificar medicamento ${medicationId}:`, error);
        results.set(medicationId, {
          hasConflict: false,
          conflicts: [],
          overallRiskLevel: 'LOW',
          summary: 'Erro na verificação',
          blockPrescription: false,
        });
      }
    }

    return results;
  }
}