import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionSeverity, EvidenceLevel } from '@prisma/client';

export class InteractionReferenceDto {
  @ApiProperty({
    description: 'Título da referência',
    example: 'Drug Interactions in Clinical Practice',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Autores',
    example: 'Silva JA, Santos MB',
  })
  @IsString()
  @IsNotEmpty()
  authors: string;

  @ApiProperty({
    description: 'Fonte/Journal',
    example: 'Brazilian Journal of Clinical Pharmacology',
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: 'Ano de publicação',
    example: 2023,
  })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiProperty({
    description: 'DOI ou URL',
    example: 'https://doi.org/10.1234/bjcp.2023.001',
    required: false,
  })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiProperty({
    description: 'PMID (PubMed ID)',
    example: '12345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  pmid?: string;
}

export class CreateInteractionDto {
  @ApiProperty({
    description: 'ID do primeiro medicamento',
    example: 'cuid123456789',
  })
  @IsString()
  @IsNotEmpty()
  medicationAId: string;

  @ApiProperty({
    description: 'ID do segundo medicamento',
    example: 'cuid987654321',
  })
  @IsString()
  @IsNotEmpty()
  medicationBId: string;

  @ApiProperty({
    description: 'Severidade da interação',
    enum: InteractionSeverity,
    example: InteractionSeverity.MODERATE,
  })
  @IsEnum(InteractionSeverity)
  severity: InteractionSeverity;

  @ApiProperty({
    description: 'Mecanismo da interação',
    example: 'Inibição competitiva da enzima CYP2D6, resultando em aumento da concentração plasmática do medicamento A',
  })
  @IsString()
  @IsNotEmpty()
  mechanism: string;

  @ApiProperty({
    description: 'Efeito clínico da interação',
    example: 'Aumento do risco de cardiotoxicidade e prolongamento do intervalo QT',
  })
  @IsString()
  @IsNotEmpty()
  clinicalEffect: string;

  @ApiProperty({
    description: 'Recomendação clínica',
    example: 'Evitar uso concomitante. Se necessário, monitorar ECG e ajustar dosagem conforme níveis séricos.',
  })
  @IsString()
  @IsNotEmpty()
  recommendation: string;

  @ApiProperty({
    description: 'Nível de evidência científica',
    enum: EvidenceLevel,
    example: EvidenceLevel.B,
  })
  @IsEnum(EvidenceLevel)
  evidenceLevel: EvidenceLevel;

  @ApiProperty({
    description: 'Referências bibliográficas',
    type: [InteractionReferenceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionReferenceDto)
  references?: InteractionReferenceDto[];

  @ApiProperty({
    description: 'Informações adicionais específicas para idosos',
    example: 'Risco aumentado em pacientes > 65 anos devido à redução do clearance renal',
    required: false,
  })
  @IsOptional()
  @IsString()
  elderlyConsiderations?: string;

  @ApiProperty({
    description: 'Informações específicas para insuficiência renal',
    example: 'Ajuste de dose necessário em TFG < 30 mL/min',
    required: false,
  })
  @IsOptional()
  @IsString()
  renalConsiderations?: string;

  @ApiProperty({
    description: 'Informações específicas para insuficiência hepática',
    example: 'Contraindicado em Child-Pugh C',
    required: false,
  })
  @IsOptional()
  @IsString()
  hepaticConsiderations?: string;

  @ApiProperty({
    description: 'Tempo de início esperado da interação',
    example: '2-4 horas após administração concomitante',
    required: false,
  })
  @IsOptional()
  @IsString()
  onsetTime?: string;

  @ApiProperty({
    description: 'Duração esperada da interação',
    example: '24-48 horas após descontinuação',
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({
    description: 'Nível de confiança na interação (1-5)',
    example: 4,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  confidenceLevel?: number;

  @ApiProperty({
    description: 'Tags para categorização',
    example: ['cardiovascular', 'cyp2d6', 'qt-prolongation'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}