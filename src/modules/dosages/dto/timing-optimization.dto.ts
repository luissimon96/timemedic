import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TimingOptimizationDto {
  @ApiProperty({ description: 'Horário atual' })
  @Expose()
  currentTime: string;

  @ApiProperty({ description: 'Horário otimizado sugerido' })
  @Expose()
  optimizedTime: string;

  @ApiProperty({ description: 'Melhoria esperada na aderência (%)' })
  @Expose()
  expectedImprovement: number;

  @ApiProperty({ description: 'Justificativa da otimização' })
  @Expose()
  justification: string;

  @ApiPropertyOptional({ description: 'Fatores considerados' })
  @Expose()
  factors?: string[];
}
