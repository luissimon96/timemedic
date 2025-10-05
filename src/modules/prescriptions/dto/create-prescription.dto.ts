import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsDateString, 
  IsBoolean,
  MinLength,
  MaxLength
} from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'ID do medicamento',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  medicationId: string;

  @ApiProperty({
    description: 'ID do médico prescritor',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  prescriberId: string;

  @ApiProperty({
    description: 'Dosagem prescrita',
    example: '500mg'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  dosage: string;

  @ApiProperty({
    description: 'Frequência de administração',
    example: '2 vezes ao dia'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  frequency: string;

  @ApiProperty({
    description: 'Via de administração',
    example: 'Via oral'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  route: string;

  @ApiPropertyOptional({
    description: 'Instruções específicas',
    example: 'Tomar após as refeições com água abundante'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiProperty({
    description: 'Data de início do tratamento',
    example: '2024-01-15T00:00:00.000Z'
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Data de fim do tratamento',
    example: '2024-02-15T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Indicação clínica',
    example: 'Hipertensão arterial sistêmica'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;

  @ApiProperty({
    description: 'Nome do médico prescritor',
    example: 'Dr. João Silva - CRM 12345'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  prescribedBy: string;

  @ApiPropertyOptional({
    description: 'Data da prescrição',
    example: '2024-01-15T10:30:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  prescriptionDate?: string;

  @ApiPropertyOptional({
    description: 'Prescrição ativa ao criar',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}