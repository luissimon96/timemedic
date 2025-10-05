import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class AdherenceMetricsDto {
  @ApiProperty({ description: 'Taxa de aderência (0-100)' })
  @Expose()
  adherenceRate: number;

  @ApiProperty({ description: 'Período de cálculo' })
  @Expose()
  period: string;

  @ApiProperty({ description: 'Total de doses agendadas' })
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

  @ApiProperty({ description: 'Última atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  lastUpdated: Date;
}
