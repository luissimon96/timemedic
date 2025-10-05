import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AllergyType, AllergySeverity } from '@prisma/client';

export class LaboratoryTestResponseDto {
  @ApiProperty({
    description: 'Nome do teste laboratorial',
    example: 'IgE específica para penicilina',
  })
  @Expose()
  testName: string;

  @ApiProperty({
    description: 'Resultado do teste',
    example: 'Positivo - 15.2 kU/L',
  })
  @Expose()
  result: string;

  @ApiProperty({
    description: 'Data do teste',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  testDate: string;

  @ApiProperty({
    description: 'Laboratório responsável',
    example: 'Laboratório Central',
  })
  @Expose()
  laboratory?: string;
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
}

export class PatientBasicInfoDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'cuid123456789',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID externo (pseudonimizado)',
    example: 'PAT-2024-001',
  })
  @Expose()
  externalId: string;
}

export class AllergyResponseDto {
  @ApiProperty({
    description: 'ID único da alergia',
    example: 'cuid123456789',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Informações básicas do paciente',
    type: PatientBasicInfoDto,
  })
  @Expose()
  @Type(() => PatientBasicInfoDto)
  patient: PatientBasicInfoDto;

  @ApiProperty({
    description: 'Informações do medicamento (se alergia medicamentosa)',
    type: MedicationBasicInfoDto,
  })
  @Expose()
  @Type(() => MedicationBasicInfoDto)
  medication?: MedicationBasicInfoDto;

  @ApiProperty({
    description: 'Nome do alérgeno',
    example: 'Penicilina',
  })
  @Expose()
  allergen: string;

  @ApiProperty({
    description: 'Tipo de alergia',
    enum: AllergyType,
    example: AllergyType.DRUG,
  })
  @Expose()
  allergyType: AllergyType;

  @ApiProperty({
    description: 'Severidade da alergia',
    enum: AllergySeverity,
    example: AllergySeverity.MODERATE,
  })
  @Expose()
  severity: AllergySeverity;

  @ApiProperty({
    description: 'Descrição da reação observada',
    example: 'Erupção cutânea generalizada com prurido intenso',
  })
  @Expose()
  reaction?: string;

  @ApiProperty({
    description: 'Data de início dos sintomas',
    example: '2024-01-10T08:00:00Z',
  })
  @Expose()
  onsetDate?: Date;

  @ApiProperty({
    description: 'Evidência clínica da alergia',
    example: 'Reação imediata após administração intravenosa',
  })
  @Expose()
  clinicalEvidence?: string;

  @ApiProperty({
    description: 'Testes laboratoriais relacionados',
    type: [LaboratoryTestResponseDto],
  })
  @Expose()
  @Type(() => LaboratoryTestResponseDto)
  laboratoryTests?: LaboratoryTestResponseDto[];

  @ApiProperty({
    description: 'Se a alergia está ativa',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Paciente relata histórico familiar de alergia à penicilina',
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Fonte da informação',
    example: 'Relato do paciente',
  })
  @Expose()
  informationSource?: string;

  @ApiProperty({
    description: 'Confiabilidade da informação (1-5)',
    example: 4,
  })
  @Expose()
  reliability?: number;

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

export class PaginatedAllergyResponseDto {
  @ApiProperty({
    description: 'Lista de alergias',
    type: [AllergyResponseDto],
  })
  @Expose()
  @Type(() => AllergyResponseDto)
  data: AllergyResponseDto[];

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

export class AllergyCheckResultDto {
  @ApiProperty({
    description: 'Se há conflito de alergia',
    example: true,
  })
  @Expose()
  hasConflict: boolean;

  @ApiProperty({
    description: 'Alergias conflitantes encontradas',
    type: [AllergyResponseDto],
  })
  @Expose()
  @Type(() => AllergyResponseDto)
  conflictingAllergies: AllergyResponseDto[];

  @ApiProperty({
    description: 'Nível de risco',
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    example: 'HIGH',
  })
  @Expose()
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

  @ApiProperty({
    description: 'Recomendações clínicas',
    example: ['Contraindicação absoluta', 'Buscar alternativa terapêutica'],
  })
  @Expose()
  recommendations: string[];

  @ApiProperty({
    description: 'Detalhes do conflito',
    example: 'Paciente possui alergia severa ao princípio ativo penicilina',
  })
  @Expose()
  conflictDetails?: string;
}