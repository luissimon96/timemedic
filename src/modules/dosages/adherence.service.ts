import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PatternAnalysisService } from './services/pattern-analysis.service';
import {
  AdherenceReportRequestDto,
  AdherenceReportDto,
  AdherenceRiskLevel,
  MedicationAdherenceDto,
  AdherencePatternDto,
  AdherenceTrendDto,
  AdherenceInterventionDto,
} from './dto/adherence-report.dto';
import { plainToClass } from 'class-transformer';
import { startOfDay, endOfDay, subDays, format, differenceInDays } from 'date-fns';

@Injectable()
export class AdherenceService {
  private readonly logger = new Logger(AdherenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly patternAnalysisService: PatternAnalysisService,
  ) {}

  /**
   * Gera relatório completo de aderência
   */
  async generateAdherenceReport(requestDto: AdherenceReportRequestDto): Promise<AdherenceReportDto> {
    this.logger.log(`Gerando relatório de aderência para paciente ${requestDto.patientId}`);

    const { startDate, endDate } = this.calculatePeriodDates(requestDto);
    
    // Busca todas as dosagens do paciente no período
    const dosages = await this.prisma.dosage.findMany({
      where: {
        prescription: { patientId: requestDto.patientId },
        isActive: true,
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
        ...(requestDto.medicationIds && {
          prescription: {
            medicationId: { in: requestDto.medicationIds }
          }
        }),
      },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
      },
    });

    // Calcula aderência por medicamento
    const medicationAdherence = await Promise.all(
      dosages.map(dosage => this.calculateMedicationAdherence(dosage, startDate, endDate))
    );

    // Calcula aderência geral
    const overallStats = this.calculateOverallAdherence(medicationAdherence);

    // Analisa padrões semanais
    const weeklyPatterns = await this.analyzeWeeklyPatterns(requestDto.patientId, startDate, endDate);

    // Analisa tendência temporal
    const adherenceTrend = await this.analyzeAdherenceTrend(requestDto.patientId, startDate, endDate);

    // Gera intervenções recomendadas
    const recommendedInterventions = await this.generateInterventionRecommendations(
      requestDto.patientId,
      medicationAdherence,
      weeklyPatterns
    );

    // Gera notas clínicas
    const clinicalNotes = this.generateClinicalNotes(medicationAdherence, weeklyPatterns);

    const report: AdherenceReportDto = {
      patientId: requestDto.patientId,
      reportPeriod: this.formatPeriod(requestDto.period, startDate, endDate),
      startDate,
      endDate,
      overallAdherenceRate: overallStats.adherenceRate,
      overallRiskLevel: overallStats.riskLevel,
      medicationAdherence,
      weeklyPatterns,
      adherenceTrend,
      recommendedInterventions,
      statistics: overallStats.statistics,
      clinicalNotes,
      generatedAt: new Date(),
    };

    return plainToClass(AdherenceReportDto, report, { excludeExtraneousValues: true });
  }

  /**
   * Calcula aderência para um medicamento específico
   */
  private async calculateMedicationAdherence(
    dosage: any,
    startDate: Date,
    endDate: Date
  ): Promise<MedicationAdherenceDto> {
    // Busca agendamentos no período
    const schedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosageId: dosage.id,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        takings: true,
      },
    });

    // Calcula estatísticas
    const totalScheduled = schedules.length;
    const dosesTaken = schedules.filter(s => 
      s.takings.some(t => t.status === 'TAKEN')
    ).length;
    const dosesDelayed = schedules.filter(s => 
      s.takings.some(t => t.status === 'DELAYED')
    ).length;
    const dosesMissed = totalScheduled - dosesTaken - dosesDelayed;

    const adherenceRate = totalScheduled > 0 ? (dosesTaken / totalScheduled) * 100 : 0;
    const riskLevel = this.calculateRiskLevel(adherenceRate);

    // Calcula atraso médio
    const delayedTakings = schedules
      .flatMap(s => s.takings)
      .filter(t => t.actualTime && t.scheduledTime);
    
    const averageDelayMinutes = delayedTakings.length > 0 
      ? delayedTakings.reduce((sum, taking) => {
          const delay = Math.abs(taking.actualTime.getTime() - taking.scheduledTime.getTime()) / (1000 * 60);
          return sum + delay;
        }, 0) / delayedTakings.length
      : 0;

    // Calcula streak de dias consecutivos
    const consecutiveDaysOnTime = await this.calculateConsecutiveDaysOnTime(dosage.id, endDate);

    // Próximas doses
    const lastTaking = await this.prisma.dosageTaking.findFirst({
      where: {
        schedule: { dosageId: dosage.id },
        status: 'TAKEN',
      },
      orderBy: { actualTime: 'desc' },
    });

    const nextSchedule = await this.prisma.dosageSchedule.findFirst({
      where: {
        dosageId: dosage.id,
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return {
      medicationId: dosage.prescription.medicationId,
      medicationName: dosage.prescription.medication.commercialName,
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      totalScheduled,
      dosesTaken,
      dosesMissed,
      dosesDelayed,
      averageDelayMinutes: Math.round(averageDelayMinutes),
      riskLevel,
      consecutiveDaysOnTime,
      lastTaken: lastTaking?.actualTime,
      nextScheduled: nextSchedule?.scheduledTime,
    };
  }

  /**
   * Calcula aderência geral
   */
  private calculateOverallAdherence(medicationAdherence: MedicationAdherenceDto[]) {
    if (medicationAdherence.length === 0) {
      return {
        adherenceRate: 0,
        riskLevel: AdherenceRiskLevel.CRITICAL,
        statistics: {
          totalDoses: 0,
          dosesTaken: 0,
          dosesMissed: 0,
          dosesDelayed: 0,
          averageDelayMinutes: 0,
          longestStreak: 0,
          currentStreak: 0,
          improvementFromLastPeriod: 0,
        },
      };
    }

    const totalDoses = medicationAdherence.reduce((sum, med) => sum + med.totalScheduled, 0);
    const dosesTaken = medicationAdherence.reduce((sum, med) => sum + med.dosesTaken, 0);
    const dosesMissed = medicationAdherence.reduce((sum, med) => sum + med.dosesMissed, 0);
    const dosesDelayed = medicationAdherence.reduce((sum, med) => sum + med.dosesDelayed, 0);
    
    const adherenceRate = totalDoses > 0 ? (dosesTaken / totalDoses) * 100 : 0;
    const averageDelayMinutes = medicationAdherence.reduce((sum, med) => sum + med.averageDelayMinutes, 0) / medicationAdherence.length;
    const longestStreak = Math.max(...medicationAdherence.map(med => med.consecutiveDaysOnTime));
    const currentStreak = Math.min(...medicationAdherence.map(med => med.consecutiveDaysOnTime));

    return {
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      riskLevel: this.calculateRiskLevel(adherenceRate),
      statistics: {
        totalDoses,
        dosesTaken,
        dosesMissed,
        dosesDelayed,
        averageDelayMinutes: Math.round(averageDelayMinutes),
        longestStreak,
        currentStreak,
        improvementFromLastPeriod: 0, // TODO: Implementar comparação com período anterior
      },
    };
  }

  /**
   * Analisa padrões semanais de aderência
   */
  private async analyzeWeeklyPatterns(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdherencePatternDto[]> {
    const patterns: AdherencePatternDto[] = [];
    
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayStats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_scheduled,
          COUNT(CASE WHEN dt.status = 'TAKEN' THEN 1 END) as taken,
          EXTRACT(HOUR FROM ds.scheduled_time) as hour_of_day
        FROM dosage_schedules ds
        LEFT JOIN dosage_takings dt ON ds.id = dt.schedule_id
        JOIN dosages d ON ds.dosage_id = d.id
        JOIN prescriptions p ON d.prescription_id = p.id
        WHERE p.patient_id = ${patientId}
          AND ds.scheduled_time >= ${startDate}
          AND ds.scheduled_time <= ${endDate}
          AND EXTRACT(DOW FROM ds.scheduled_time) = ${dayOfWeek}
        GROUP BY EXTRACT(HOUR FROM ds.scheduled_time)
        ORDER BY hour_of_day
      `;

      const totalScheduled = (dayStats as any[]).reduce((sum, stat) => sum + Number(stat.total_scheduled), 0);
      const totalTaken = (dayStats as any[]).reduce((sum, stat) => sum + Number(stat.taken), 0);
      const adherenceRate = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0;

      // Identifica melhor e pior horário
      const hourStats = dayStats as any[];
      const bestHour = hourStats.reduce((best, current) => {
        const currentRate = Number(current.taken) / Number(current.total_scheduled);
        const bestRate = Number(best.taken) / Number(best.total_scheduled);
        return currentRate > bestRate ? current : best;
      }, hourStats[0] || { hour_of_day: 8 });

      const worstHour = hourStats.reduce((worst, current) => {
        const currentRate = Number(current.taken) / Number(current.total_scheduled);
        const worstRate = Number(worst.taken) / Number(worst.total_scheduled);
        return currentRate < worstRate ? current : worst;
      }, hourStats[0] || { hour_of_day: 20 });

      patterns.push({
        dayOfWeek,
        dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
        adherenceRate: Math.round(adherenceRate * 100) / 100,
        worstTimeSlot: `${bestHour?.hour_of_day || 8}:00`,
        bestTimeSlot: `${worstHour?.hour_of_day || 20}:00`,
      });
    }

    return patterns;
  }

  /**
   * Analisa tendência temporal de aderência
   */
  private async analyzeAdherenceTrend(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdherenceTrendDto[]> {
    const trends: AdherenceTrendDto[] = [];
    const daysDiff = differenceInDays(endDate, startDate);

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = subDays(endDate, daysDiff - i);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const dayStats = await this.prisma.dosageSchedule.findMany({
        where: {
          dosage: {
            prescription: { patientId },
          },
          scheduledTime: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          takings: true,
        },
      });

      const dosesScheduled = dayStats.length;
      const dosesTaken = dayStats.filter(s => 
        s.takings.some(t => t.status === 'TAKEN')
      ).length;
      const dailyRate = dosesScheduled > 0 ? (dosesTaken / dosesScheduled) * 100 : 0;

      // Calcula média móvel de 7 dias
      const weekStart = subDays(currentDate, 6);
      const weekEnd = endOfDay(currentDate);
      
      const weekStats = await this.prisma.dosageSchedule.findMany({
        where: {
          dosage: {
            prescription: { patientId },
          },
          scheduledTime: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          takings: true,
        },
      });

      const weeklyScheduled = weekStats.length;
      const weeklyTaken = weekStats.filter(s => 
        s.takings.some(t => t.status === 'TAKEN')
      ).length;
      const weeklyAverage = weeklyScheduled > 0 ? (weeklyTaken / weeklyScheduled) * 100 : 0;

      trends.push({
        date: currentDate,
        dailyRate: Math.round(dailyRate * 100) / 100,
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        dosesTaken,
        dosesScheduled,
      });
    }

    return trends;
  }

  /**
   * Gera recomendações de intervenção
   */
  private async generateInterventionRecommendations(
    patientId: string,
    medicationAdherence: MedicationAdherenceDto[],
    weeklyPatterns: AdherencePatternDto[]
  ): Promise<AdherenceInterventionDto[]> {
    const interventions: AdherenceInterventionDto[] = [];

    // Identifica medicamentos com baixa aderência
    const criticalMedications = medicationAdherence.filter(med => med.riskLevel === AdherenceRiskLevel.CRITICAL);
    const highRiskMedications = medicationAdherence.filter(med => med.riskLevel === AdherenceRiskLevel.HIGH);

    // Intervenções para medicamentos críticos
    criticalMedications.forEach(med => {
      interventions.push({
        triggerLevel: AdherenceRiskLevel.CRITICAL,
        interventionType: 'IMMEDIATE_MEDICAL_REVIEW',
        description: `Aderência crítica para ${med.medicationName} (${med.adherenceRate}%). Revisão médica urgente necessária.`,
        priority: 5,
        recommendedDate: new Date(),
        responsibleContact: 'Médico prescritor',
      });
    });

    // Intervenções para medicamentos de alto risco
    highRiskMedications.forEach(med => {
      interventions.push({
        triggerLevel: AdherenceRiskLevel.HIGH,
        interventionType: 'MEDICATION_COUNSELING',
        description: `Aconselhamento farmacêutico para ${med.medicationName}. Identificar barreiras à aderência.`,
        priority: 4,
        recommendedDate: new Date(),
        responsibleContact: 'Farmacêutico clínico',
      });
    });

    // Análise de padrões semanais
    const problemDays = weeklyPatterns.filter(pattern => pattern.adherenceRate < 70);
    if (problemDays.length > 0) {
      interventions.push({
        triggerLevel: AdherenceRiskLevel.MODERATE,
        interventionType: 'SCHEDULE_OPTIMIZATION',
        description: `Baixa aderência nos dias: ${problemDays.map(d => d.dayName).join(', ')}. Considerar ajuste de horários.`,
        priority: 3,
        recommendedDate: new Date(),
        responsibleContact: 'Farmacêutico clínico',
      });
    }

    // Lembretes e tecnologia
    const overallAdherence = medicationAdherence.reduce((sum, med) => sum + med.adherenceRate, 0) / medicationAdherence.length;
    if (overallAdherence < 85) {
      interventions.push({
        triggerLevel: AdherenceRiskLevel.MODERATE,
        interventionType: 'TECHNOLOGY_ENHANCEMENT',
        description: 'Implementar lembretes inteligentes e dispositivos de apoio à aderência.',
        priority: 2,
        recommendedDate: new Date(),
        responsibleContact: 'Equipe de tecnologia',
      });
    }

    return interventions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Atualiza estatísticas de aderência em background
   */
  async updateAdherenceStats(dosageId: string): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30); // Últimos 30 dias

      const stats = await this.getBasicStats(dosageId, startDate, endDate);
      
      // Salva no cache para consultas rápidas
      await this.prisma.systemConfig.upsert({
        where: { key: `adherence_stats_${dosageId}` },
        update: { 
          value: stats,
          updatedAt: new Date(),
        },
        create: {
          key: `adherence_stats_${dosageId}`,
          value: stats,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao atualizar estatísticas de aderência para dosagem ${dosageId}:`, error);
    }
  }

  /**
   * Obtém estatísticas básicas de aderência
   */
  async getBasicStats(dosageId: string, startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || subDays(end, 30);

    const schedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosageId,
        scheduledTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        takings: true,
      },
    });

    const totalScheduled = schedules.length;
    const dosesTaken = schedules.filter(s => 
      s.takings.some(t => t.status === 'TAKEN')
    ).length;
    const dosesMissed = totalScheduled - dosesTaken;
    const adherenceRate = totalScheduled > 0 ? (dosesTaken / totalScheduled) * 100 : 0;

    const lastTaking = await this.prisma.dosageTaking.findFirst({
      where: {
        schedule: { dosageId },
        status: 'TAKEN',
      },
      orderBy: { actualTime: 'desc' },
    });

    const nextSchedule = await this.prisma.dosageSchedule.findFirst({
      where: {
        dosageId,
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return {
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      dosesTaken,
      dosesScheduled: totalScheduled,
      dosesMissed,
      lastTaken: lastTaking?.actualTime,
      nextScheduled: nextSchedule?.scheduledTime,
      riskLevel: this.calculateRiskLevel(adherenceRate),
    };
  }

  /**
   * Métodos auxiliares privados
   */
  private calculatePeriodDates(requestDto: AdherenceReportRequestDto) {
    const now = new Date();
    
    if (requestDto.period === 'CUSTOM' && requestDto.startDate && requestDto.endDate) {
      return {
        startDate: new Date(requestDto.startDate),
        endDate: new Date(requestDto.endDate),
      };
    }

    const daysMap = {
      'LAST_7_DAYS': 7,
      'LAST_30_DAYS': 30,
      'LAST_90_DAYS': 90,
    };

    const days = daysMap[requestDto.period] || 30;
    return {
      startDate: subDays(now, days),
      endDate: now,
    };
  }

  private calculateRiskLevel(adherenceRate: number): AdherenceRiskLevel {
    if (adherenceRate >= 90) return AdherenceRiskLevel.LOW;
    if (adherenceRate >= 80) return AdherenceRiskLevel.MODERATE;
    if (adherenceRate >= 60) return AdherenceRiskLevel.HIGH;
    return AdherenceRiskLevel.CRITICAL;
  }

  private async calculateConsecutiveDaysOnTime(dosageId: string, endDate: Date): Promise<number> {
    // Implementação simplificada - busca últimos 30 dias
    const startDate = subDays(endDate, 30);
    
    const dailyStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(ds.scheduled_time) as schedule_date,
        COUNT(*) as total_scheduled,
        COUNT(CASE WHEN dt.status = 'TAKEN' THEN 1 END) as taken
      FROM dosage_schedules ds
      LEFT JOIN dosage_takings dt ON ds.id = dt.schedule_id
      WHERE ds.dosage_id = ${dosageId}
        AND ds.scheduled_time >= ${startDate}
        AND ds.scheduled_time <= ${endDate}
      GROUP BY DATE(ds.scheduled_time)
      ORDER BY schedule_date DESC
    `;

    let consecutiveDays = 0;
    for (const day of dailyStats as any[]) {
      const adherenceRate = Number(day.taken) / Number(day.total_scheduled);
      if (adherenceRate >= 0.8) { // 80% considerado "on time"
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  private formatPeriod(period: string, startDate: Date, endDate: Date): string {
    if (period === 'CUSTOM') {
      return `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`;
    }
    
    const periodMap = {
      'LAST_7_DAYS': 'Últimos 7 dias',
      'LAST_30_DAYS': 'Últimos 30 dias',
      'LAST_90_DAYS': 'Últimos 90 dias',
    };

    return periodMap[period] || 'Período personalizado';
  }

  private generateClinicalNotes(
    medicationAdherence: MedicationAdherenceDto[],
    weeklyPatterns: AdherencePatternDto[]
  ): string[] {
    const notes: string[] = [];

    // Análise geral
    const overallAdherence = medicationAdherence.reduce((sum, med) => sum + med.adherenceRate, 0) / medicationAdherence.length;
    notes.push(`Taxa de aderência geral: ${overallAdherence.toFixed(1)}%`);

    // Medicamentos problemáticos
    const problematicMeds = medicationAdherence.filter(med => med.adherenceRate < 70);
    if (problematicMeds.length > 0) {
      notes.push(`Medicamentos com baixa aderência: ${problematicMeds.map(m => m.medicationName).join(', ')}`);
    }

    // Padrões semanais
    const problemDays = weeklyPatterns.filter(p => p.adherenceRate < 70);
    if (problemDays.length > 0) {
      notes.push(`Dias da semana com maior dificuldade: ${problemDays.map(d => d.dayName).join(', ')}`);
    }

    // Recomendações gerais
    if (overallAdherence < 85) {
      notes.push('Recomenda-se intensificação das estratégias de apoio à aderência');
    }

    return notes;
  }
}