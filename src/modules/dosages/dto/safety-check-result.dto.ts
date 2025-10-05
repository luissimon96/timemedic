import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export enum SafetyRiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum SafetyCheckType {
  ALLERGY = 'ALLERGY',
  INTERACTION = 'INTERACTION',
  CONTRAINDICATION = 'CONTRAINDICATION',
  DOSAGE_LIMIT = 'DOSAGE_LIMIT',
  TIMING_CONFLICT = 'TIMING_CONFLICT',
  DUPLICATE_THERAPY = 'DUPLICATE_THERAPY',
  AGE_RESTRICTION = 'AGE_RESTRICTION',
  RENAL_FUNCTION = 'RENAL_FUNCTION',
  HEPATIC_FUNCTION = 'HEPATIC_FUNCTION'
}

export class SafetyIssueDto {
  @ApiProperty({
    enum: SafetyCheckType,
    description: 'Tipo de verificação de segurança'
  })
  @Expose()
  checkType: SafetyCheckType;

  @ApiProperty({
    enum: SafetyRiskLevel,
    description: 'Nível de risco'
  })
  @Expose()
  riskLevel: SafetyRiskLevel;

  @ApiProperty({
    description: 'Descrição do problema',
    example: 'Paciente possui alergia conhecida a penicilina'
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Medicamentos envolvidos',
    example: ['Amoxicilina', 'Penicilina G']
  })
  @Expose()
  involvedMedications: string[];

  @ApiProperty({
    description: 'Recomendações clínicas'
  })
  @Expose()
  recommendations: string[];

  @ApiPropertyOptional({
    description: 'Alternativas sugeridas'
  })
  @Expose()
  alternatives?: string[];

  @ApiProperty({
    description: 'Referências científicas'
  })
  @Expose()
  references: string[];

  @ApiProperty({
    description: 'Requer intervenção médica imediata'
  })
  @Expose()
  requiresImmediateAction: boolean;

  @ApiPropertyOptional({
    description: 'Detalhes específicos da verificação'
  })
  @Expose()
  details?: object;
}

export class AllergyCheckResultDto {
  @ApiProperty({
    description: 'Possui conflito com alergias'
  })
  @Expose()
  hasConflict: boolean;

  @ApiProperty({
    description: 'Alergias conflitantes encontradas'
  })
  @Expose()
  conflictingAllergies: string[];

  @ApiProperty({
    enum: SafetyRiskLevel,
    description: 'Nível de risco máximo'
  })
  @Expose()
  maxRiskLevel: SafetyRiskLevel;

  @ApiProperty({
    description: 'Detalhes dos conflitos'
  })
  @Expose()
  conflictDetails: object[];
}

export class InteractionCheckResultDto {
  @ApiProperty({
    description: 'Possui interações'
  })
  @Expose()
  hasInteractions: boolean;

  @ApiProperty({
    description: 'Número de interações encontradas'
  })
  @Expose()
  interactionCount: number;

  @ApiProperty({
    enum: SafetyRiskLevel,
    description: 'Severidade máxima das interações'
  })
  @Expose()
  maxSeverity: SafetyRiskLevel;

  @ApiProperty({
    description: 'Detalhes das interações'
  })
  @Expose()
  interactions: object[];
}

export class DosageLimitCheckResultDto {
  @ApiProperty({
    description: 'Dosagem excede limites seguros'
  })
  @Expose()
  exceedsLimits: boolean;

  @ApiProperty({
    description: 'Dosagem atual em mg/dia'
  })
  @Expose()
  currentDailyDose: number;

  @ApiProperty({
    description: 'Dose máxima recomendada em mg/dia'
  })
  @Expose()
  maximumRecommendedDose: number;

  @ApiProperty({
    description: 'Porcentagem da dose máxima'
  })
  @Expose()
  percentageOfMax: number;

  @ApiPropertyOptional({
    description: 'Considerações especiais'
  })
  @Expose()
  specialConsiderations?: string[];
}

export class TimingConflictResultDto {
  @ApiProperty({
    description: 'Possui conflitos de horário'
  })
  @Expose()
  hasConflicts: boolean;

  @ApiProperty({
    description: 'Medicamentos com conflito de timing'
  })
  @Expose()
  conflictingMedications: string[];

  @ApiProperty({
    description: 'Sugestões de reorganização'
  })
  @Expose()
  timingRecommendations: string[];

  @ApiProperty({
    description: 'Horários problemáticos'
  })
  @Expose()
  problematicTimes: string[];
}

export class SafetyCheckResultDto {
  @ApiProperty({
    description: 'ID da verificação',
    example: 'check_clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @Expose()
  checkId: string;

  @ApiProperty({
    description: 'ID do paciente'
  })
  @Expose()
  patientId: string;

  @ApiProperty({
    description: 'IDs dos medicamentos verificados'
  })
  @Expose()
  medicationIds: string[];

  @ApiProperty({
    description: 'Timestamp da verificação'
  })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  checkTimestamp: Date;

  @ApiProperty({
    description: 'Verificação passou sem problemas'
  })
  @Expose()
  passed: boolean;

  @ApiProperty({
    enum: SafetyRiskLevel,
    description: 'Nível de risco geral'
  })
  @Expose()
  overallRiskLevel: SafetyRiskLevel;

  @ApiProperty({
    description: 'Número total de problemas encontrados'
  })
  @Expose()
  totalIssues: number;

  @ApiProperty({
    description: 'Problemas de segurança identificados',
    type: [SafetyIssueDto]
  })
  @Expose()
  @Type(() => SafetyIssueDto)
  safetyIssues: SafetyIssueDto[];

  @ApiProperty({
    description: 'Resultado da verificação de alergias',
    type: AllergyCheckResultDto
  })
  @Expose()
  @Type(() => AllergyCheckResultDto)
  allergyCheck: AllergyCheckResultDto;

  @ApiProperty({
    description: 'Resultado da verificação de interações',
    type: InteractionCheckResultDto
  })
  @Expose()
  @Type(() => InteractionCheckResultDto)
  interactionCheck: InteractionCheckResultDto;

  @ApiProperty({
    description: 'Resultado da verificação de limites de dose',
    type: DosageLimitCheckResultDto
  })
  @Expose()
  @Type(() => DosageLimitCheckResultDto)
  dosageLimitCheck: DosageLimitCheckResultDto;

  @ApiProperty({
    description: 'Resultado da verificação de conflitos de timing',
    type: TimingConflictResultDto
  })
  @Expose()
  @Type(() => TimingConflictResultDto)
  timingConflictCheck: TimingConflictResultDto;

  @ApiProperty({
    description: 'Recomendações clínicas prioritárias'
  })
  @Expose()
  priorityRecommendations: string[];

  @ApiProperty({
    description: 'Ações requeridas pelo prescritor'
  })
  @Expose()
  requiredActions: string[];

  @ApiProperty({
    description: 'Aprovação necessária antes de administrar'
  })
  @Expose()
  requiresApproval: boolean;

  @ApiPropertyOptional({
    description: 'Quem deve aprovar'
  })
  @Expose()
  approvalRequired?: string;

  @ApiProperty({
    description: 'Resumo executivo da verificação'
  })
  @Expose()
  executiveSummary: string;

  @ApiPropertyOptional({
    description: 'Informações adicionais'
  })
  @Expose()
  additionalInfo?: object;
}