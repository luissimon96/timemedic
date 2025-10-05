import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsObject,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  VOICE_CALL = 'VOICE_CALL',
  WHATSAPP = 'WHATSAPP'
}

export enum EscalationLevel {
  LEVEL_1 = 'LEVEL_1', // Paciente apenas
  LEVEL_2 = 'LEVEL_2', // Paciente + cuidador
  LEVEL_3 = 'LEVEL_3', // Paciente + cuidador + médico
  LEVEL_4 = 'LEVEL_4'  // Todos + emergência
}

export class NotificationChannelConfigDto {
  @ApiProperty({
    enum: NotificationChannel,
    description: 'Tipo de canal de notificação'
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Canal está ativo',
    default: true
  })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Prioridade do canal (1-5)',
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Configurações específicas do canal',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  settings?: {
    recipient?: string;
    template?: string;
    voice?: string;
    language?: string;
  };
}

export class EscalationRuleDto {
  @ApiProperty({
    enum: EscalationLevel,
    description: 'Nível de escalação'
  })
  @IsEnum(EscalationLevel)
  level: EscalationLevel;

  @ApiProperty({
    description: 'Minutos após dose perdida para ativar',
    example: 30
  })
  @IsNumber()
  @Min(5)
  @Max(1440) // 24 horas
  triggerDelayMinutes: number;

  @ApiProperty({
    description: 'Canais de notificação para este nível',
    type: [NotificationChannelConfigDto]
  })
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelConfigDto)
  channels: NotificationChannelConfigDto[];

  @ApiPropertyOptional({
    description: 'Máximo de tentativas neste nível',
    example: 3,
    default: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;

  @ApiPropertyOptional({
    description: 'Intervalo entre tentativas em minutos',
    example: 15,
    default: 15
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  retryIntervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Contatos adicionais específicos',
    example: ['cuidador@email.com', '+5511999999999']
  })
  @IsOptional()
  @IsString({ each: true })
  additionalContacts?: string[];
}

export class CaregiverContactDto {
  @ApiProperty({
    description: 'Nome do cuidador',
    example: 'Maria Silva'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Relacionamento com paciente',
    example: 'Filha'
  })
  @IsString()
  relationship: string;

  @ApiPropertyOptional({
    description: 'Telefone',
    example: '+5511999999999'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email',
    example: 'maria@email.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp',
    example: '+5511999999999'
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({
    description: 'Contato principal',
    default: false
  })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({
    description: 'Contato ativo',
    default: true
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Horários preferenciais para contato',
    example: ['08:00-12:00', '14:00-18:00']
  })
  @IsOptional()
  @IsString({ each: true })
  preferredContactHours?: string[];
}

export class ReminderConfigDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({
    description: 'ID específico da dosagem (opcional)',
    example: 'clxxx123-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  })
  @IsOptional()
  @IsUUID()
  dosageId?: string;

  @ApiProperty({
    description: 'Sistema de lembretes ativo',
    default: true
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Minutos de antecedência para lembrete',
    example: 15,
    default: 15
  })
  @IsNumber()
  @Min(0)
  @Max(120)
  advanceReminderMinutes: number;

  @ApiProperty({
    description: 'Regras de escalação',
    type: [EscalationRuleDto]
  })
  @ValidateNested({ each: true })
  @Type(() => EscalationRuleDto)
  escalationRules: EscalationRuleDto[];

  @ApiProperty({
    description: 'Contatos de cuidadores',
    type: [CaregiverContactDto]
  })
  @ValidateNested({ each: true })
  @Type(() => CaregiverContactDto)
  caregiverContacts: CaregiverContactDto[];

  @ApiPropertyOptional({
    description: 'Horário de silêncio - início',
    example: '22:00'
  })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({
    description: 'Horário de silêncio - fim',
    example: '07:00'
  })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({
    description: 'Medicações críticas ignoram horário silencioso',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  criticalOverrideQuietHours?: boolean;

  @ApiPropertyOptional({
    description: 'Timezone do paciente',
    example: 'America/Sao_Paulo',
    default: 'America/Sao_Paulo'
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Personalização de mensagens',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  messageCustomization?: {
    language?: string;
    tone?: string;
    includeMotivation?: boolean;
    personalizedGreeting?: string;
  };

  @ApiPropertyOptional({
    description: 'Configurações especiais',
    type: 'object'
  })
  @IsOptional()
  @IsObject()
  specialSettings?: {
    adaptiveReminders?: boolean;
    learningEnabled?: boolean;
    behaviorAnalysis?: boolean;
    weekendDifferentSchedule?: boolean;
  };
}