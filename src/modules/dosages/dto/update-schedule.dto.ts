import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @ApiPropertyOptional({
    description: 'Motivo da alteração de agendamento',
    example: 'Ajuste por solicitação do paciente'
  })
  @IsOptional()
  changeReason?: string;
}
