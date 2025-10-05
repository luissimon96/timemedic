import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsDateString, IsNumber, IsObject } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ description: 'ID do usuário associado' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nome completo (será criptografado)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'CPF (será criptografado)' })
  @IsString()
  cpf: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Telefone (será criptografado)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Endereço (será criptografado)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Peso em kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Altura em cm' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Condições crônicas' })
  @IsOptional()
  @IsObject()
  chronicConditions?: any;

  @ApiPropertyOptional({ description: 'Função renal' })
  @IsOptional()
  @IsString()
  renalFunction?: string;

  @ApiPropertyOptional({ description: 'Função hepática' })
  @IsOptional()
  @IsString()
  hepaticFunction?: string;

  @ApiPropertyOptional({ description: 'Contato de emergência (será criptografado)' })
  @IsOptional()
  @IsObject()
  emergencyContact?: any;
}
