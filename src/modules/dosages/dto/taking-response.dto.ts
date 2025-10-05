import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { TakingStatus, DelayReason, SideEffectDto } from './record-taking.dto';

export class TakingResponseDto {
  @ApiProperty({ description: 'ID único do registro' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID do paciente' })
  @Expose()
  patientId: string;

  @ApiProperty({ description: 'ID do agendamento' })
  @Expose()
  scheduleId: string;

  @ApiProperty({ description: 'Hora agendada' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  scheduledTime: Date;

  @ApiPropertyOptional({ description: 'Hora real da tomada' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  actualTime?: Date;

  @ApiProperty({ enum: TakingStatus, description: 'Status da tomada' })
  @Expose()
  status: TakingStatus;

  @ApiPropertyOptional({ enum: DelayReason, description: 'Motivo do atraso' })
  @Expose()
  delayReason?: DelayReason;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @Expose()
  delayDescription?: string;

  @ApiProperty({ description: 'Porcentagem da dose tomada' })
  @Expose()
  dosagePercentage: number;

  @ApiPropertyOptional({ description: 'Método de administração' })
  @Expose()
  administrationMethod?: string;

  @ApiProperty({ description: 'Tomado com alimento' })
  @Expose()
  takenWithFood: boolean;

  @ApiPropertyOptional({ description: 'Efeitos colaterais', type: [SideEffectDto] })
  @Expose()
  @Type(() => SideEffectDto)
  sideEffects?: SideEffectDto[];

  @ApiPropertyOptional({ description: 'Sintomas após dose' })
  @Expose()
  symptomsAfterDose?: string;

  @ApiPropertyOptional({ description: 'Eficácia percebida (1-10)' })
  @Expose()
  perceivedEfficacy?: number;

  @ApiPropertyOptional({ description: 'Localização da tomada' })
  @Expose()
  location?: string;

  @ApiPropertyOptional({ description: 'Notas do paciente' })
  @Expose()
  patientNotes?: string;

  @ApiPropertyOptional({ description: 'Dados adicionais' })
  @Expose()
  additionalData?: object;

  @ApiProperty({ description: 'Confirmação automática' })
  @Expose()
  automaticConfirmation: boolean;

  @ApiPropertyOptional({ description: 'ID do dispositivo' })
  @Expose()
  deviceId?: string;

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;
}

export class PaginatedTakingResponseDto {
  @ApiProperty({ description: 'Lista de registros de tomada', type: [TakingResponseDto] })
  @Expose()
  @Type(() => TakingResponseDto)
  data: TakingResponseDto[];

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
