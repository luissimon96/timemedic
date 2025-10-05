import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InteractionSeverity, EvidenceLevel } from '@prisma/client';

export class InteractionReferenceResponseDto {
  @ApiProperty({
    description: 'Título da referência',
    example: 'Drug Interactions in Clinical Practice',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Autores',
    example: 'Silva JA, Santos MB',
  })
  @Expose()
  authors: string;

  @ApiProperty({
    description: 'Fonte/Journal',
    example: 'Brazilian Journal of Clinical Pharmacology',
  })
  @Expose()
  source: string;

  @ApiProperty({
    description: 'Ano de publicação',
    example: '2023',
  })
  @Expose()
  year: string;

  @ApiProperty({
    description: 'DOI ou URL',
    example: 'https://doi.org/10.1234/bjcp.2023.001',
  })
  @Expose()
  doi?: string;

  @ApiProperty({
    description: 'PMID (PubMed ID)',
    example: '12345678',
  })
  @Expose()
  pmid?: string;
}

export class MedicationBasicInfoDto {
  @ApiProperty({
    description: 'ID do medicamento',
    example: 'cuid987654321',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nome comercial',
    example: 'Amoxil',
  })
  @Expose()
  commercialName: string;

  @ApiProperty({
    description: 'Código ANVISA',
    example: '1234567890123',
  })
  @Expose()
  anvisaCode: string;

  @ApiProperty({
    description: 'Classe terapêutica',
    example: 'Antibióticos',
  })
  @Expose()
  therapeuticClass: string;
}

export class InteractionResponseDto {
  @ApiProperty({
    description: 'ID único da interação',
    example: 'cuid123456789',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Informações do medicamento A',
    type: MedicationBasicInfoDto,
  })
  @Expose()
  @Type(() => MedicationBasicInfoDto)
  medicationA: MedicationBasicInfoDto;

  @ApiProperty({
    description: 'Informações do medicamento B',
    type: MedicationBasicInfoDto,
  })
  @Expose()
  @Type(() => MedicationBasicInfoDto)
  medicationB: MedicationBasicInfoDto;

  @ApiProperty({
    description: 'Severidade da interação',
    enum: InteractionSeverity,
    example: InteractionSeverity.MODERATE,
  })
  @Expose()
  severity: InteractionSeverity;

  @ApiProperty({
    description: 'Mecanismo da interação',
    example: 'Inibição competitiva da enzima CYP2D6',
  })
  @Expose()
  mechanism: string;

  @ApiProperty({
    description: 'Efeito clínico',
    example: 'Aumento do risco de cardiotoxicidade',
  })
  @Expose()
  clinicalEffect: string;

  @ApiProperty({
    description: 'Recomendação clínica',
    example: 'Evitar uso concomitante',
  })
  @Expose()
  recommendation: string;

  @ApiProperty({
    description: 'Nível de evidência',
    enum: EvidenceLevel,
    example: EvidenceLevel.B,
  })
  @Expose()
  evidenceLevel: EvidenceLevel;

  @ApiProperty({
    description: 'Referências bibliográficas',
    type: [InteractionReferenceResponseDto],
  })
  @Expose()
  @Type(() => InteractionReferenceResponseDto)
  references?: InteractionReferenceResponseDto[];

  @ApiProperty({
    description: 'Considerações para idosos',
    example: 'Risco aumentado em pacientes > 65 anos',
  })
  @Expose()
  elderlyConsiderations?: string;

  @ApiProperty({
    description: 'Considerações renais',
    example: 'Ajuste de dose em TFG < 30 mL/min',
  })
  @Expose()
  renalConsiderations?: string;

  @ApiProperty({
    description: 'Considerações hepáticas',
    example: 'Contraindicado em Child-Pugh C',
  })
  @Expose()
  hepaticConsiderations?: string;

  @ApiProperty({
    description: 'Tempo de início',
    example: '2-4 horas',
  })
  @Expose()
  onsetTime?: string;

  @ApiProperty({
    description: 'Duração',
    example: '24-48 horas',
  })
  @Expose()
  duration?: string;

  @ApiProperty({
    description: 'Nível de confiança (1-5)',
    example: 4,
  })
  @Expose()
  confidenceLevel?: number;

  @ApiProperty({
    description: 'Tags',
    example: ['cardiovascular', 'cyp2d6'],
  })
  @Expose()
  tags?: string[];

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

export class PaginatedInteractionResponseDto {
  @ApiProperty({
    description: 'Lista de interações',
    type: [InteractionResponseDto],
  })
  @Expose()
  @Type(() => InteractionResponseDto)
  data: InteractionResponseDto[];

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

export class InteractionAnalysisResultDto {
  @ApiProperty({
    description: 'Se há interações encontradas',
    example: true,
  })
  @Expose()
  hasInteractions: boolean;

  @ApiProperty({
    description: 'Interações encontradas',
    type: [InteractionResponseDto],
  })
  @Expose()
  @Type(() => InteractionResponseDto)
  interactions: InteractionResponseDto[];

  @ApiProperty({
    description: 'Nível de risco geral',
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    example: 'HIGH',
  })
  @Expose()
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

  @ApiProperty({
    description: 'Recomendações gerais',
    example: ['Monitorar ECG', 'Ajustar dosagem'],
  })
  @Expose()
  recommendations: string[];

  @ApiProperty({
    description: 'Se há contraindicações absolutas',
    example: false,
  })
  @Expose()
  hasContraindications: boolean;

  @ApiProperty({
    description: 'Resumo da análise',
    example: '2 interações moderadas encontradas. Monitoramento necessário.',
  })
  @Expose()
  summary: string;

  @ApiProperty({
    description: 'Considerações especiais para idosos',
    example: 'Risco aumentado em pacientes idosos',
  })
  @Expose()
  elderlyConsiderations?: string;
}