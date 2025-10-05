import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsUUID, 
  IsEnum, 
  IsBoolean, 
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsString
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DosageFrequencyType, MealTiming } from './create-dosage.dto';
import { AdherenceRiskLevel } from './adherence-report.dto';

export class SearchDosageDto {
  @ApiPropertyOptional({
    description: 'ID do paciente',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'ID da prescrição',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @ApiPropertyOptional({
    description: 'ID do medicamento',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  medicationId?: string;

  @ApiPropertyOptional({
    enum: DosageFrequencyType,
    description: 'Tipo de frequência'
  })
  @IsOptional()
  @IsEnum(DosageFrequencyType)
  frequencyType?: DosageFrequencyType;

  @ApiPropertyOptional({
    enum: MealTiming,
    description: 'Relação com refeições'
  })
  @IsOptional()
  @IsEnum(MealTiming)
  mealTiming?: MealTiming;

  @ApiPropertyOptional({
    description: 'Apenas dosagens ativas',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({
    description: 'Apenas medicações críticas',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  criticalOnly?: boolean;

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
    enum: AdherenceRiskLevel,
    description: 'Nível mínimo de risco de aderência'
  })
  @IsOptional()
  @IsEnum(AdherenceRiskLevel)
  minAdherenceRisk?: AdherenceRiskLevel;

  @ApiPropertyOptional({
    description: 'Taxa mínima de aderência (0-100)',
    example: 80
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minAdherenceRate?: number;

  @ApiPropertyOptional({
    description: 'Incluir estatísticas de aderência',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAdherenceStats?: boolean;

  @ApiPropertyOptional({
    description: 'Busca por texto (nome do medicamento, instruções)',
    example: 'paracetamol'
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
    enum: ['startDate', 'createdAt', 'adherenceRate', 'medicationName'],
    default: 'startDate'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'startDate';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
