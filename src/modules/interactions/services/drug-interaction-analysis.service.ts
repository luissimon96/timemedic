import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { InteractionSeverity } from '@prisma/client';

export interface InteractionAnalysisOptions {
  includeMinor?: boolean;
  checkElderlySpecific?: boolean;
  patientAge?: number;
  renalFunction?: string;
  hepaticFunction?: string;
  considerPharmacogenetics?: boolean;
}

export interface AnalysisResult {
  hasInteractions: boolean;
  interactions: any[];
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  hasContraindications: boolean;
  summary: string;
  elderlyConsiderations?: string;
}

@Injectable()
export class DrugInteractionAnalysisService {
  private readonly logger = new Logger(DrugInteractionAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analisa interações entre uma lista de medicamentos
   */
  async analyzeMedicationList(
    medicationIds: string[],
    options: InteractionAnalysisOptions = {},
  ): Promise<AnalysisResult> {
    this.logger.debug(`Analisando interações para ${medicationIds.length} medicamentos`);

    if (medicationIds.length < 2) {
      return this.createEmptyResult();
    }

    try {
      // Busca todas as interações possíveis entre os medicamentos
      const interactions = await this.findInteractionsBetweenMedications(medicationIds, options);

      // Analisa o risco geral
      const riskAnalysis = this.analyzeOverallRisk(interactions, options);

      // Gera recomendações
      const recommendations = this.generateRecommendations(interactions, options);

      // Verifica contraindicações
      const hasContraindications = interactions.some(
        i => i.severity === InteractionSeverity.CONTRAINDICATED
      );

      // Gera resumo
      const summary = this.generateSummary(interactions, riskAnalysis.overallRiskLevel);

      // Considerações para idosos
      const elderlyConsiderations = options.checkElderlySpecific 
        ? this.generateElderlyConsiderations(interactions, options)
        : undefined;

      return {
        hasInteractions: interactions.length > 0,
        interactions,
        overallRiskLevel: riskAnalysis.overallRiskLevel,
        recommendations,
        hasContraindications,
        summary,
        elderlyConsiderations,
      };
    } catch (error) {
      this.logger.error('Erro na análise de interações:', error);
      throw error;
    }
  }

  /**
   * Analisa interação específica entre dois medicamentos
   */
  async analyzeTwoMedications(
    medicationAId: string,
    medicationBId: string,
    options: InteractionAnalysisOptions = {},
  ): Promise<AnalysisResult> {
    this.logger.debug(`Analisando interação entre medicamentos: ${medicationAId} e ${medicationBId}`);

    try {
      const interaction = await this.findDirectInteraction(medicationAId, medicationBId);

      if (!interaction) {
        return this.createEmptyResult();
      }

      const interactions = [interaction];
      const riskAnalysis = this.analyzeOverallRisk(interactions, options);
      const recommendations = this.generateRecommendations(interactions, options);

      return {
        hasInteractions: true,
        interactions,
        overallRiskLevel: riskAnalysis.overallRiskLevel,
        recommendations,
        hasContraindications: interaction.severity === InteractionSeverity.CONTRAINDICATED,
        summary: this.generateSummary(interactions, riskAnalysis.overallRiskLevel),
        elderlyConsiderations: options.checkElderlySpecific 
          ? this.generateElderlyConsiderations(interactions, options)
          : undefined,
      };
    } catch (error) {
      this.logger.error('Erro na análise de interação entre dois medicamentos:', error);
      throw error;
    }
  }

  /**
   * Analisa interações para prescrições ativas de um paciente
   */
  async analyzePatientMedications(
    patientId: string,
    newMedicationId?: string,
    options: InteractionAnalysisOptions = {},
  ): Promise<AnalysisResult> {
    this.logger.debug(`Analisando medicações do paciente: ${patientId}`);

    try {
      // Busca prescrições ativas do paciente
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          prescriptions: {
            where: { isActive: true },
            include: { medication: true },
          },
        },
      });

      if (!patient) {
        throw new Error('Paciente não encontrado');
      }

      const currentMedicationIds = patient.prescriptions.map(p => p.medicationId);
      
      // Adiciona novo medicamento se fornecido
      const allMedicationIds = newMedicationId 
        ? [...currentMedicationIds, newMedicationId]
        : currentMedicationIds;

      // Enriquece opções com dados do paciente
      const enhancedOptions: InteractionAnalysisOptions = {
        ...options,
        patientAge: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : undefined,
        renalFunction: patient.renalFunction || undefined,
        hepaticFunction: patient.hepaticFunction || undefined,
      };

      return await this.analyzeMedicationList(allMedicationIds, enhancedOptions);
    } catch (error) {
      this.logger.error('Erro na análise de medicações do paciente:', error);
      throw error;
    }
  }

  /**
   * Busca interações entre lista de medicamentos
   */
  private async findInteractionsBetweenMedications(
    medicationIds: string[],
    options: InteractionAnalysisOptions,
  ): Promise<any[]> {
    const interactions: any[] = [];

    // Verifica todas as combinações possíveis de pares
    for (let i = 0; i < medicationIds.length; i++) {
      for (let j = i + 1; j < medicationIds.length; j++) {
        const interaction = await this.findDirectInteraction(medicationIds[i], medicationIds[j]);
        if (interaction && this.shouldIncludeInteraction(interaction, options)) {
          interactions.push(interaction);
        }
      }
    }

    return interactions;
  }

  /**
   * Busca interação direta entre dois medicamentos
   */
  private async findDirectInteraction(medicationAId: string, medicationBId: string): Promise<any | null> {
    // Busca em ambas as direções (A->B e B->A)
    const interaction = await this.prisma.drugInteraction.findFirst({
      where: {
        OR: [
          { medicationAId, medicationBId },
          { medicationAId: medicationBId, medicationBId: medicationAId },
        ],
      },
      include: {
        medicationA: {
          select: {
            id: true,
            commercialName: true,
            anvisaCode: true,
            therapeuticClass: true,
            activeSubstance: true,
          },
        },
        medicationB: {
          select: {
            id: true,
            commercialName: true,
            anvisaCode: true,
            therapeuticClass: true,
            activeSubstance: true,
          },
        },
      },
    });

    return interaction;
  }

  /**
   * Determina se uma interação deve ser incluída com base nas opções
   */
  private shouldIncludeInteraction(interaction: any, options: InteractionAnalysisOptions): boolean {
    // Se não incluir menores, filtra interações menores
    if (!options.includeMinor && interaction.severity === InteractionSeverity.MINOR) {
      return false;
    }

    return true;
  }

  /**
   * Analisa o risco geral baseado nas interações encontradas
   */
  private analyzeOverallRisk(
    interactions: any[],
    options: InteractionAnalysisOptions,
  ): { overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' } {
    if (interactions.length === 0) {
      return { overallRiskLevel: 'LOW' };
    }

    // Determina o maior nível de severidade
    const severities = interactions.map(i => i.severity);
    
    if (severities.includes(InteractionSeverity.CONTRAINDICATED)) {
      return { overallRiskLevel: 'CRITICAL' };
    }
    
    if (severities.includes(InteractionSeverity.MAJOR)) {
      return { overallRiskLevel: 'HIGH' };
    }
    
    if (severities.includes(InteractionSeverity.MODERATE)) {
      return { overallRiskLevel: 'MODERATE' };
    }

    // Múltiplas interações menores podem aumentar o risco
    if (severities.length > 3 && severities.every(s => s === InteractionSeverity.MINOR)) {
      return { overallRiskLevel: 'MODERATE' };
    }

    return { overallRiskLevel: 'LOW' };
  }

  /**
   * Gera recomendações baseadas nas interações
   */
  private generateRecommendations(
    interactions: any[],
    options: InteractionAnalysisOptions,
  ): string[] {
    const recommendations: string[] = [];

    for (const interaction of interactions) {
      // Adiciona recomendação específica da interação
      if (interaction.recommendation) {
        recommendations.push(interaction.recommendation);
      }

      // Recomendações baseadas na severidade
      switch (interaction.severity) {
        case InteractionSeverity.CONTRAINDICATED:
          recommendations.push('CONTRAINDICAÇÃO ABSOLUTA - Buscar alternativa terapêutica imediatamente');
          break;
        case InteractionSeverity.MAJOR:
          recommendations.push('Interação importante - Considerar alternativa ou monitorização rigorosa');
          break;
        case InteractionSeverity.MODERATE:
          recommendations.push('Monitorar paciente para sinais de interação');
          break;
      }

      // Recomendações específicas para idosos
      if (options.checkElderlySpecific && options.patientAge && options.patientAge >= 65) {
        if (interaction.elderlyConsiderations) {
          recommendations.push(`IDOSO: ${interaction.elderlyConsiderations}`);
        }
      }

      // Recomendações para função renal/hepática
      if (options.renalFunction && interaction.renalConsiderations) {
        recommendations.push(`RENAL: ${interaction.renalConsiderations}`);
      }

      if (options.hepaticFunction && interaction.hepaticConsiderations) {
        recommendations.push(`HEPÁTICO: ${interaction.hepaticConsiderations}`);
      }
    }

    // Remove duplicatas e retorna
    return [...new Set(recommendations)];
  }

  /**
   * Gera resumo da análise
   */
  private generateSummary(interactions: any[], riskLevel: string): string {
    if (interactions.length === 0) {
      return 'Nenhuma interação medicamentosa identificada';
    }

    const severityCounts = this.countBySeverity(interactions);
    let summary = '';

    if (severityCounts.contraindicated > 0) {
      summary += `${severityCounts.contraindicated} contraindicação(ões) absoluta(s). `;
    }

    if (severityCounts.major > 0) {
      summary += `${severityCounts.major} interação(ões) importante(s). `;
    }

    if (severityCounts.moderate > 0) {
      summary += `${severityCounts.moderate} interação(ões) moderada(s). `;
    }

    if (severityCounts.minor > 0) {
      summary += `${severityCounts.minor} interação(ões) menor(es). `;
    }

    summary += `Nível de risco geral: ${riskLevel}.`;

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      summary += ' AÇÃO IMEDIATA NECESSÁRIA.';
    }

    return summary;
  }

  /**
   * Gera considerações específicas para idosos
   */
  private generateElderlyConsiderations(
    interactions: any[],
    options: InteractionAnalysisOptions,
  ): string | undefined {
    if (!options.patientAge || options.patientAge < 65) {
      return undefined;
    }

    const elderlySpecificInteractions = interactions.filter(i => i.elderlyConsiderations);
    
    if (elderlySpecificInteractions.length === 0) {
      return 'Paciente idoso - monitorização geral recomendada devido à alterações farmacocinéticas relacionadas à idade';
    }

    const considerations = elderlySpecificInteractions
      .map(i => i.elderlyConsiderations)
      .filter(Boolean);

    return `PACIENTE IDOSO: ${considerations.join('. ')}.`;
  }

  /**
   * Utilitários
   */
  private createEmptyResult(): AnalysisResult {
    return {
      hasInteractions: false,
      interactions: [],
      overallRiskLevel: 'LOW',
      recommendations: [],
      hasContraindications: false,
      summary: 'Nenhuma interação medicamentosa identificada',
    };
  }

  private countBySeverity(interactions: any[]): Record<string, number> {
    const counts = {
      contraindicated: 0,
      major: 0,
      moderate: 0,
      minor: 0,
    };

    for (const interaction of interactions) {
      switch (interaction.severity) {
        case InteractionSeverity.CONTRAINDICATED:
          counts.contraindicated++;
          break;
        case InteractionSeverity.MAJOR:
          counts.major++;
          break;
        case InteractionSeverity.MODERATE:
          counts.moderate++;
          break;
        case InteractionSeverity.MINOR:
          counts.minor++;
          break;
      }
    }

    return counts;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Busca interações que podem ser relevantes baseadas em princípios ativos similares
   */
  async findPotentialInteractions(medicationId: string): Promise<any[]> {
    try {
      const medication = await this.prisma.medication.findUnique({
        where: { id: medicationId },
        select: {
          activeSubstance: true,
          therapeuticClass: true,
        },
      });

      if (!medication) {
        return [];
      }

      // Busca medicamentos com princípios ativos similares
      // Esta é uma implementação simplificada - em um sistema real seria mais sofisticada
      const potentialInteractions = await this.prisma.drugInteraction.findMany({
        where: {
          OR: [
            { medicationAId: medicationId },
            { medicationBId: medicationId },
          ],
        },
        include: {
          medicationA: true,
          medicationB: true,
        },
        take: 10, // Limita para performance
      });

      return potentialInteractions;
    } catch (error) {
      this.logger.error('Erro ao buscar interações potenciais:', error);
      return [];
    }
  }
}