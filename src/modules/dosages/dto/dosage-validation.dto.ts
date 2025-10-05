import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DosageValidationDto {
  @ApiProperty({ description: 'Validação passou' })
  @Expose()
  isValid: boolean;

  @ApiProperty({ description: 'Lista de erros' })
  @Expose()
  errors: string[];

  @ApiProperty({ description: 'Lista de avisos' })
  @Expose()
  warnings: string[];
}
