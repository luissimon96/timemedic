import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AllergiesService } from '../../allergies/allergies.service';
import {
  SafetyCheckResultDto,
  SafetyRiskLevel,
  SafetyCheckType,
  SafetyIssueDto,
  AllergyCheckResultDto,
  InteractionCheckResultDto,
  DosageLimitCheckResultDto,
  TimingConflictResultDto,
} from '../dto/safety-check-result.dto';
import { plainToClass } from 'class-transformer';

export interface SafetyCheckOptions {
  includeAllergies?: boolean;
  includeInteractions?: boolean;
  includeDosageLimits?: boolean;
  includeTimingConflicts?: boolean;
  includeContraindications?: boolean;
  includeDuplicateTherapy?: boolean;
  includeAgeRestrictions?: boolean;
  includeRenalFunction?: boolean;
  includeHepaticFunction?: boolean;
}

@Injectable()
export class SafetyCheckService {
  private readonly logger = new Logger(SafetyCheckService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly allergiesService: AllergiesService,
  ) {}

  /**
   * Verificação completa de segurança
   */
  async performComprehensiveCheck(
    patientId: string,
    medicationIds: string[],
    options: SafetyCheckOptions = {}
  ): Promise<SafetyCheckResultDto> {
    this.logger.log(`Iniciando verificação de segurança para paciente ${patientId}`);

    const checkId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkTimestamp = new Date();
    const safetyIssues: SafetyIssueDto[] = [];

    // Busca dados do paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        allergies: { where: { isActive: true } },
      },
    });

    if (!patient) {
      throw new Error(`Paciente ${patientId} não encontrado`);
    }

    // Busca medicamentos
    const medications = await this.prisma.medication.findMany({
      where: { id: { in: medicationIds } },
      include: {
        interactionsA: {
          include: { medicationB: true },
        },
        interactionsB: {
          include: { medicationA: true },
        },
      },
    });

    // Verificação de alergias
    let allergyCheck: AllergyCheckResultDto = {
      hasConflict: false,
      conflictingAllergies: [],
      maxRiskLevel: SafetyRiskLevel.LOW,
      conflictDetails: [],
    };

    if (options.includeAllergies !== false) {
      allergyCheck = await this.checkAllergies(patientId, medicationIds);
      if (allergyCheck.hasConflict) {
        safetyIssues.push(...this.createAllergyIssues(allergyCheck));
      }
    }

    // Verificação de interações medicamentosas
    let interactionCheck: InteractionCheckResultDto = {
      hasInteractions: false,
      interactionCount: 0,
      maxSeverity: SafetyRiskLevel.LOW,
      interactions: [],
    };

    if (options.includeInteractions !== false) {
      interactionCheck = await this.checkDrugInteractions(medicationIds);
      if (interactionCheck.hasInteractions) {
        safetyIssues.push(...this.createInteractionIssues(interactionCheck));
      }
    }

    // Verificação de limites de dosagem
    let dosageLimitCheck: DosageLimitCheckResultDto = {
      exceedsLimits: false,
      currentDailyDose: 0,
      maximumRecommendedDose: 0,
      percentageOfMax: 0,
    };

    if (options.includeDosageLimits !== false) {
      dosageLimitCheck = await this.checkDosageLimits(patientId, medicationIds);
      if (dosageLimitCheck.exceedsLimits) {
        safetyIssues.push(...this.createDosageLimitIssues(dosageLimitCheck, medications));
      }
    }

    // Verificação de conflitos de timing
    let timingConflictCheck: TimingConflictResultDto = {
      hasConflicts: false,
      conflictingMedications: [],
      timingRecommendations: [],
      problematicTimes: [],
    };

    if (options.includeTimingConflicts !== false) {
      timingConflictCheck = await this.checkTimingConflicts(patientId, medicationIds);
      if (timingConflictCheck.hasConflicts) {
        safetyIssues.push(...this.createTimingConflictIssues(timingConflictCheck));
      }
    }

    // Verificações adicionais
    if (options.includeContraindications !== false) {
      const contraindicationIssues = await this.checkContraindications(patient, medications);
      safetyIssues.push(...contraindicationIssues);
    }

    if (options.includeDuplicateTherapy !== false) {
      const duplicateIssues = await this.checkDuplicateTherapy(patientId, medications);
      safetyIssues.push(...duplicateIssues);
    }

    if (options.includeAgeRestrictions !== false) {
      const ageIssues = await this.checkAgeRestrictions(patient, medications);
      safetyIssues.push(...ageIssues);
    }

    if (options.includeRenalFunction !== false) {
      const renalIssues = await this.checkRenalFunction(patient, medications);
      safetyIssues.push(...renalIssues);
    }

    if (options.includeHepaticFunction !== false) {
      const hepaticIssues = await this.checkHepaticFunction(patient, medications);
      safetyIssues.push(...hepaticIssues);
    }

    // Determina nível de risco geral
    const overallRiskLevel = this.determineOverallRiskLevel(safetyIssues);
    const passed = safetyIssues.filter(issue => 
      issue.riskLevel === SafetyRiskLevel.HIGH || issue.riskLevel === SafetyRiskLevel.CRITICAL
    ).length === 0;

    // Gera recomendações prioritárias
    const priorityRecommendations = this.generatePriorityRecommendations(safetyIssues);
    const requiredActions = this.generateRequiredActions(safetyIssues);
    const requiresApproval = safetyIssues.some(issue => 
      issue.riskLevel === SafetyRiskLevel.CRITICAL || issue.requiresImmediateAction
    );

    const result: SafetyCheckResultDto = {
      checkId,
      patientId,
      medicationIds,
      checkTimestamp,
      passed,
      overallRiskLevel,
      totalIssues: safetyIssues.length,
      safetyIssues,
      allergyCheck,
      interactionCheck,
      dosageLimitCheck,
      timingConflictCheck,
      priorityRecommendations,
      requiredActions,
      requiresApproval,
      approvalRequired: requiresApproval ? 'Médico prescritor ou farmacêutico clínico' : undefined,
      executiveSummary: this.generateExecutiveSummary(safetyIssues, overallRiskLevel, passed),
    };

    // Log do resultado
    this.logger.log(`Verificação de segurança concluída: ${passed ? 'PASSOU' : 'FALHOU'} - ${safetyIssues.length} problemas encontrados`);

    return plainToClass(SafetyCheckResultDto, result, { excludeExtraneousValues: true });
  }

  /**
   * Verificação pré-dose (mais rápida)
   */
  async performPreDoseCheck(
    patientId: string,
    medicationId: string
  ): Promise<SafetyCheckResultDto> {
    return await this.performComprehensiveCheck(patientId, [medicationId], {
      includeAllergies: true,
      includeInteractions: true,
      includeDosageLimits: false,
      includeTimingConflicts: false,
      includeContraindications: true,
    });
  }

  /**
   * Verificação de alergias
   */
  private async checkAllergies(
    patientId: string,
    medicationIds: string[]
  ): Promise<AllergyCheckResultDto> {
    const conflictDetails: any[] = [];
    const conflictingAllergies: string[] = [];
    let maxRiskLevel = SafetyRiskLevel.LOW;

    for (const medicationId of medicationIds) {
      try {
        const allergyResult = await this.allergiesService.checkMedicationConflict(
          patientId,
          medicationId
        );

        if (allergyResult.hasConflict) {
          conflictDetails.push(allergyResult);
          conflictingAllergies.push(...allergyResult.conflictingAllergies.map(a => a.allergen));
          
          const riskLevel = this.mapAllergyRiskToSafety(allergyResult.riskLevel);
          if (this.compareRiskLevels(riskLevel, maxRiskLevel) > 0) {
            maxRiskLevel = riskLevel;
          }
        }
      } catch (error) {
        this.logger.error(`Erro na verificação de alergia para medicamento ${medicationId}:`, error);
      }
    }

    return {
      hasConflict: conflictDetails.length > 0,
      conflictingAllergies: [...new Set(conflictingAllergies)],
      maxRiskLevel,
      conflictDetails,
    };
  }

  /**
   * Verificação de interações medicamentosas
   */
  private async checkDrugInteractions(medicationIds: string[]): Promise<InteractionCheckResultDto> {
    const interactions: any[] = [];
    let maxSeverity = SafetyRiskLevel.LOW;

    // Busca medicações atuais do paciente (se aplicável)
    const currentMedications = await this.getCurrentMedications(medicationIds);

    // Verifica interações entre medicamentos na lista
    for (let i = 0; i < medicationIds.length; i++) {
      for (let j = i + 1; j < medicationIds.length; j++) {
        const interaction = await this.prisma.drugInteraction.findFirst({
          where: {
            OR: [
              { medicationAId: medicationIds[i], medicationBId: medicationIds[j] },
              { medicationAId: medicationIds[j], medicationBId: medicationIds[i] },
            ],
          },
          include: {
            medicationA: true,
            medicationB: true,
          },
        });

        if (interaction) {
          interactions.push(interaction);
          const riskLevel = this.mapInteractionSeverityToSafety(interaction.severity);
          if (this.compareRiskLevels(riskLevel, maxSeverity) > 0) {
            maxSeverity = riskLevel;
          }
        }
      }
    }

    // Verifica interações com medicações atuais
    for (const currentMed of currentMedications) {
      for (const newMedId of medicationIds) {
        if (currentMed.id !== newMedId) {
          const interaction = await this.prisma.drugInteraction.findFirst({
            where: {
              OR: [
                { medicationAId: currentMed.id, medicationBId: newMedId },
                { medicationAId: newMedId, medicationBId: currentMed.id },
              ],
            },
            include: {
              medicationA: true,
              medicationB: true,
            },
          });

          if (interaction) {
            interactions.push(interaction);
            const riskLevel = this.mapInteractionSeverityToSafety(interaction.severity);
            if (this.compareRiskLevels(riskLevel, maxSeverity) > 0) {
              maxSeverity = riskLevel;
            }
          }
        }
      }
    }

    return {
      hasInteractions: interactions.length > 0,
      interactionCount: interactions.length,
      maxSeverity,
      interactions,
    };
  }

  /**
   * Verificação de limites de dosagem
   */
  private async checkDosageLimits(
    patientId: string,
    medicationIds: string[]
  ): Promise<DosageLimitCheckResultDto> {
    // Implementação simplificada - busca dosagens atuais
    const activeDosages = await this.prisma.dosage.findMany({
      where: {
        prescription: {
          patientId,
          medicationId: { in: medicationIds },
        },
        isActive: true,
      },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
      },
    });

    let currentDailyDose = 0;
    let maximumRecommendedDose = 1000; // Valor padrão - deveria vir de base de dados

    // Calcula dose diária total (simplificado)
    for (const dosage of activeDosages) {
      const dosageAmount = this.extractDosageAmount(dosage.dosagePerAdministration);
      const dailyFrequency = this.calculateDailyFrequency(dosage.frequency);
      currentDailyDose += dosageAmount * dailyFrequency;
    }

    const percentageOfMax = maximumRecommendedDose > 0 ? 
      (currentDailyDose / maximumRecommendedDose) * 100 : 0;

    return {
      exceedsLimits: percentageOfMax > 100,
      currentDailyDose,
      maximumRecommendedDose,
      percentageOfMax: Math.round(percentageOfMax * 100) / 100,
      specialConsiderations: percentageOfMax > 80 ? 
        ['Dose próxima ao limite máximo', 'Monitoramento intensivo recomendado'] : undefined,
    };
  }

  /**
   * Verificação de conflitos de timing
   */
  private async checkTimingConflicts(
    patientId: string,
    medicationIds: string[]
  ): Promise<TimingConflictResultDto> {
    // Busca agendamentos atuais
    const currentSchedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosage: {
          prescription: { patientId },
        },
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                medication: true,
              },
            },
          },
        },
      },
    });

    const conflictingMedications: string[] = [];
    const problematicTimes: string[] = [];
    const timingRecommendations: string[] = [];

    // Detecta horários muito próximos (< 30 minutos)
    for (let i = 0; i < currentSchedules.length; i++) {
      for (let j = i + 1; j < currentSchedules.length; j++) {
        const timeDiff = Math.abs(
          currentSchedules[i].scheduledTime.getTime() - 
          currentSchedules[j].scheduledTime.getTime()
        ) / (1000 * 60); // minutos

        if (timeDiff < 30) {
          const med1 = currentSchedules[i].dosage.prescription.medication.commercialName;
          const med2 = currentSchedules[j].dosage.prescription.medication.commercialName;
          
          conflictingMedications.push(med1, med2);
          problematicTimes.push(
            currentSchedules[i].scheduledTime.toTimeString().substr(0, 5),
            currentSchedules[j].scheduledTime.toTimeString().substr(0, 5)
          );
        }
      }
    }

    if (conflictingMedications.length > 0) {
      timingRecommendations.push(
        'Separar administrações em pelo menos 30 minutos',
        'Considerar reorganização de horários',
        'Verificar se medicamentos podem ser tomados juntos'
      );
    }

    return {
      hasConflicts: conflictingMedications.length > 0,
      conflictingMedications: [...new Set(conflictingMedications)],
      timingRecommendations,
      problematicTimes: [...new Set(problematicTimes)],
    };
  }

  /**
   * Métodos auxiliares para criar issues
   */
  private createAllergyIssues(allergyCheck: AllergyCheckResultDto): SafetyIssueDto[] {
    return allergyCheck.conflictDetails.map(conflict => ({
      checkType: SafetyCheckType.ALLERGY,
      riskLevel: allergyCheck.maxRiskLevel,
      description: `Paciente possui alergia: ${conflict.conflictingAllergies?.map(a => a.allergen).join(', ')}`,
      involvedMedications: [conflict.medicationName || 'Medicamento'],
      recommendations: conflict.recommendations || ['Evitar administração', 'Consultar médico'],
      alternatives: [],
      references: [],
      requiresImmediateAction: allergyCheck.maxRiskLevel === SafetyRiskLevel.CRITICAL,
    }));
  }

  private createInteractionIssues(interactionCheck: InteractionCheckResultDto): SafetyIssueDto[] {
    return interactionCheck.interactions.map(interaction => ({
      checkType: SafetyCheckType.INTERACTION,
      riskLevel: this.mapInteractionSeverityToSafety(interaction.severity),
      description: interaction.clinicalEffect,
      involvedMedications: [interaction.medicationA.commercialName, interaction.medicationB.commercialName],
      recommendations: [interaction.recommendation],
      alternatives: [],
      references: interaction.references ? [JSON.stringify(interaction.references)] : [],
      requiresImmediateAction: interaction.severity === 'CONTRAINDICATED',
    }));
  }

  private createDosageLimitIssues(
    dosageLimitCheck: DosageLimitCheckResultDto,
    medications: any[]
  ): SafetyIssueDto[] {
    if (!dosageLimitCheck.exceedsLimits) return [];

    return [{
      checkType: SafetyCheckType.DOSAGE_LIMIT,
      riskLevel: SafetyRiskLevel.HIGH,
      description: `Dose diária total (${dosageLimitCheck.currentDailyDose}mg) excede limite máximo (${dosageLimitCheck.maximumRecommendedDose}mg)`,
      involvedMedications: medications.map(m => m.commercialName),
      recommendations: [
        'Revisar dosagem prescrita',
        'Considerar redução de dose',
        'Monitoramento intensivo',
      ],
      alternatives: [],
      references: [],
      requiresImmediateAction: dosageLimitCheck.percentageOfMax > 150,
    }];
  }

  private createTimingConflictIssues(timingCheck: TimingConflictResultDto): SafetyIssueDto[] {
    if (!timingCheck.hasConflicts) return [];

    return [{
      checkType: SafetyCheckType.TIMING_CONFLICT,
      riskLevel: SafetyRiskLevel.MODERATE,
      description: `Conflitos de timing detectados: ${timingCheck.conflictingMedications.join(', ')}`,
      involvedMedications: timingCheck.conflictingMedications,
      recommendations: timingCheck.timingRecommendations,
      alternatives: [],
      references: [],
      requiresImmediateAction: false,
    }];
  }

  /**
   * Métodos auxiliares
   */
  private async getCurrentMedications(excludeIds: string[] = []): Promise<any[]> {
    // Implementação simplificada
    return [];
  }

  private extractDosageAmount(dosageString: string): number {
    const match = dosageString.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private calculateDailyFrequency(frequency: any): number {
    switch (frequency.type) {
      case 'DAILY_TIMES':
        return frequency.timesPerDay || 1;
      case 'FIXED_INTERVAL':
        return Math.round(24 / (frequency.intervalHours || 24));
      default:
        return 1;
    }
  }

  private mapAllergyRiskToSafety(allergyRisk: string): SafetyRiskLevel {
    const mapping = {
      'MILD': SafetyRiskLevel.LOW,
      'MODERATE': SafetyRiskLevel.MODERATE,
      'SEVERE': SafetyRiskLevel.HIGH,
      'ANAPHYLACTIC': SafetyRiskLevel.CRITICAL,
    };
    return mapping[allergyRisk] || SafetyRiskLevel.MODERATE;
  }

  private mapInteractionSeverityToSafety(severity: string): SafetyRiskLevel {
    const mapping = {
      'MINOR': SafetyRiskLevel.LOW,
      'MODERATE': SafetyRiskLevel.MODERATE,
      'MAJOR': SafetyRiskLevel.HIGH,
      'CONTRAINDICATED': SafetyRiskLevel.CRITICAL,
    };
    return mapping[severity] || SafetyRiskLevel.MODERATE;
  }

  private compareRiskLevels(level1: SafetyRiskLevel, level2: SafetyRiskLevel): number {
    const levels = [SafetyRiskLevel.LOW, SafetyRiskLevel.MODERATE, SafetyRiskLevel.HIGH, SafetyRiskLevel.CRITICAL];
    return levels.indexOf(level1) - levels.indexOf(level2);
  }

  private determineOverallRiskLevel(issues: SafetyIssueDto[]): SafetyRiskLevel {
    if (issues.some(i => i.riskLevel === SafetyRiskLevel.CRITICAL)) {
      return SafetyRiskLevel.CRITICAL;
    }
    if (issues.some(i => i.riskLevel === SafetyRiskLevel.HIGH)) {
      return SafetyRiskLevel.HIGH;
    }
    if (issues.some(i => i.riskLevel === SafetyRiskLevel.MODERATE)) {
      return SafetyRiskLevel.MODERATE;
    }
    return SafetyRiskLevel.LOW;
  }

  private generatePriorityRecommendations(issues: SafetyIssueDto[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.riskLevel === SafetyRiskLevel.CRITICAL);
    const highIssues = issues.filter(i => i.riskLevel === SafetyRiskLevel.HIGH);

    if (criticalIssues.length > 0) {
      recommendations.push('AÇÃO IMEDIATA NECESSÁRIA - Não administrar medicação');
      recommendations.push('Contatar médico prescritor urgentemente');
    }

    if (highIssues.length > 0) {
      recommendations.push('Revisar prescrição antes da administração');
      recommendations.push('Monitoramento intensivo necessário');
    }

    return recommendations;
  }

  private generateRequiredActions(issues: SafetyIssueDto[]): string[] {
    const actions: string[] = [];
    
    if (issues.some(i => i.requiresImmediateAction)) {
      actions.push('Suspender administração imediatamente');
      actions.push('Notificar equipe médica');
    }

    if (issues.some(i => i.checkType === SafetyCheckType.ALLERGY && i.riskLevel === SafetyRiskLevel.CRITICAL)) {
      actions.push('Verificar disponibilidade de medicação de emergência (adrenalina)');
    }

    return actions;
  }

  private generateExecutiveSummary(
    issues: SafetyIssueDto[],
    riskLevel: SafetyRiskLevel,
    passed: boolean
  ): string {
    if (passed) {
      return `Verificação de segurança APROVADA. ${issues.length} problemas menores identificados que não impedem a administração.`;
    }

    const criticalCount = issues.filter(i => i.riskLevel === SafetyRiskLevel.CRITICAL).length;
    const highCount = issues.filter(i => i.riskLevel === SafetyRiskLevel.HIGH).length;

    let summary = `Verificação de segurança REPROVADA (${riskLevel}). `;
    summary += `${issues.length} problemas identificados`;
    
    if (criticalCount > 0) {
      summary += ` incluindo ${criticalCount} crítico(s)`;
    }
    
    if (highCount > 0) {
      summary += ` e ${highCount} de alto risco`;
    }

    summary += '. Intervenção necessária antes da administração.';

    return summary;
  }

  // Implementações stub para verificações adicionais
  private async checkContraindications(patient: any, medications: any[]): Promise<SafetyIssueDto[]> {
    // TODO: Implementar verificação de contraindicações
    return [];
  }

  private async checkDuplicateTherapy(patientId: string, medications: any[]): Promise<SafetyIssueDto[]> {
    // TODO: Implementar verificação de terapia duplicada
    return [];
  }

  private async checkAgeRestrictions(patient: any, medications: any[]): Promise<SafetyIssueDto[]> {
    // TODO: Implementar verificação de restrições por idade
    return [];
  }

  private async checkRenalFunction(patient: any, medications: any[]): Promise<SafetyIssueDto[]> {
    // TODO: Implementar verificação de função renal
    return [];
  }

  private async checkHepaticFunction(patient: any, medications: any[]): Promise<SafetyIssueDto[]> {
    // TODO: Implementar verificação de função hepática
    return [];
  }
}