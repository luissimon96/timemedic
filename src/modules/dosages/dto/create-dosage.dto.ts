import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsDateString, 
  IsObject, 
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DosageFrequencyType {
  FIXED_INTERVAL = 'FIXED_INTERVAL', // A cada X horas
  DAILY_TIMES = 'DAILY_TIMES',       // X vezes por dia
  WEEKLY_SCHEDULE = 'WEEKLY_SCHEDULE', // Dias específicos da semana
  PRN = 'PRN',                       // Se necessário
  CUSTOM = 'CUSTOM'                  // Padrão customizado
}

export enum MealTiming {
  BEFORE_MEAL = 'BEFORE_MEAL',
  WITH_MEAL = 'WITH_MEAL',
  AFTER_MEAL = 'AFTER_MEAL',
  EMPTY_STOMACH = 'EMPTY_STOMACH',
  ANY_TIME = 'ANY_TIME'
}

export class DosageFrequencyDto {
  @ApiProperty({
    enum: DosageFrequencyType,
    description: 'Tipo de frequência de dosagem'
  })
  @IsEnum(DosageFrequencyType)
  type: DosageFrequencyType;

  @ApiPropertyOptional({
    description: 'Intervalo em horas (para FIXED_INTERVAL)',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // Máximo 1 semana
  intervalHours?: number;

  @ApiPropertyOptional({
    description: 'Número de vezes por dia (para DAILY_TIMES)',
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  timesPerDay?: number;

  @ApiPropertyOptional({
    description: 'Horários específicos (HH:MM)',
    example: ['08:00', '14:00', '20:00']
  })
  @IsOptional()
  @IsString({ each: true })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { each: true, message: 'Formato de hora inválido (HH:MM)' })
  specificTimes?: string[];

  @ApiPropertyOptional({
    description: 'Dias da semana (0=domingo, 6=sábado)',
    example: [1, 3, 5]
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekDays?: number[];

  @ApiPropertyOptional({
    description: 'Configuração customizada em formato cron',
    example: '0 8,14,20 * * *'
  })
  @IsOptional()
  @IsString()
  customPattern?: string;
}

export class CreateDosageDto {
  @ApiProperty({
    description: 'ID da prescrição',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  prescriptionId: string;

  @ApiProperty({
    description: 'Dosagem por administração',
    example: '500mg'
  })
  @IsString()
  dosagePerAdministration: string;

  @ApiProperty({
    description: 'Configuração de frequência',
    type: DosageFrequencyDto
  })
  @ValidateNested()
  @Type(() => DosageFrequencyDto)
  frequency: DosageFrequencyDto;

  @ApiPropertyOptional({
    enum: MealTiming,
    description: 'Relação com refeições',
    default: MealTiming.ANY_TIME
  })
  @IsOptional()
  @IsEnum(MealTiming)
  mealTiming?: MealTiming;

  @ApiPropertyOptional({
    description: 'Minutos antes/depois da refeição',
    example: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(-120)
  @Max(120)
  mealOffset?: number;

  @ApiProperty({
    description: 'Data de início do tratamento',
    example: '2024-01-15T08:00:00.000Z'
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Data de fim do tratamento',
    example: '2024-02-15T08:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Duração máxima em dias',
    example: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  maxDurationDays?: number;

  @ApiPropertyOptional({
    description: 'Instruções especiais',
    example: 'Tomar com água abundante. Não mastigar.'
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({
    description: 'Configurações de lembrete específicas',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  reminderSettings?: {
    enabled?: boolean;
    advanceMinutes?: number;
    maxRetries?: number;
    escalationMinutes?: number;
    channels?: string[];
  };

  @ApiPropertyOptional({
    description: 'Permitir ajuste de horários pelo paciente',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  allowPatientAdjustment?: boolean;

  @ApiPropertyOptional({
    description: 'Janela de tolerância em minutos',
    example: 30,
    default: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(240)
  toleranceWindowMinutes?: number;

  @ApiPropertyOptional({
    description: 'Marcado como medicação crítica',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional({
    description: 'Notas adicionais',
    example: 'Paciente tem dificuldade para lembrar horários'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}