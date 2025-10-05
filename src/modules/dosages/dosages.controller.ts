import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DosagesService } from './dosages.service';
import { AdherenceService } from './adherence.service';
import { ReminderService } from './reminder.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  CreateDosageDto,
  UpdateDosageDto,
  SearchDosageDto,
  DosageResponseDto,
  PaginatedDosageResponseDto,
  RecordTakingDto,
  TakingResponseDto,
  BulkRecordTakingDto,
  AdherenceReportRequestDto,
  AdherenceReportDto,
  ReminderConfigDto,
  SafetyCheckResultDto,
} from './dto';

@ApiTags('Dosagens e Acompanhamento')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('dosages')
export class DosagesController {
  private readonly logger = new Logger(DosagesController.name);

  constructor(
    private readonly dosagesService: DosagesService,
    private readonly adherenceService: AdherenceService,
    private readonly reminderService: ReminderService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar configuração de dosagem',
    description: 'Cria uma nova configuração de dosagem com agendamentos automáticos e verificações de segurança.',
  })
  @ApiBody({ type: CreateDosageDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dosagem criada com sucesso',
    type: DosageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito de dados ou falha na verificação de segurança',
  })
  async create(@Body() createDosageDto: CreateDosageDto): Promise<DosageResponseDto> {
    this.logger.log(`POST /dosages - Criando dosagem para prescrição ${createDosageDto.prescriptionId}`);
    return await this.dosagesService.create(createDosageDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar dosagens',
    description: 'Busca dosagens com filtros avançados, paginação e estatísticas de aderência opcionais.',
  })
  @ApiQuery({ name: 'patientId', required: false, description: 'ID do paciente' })
  @ApiQuery({ name: 'prescriptionId', required: false, description: 'ID da prescrição' })
  @ApiQuery({ name: 'medicationId', required: false, description: 'ID do medicamento' })
  @ApiQuery({ name: 'frequencyType', required: false, enum: ['FIXED_INTERVAL', 'DAILY_TIMES', 'WEEKLY_SCHEDULE', 'PRN', 'CUSTOM'] })
  @ApiQuery({ name: 'mealTiming', required: false, enum: ['BEFORE_MEAL', 'WITH_MEAL', 'AFTER_MEAL', 'EMPTY_STOMACH', 'ANY_TIME'] })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Apenas dosagens ativas (padrão: true)' })
  @ApiQuery({ name: 'criticalOnly', required: false, type: Boolean, description: 'Apenas medicações críticas' })
  @ApiQuery({ name: 'startDateFrom', required: false, description: 'Data de início - filtro a partir de' })
  @ApiQuery({ name: 'startDateTo', required: false, description: 'Data de início - filtro até' })
  @ApiQuery({ name: 'minAdherenceRisk', required: false, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'minAdherenceRate', required: false, type: Number, description: 'Taxa mínima de aderência (0-100)' })
  @ApiQuery({ name: 'includeAdherenceStats', required: false, type: Boolean, description: 'Incluir estatísticas de aderência' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por texto' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['startDate', 'createdAt', 'adherenceRate', 'medicationName'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de dosagens com paginação',
    type: PaginatedDosageResponseDto,
  })
  async findAll(@Query() searchDto: SearchDosageDto): Promise<PaginatedDosageResponseDto> {
    this.logger.log(`GET /dosages - Buscando dosagens com filtros: ${JSON.stringify(searchDto)}`);
    return await this.dosagesService.findAll(searchDto);
  }

  @Get('adherence/report')
  @ApiOperation({
    summary: 'Gerar relatório de aderência',
    description: 'Gera relatório completo de aderência com análise de padrões e recomendações de intervenção.',
  })
  @ApiQuery({ name: 'patientId', required: true, description: 'ID do paciente' })
  @ApiQuery({ name: 'period', required: false, enum: ['LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'CUSTOM'] })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data de início (para período customizado)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data de fim (para período customizado)' })
  @ApiQuery({ name: 'medicationIds', required: false, description: 'IDs específicos de medicamentos (separados por vírgula)' })
  @ApiQuery({ name: 'includePredictiveAnalysis', required: false, type: Boolean, description: 'Incluir análise preditiva' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relatório de aderência gerado',
    type: AdherenceReportDto,
  })
  async generateAdherenceReport(@Query() query: any): Promise<AdherenceReportDto> {
    if (!query.patientId) {
      throw new BadRequestException('patientId é obrigatório');
    }

    const requestDto: AdherenceReportRequestDto = {
      patientId: query.patientId,
      period: query.period,
      startDate: query.startDate,
      endDate: query.endDate,
      medicationIds: query.medicationIds ? query.medicationIds.split(',') : undefined,
      includePredictiveAnalysis: query.includePredictiveAnalysis === 'true',
    };

    this.logger.log(`GET /dosages/adherence/report - Gerando relatório para paciente ${query.patientId}`);
    return await this.adherenceService.generateAdherenceReport(requestDto);
  }

  @Post('taking')
  @ApiOperation({
    summary: 'Registrar tomada de medicamento',
    description: 'Registra a tomada de um medicamento com verificações de segurança automáticas.',
  })
  @ApiBody({ type: RecordTakingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tomada registrada com sucesso',
    type: TakingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Falha na verificação de segurança ou conflito de dados',
  })
  async recordTaking(@Body() recordTakingDto: RecordTakingDto): Promise<TakingResponseDto> {
    this.logger.log(`POST /dosages/taking - Registrando tomada para agendamento ${recordTakingDto.scheduleId}`);
    return await this.dosagesService.recordTaking(recordTakingDto);
  }

  @Post('taking/bulk')
  @ApiOperation({
    summary: 'Registrar múltiplas tomadas',
    description: 'Registra múltiplas tomadas de medicamentos em lote.',
  })
  @ApiBody({ type: BulkRecordTakingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tomadas processadas em lote',
    type: [TakingResponseDto],
  })
  async recordBulkTaking(@Body() bulkRecordDto: BulkRecordTakingDto): Promise<TakingResponseDto[]> {
    this.logger.log(`POST /dosages/taking/bulk - Processando ${bulkRecordDto.takings.length} tomadas em lote`);
    return await this.dosagesService.recordBulkTaking(bulkRecordDto);
  }

  @Post('reminders/config')
  @ApiOperation({
    summary: 'Configurar lembretes',
    description: 'Configura sistema de lembretes e escalação para um paciente.',
  })
  @ApiBody({ type: ReminderConfigDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Configuração de lembretes salva com sucesso',
  })
  async configureReminders(@Body() reminderConfigDto: ReminderConfigDto): Promise<{ message: string }> {
    this.logger.log(`POST /dosages/reminders/config - Configurando lembretes para paciente ${reminderConfigDto.patientId}`);
    
    // Salva configuração no sistema
    await this.prisma.systemConfig.upsert({
      where: { key: `reminder_config_${reminderConfigDto.patientId}` },
      update: { 
        value: reminderConfigDto,
        updatedAt: new Date(),
      },
      create: {
        key: `reminder_config_${reminderConfigDto.patientId}`,
        value: reminderConfigDto,
      },
    });

    // Atualiza lembretes existentes se houver dosagem específica
    if (reminderConfigDto.dosageId) {
      await this.reminderService.updateRemindersForDosage(
        reminderConfigDto.dosageId, 
        reminderConfigDto.patientId
      );
    }

    return { message: 'Configuração de lembretes salva com sucesso' };
  }

  @Post(':id/safety-check')
  @ApiOperation({
    summary: 'Verificação de segurança',
    description: 'Executa verificação completa de segurança para uma dosagem específica.',
  })
  @ApiParam({ name: 'id', description: 'ID da dosagem' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da verificação de segurança',
    type: SafetyCheckResultDto,
  })
  async performSafetyCheck(@Param('id') id: string): Promise<SafetyCheckResultDto> {
    this.logger.log(`POST /dosages/${id}/safety-check`);
    return await this.dosagesService.performSafetyCheck(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar dosagem por ID',
    description: 'Retorna detalhes completos de uma dosagem específica com estatísticas de aderência.',
  })
  @ApiParam({ name: 'id', description: 'ID único da dosagem' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dosagem encontrada',
    type: DosageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dosagem não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<DosageResponseDto> {
    this.logger.log(`GET /dosages/${id}`);
    return await this.dosagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dosagem',
    description: 'Atualiza configuração de dosagem com regeneração automática de agendamentos.',
  })
  @ApiParam({ name: 'id', description: 'ID único da dosagem' })
  @ApiBody({ type: UpdateDosageDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dosagem atualizada com sucesso',
    type: DosageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dosagem não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dados inconsistentes ou conflito',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDosageDto: UpdateDosageDto,
  ): Promise<DosageResponseDto> {
    this.logger.log(`PATCH /dosages/${id}`);
    return await this.dosagesService.update(id, updateDosageDto);
  }

  @Patch(':id/inactivate')
  @ApiOperation({
    summary: 'Inativar dosagem',
    description: 'Inativa uma dosagem cancelando agendamentos futuros e lembretes.',
  })
  @ApiParam({ name: 'id', description: 'ID único da dosagem' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da inativação' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dosagem inativada com sucesso',
    type: DosageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dosagem não encontrada',
  })
  async inactivate(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ): Promise<DosageResponseDto> {
    this.logger.log(`PATCH /dosages/${id}/inactivate`);
    return await this.dosagesService.inactivate(id, body?.reason);
  }

  @Get('patient/:patientId/schedules/upcoming')
  @ApiOperation({
    summary: 'Próximos agendamentos do paciente',
    description: 'Retorna próximos agendamentos de medicamentos para um paciente específico.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de dias à frente (padrão: 7)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados (padrão: 50)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de próximos agendamentos',
  })
  async getUpcomingSchedules(
    @Param('patientId') patientId: string,
    @Query('days') days: number = 7,
    @Query('limit') limit: number = 50,
  ) {
    this.logger.log(`GET /dosages/patient/${patientId}/schedules/upcoming`);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const schedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosage: {
          prescription: { patientId },
          isActive: true,
        },
        scheduledTime: {
          gte: new Date(),
          lte: endDate,
        },
        status: 'SCHEDULED',
      },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                medication: {
                  select: {
                    commercialName: true,
                    anvisaCode: true,
                  },
                },
              },
            },
          },
        },
        takings: true,
      },
      orderBy: { scheduledTime: 'asc' },
      take: limit,
    });

    return schedules.map(schedule => ({
      id: schedule.id,
      scheduledTime: schedule.scheduledTime,
      dosage: schedule.dosage,
      medicationName: schedule.dosage.prescription.medication.commercialName,
      anvisaCode: schedule.dosage.prescription.medication.anvisaCode,
      instructions: schedule.instructions,
      isCritical: schedule.dosage.isCritical,
      hasTaking: schedule.takings.length > 0,
      status: schedule.status,
    }));
  }

  @Get('patient/:patientId/adherence/summary')
  @ApiOperation({
    summary: 'Resumo de aderência do paciente',
    description: 'Retorna resumo rápido de aderência para dashboard do paciente.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Período em dias (padrão: 30)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumo de aderência',
  })
  async getAdherenceSummary(
    @Param('patientId') patientId: string,
    @Query('days') days: number = 30,
  ) {
    this.logger.log(`GET /dosages/patient/${patientId}/adherence/summary`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Busca estatísticas básicas
    const schedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosage: {
          prescription: { patientId },
          isActive: true,
        },
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        takings: true,
        dosage: {
          include: {
            prescription: {
              include: {
                medication: {
                  select: {
                    commercialName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalScheduled = schedules.length;
    const dosesTaken = schedules.filter(s => 
      s.takings.some(t => t.status === 'TAKEN')
    ).length;
    const dosesMissed = schedules.filter(s => 
      s.takings.some(t => t.status === 'MISSED') || 
      (s.status === 'MISSED' && s.takings.length === 0)
    ).length;
    const dosesDelayed = schedules.filter(s => 
      s.takings.some(t => t.status === 'DELAYED')
    ).length;

    const adherenceRate = totalScheduled > 0 ? (dosesTaken / totalScheduled) * 100 : 0;

    // Próxima dose
    const nextSchedule = await this.prisma.dosageSchedule.findFirst({
      where: {
        dosage: {
          prescription: { patientId },
          isActive: true,
        },
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                medication: {
                  select: {
                    commercialName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return {
      period: `${days} dias`,
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      totalScheduled,
      dosesTaken,
      dosesMissed,
      dosesDelayed,
      riskLevel: this.calculateRiskLevel(adherenceRate),
      nextDose: nextSchedule ? {
        scheduledTime: nextSchedule.scheduledTime,
        medicationName: nextSchedule.dosage.prescription.medication.commercialName,
        dosage: nextSchedule.dosage,
        isCritical: nextSchedule.dosage.isCritical,
      } : null,
    };
  }

  /**
   * Métodos auxiliares privados
   */
  private calculateRiskLevel(adherenceRate: number): string {
    if (adherenceRate >= 90) return 'LOW';
    if (adherenceRate >= 80) return 'MODERATE';
    if (adherenceRate >= 60) return 'HIGH';
    return 'CRITICAL';
  }

}