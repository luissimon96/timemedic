import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePrescriptionDto } from './create-prescription.dto';

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
  @ApiPropertyOptional({
    description: 'Motivo da alteração',
    example: 'Ajuste de dosagem conforme evolução clínica'
  })
  @IsOptional()
  changeReason?: string;

  @ApiPropertyOptional({
    description: 'Aprovado por (médico responsável)',
    example: 'Dr. Maria Santos - CRM 67890'
  })
  @IsOptional()
  approvedBy?: string;
}
