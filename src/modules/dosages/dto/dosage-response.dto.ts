import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { DosageFrequencyDto, MealTiming } from './create-dosage.dto';

export class PrescriptionSummaryDto {
  @ApiProperty({ description: 'ID da prescrição' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Nome comercial do medicamento' })
  @Expose()
  medicationName: string;

  @ApiProperty({ description: 'Código ANVISA' })
  @Expose()
  anvisaCode: string;

  @ApiProperty({ description: 'Médico prescritor' })
  @Expose()
  prescribedBy: string;

  @ApiProperty({ description: 'Indicação clínica' })
  @Expose()
  indication: string;
}

export class PatientSummaryDto {
  @ApiProperty({ description: 'ID do paciente' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID externo pseudonimizado' })
  @Expose()
  externalId: string;
}

export class AdherenceStatsDto {
  @ApiProperty({ description: 'Taxa de aderência (0-100)' })
  @Expose()
  adherenceRate: number;

  @ApiProperty({ description: 'Doses tomadas' })
  @Expose()
  dosesTaken: number;

  @ApiProperty({ description: 'Doses agendadas' })
  @Expose()
  dosesScheduled: number;

  @ApiProperty({ description: 'Doses perdidas' })
  @Expose()
  dosesMissed: number;

  @ApiProperty({ description: 'Última dose tomada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  lastTaken?: Date;

  @ApiProperty({ description: 'Próxima dose agendada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  nextScheduled?: Date;
}

export class DosageResponseDto {
  @ApiProperty({ description: 'ID único da dosagem' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID da prescrição' })
  @Expose()
  prescriptionId: string;

  @ApiProperty({ description: 'Dosagem por administração' })
  @Expose()
  dosagePerAdministration: string;

  @ApiProperty({ description: 'Configuração de frequência' })
  @Expose()
  @Type(() => DosageFrequencyDto)
  frequency: DosageFrequencyDto;

  @ApiPropertyOptional({ enum: MealTiming, description: 'Relação com refeições' })
  @Expose()
  mealTiming?: MealTiming;

  @ApiPropertyOptional({ description: 'Minutos antes/depois da refeição' })
  @Expose()
  mealOffset?: number;

  @ApiProperty({ description: 'Data de início' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  startDate: Date;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Duração máxima em dias' })
  @Expose()
  maxDurationDays?: number;

  @ApiPropertyOptional({ description: 'Instruções especiais' })
  @Expose()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Configurações de lembrete' })
  @Expose()
  reminderSettings?: object;

  @ApiProperty({ description: 'Permite ajuste pelo paciente' })
  @Expose()
  allowPatientAdjustment: boolean;

  @ApiProperty({ description: 'Janela de tolerância em minutos' })
  @Expose()
  toleranceWindowMinutes: number;

  @ApiProperty({ description: 'Medicação crítica' })
  @Expose()
  isCritical: boolean;

  @ApiProperty({ description: 'Status ativo' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Notas adicionais' })
  @Expose()
  notes?: string;

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;

  // Relacionamentos
  @ApiPropertyOptional({ description: 'Informações da prescrição' })
  @Expose()
  @Type(() => PrescriptionSummaryDto)
  prescription?: PrescriptionSummaryDto;

  @ApiPropertyOptional({ description: 'Informações do paciente' })
  @Expose()
  @Type(() => PatientSummaryDto)
  patient?: PatientSummaryDto;

  @ApiPropertyOptional({ description: 'Estatísticas de aderência' })
  @Expose()
  @Type(() => AdherenceStatsDto)
  adherenceStats?: AdherenceStatsDto;
}

export class PaginatedDosageResponseDto {
  @ApiProperty({ description: 'Lista de dosagens', type: [DosageResponseDto] })
  @Expose()
  @Type(() => DosageResponseDto)
  data: DosageResponseDto[];

  @ApiProperty({ description: 'Metadados de paginação' })
  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DosageScheduleResponseDto {
  @ApiProperty({ description: 'ID único do agendamento' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID da dosagem' })
  @Expose()
  dosageId: string;

  @ApiProperty({ description: 'Hora agendada' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  scheduledTime: Date;

  @ApiProperty({ description: 'Dosagem específica' })
  @Expose()
  dosage: string;

  @ApiPropertyOptional({ description: 'Instruções específicas' })
  @Expose()
  instructions?: string;

  @ApiProperty({ description: 'Status do agendamento' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: 'Hora real de tomada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  actualTime?: Date;

  @ApiPropertyOptional({ description: 'Motivo do atraso' })
  @Expose()
  delayReason?: string;

  @ApiPropertyOptional({ description: 'Observações do paciente' })
  @Expose()
  patientNotes?: string;

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;
}