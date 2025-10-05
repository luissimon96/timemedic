import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ActiveSubstanceResponseDto {
  @ApiProperty({
    description: 'Nome do princípio ativo',
    example: 'Paracetamol',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Concentração',
    example: '500mg',
  })
  @Expose()
  concentration: string;

  @ApiProperty({
    description: 'Unidade',
    example: 'mg',
  })
  @Expose()
  unit: string;
}

export class PackageInfoResponseDto {
  @ApiProperty({
    description: 'Apresentação comercial',
    example: 'Comprimido revestido',
  })
  @Expose()
  presentation: string;

  @ApiProperty({
    description: 'Quantidade por embalagem',
    example: '20',
  })
  @Expose()
  quantity: string;

  @ApiProperty({
    description: 'Informações da embalagem',
    example: 'Blister com 20 comprimidos',
  })
  @Expose()
  packagingInfo?: string;
}

export class MedicationResponseDto {
  @ApiProperty({
    description: 'ID único do medicamento',
    example: 'cuid123456789',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Código ANVISA',
    example: '1234567890123',
  })
  @Expose()
  anvisaCode: string;

  @ApiProperty({
    description: 'Nome comercial',
    example: 'Tylenol',
  })
  @Expose()
  commercialName: string;

  @ApiProperty({
    description: 'Princípios ativos',
    type: [ActiveSubstanceResponseDto],
  })
  @Expose()
  @Type(() => ActiveSubstanceResponseDto)
  activeSubstance: ActiveSubstanceResponseDto[];

  @ApiProperty({
    description: 'Forma farmacêutica',
    example: 'Comprimido revestido',
  })
  @Expose()
  pharmaceuticalForm: string;

  @ApiProperty({
    description: 'Classe terapêutica',
    example: 'Analgésicos e Antipiréticos',
  })
  @Expose()
  therapeuticClass: string;

  @ApiProperty({
    description: 'Fabricante',
    example: 'Johnson & Johnson do Brasil',
  })
  @Expose()
  manufacturer: string;

  @ApiProperty({
    description: 'Informações da embalagem',
    type: PackageInfoResponseDto,
  })
  @Expose()
  @Type(() => PackageInfoResponseDto)
  packageInfo?: PackageInfoResponseDto;

  @ApiProperty({
    description: 'Contraindicações',
    example: ['Hipersensibilidade ao paracetamol'],
  })
  @Expose()
  contraindications?: string[];

  @ApiProperty({
    description: 'Efeitos adversos',
    example: ['Náusea', 'Vômito'],
  })
  @Expose()
  sideEffects?: string[];

  @ApiProperty({
    description: 'Diretrizes de dosagem',
  })
  @Expose()
  dosageGuidelines?: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}

export class PaginatedMedicationResponseDto {
  @ApiProperty({
    description: 'Lista de medicamentos',
    type: [MedicationResponseDto],
  })
  @Expose()
  @Type(() => MedicationResponseDto)
  data: MedicationResponseDto[];

  @ApiProperty({
    description: 'Metadados de paginação',
  })
  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}