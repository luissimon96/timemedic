import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AllergyType, AllergySeverity } from '@prisma/client';

export enum AllergySortBy {
  ALLERGEN = 'allergen',
  SEVERITY = 'severity',
  ONSET_DATE = 'onsetDate',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchAllergyDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'cuid123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({
    description: 'Termo de busca para nome do alérgeno',
    example: 'penicilina',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Tipo específico de alergia',
    enum: AllergyType,
    example: AllergyType.DRUG,
    required: false,
  })
  @IsOptional()
  @IsEnum(AllergyType)
  allergyType?: AllergyType;

  @ApiProperty({
    description: 'Severidade específica',
    enum: AllergySeverity,
    example: AllergySeverity.SEVERE,
    required: false,
  })
  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @ApiProperty({
    description: 'Incluir apenas alergias ativas',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean = true;

  @ApiProperty({
    description: 'Incluir apenas alergias com evidência laboratorial',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withLabTestsOnly?: boolean;

  @ApiProperty({
    description: 'Severidade mínima para filtrar',
    enum: AllergySeverity,
    required: false,
  })
  @IsOptional()
  @IsEnum(AllergySeverity)
  minSeverity?: AllergySeverity;

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
    enum: AllergySortBy,
    example: AllergySortBy.SEVERITY,
    required: false,
    default: AllergySortBy.SEVERITY,
  })
  @IsOptional()
  @IsEnum(AllergySortBy)
  sortBy?: AllergySortBy = AllergySortBy.SEVERITY;

  @ApiProperty({
    description: 'Ordem de classificação',
    enum: SortOrder,
    example: SortOrder.DESC,
    required: false,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}