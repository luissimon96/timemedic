import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InteractionSeverity, EvidenceLevel } from '@prisma/client';

export enum InteractionSortBy {
  SEVERITY = 'severity',
  EVIDENCE_LEVEL = 'evidenceLevel',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchInteractionDto {
  @ApiProperty({
    description: 'ID do medicamento A',
    example: 'cuid123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicationAId?: string;

  @ApiProperty({
    description: 'ID do medicamento B',
    example: 'cuid987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicationBId?: string;

  @ApiProperty({
    description: 'Lista de IDs de medicamentos para verificar interações',
    example: ['cuid123456789', 'cuid987654321'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicationIds?: string[];

  @ApiProperty({
    description: 'Termo de busca para mecanismo ou efeito clínico',
    example: 'cyp2d6',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Severidade específica',
    enum: InteractionSeverity,
    example: InteractionSeverity.MAJOR,
    required: false,
  })
  @IsOptional()
  @IsEnum(InteractionSeverity)
  severity?: InteractionSeverity;

  @ApiProperty({
    description: 'Severidade mínima para filtrar',
    enum: InteractionSeverity,
    required: false,
  })
  @IsOptional()
  @IsEnum(InteractionSeverity)
  minSeverity?: InteractionSeverity;

  @ApiProperty({
    description: 'Nível de evidência',
    enum: EvidenceLevel,
    example: EvidenceLevel.A,
    required: false,
  })
  @IsOptional()
  @IsEnum(EvidenceLevel)
  evidenceLevel?: EvidenceLevel;

  @ApiProperty({
    description: 'Tags para filtrar',
    example: ['cardiovascular', 'cyp2d6'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Incluir considerações para idosos',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  elderlyOnly?: boolean;

  @ApiProperty({
    description: 'Confiança mínima (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minConfidence?: number;

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
    enum: InteractionSortBy,
    example: InteractionSortBy.SEVERITY,
    required: false,
    default: InteractionSortBy.SEVERITY,
  })
  @IsOptional()
  @IsEnum(InteractionSortBy)
  sortBy?: InteractionSortBy = InteractionSortBy.SEVERITY;

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