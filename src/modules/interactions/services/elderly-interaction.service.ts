import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ElderlyInteractionResult {
  hasElderlySpecificRisks: boolean;
  risks: string[];
  recommendations: string[];
  adjustmentNeeded: boolean;
}

@Injectable()
export class ElderlyInteractionService {
  private readonly logger = new Logger(ElderlyInteractionService.name);

  // Medicamentos com riscos aumentados em idosos
  private readonly elderlyRiskyMedications = new Set([
    'benzodiazepina', 'zolpidem', 'dipirona', 'diazepam', 'clonazepam',
    'amitriptilina', 'fluoxetina', 'haloperidol', 'risperidona',
    'digoxina', 'varfarina', 'insulina', 'metformina'
  ]);

  // Interações com risco aumentado em idosos
  private readonly elderlyRiskyInteractions = new Map([
    ['anticoagulante + anti-inflamatório', 'Risco aumentado de sangramento gastrointestinal'],
    ['diurético + digoxina', 'Risco de intoxicação digitálica por hipocalemia'],
    ['sedativo + sedativo', 'Risco de queda e confusão mental'],
    ['antihipertensivo + vasodilatador', 'Risco de hipotensão e quedas'],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analisa riscos específicos para pacientes idosos
   */
  async analyzeElderlyRisks(
    patientId: string,
    medicationIds?: string[]
  ): Promise<ElderlyInteractionResult> {
    this.logger.debug(`Analisando riscos geriátricos para paciente: ${patientId}`);

    try {
      // Busca dados do paciente
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

      const age = this.calculateAge(patient.dateOfBirth);
      
      if (age < 65) {
        return {
          hasElderlySpecificRisks: false,
          risks: [],
          recommendations: [],
          adjustmentNeeded: false,
        };
      }

      // Determina medicamentos a analisar
      const medications = medicationIds
        ? await this.prisma.medication.findMany({
            where: { id: { in: medicationIds } },
          })
        : patient.prescriptions.map(p => p.medication);

      const risks: string[] = [];
      const recommendations: string[] = [];
      let adjustmentNeeded = false;

      // Analisa medicamentos individuais
      for (const medication of medications) {
        const medicationRisks = this.analyzeMedicationForElderly(medication, age);
        risks.push(...medicationRisks.risks);
        recommendations.push(...medicationRisks.recommendations);
        if (medicationRisks.adjustmentNeeded) adjustmentNeeded = true;
      }

      // Analisa interações específicas para idosos
      const interactionRisks = this.analyzeElderlySpecificInteractions(medications);
      risks.push(...interactionRisks.risks);
      recommendations.push(...interactionRisks.recommendations);

      // Adiciona recomendações gerais para idosos
      recommendations.push(...this.getGeneralElderlyRecommendations(age));

      return {
        hasElderlySpecificRisks: risks.length > 0,
        risks: [...new Set(risks)], // Remove duplicatas
        recommendations: [...new Set(recommendations)],
        adjustmentNeeded,
      };
    } catch (error) {
      this.logger.error('Erro na análise de riscos geriátricos:', error);
      throw error;
    }
  }

  /**
   * Analisa medicamento específico para paciente idoso
   */
  private analyzeMedicationForElderly(
    medication: any,
    age: number
  ): { risks: string[]; recommendations: string[]; adjustmentNeeded: boolean } {
    const risks: string[] = [];
    const recommendations: string[] = [];
    let adjustmentNeeded = false;

    const medicationName = medication.commercialName.toLowerCase();
    const activeSubstances = medication.activeSubstance || [];

    // Verifica medicamentos com riscos conhecidos em idosos
    for (const riskyMed of this.elderlyRiskyMedications) {
      if (medicationName.includes(riskyMed) || 
          activeSubstances.some((sub: any) => sub.name.toLowerCase().includes(riskyMed))) {
        
        risks.push(`${medication.commercialName} possui risco aumentado em idosos`);
        
        switch (riskyMed) {
          case 'benzodiazepina':
          case 'zolpidem':
            recommendations.push('Considerar redução de dose e monitorar risco de quedas');
            recommendations.push('Avaliar necessidade de uso contínuo');
            adjustmentNeeded = true;
            break;
          case 'digoxina':
            recommendations.push('Monitorar níveis séricos e função renal');
            adjustmentNeeded = true;
            break;
          case 'varfarina':
            recommendations.push('Monitoramento mais frequente do INR');
            adjustmentNeeded = true;
            break;
          case 'metformina':
            recommendations.push('Verificar função renal antes do uso');
            break;
        }
      }
    }

    // Riscos específicos por idade
    if (age >= 80) {
      risks.push('Paciente com idade ≥ 80 anos - risco aumentado de eventos adversos');
      recommendations.push('Iniciar com doses menores e titular gradualmente');
      adjustmentNeeded = true;
    }

    return { risks, recommendations, adjustmentNeeded };
  }

  /**
   * Analisa interações específicas para idosos
   */
  private analyzeElderlySpecificInteractions(
    medications: any[]
  ): { risks: string[]; recommendations: string[] } {
    const risks: string[] = [];
    const recommendations: string[] = [];

    const medicationClasses = medications.map(med => {
      const name = med.commercialName.toLowerCase();
      const therapeuticClass = med.therapeuticClass.toLowerCase();
      
      // Classifica medicamentos por tipo
      if (therapeuticClass.includes('anticoagulante') || name.includes('varfarina')) {
        return 'anticoagulante';
      }
      if (therapeuticClass.includes('anti-inflamatório') || therapeuticClass.includes('aine')) {
        return 'anti-inflamatório';
      }
      if (therapeuticClass.includes('diurético')) {
        return 'diurético';
      }
      if (therapeuticClass.includes('sedativo') || therapeuticClass.includes('ansiolítico')) {
        return 'sedativo';
      }
      if (therapeuticClass.includes('antihipertensivo')) {
        return 'antihipertensivo';
      }
      
      return therapeuticClass;
    });

    // Verifica combinações perigosas
    const classCount = new Map<string, number>();
    medicationClasses.forEach(cls => {
      classCount.set(cls, (classCount.get(cls) || 0) + 1);
    });

    // Múltiplos sedativos
    if (classCount.get('sedativo') && classCount.get('sedativo')! > 1) {
      risks.push('Múltiplos medicamentos sedativos - risco de queda em idosos');
      recommendations.push('Considerar redução ou substituição de sedativos');
    }

    // Anticoagulante + Anti-inflamatório
    if (medicationClasses.includes('anticoagulante') && medicationClasses.includes('anti-inflamatório')) {
      risks.push('Combinação anticoagulante + AINE - risco aumentado de sangramento em idosos');
      recommendations.push('Monitorar sinais de sangramento, considerar protetor gástrico');
    }

    // Múltiplos anti-hipertensivos
    if (classCount.get('antihipertensivo') && classCount.get('antihipertensivo')! > 2) {
      risks.push('Múltiplos anti-hipertensivos - risco de hipotensão e quedas em idosos');
      recommendations.push('Monitorar pressão arterial e ajustar doses conforme necessário');
    }

    return { risks, recommendations };
  }

  /**
   * Recomendações gerais para pacientes idosos
   */
  private getGeneralElderlyRecommendations(age: number): string[] {
    const recommendations = [
      'Revisar periodicamente a necessidade de todos os medicamentos',
      'Monitorar função renal e hepática regularmente',
      'Orientar sobre risco de quedas e interações',
      'Considerar impacto na qualidade de vida'
    ];

    if (age >= 80) {
      recommendations.push('Paciente muito idoso - preferência por esquemas simples');
      recommendations.push('Envolver cuidador/familiar no tratamento');
    }

    return recommendations;
  }

  private calculateAge(dateOfBirth: Date | null): number {
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
}