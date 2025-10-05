import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';

export class MedicationSummaryDto {
  @ApiProperty({ description: 'ID do medicamento' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Nome comercial' })
  @Expose()
  commercialName: string;

  @ApiProperty({ description: 'Código ANVISA' })
  @Expose()
  anvisaCode: string;

  @ApiProperty({ description: 'Princípio ativo' })
  @Expose()
  activeSubstance: any;

  @ApiProperty({ description: 'Classe terapêutica' })
  @Expose()
  therapeuticClass: string;
}

export class PrescriberSummaryDto {
  @ApiProperty({ description: 'ID do prescritor' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Email do prescritor' })
  @Expose()
  email: string;
}

export class PatientSummaryDto {
  @ApiProperty({ description: 'ID do paciente' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID externo pseudonimizado' })
  @Expose()
  externalId: string;
}

export class PrescriptionResponseDto {
  @ApiProperty({ description: 'ID único da prescrição' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID do paciente' })
  @Expose()
  patientId: string;

  @ApiProperty({ description: 'ID do medicamento' })
  @Expose()
  medicationId: string;

  @ApiProperty({ description: 'ID do prescritor' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Dosagem prescrita' })
  @Expose()
  dosage: string;

  @ApiProperty({ description: 'Frequência de administração' })
  @Expose()
  frequency: string;

  @ApiProperty({ description: 'Via de administração' })
  @Expose()
  route: string;

  @ApiPropertyOptional({ description: 'Instruções específicas' })
  @Expose()
  instructions?: string;

  @ApiProperty({ description: 'Data de início' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  startDate: Date;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  endDate?: Date;

  @ApiProperty({ description: 'Status ativo' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Indicação clínica' })
  @Expose()
  indication?: string;

  @ApiPropertyOptional({ description: 'Nome do médico prescritor' })
  @Expose()
  prescribedBy?: string;

  @ApiProperty({ description: 'Data da prescrição' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  prescriptionDate: Date;

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;

  // Relacionamentos
  @ApiPropertyOptional({ description: 'Informações do paciente' })
  @Expose()
  @Type(() => PatientSummaryDto)
  patient?: PatientSummaryDto;

  @ApiPropertyOptional({ description: 'Informações do medicamento' })
  @Expose()
  @Type(() => MedicationSummaryDto)
  medication?: MedicationSummaryDto;

  @ApiPropertyOptional({ description: 'Informações do prescritor' })
  @Expose()
  @Type(() => PrescriberSummaryDto)
  prescriber?: PrescriberSummaryDto;
}

export class PaginatedPrescriptionResponseDto {
  @ApiProperty({ description: 'Lista de prescrições', type: [PrescriptionResponseDto] })
  @Expose()
  @Type(() => PrescriptionResponseDto)
  data: PrescriptionResponseDto[];

  @ApiProperty({ description: 'Metadados de paginação' })
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
