import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class AnvisaSyncDto {
  @ApiProperty({
    description: 'Código ANVISA específico para sincronização',
    example: '1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  anvisaCode?: string;

  @ApiProperty({
    description: 'Lista de códigos ANVISA para sincronização em lote',
    example: ['1234567890123', '1234567890124'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  anvisaCodes?: string[];

  @ApiProperty({
    description: 'Forçar atualização mesmo se o medicamento já existir',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean = false;

  @ApiProperty({
    description: 'Data de início para sincronização incremental (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiProperty({
    description: 'Incluir medicamentos inativos na sincronização',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean = false;
}

export class AnvisaSyncResultDto {
  @ApiProperty({
    description: 'Número de medicamentos processados',
    example: 150,
  })
  processed: number;

  @ApiProperty({
    description: 'Número de medicamentos criados',
    example: 50,
  })
  created: number;

  @ApiProperty({
    description: 'Número de medicamentos atualizados',
    example: 30,
  })
  updated: number;

  @ApiProperty({
    description: 'Número de medicamentos com erro',
    example: 2,
  })
  errors: number;

  @ApiProperty({
    description: 'Lista de erros encontrados',
    example: [
      {
        anvisaCode: '1234567890123',
        error: 'Medicamento não encontrado na base ANVISA'
      }
    ],
  })
  errorDetails: Array<{
    anvisaCode: string;
    error: string;
  }>;

  @ApiProperty({
    description: 'Duração da sincronização em segundos',
    example: 120.5,
  })
  duration: number;

  @ApiProperty({
    description: 'Timestamp da sincronização',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: Date;
}