import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDosageDto } from './create-dosage.dto';

export class UpdateDosageDto extends PartialType(CreateDosageDto) {
  @ApiPropertyOptional({
    description: 'Motivo da alteração',
    example: 'Ajuste de dosagem conforme evolução clínica'
  })
  @IsOptional()
  changeReason?: string;

  @ApiPropertyOptional({
    description: 'Aprovado por (médico responsável)',
    example: 'Dr. João Silva - CRM 12345'
  })
  @IsOptional()
  approvedBy?: string;
}
