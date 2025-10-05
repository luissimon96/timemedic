import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class ScheduleResponseDto {
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

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;
}

export class PaginatedScheduleResponseDto {
  @ApiProperty({ description: 'Lista de agendamentos', type: [ScheduleResponseDto] })
  @Expose()
  @Type(() => ScheduleResponseDto)
  data: ScheduleResponseDto[];

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
