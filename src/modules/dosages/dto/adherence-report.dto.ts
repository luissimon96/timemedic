import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsDateString, 
  IsOptional, 
  IsUUID, 
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';

export enum AdherenceReportPeriod {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  CUSTOM = 'CUSTOM'
}

export enum AdherenceRiskLevel {
  LOW = 'LOW',           // > 90%
  MODERATE = 'MODERATE', // 80-90%
  HIGH = 'HIGH',         // 60-80%
  CRITICAL = 'CRITICAL'  // < 60%
}

export class AdherenceReportRequestDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({
    enum: AdherenceReportPeriod,
    description: 'Período do relatório',
    default: AdherenceReportPeriod.LAST_30_DAYS
  })
  @IsOptional()
  @IsEnum(AdherenceReportPeriod)
  period?: AdherenceReportPeriod;

  @ApiPropertyOptional({
    description: 'Data de início (para período customizado)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim (para período customizado)',
    example: '2024-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'IDs específicos de medicamentos',
    example: ['clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx']
  })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  medicationIds?: string[];

  @ApiPropertyOptional({
    description: 'Incluir análise preditiva',
    default: false
  })
  @IsOptional()
  includePredictiveAnalysis?: boolean;
}

export class MedicationAdherenceDto {
  @ApiProperty({ description: 'ID do medicamento' })
  @Expose()
  medicationId: string;

  @ApiProperty({ description: 'Nome do medicamento' })
  @Expose()
  medicationName: string;

  @ApiProperty({ description: 'Taxa de aderência (0-100)' })
  @Expose()
  adherenceRate: number;

  @ApiProperty({ description: 'Doses totais agendadas' })
  @Expose()
  totalScheduled: number;

  @ApiProperty({ description: 'Doses tomadas' })
  @Expose()
  dosesTaken: number;

  @ApiProperty({ description: 'Doses perdidas' })
  @Expose()
  dosesMissed: number;

  @ApiProperty({ description: 'Doses atrasadas' })
  @Expose()
  dosesDelayed: number;

  @ApiProperty({ description: 'Atraso médio em minutos' })
  @Expose()
  averageDelayMinutes: number;

  @ApiProperty({ enum: AdherenceRiskLevel, description: 'Nível de risco' })
  @Expose()
  riskLevel: AdherenceRiskLevel;

  @ApiProperty({ description: 'Dias consecutivos sem perder dose' })
  @Expose()
  consecutiveDaysOnTime: number;

  @ApiProperty({ description: 'Última dose tomada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  lastTaken?: Date;

  @ApiProperty({ description: 'Próxima dose agendada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  nextScheduled?: Date;
}

export class AdherencePatternDto {
  @ApiProperty({ description: 'Dia da semana (0=domingo)' })
  @Expose()
  dayOfWeek: number;

  @ApiProperty({ description: 'Nome do dia' })
  @Expose()
  dayName: string;

  @ApiProperty({ description: 'Taxa de aderência do dia' })
  @Expose()
  adherenceRate: number;

  @ApiProperty({ description: 'Horário com maior taxa de perda' })
  @Expose()
  worstTimeSlot: string;

  @ApiProperty({ description: 'Horário com melhor aderência' })
  @Expose()
  bestTimeSlot: string;
}

export class AdherenceTrendDto {
  @ApiProperty({ description: 'Data' })
  @Expose()
  @Transform(({ value }) => value.toISOString().split('T')[0])
  date: Date;

  @ApiProperty({ description: 'Taxa de aderência do dia' })
  @Expose()
  dailyRate: number;

  @ApiProperty({ description: 'Média móvel de 7 dias' })
  @Expose()
  weeklyAverage: number;

  @ApiProperty({ description: 'Doses tomadas no dia' })
  @Expose()
  dosesTaken: number;

  @ApiProperty({ description: 'Doses agendadas no dia' })
  @Expose()
  dosesScheduled: number;
}

export class AdherenceInterventionDto {
  @ApiProperty({ enum: AdherenceRiskLevel, description: 'Nível de risco que triggerou' })
  @Expose()
  triggerLevel: AdherenceRiskLevel;

  @ApiProperty({ description: 'Tipo de intervenção recomendada' })
  @Expose()
  interventionType: string;

  @ApiProperty({ description: 'Descrição da intervenção' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Prioridade (1-5)' })
  @Expose()
  priority: number;

  @ApiProperty({ description: 'Data recomendada para ação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  recommendedDate: Date;

  @ApiProperty({ description: 'Contato do responsável' })
  @Expose()
  responsibleContact?: string;
}

export class AdherenceReportDto {
  @ApiProperty({ description: 'ID do paciente' })
  @Expose()
  patientId: string;

  @ApiProperty({ description: 'Período do relatório' })
  @Expose()
  reportPeriod: string;

  @ApiProperty({ description: 'Data de início' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  startDate: Date;

  @ApiProperty({ description: 'Data de fim' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  endDate: Date;

  @ApiProperty({ description: 'Taxa geral de aderência' })
  @Expose()
  overallAdherenceRate: number;

  @ApiProperty({ enum: AdherenceRiskLevel, description: 'Nível de risco geral' })
  @Expose()
  overallRiskLevel: AdherenceRiskLevel;

  @ApiProperty({ description: 'Aderência por medicamento', type: [MedicationAdherenceDto] })
  @Expose()
  @Type(() => MedicationAdherenceDto)
  medicationAdherence: MedicationAdherenceDto[];

  @ApiProperty({ description: 'Padrões por dia da semana', type: [AdherencePatternDto] })
  @Expose()
  @Type(() => AdherencePatternDto)
  weeklyPatterns: AdherencePatternDto[];

  @ApiProperty({ description: 'Tendência temporal', type: [AdherenceTrendDto] })
  @Expose()
  @Type(() => AdherenceTrendDto)
  adherenceTrend: AdherenceTrendDto[];

  @ApiProperty({ description: 'Intervenções recomendadas', type: [AdherenceInterventionDto] })
  @Expose()
  @Type(() => AdherenceInterventionDto)
  recommendedInterventions: AdherenceInterventionDto[];

  @ApiProperty({ description: 'Resumo estatístico' })
  @Expose()
  statistics: {
    totalDoses: number;
    dosesTaken: number;
    dosesMissed: number;
    dosesDelayed: number;
    averageDelayMinutes: number;
    longestStreak: number;
    currentStreak: number;
    improvementFromLastPeriod: number;
  };

  @ApiProperty({ description: 'Observações e notas' })
  @Expose()
  clinicalNotes: string[];

  @ApiProperty({ description: 'Data de geração do relatório' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  generatedAt: Date;
}