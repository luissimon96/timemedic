import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsDateString, ValidateNested, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AllergyType, AllergySeverity } from '@prisma/client';

export class LaboratoryTestDto {
  @ApiProperty({
    description: 'Nome do teste laboratorial',
    example: 'IgE específica para penicilina',
  })
  @IsString()
  @IsNotEmpty()
  testName: string;

  @ApiProperty({
    description: 'Resultado do teste',
    example: 'Positivo - 15.2 kU/L',
  })
  @IsString()
  @IsNotEmpty()
  result: string;

  @ApiProperty({
    description: 'Data do teste (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  testDate: string;

  @ApiProperty({
    description: 'Laboratório responsável',
    example: 'Laboratório Central',
  })
  @IsString()
  @IsOptional()
  laboratory?: string;
}

export class CreateAllergyDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'cuid123456789',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    description: 'ID do medicamento (se alergia medicamentosa)',
    example: 'cuid987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicationId?: string;

  @ApiProperty({
    description: 'Nome do alérgeno',
    example: 'Penicilina',
  })
  @IsString()
  @IsNotEmpty()
  allergen: string;

  @ApiProperty({
    description: 'Tipo de alergia',
    enum: AllergyType,
    example: AllergyType.DRUG,
  })
  @IsEnum(AllergyType)
  allergyType: AllergyType;

  @ApiProperty({
    description: 'Severidade da alergia',
    enum: AllergySeverity,
    example: AllergySeverity.MODERATE,
  })
  @IsEnum(AllergySeverity)
  severity: AllergySeverity;

  @ApiProperty({
    description: 'Descrição da reação observada',
    example: 'Erupção cutânea generalizada com prurido intenso',
    required: false,
  })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiProperty({
    description: 'Data de início dos sintomas (ISO 8601)',
    example: '2024-01-10T08:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @ApiProperty({
    description: 'Evidência clínica da alergia',
    example: 'Reação imediata após administração intravenosa. Paciente desenvolveu urticária e angioedema.',
    required: false,
  })
  @IsOptional()
  @IsString()
  clinicalEvidence?: string;

  @ApiProperty({
    description: 'Testes laboratoriais relacionados',
    type: [LaboratoryTestDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LaboratoryTestDto)
  laboratoryTests?: LaboratoryTestDto[];

  @ApiProperty({
    description: 'Se a alergia está ativa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Paciente relata histórico familiar de alergia à penicilina',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Fonte da informação',
    example: 'Relato do paciente',
    required: false,
  })
  @IsOptional()
  @IsString()
  informationSource?: string;

  @ApiProperty({
    description: 'Confiabilidade da informação (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  reliability?: number;
}