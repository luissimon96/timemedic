import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsUUID, 
  IsBoolean, 
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsString
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchPrescriptionDto {
  @ApiPropertyOptional({
    description: 'ID do paciente',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'ID do medicamento',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  medicationId?: string;

  @ApiPropertyOptional({
    description: 'ID do prescritor',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  prescriberId?: string;

  @ApiPropertyOptional({
    description: 'Apenas prescrições ativas',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({
    description: 'Data de início - filtro a partir de',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Data de início - filtro até',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: 'Classe terapêutica',
    example: 'Anti-hipertensivo'
  })
  @IsOptional()
  @IsString()
  therapeuticClass?: string;

  @ApiPropertyOptional({
    description: 'Indicação clínica',
    example: 'Hipertensão'
  })
  @IsOptional()
  @IsString()
  indication?: string;

  @ApiPropertyOptional({
    description: 'Busca por texto (nome do medicamento, indicação, instruções)',
    example: 'losartana'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 20,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    enum: ['prescriptionDate', 'startDate', 'medicationName'],
    default: 'prescriptionDate'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'prescriptionDate';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
