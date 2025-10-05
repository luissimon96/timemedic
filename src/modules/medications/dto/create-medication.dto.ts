import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ActiveSubstanceDto {
  @ApiProperty({
    description: 'Nome do princípio ativo',
    example: 'Paracetamol',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Concentração do princípio ativo',
    example: '500mg',
  })
  @IsString()
  @IsNotEmpty()
  concentration: string;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'mg',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class PackageInfoDto {
  @ApiProperty({
    description: 'Apresentação comercial',
    example: 'Comprimido revestido',
  })
  @IsString()
  @IsNotEmpty()
  presentation: string;

  @ApiProperty({
    description: 'Quantidade por embalagem',
    example: 20,
  })
  @IsString()
  @IsNotEmpty()
  quantity: string;

  @ApiProperty({
    description: 'Informações da embalagem',
    example: 'Blister com 20 comprimidos',
  })
  @IsString()
  @IsOptional()
  packagingInfo?: string;
}

export class CreateMedicationDto {
  @ApiProperty({
    description: 'Código ANVISA do medicamento',
    example: '1234567890123',
  })
  @IsString()
  @IsNotEmpty()
  anvisaCode: string;

  @ApiProperty({
    description: 'Nome comercial do medicamento',
    example: 'Tylenol',
  })
  @IsString()
  @IsNotEmpty()
  commercialName: string;

  @ApiProperty({
    description: 'Princípios ativos do medicamento',
    type: [ActiveSubstanceDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ActiveSubstanceDto)
  activeSubstance: ActiveSubstanceDto[];

  @ApiProperty({
    description: 'Forma farmacêutica',
    example: 'Comprimido revestido',
  })
  @IsString()
  @IsNotEmpty()
  pharmaceuticalForm: string;

  @ApiProperty({
    description: 'Classe terapêutica',
    example: 'Analgésicos e Antipiréticos',
  })
  @IsString()
  @IsNotEmpty()
  therapeuticClass: string;

  @ApiProperty({
    description: 'Fabricante do medicamento',
    example: 'Johnson & Johnson do Brasil Indústria e Comércio de Produtos para Saúde Ltda.',
  })
  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @ApiProperty({
    description: 'Informações da embalagem',
    type: PackageInfoDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => PackageInfoDto)
  @IsOptional()
  packageInfo?: PackageInfoDto;

  @ApiProperty({
    description: 'Contraindicações',
    example: ['Hipersensibilidade ao paracetamol', 'Insuficiência hepática grave'],
    required: false,
  })
  @IsOptional()
  contraindications?: string[];

  @ApiProperty({
    description: 'Efeitos adversos conhecidos',
    example: ['Náusea', 'Vômito', 'Erupção cutânea'],
    required: false,
  })
  @IsOptional()
  sideEffects?: string[];

  @ApiProperty({
    description: 'Diretrizes de dosagem',
    example: {
      adult: 'Adultos: 500mg a 1g, 4 vezes ao dia',
      pediatric: 'Crianças: 10-15mg/kg de peso, a cada 6 horas'
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  dosageGuidelines?: Record<string, any>;
}