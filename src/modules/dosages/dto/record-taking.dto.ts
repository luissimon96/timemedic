import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsUUID, 
  IsDateString, 
  IsOptional, 
  IsString, 
  IsObject, 
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TakingStatus {
  TAKEN = 'TAKEN',
  MISSED = 'MISSED',
  DELAYED = 'DELAYED',
  SKIPPED = 'SKIPPED',
  PARTIAL = 'PARTIAL'
}

export enum DelayReason {
  FORGOT = 'FORGOT',
  SIDE_EFFECTS = 'SIDE_EFFECTS',
  UNAVAILABLE = 'UNAVAILABLE',
  SLEEPING = 'SLEEPING',
  TRAVELING = 'TRAVELING',
  WORK = 'WORK',
  MEAL_TIMING = 'MEAL_TIMING',
  OTHER = 'OTHER'
}

export enum SideEffectSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE'
}

export class SideEffectDto {
  @ApiProperty({
    description: 'Descrição do efeito colateral',
    example: 'Náusea leve'
  })
  @IsString()
  description: string;

  @ApiProperty({
    enum: SideEffectSeverity,
    description: 'Severidade do efeito'
  })
  @IsEnum(SideEffectSeverity)
  severity: SideEffectSeverity;

  @ApiPropertyOptional({
    description: 'Duração em minutos',
    example: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440) // 24 horas
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Ação tomada',
    example: 'Tomei com alimento'
  })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}

export class RecordTakingDto {
  @ApiProperty({
    description: 'ID do agendamento de dose',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  scheduleId: string;

  @ApiProperty({
    enum: TakingStatus,
    description: 'Status da tomada'
  })
  @IsEnum(TakingStatus)
  status: TakingStatus;

  @ApiPropertyOptional({
    description: 'Hora real da tomada (se diferente do agendado)',
    example: '2024-01-15T08:30:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  actualTime?: string;

  @ApiPropertyOptional({
    enum: DelayReason,
    description: 'Motivo do atraso ou não tomada'
  })
  @IsOptional()
  @IsEnum(DelayReason)
  delayReason?: DelayReason;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do motivo',
    example: 'Estava em reunião e não consegui tomar no horário'
  })
  @IsOptional()
  @IsString()
  delayDescription?: string;

  @ApiPropertyOptional({
    description: 'Porcentagem da dose tomada (0-100)',
    example: 100,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dosagePercentage?: number;

  @ApiPropertyOptional({
    description: 'Método de administração usado',
    example: 'Via oral com água'
  })
  @IsOptional()
  @IsString()
  administrationMethod?: string;

  @ApiPropertyOptional({
    description: 'Tomado com refeição',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  takenWithFood?: boolean;

  @ApiPropertyOptional({
    description: 'Efeitos colaterais observados',
    type: [SideEffectDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SideEffectDto)
  sideEffects?: SideEffectDto[];

  @ApiPropertyOptional({
    description: 'Sintomas ou sensações após a dose',
    example: 'Senti-me melhor após 30 minutos'
  })
  @IsOptional()
  @IsString()
  symptomsAfterDose?: string;

  @ApiPropertyOptional({
    description: 'Eficácia percebida (1-10)',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  perceivedEfficacy?: number;

  @ApiPropertyOptional({
    description: 'Localização da tomada',
    example: 'Casa'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionais do paciente',
    example: 'Tudo normal, sem problemas'
  })
  @IsOptional()
  @IsString()
  patientNotes?: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais em formato JSON',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  additionalData?: object;

  @ApiPropertyOptional({
    description: 'Confirmação automática (via dispositivo)',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  automaticConfirmation?: boolean;

  @ApiPropertyOptional({
    description: 'ID do dispositivo que confirmou',
    example: 'smart-pill-dispenser-001'
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class BulkRecordTakingDto {
  @ApiProperty({
    description: 'Lista de registros de tomada',
    type: [RecordTakingDto]
  })
  @ValidateNested({ each: true })
  @Type(() => RecordTakingDto)
  takings: RecordTakingDto[];

  @ApiPropertyOptional({
    description: 'Notas gerais sobre o lote',
    example: 'Registro de fim de semana'
  })
  @IsOptional()
  @IsString()
  batchNotes?: string;

  @ApiPropertyOptional({
    description: 'Marcação temporal do lote',
    example: '2024-01-15T20:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  batchTimestamp?: string;
}