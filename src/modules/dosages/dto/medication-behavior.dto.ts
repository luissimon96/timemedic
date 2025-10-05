import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MedicationBehaviorDto {
  @ApiProperty({ description: 'ID do medicamento' })
  @Expose()
  medicationId: string;

  @ApiProperty({ description: 'Nome do medicamento' })
  @Expose()
  medicationName: string;

  @ApiProperty({ description: 'Padrão de aderência' })
  @Expose()
  adherencePattern: string;

  @ApiProperty({ description: 'Horário preferido' })
  @Expose()
  preferredTime: string;

  @ApiProperty({ description: 'Principais barreiras' })
  @Expose()
  barriers: string[];

  @ApiPropertyOptional({ description: 'Insights comportamentais' })
  @Expose()
  behaviorInsights?: string[];
}
