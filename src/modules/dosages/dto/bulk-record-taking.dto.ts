import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  ValidateNested,
  IsOptional,
  IsString,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordTakingDto } from './record-taking.dto';

export class BulkRecordTakingDto {
  @ApiProperty({
    description: 'Lista de registros de tomada',
    type: [RecordTakingDto]
  })
  @ValidateNested({ each: true })
  @Type(() => RecordTakingDto)
  takings: RecordTakingDto[];

  @ApiPropertyOptional({
    description: 'Notas gerais sobre o lote',
    example: 'Registro de fim de semana'
  })
  @IsOptional()
  @IsString()
  batchNotes?: string;

  @ApiPropertyOptional({
    description: 'Marcação temporal do lote',
    example: '2024-01-15T20:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  batchTimestamp?: string;
}
