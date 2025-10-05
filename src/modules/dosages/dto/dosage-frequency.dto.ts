import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, IsArray, Min, Max, Matches } from 'class-validator';
import { DosageFrequencyType } from './create-dosage.dto';

export class DosageFrequencyDto {
  @ApiProperty({
    enum: DosageFrequencyType,
    description: 'Tipo de frequência de dosagem'
  })
  @IsEnum(DosageFrequencyType)
  type: DosageFrequencyType;

  @ApiPropertyOptional({
    description: 'Intervalo em horas (para FIXED_INTERVAL)',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  intervalHours?: number;

  @ApiPropertyOptional({
    description: 'Número de vezes por dia (para DAILY_TIMES)',
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  timesPerDay?: number;

  @ApiPropertyOptional({
    description: 'Horários específicos (HH:MM)',
    example: ['08:00', '14:00', '20:00']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { each: true })
  specificTimes?: string[];

  @ApiPropertyOptional({
    description: 'Dias da semana (0=domingo, 6=sábado)',
    example: [1, 3, 5]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekDays?: number[];

  @ApiPropertyOptional({
    description: 'Configuração customizada em formato cron',
    example: '0 8,14,20 * * *'
  })
  @IsOptional()
  @IsString()
  customPattern?: string;
}
