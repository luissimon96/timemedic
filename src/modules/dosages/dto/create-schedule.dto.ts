import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsUUID, 
  IsDateString, 
  IsString, 
  IsOptional, 
  IsBoolean,
  IsObject
} from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID da dosagem',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  dosageId: string;

  @ApiProperty({
    description: 'Hora agendada',
    example: '2024-01-15T08:00:00.000Z'
  })
  @IsDateString()
  scheduledTime: string;

  @ApiProperty({
    description: 'Dosagem específica para esta administração',
    example: '500mg'
  })
  @IsString()
  dosage: string;

  @ApiPropertyOptional({
    description: 'Instruções específicas para esta dose',
    example: 'Tomar com água, após o café da manhã'
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Gerar lembrete automático',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  createReminder?: boolean;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  metadata?: object;
}
