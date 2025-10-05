import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PatternAnalysisDto {
  @ApiProperty({ description: 'Tipo de padrão' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Descrição do padrão' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Nível de confiança (0-100)' })
  @Expose()
  confidence: number;

  @ApiProperty({ description: 'Impacto do padrão' })
  @Expose()
  impact: string;

  @ApiProperty({ description: 'Recomendações' })
  @Expose()
  recommendations: string[];

  @ApiPropertyOptional({ description: 'Dados do padrão' })
  @Expose()
  data?: any;
}
