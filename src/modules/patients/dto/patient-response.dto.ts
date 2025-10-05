import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class UserSummaryDto {
  @ApiProperty({ description: 'ID do usuário' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Papel do usuário' })
  @Expose()
  role: string;
}

export class PatientResponseDto {
  @ApiProperty({ description: 'ID único do paciente' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID do usuário associado' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'ID externo pseudonimizado' })
  @Expose()
  externalId: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gênero' })
  @Expose()
  gender?: string;

  @ApiPropertyOptional({ description: 'Peso em kg' })
  @Expose()
  weight?: number;

  @ApiPropertyOptional({ description: 'Altura em cm' })
  @Expose()
  height?: number;

  @ApiPropertyOptional({ description: 'Condições crônicas' })
  @Expose()
  chronicConditions?: any;

  @ApiPropertyOptional({ description: 'Função renal' })
  @Expose()
  renalFunction?: string;

  @ApiPropertyOptional({ description: 'Função hepática' })
  @Expose()
  hepaticFunction?: string;

  @ApiProperty({ description: 'Data de criação' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Informações do usuário' })
  @Expose()
  @Type(() => UserSummaryDto)
  user?: UserSummaryDto;

  // Dados criptografados - não expostos na API
  encryptedPii?: any;
  emergencyContact?: any;
}

export class PaginatedPatientResponseDto {
  @ApiProperty({ description: 'Lista de pacientes', type: [PatientResponseDto] })
  @Expose()
  @Type(() => PatientResponseDto)
  data: PatientResponseDto[];

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
