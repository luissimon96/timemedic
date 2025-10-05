import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { subDays, startOfDay, endOfDay, format, getDay } from 'date-fns';

export interface AdherencePattern {
  type: 'WEEKLY' | 'DAILY' | 'HOURLY' | 'SEASONAL';
  description: string;
  confidence: number;
  impact: 'HIGH' | 'MODERATE' | 'LOW';
  recommendations: string[];
  data: any;
}

export interface BehaviorInsight {
  category: 'TIMING' | 'FREQUENCY' | 'CONSISTENCY' | 'BARRIERS';
  insight: string;
  evidence: string[];
  actionable: boolean;
  priority: number;
}

@Injectable()
export class PatternAnalysisService {
  private readonly logger = new Logger(PatternAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analisa padrões de aderência de um paciente
   */
  async analyzeAdherencePatterns(
    patientId: string,
    days: number = 90
  ): Promise<AdherencePattern[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    this.logger.log(`Analisando padrões de aderência para paciente ${patientId}`);

    const patterns: AdherencePattern[] = [];

    // Busca dados de tomadas
    const takings = await this.getTakingData(patientId, startDate, endDate);

    if (takings.length === 0) {
      return patterns;
    }

    // Analisa padrões semanais
    const weeklyPattern = this.analyzeWeeklyPattern(takings);
    if (weeklyPattern) patterns.push(weeklyPattern);

    // Analisa padrões diários
    const dailyPattern = this.analyzeDailyPattern(takings);
    if (dailyPattern) patterns.push(dailyPattern);

    // Analisa padrões horários
    const hourlyPattern = this.analyzeHourlyPattern(takings);
    if (hourlyPattern) patterns.push(hourlyPattern);

    // Analisa tendências temporais
    const temporalPattern = this.analyzeTemporalTrends(takings);
    if (temporalPattern) patterns.push(temporalPattern);

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Gera insights comportamentais
   */
  async generateBehaviorInsights(
    patientId: string,
    days: number = 90
  ): Promise<BehaviorInsight[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const insights: BehaviorInsight[] = [];
    const takings = await this.getTakingData(patientId, startDate, endDate);

    // Analisa consistência de timing
    const timingInsight = this.analyzeTimingConsistency(takings);
    if (timingInsight) insights.push(timingInsight);

    // Analisa barreiras à aderência
    const barrierInsights = this.identifyAdherenceBarriers(takings);
    insights.push(...barrierInsights);

    // Analisa frequência de uso
    const frequencyInsight = this.analyzeUsageFrequency(takings);
    if (frequencyInsight) insights.push(frequencyInsight);

    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analisa padrão semanal
   */
  private analyzeWeeklyPattern(takings: any[]): AdherencePattern | null {
    const weeklyStats = [0, 0, 0, 0, 0, 0, 0]; // Dom a Sáb
    const weeklyTotals = [0, 0, 0, 0, 0, 0, 0];

    takings.forEach(taking => {
      const dayOfWeek = getDay(taking.scheduledTime);
      weeklyTotals[dayOfWeek]++;
      if (taking.status === 'TAKEN') {
        weeklyStats[dayOfWeek]++;
      }
    });

    const weeklyRates = weeklyStats.map((taken, i) => 
      weeklyTotals[i] > 0 ? (taken / weeklyTotals[i]) * 100 : 0
    );

    const avgRate = weeklyRates.reduce((sum, rate) => sum + rate, 0) / 7;
    const variance = weeklyRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / 7;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation > 20) { // Variação significativa
      const worstDay = weeklyRates.indexOf(Math.min(...weeklyRates));
      const bestDay = weeklyRates.indexOf(Math.max(...weeklyRates));
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      return {
        type: 'WEEKLY',
        description: `Aderência varia significativamente durante a semana`,
        confidence: Math.min(90, standardDeviation * 3),
        impact: standardDeviation > 30 ? 'HIGH' : 'MODERATE',
        recommendations: [
          `Foco especial em ${dayNames[worstDay]} (${weeklyRates[worstDay].toFixed(1)}% aderência)`,
          `Replicar estratégias de ${dayNames[bestDay]} (${weeklyRates[bestDay].toFixed(1)}% aderência)`,
          'Considerar lembretes diferenciados por dia da semana',
        ],
        data: {
          weeklyRates,
          worstDay: dayNames[worstDay],
          bestDay: dayNames[bestDay],
          variance: standardDeviation,
        },
      };
    }

    return null;
  }

  /**
   * Analisa padrão diário
   */
  private analyzeDailyPattern(takings: any[]): AdherencePattern | null {
    const dailyData = new Map<string, { taken: number; total: number }>();

    takings.forEach(taking => {
      const dateKey = format(taking.scheduledTime, 'yyyy-MM-dd');
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { taken: 0, total: 0 });
      }
      const data = dailyData.get(dateKey)!;
      data.total++;
      if (taking.status === 'TAKEN') {
        data.taken++;
      }
    });

    const dailyRates = Array.from(dailyData.values()).map(d => 
      d.total > 0 ? (d.taken / d.total) * 100 : 0
    );

    if (dailyRates.length < 7) return null;

    const avgRate = dailyRates.reduce((sum, rate) => sum + rate, 0) / dailyRates.length;
    const perfectDays = dailyRates.filter(rate => rate === 100).length;
    const perfectPercentage = (perfectDays / dailyRates.length) * 100;

    if (perfectPercentage > 70) {
      return {
        type: 'DAILY',
        description: 'Consistência diária excelente',
        confidence: perfectPercentage,
        impact: 'LOW',
        recommendations: [
          'Manter estratégias atuais',
          'Monitoramento contínuo para prevenir recidivas',
        ],
        data: {
          perfectDays,
          totalDays: dailyRates.length,
          averageRate: avgRate,
        },
      };
    } else if (perfectPercentage < 30) {
      return {
        type: 'DAILY',
        description: 'Inconsistência diária significativa',
        confidence: 90 - perfectPercentage,
        impact: 'HIGH',
        recommendations: [
          'Revisar estratégias de lembrete',
          'Identificar barreiras diárias',
          'Considerar simplificação do regime',
        ],
        data: {
          perfectDays,
          totalDays: dailyRates.length,
          averageRate: avgRate,
        },
      };
    }

    return null;
  }

  /**
   * Analisa padrão horário
   */
  private analyzeHourlyPattern(takings: any[]): AdherencePattern | null {
    const hourlyStats = new Array(24).fill(0).map(() => ({ taken: 0, total: 0 }));

    takings.forEach(taking => {
      const hour = taking.scheduledTime.getHours();
      hourlyStats[hour].total++;
      if (taking.status === 'TAKEN') {
        hourlyStats[hour].taken++;
      }
    });

    const hourlyRates = hourlyStats.map(stat => 
      stat.total > 0 ? (stat.taken / stat.total) * 100 : null
    ).filter(rate => rate !== null) as number[];

    if (hourlyRates.length < 3) return null;

    const bestHourIndex = hourlyRates.indexOf(Math.max(...hourlyRates));
    const worstHourIndex = hourlyRates.indexOf(Math.min(...hourlyRates));
    const difference = Math.max(...hourlyRates) - Math.min(...hourlyRates);

    if (difference > 30) {
      return {
        type: 'HOURLY',
        description: 'Aderência varia significativamente por horário',
        confidence: Math.min(90, difference * 2),
        impact: difference > 50 ? 'HIGH' : 'MODERATE',
        recommendations: [
          `Melhor horário: ${bestHourIndex}:00 (${hourlyRates[bestHourIndex].toFixed(1)}%)`,
          `Horário problemático: ${worstHourIndex}:00 (${hourlyRates[worstHourIndex].toFixed(1)}%)`,
          'Considerar ajuste de horários para períodos de maior aderência',
        ],
        data: {
          hourlyRates,
          bestHour: bestHourIndex,
          worstHour: worstHourIndex,
          difference,
        },
      };
    }

    return null;
  }

  /**
   * Analisa tendências temporais
   */
  private analyzeTemporalTrends(takings: any[]): AdherencePattern | null {
    // Divide em períodos de 30 dias para análise de tendência
    const periods = this.groupByPeriods(takings, 30);
    
    if (periods.length < 2) return null;

    const rates = periods.map(period => {
      const taken = period.filter(t => t.status === 'TAKEN').length;
      return period.length > 0 ? (taken / period.length) * 100 : 0;
    });

    // Calcula tendência linear simples
    const trend = this.calculateTrend(rates);
    
    if (Math.abs(trend) > 5) { // Mudança de mais de 5% por período
      return {
        type: 'SEASONAL',
        description: trend > 0 ? 'Tendência de melhora na aderência' : 'Tendência de piora na aderência',
        confidence: Math.min(90, Math.abs(trend) * 10),
        impact: Math.abs(trend) > 10 ? 'HIGH' : 'MODERATE',
        recommendations: trend > 0 ? [
          'Identificar fatores que contribuem para melhora',
          'Reforçar estratégias positivas',
        ] : [
          'Intervenção urgente necessária',
          'Investigar causas da deterioração',
          'Revisar plano de tratamento',
        ],
        data: {
          periods: rates,
          trend,
          direction: trend > 0 ? 'IMPROVING' : 'DECLINING',
        },
      };
    }

    return null;
  }

  /**
   * Analisa consistência de timing
   */
  private analyzeTimingConsistency(takings: any[]): BehaviorInsight | null {
    const takenTakings = takings.filter(t => t.status === 'TAKEN' && t.actualTime);
    
    if (takenTakings.length < 10) return null;

    const delays = takenTakings.map(taking => {
      const scheduled = new Date(taking.scheduledTime);
      const actual = new Date(taking.actualTime);
      return (actual.getTime() - scheduled.getTime()) / (1000 * 60); // minutos
    });

    const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
    const variability = Math.sqrt(
      delays.reduce((sum, delay) => sum + Math.pow(delay - avgDelay, 2), 0) / delays.length
    );

    if (variability > 60) { // Alta variabilidade (mais de 1 hora)
      return {
        category: 'TIMING',
        insight: 'Timing inconsistente das tomadas',
        evidence: [
          `Atraso médio: ${avgDelay.toFixed(1)} minutos`,
          `Variabilidade: ${variability.toFixed(1)} minutos`,
          `${delays.filter(d => Math.abs(d) > 30).length} doses com atraso >30min`,
        ],
        actionable: true,
        priority: 3,
      };
    }

    return null;
  }

  /**
   * Identifica barreiras à aderência
   */
  private identifyAdherenceBarriers(takings: any[]): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];
    
    // Analisa motivos de atrasos/faltas
    const missedTakings = takings.filter(t => t.status === 'MISSED' || t.status === 'DELAYED');
    const reasonCounts = new Map<string, number>();
    
    missedTakings.forEach(taking => {
      const reason = taking.delayReason || 'NOT_SPECIFIED';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    if (reasonCounts.size > 0) {
      const topReason = Array.from(reasonCounts.entries())
        .sort(([,a], [,b]) => b - a)[0];
      
      insights.push({
        category: 'BARRIERS',
        insight: `Principal barreira: ${this.translateReason(topReason[0])}`,
        evidence: [
          `${topReason[1]} ocorrências de ${topReason[0]}`,
          `${missedTakings.length} doses perdidas/atrasadas total`,
        ],
        actionable: true,
        priority: 4,
      });
    }

    return insights;
  }

  /**
   * Analisa frequência de uso
   */
  private analyzeUsageFrequency(takings: any[]): BehaviorInsight | null {
    const takenCount = takings.filter(t => t.status === 'TAKEN').length;
    const adherenceRate = takings.length > 0 ? (takenCount / takings.length) * 100 : 0;

    if (adherenceRate < 70) {
      return {
        category: 'FREQUENCY',
        insight: 'Frequência de uso abaixo do ideal',
        evidence: [
          `Taxa de aderência: ${adherenceRate.toFixed(1)}%`,
          `${takenCount} de ${takings.length} doses tomadas`,
        ],
        actionable: true,
        priority: 5,
      };
    }

    return null;
  }

  /**
   * Métodos auxiliares
   */
  private async getTakingData(patientId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await this.prisma.dosageTaking.findMany({
      where: {
        patientId,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  private groupByPeriods(takings: any[], daysPeriod: number): any[][] {
    const periods: any[][] = [];
    const sortedTakings = [...takings].sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    if (sortedTakings.length === 0) return periods;

    const startDate = new Date(sortedTakings[0].scheduledTime);
    let currentPeriod: any[] = [];
    let periodEnd = new Date(startDate.getTime() + daysPeriod * 24 * 60 * 60 * 1000);

    for (const taking of sortedTakings) {
      const takingDate = new Date(taking.scheduledTime);
      
      if (takingDate <= periodEnd) {
        currentPeriod.push(taking);
      } else {
        if (currentPeriod.length > 0) {
          periods.push(currentPeriod);
        }
        currentPeriod = [taking];
        periodEnd = new Date(takingDate.getTime() + daysPeriod * 24 * 60 * 60 * 1000);
      }
    }

    if (currentPeriod.length > 0) {
      periods.push(currentPeriod);
    }

    return periods;
  }

  private calculateTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * (i + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private translateReason(reason: string): string {
    const translations = {
      'FORGOT': 'Esquecimento',
      'SIDE_EFFECTS': 'Efeitos colaterais',
      'UNAVAILABLE': 'Medicamento indisponível',
      'SLEEPING': 'Paciente dormindo',
      'TRAVELING': 'Viagem',
      'WORK': 'Trabalho',
      'MEAL_TIMING': 'Timing de refeição',
      'OTHER': 'Outros motivos',
      'NOT_SPECIFIED': 'Não especificado',
    };
    return translations[reason] || reason;
  }
}
