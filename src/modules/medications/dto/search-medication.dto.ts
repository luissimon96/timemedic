import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum MedicationSortBy {
  COMMERCIAL_NAME = 'commercialName',
  THERAPEUTIC_CLASS = 'therapeuticClass',
  MANUFACTURER = 'manufacturer',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchMedicationDto {
  @ApiProperty({
    description: 'Termo de busca para nome comercial ou princípio ativo',
    example: 'paracetamol',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Código ANVISA específico',
    example: '1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  anvisaCode?: string;

  @ApiProperty({
    description: 'Classe terapêutica',
    example: 'Analgésicos e Antipiréticos',
    required: false,
  })
  @IsOptional()
  @IsString()
  therapeuticClass?: string;

  @ApiProperty({
    description: 'Fabricante',
    example: 'Johnson & Johnson',
    required: false,
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({
    description: 'Forma farmacêutica',
    example: 'Comprimido',
    required: false,
  })
  @IsOptional()
  @IsString()
  pharmaceuticalForm?: string;

  @ApiProperty({
    description: 'Incluir apenas medicamentos ativos',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean = true;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Campo para ordenação',
    enum: MedicationSortBy,
    example: MedicationSortBy.COMMERCIAL_NAME,
    required: false,
    default: MedicationSortBy.COMMERCIAL_NAME,
  })
  @IsOptional()
  @IsEnum(MedicationSortBy)
  sortBy?: MedicationSortBy = MedicationSortBy.COMMERCIAL_NAME;

  @ApiProperty({
    description: 'Ordem de classificação',
    enum: SortOrder,
    example: SortOrder.ASC,
    required: false,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}