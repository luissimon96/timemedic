import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SchedulingService } from './scheduling.service';
import { AdherenceService } from './adherence.service';
import { ReminderService } from './reminder.service';
import { DosageValidationService } from './services/dosage-validation.service';
import { SafetyCheckService } from './services/safety-check.service';
import { AllergiesService } from '../allergies/allergies.service';
import {
  CreateDosageDto,
  UpdateDosageDto,
  SearchDosageDto,
  DosageResponseDto,
  PaginatedDosageResponseDto,
  RecordTakingDto,
  TakingResponseDto,
  BulkRecordTakingDto,
  SafetyCheckResultDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class DosagesService {
  private readonly logger = new Logger(DosagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
    private readonly adherenceService: AdherenceService,
    private readonly reminderService: ReminderService,
    private readonly validationService: DosageValidationService,
    private readonly safetyCheckService: SafetyCheckService,
    private readonly allergiesService: AllergiesService,
  ) {}

  /**
   * Cria uma nova configuração de dosagem com validação completa
   */
  async create(createDosageDto: CreateDosageDto): Promise<DosageResponseDto> {
    this.logger.log(`Criando dosagem para prescrição: ${createDosageDto.prescriptionId}`);

    // Valida a prescrição
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: createDosageDto.prescriptionId },
      include: {
        patient: true,
        medication: true,
        prescriber: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescrição ${createDosageDto.prescriptionId} não encontrada`);
    }

    if (!prescription.isActive) {
      throw new ConflictException('Não é possível criar dosagem para prescrição inativa');
    }

    // Validação de dados da dosagem
    const validation = await this.validationService.validateDosageData(createDosageDto, prescription);
    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificação de segurança
    const safetyCheck = await this.safetyCheckService.performComprehensiveCheck(
      prescription.patientId,
      [prescription.medicationId],
      {
        includeAllergies: true,
        includeInteractions: true,
        includeDosageLimits: true,
        includeTimingConflicts: true,
      }
    );

    if (!safetyCheck.passed && safetyCheck.overallRiskLevel === 'CRITICAL') {
      throw new ConflictException(`Verificação de segurança falhou: ${safetyCheck.executiveSummary}`);
    }

    try {
      const dosage = await this.prisma.$transaction(async (tx) => {
        // Cria a configuração de dosagem
        const newDosage = await tx.dosage.create({
          data: {
            prescriptionId: createDosageDto.prescriptionId,
            dosagePerAdministration: createDosageDto.dosagePerAdministration,
            frequency: createDosageDto.frequency,
            mealTiming: createDosageDto.mealTiming,
            mealOffset: createDosageDto.mealOffset,
            startDate: new Date(createDosageDto.startDate),
            endDate: createDosageDto.endDate ? new Date(createDosageDto.endDate) : null,
            maxDurationDays: createDosageDto.maxDurationDays,
            specialInstructions: createDosageDto.specialInstructions,
            reminderSettings: createDosageDto.reminderSettings,
            allowPatientAdjustment: createDosageDto.allowPatientAdjustment ?? false,
            toleranceWindowMinutes: createDosageDto.toleranceWindowMinutes ?? 30,
            isCritical: createDosageDto.isCritical ?? false,
            notes: createDosageDto.notes,
            isActive: true,
          },
        });

        // Gera agendamentos automáticos
        await this.schedulingService.generateSchedulesForDosage(newDosage.id, tx);

        // Configura lembretes
        if (createDosageDto.reminderSettings?.enabled !== false) {
          await this.reminderService.setupRemindersForDosage(newDosage.id, prescription.patientId);
        }

        return newDosage;
      });

      const result = await this.findOne(dosage.id);
      this.logger.log(`Dosagem criada com sucesso: ${dosage.id}`);
      
      return result;
    } catch (error) {
      this.logger.error('Erro ao criar dosagem:', error);
      throw new ConflictException('Erro ao criar configuração de dosagem');
    }
  }

  /**
   * Busca dosagens com filtros e paginação
   */
  async findAll(searchDto: SearchDosageDto): Promise<PaginatedDosageResponseDto> {
    const {
      patientId,
      prescriptionId,
      medicationId,
      frequencyType,
      mealTiming,
      activeOnly = true,
      criticalOnly,
      startDateFrom,
      startDateTo,
      minAdherenceRisk,
      minAdherenceRate,
      includeAdherenceStats,
      search,
      page = 1,
      limit = 20,
      sortBy = 'startDate',
      sortOrder = 'desc',
    } = searchDto;

    // Constrói filtros dinâmicos
    const where: any = {};

    if (patientId) {
      where.prescription = { patientId };
    }

    if (prescriptionId) {
      where.prescriptionId = prescriptionId;
    }

    if (medicationId) {
      where.prescription = { 
        ...where.prescription,
        medicationId 
      };
    }

    if (frequencyType) {
      where.frequency = {
        path: ['type'],
        equals: frequencyType,
      };
    }

    if (mealTiming) {
      where.mealTiming = mealTiming;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    if (criticalOnly) {
      where.isCritical = true;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    if (search) {
      where.OR = [
        {
          prescription: {
            medication: {
              commercialName: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          specialInstructions: { contains: search, mode: 'insensitive' }
        },
        {
          notes: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    const skip = (page - 1) * limit;

    try {
      const [dosages, total] = await Promise.all([
        this.prisma.dosage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            prescription: {
              include: {
                patient: {
                  select: {
                    id: true,
                    externalId: true,
                  },
                },
                medication: {
                  select: {
                    id: true,
                    commercialName: true,
                    anvisaCode: true,
                  },
                },
                prescriber: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.dosage.count({ where }),
      ]);

      // Enriquecer com estatísticas de aderência se solicitado
      const enrichedDosages = await Promise.all(
        dosages.map(async (dosage) => {
          let adherenceStats = null;
          
          if (includeAdherenceStats) {
            adherenceStats = await this.adherenceService.getBasicStats(dosage.id);
          }

          // Filtrar por aderência se especificado
          if (minAdherenceRate !== undefined || minAdherenceRisk) {
            if (!adherenceStats) {
              adherenceStats = await this.adherenceService.getBasicStats(dosage.id);
            }
            
            if (minAdherenceRate !== undefined && adherenceStats.adherenceRate < minAdherenceRate) {
              return null;
            }

            if (minAdherenceRisk && this.compareRiskLevels(adherenceStats.riskLevel, minAdherenceRisk) < 0) {
              return null;
            }
          }

          return {
            ...dosage,
            adherenceStats,
          };
        })
      );

      const filteredDosages = enrichedDosages.filter(d => d !== null);
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedDosageResponseDto = {
        data: filteredDosages.map(dosage => 
          plainToClass(DosageResponseDto, dosage, { excludeExtraneousValues: true })
        ),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      return response;
    } catch (error) {
      this.logger.error('Erro ao buscar dosagens:', error);
      throw new Error('Erro interno ao buscar dosagens');
    }
  }

  /**
   * Busca dosagem por ID
   */
  async findOne(id: string): Promise<DosageResponseDto> {
    const dosage = await this.prisma.dosage.findUnique({
      where: { id },
      include: {
        prescription: {
          include: {
            patient: {
              select: {
                id: true,
                externalId: true,
              },
            },
            medication: {
              select: {
                id: true,
                commercialName: true,
                anvisaCode: true,
              },
            },
            prescriber: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dosage) {
      throw new NotFoundException(`Dosagem ${id} não encontrada`);
    }

    // Adiciona estatísticas de aderência
    const adherenceStats = await this.adherenceService.getBasicStats(id);

    return plainToClass(DosageResponseDto, {
      ...dosage,
      adherenceStats,
    }, { excludeExtraneousValues: true });
  }

  /**
   * Atualiza configuração de dosagem
   */
  async update(id: string, updateDosageDto: UpdateDosageDto): Promise<DosageResponseDto> {
    this.logger.log(`Atualizando dosagem: ${id}`);

    const existingDosage = await this.prisma.dosage.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!existingDosage) {
      throw new NotFoundException(`Dosagem ${id} não encontrada`);
    }

    // Validação da atualização
    const mergedData = { ...existingDosage, ...updateDosageDto };
    const validation = await this.validationService.validateDosageData(mergedData, existingDosage.prescription);
    
    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    try {
      const updatedDosage = await this.prisma.$transaction(async (tx) => {
        // Atualiza a dosagem
        const updated = await tx.dosage.update({
          where: { id },
          data: {
            ...updateDosageDto,
            ...(updateDosageDto.startDate && { startDate: new Date(updateDosageDto.startDate) }),
            ...(updateDosageDto.endDate && { endDate: new Date(updateDosageDto.endDate) }),
            updatedAt: new Date(),
          },
        });

        // Regenera agendamentos se necessário
        if (updateDosageDto.frequency || updateDosageDto.startDate || updateDosageDto.endDate) {
          await this.schedulingService.regenerateSchedulesForDosage(updated.id, tx);
        }

        // Atualiza lembretes se necessário
        if (updateDosageDto.reminderSettings) {
          await this.reminderService.updateRemindersForDosage(updated.id, existingDosage.prescription.patientId);
        }

        return updated;
      });

      this.logger.log(`Dosagem atualizada: ${id}`);
      return await this.findOne(updatedDosage.id);
    } catch (error) {
      this.logger.error('Erro ao atualizar dosagem:', error);
      throw new ConflictException('Erro ao atualizar dosagem');
    }
  }

  /**
   * Registra tomada de medicamento
   */
  async recordTaking(recordTakingDto: RecordTakingDto): Promise<TakingResponseDto> {
    this.logger.log(`Registrando tomada para agendamento: ${recordTakingDto.scheduleId}`);

    const schedule = await this.prisma.dosageSchedule.findUnique({
      where: { id: recordTakingDto.scheduleId },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                patient: true,
                medication: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Agendamento ${recordTakingDto.scheduleId} não encontrado`);
    }

    // Verificação de segurança antes da tomada
    if (recordTakingDto.status === 'TAKEN') {
      const safetyCheck = await this.safetyCheckService.performPreDoseCheck(
        schedule.dosage.prescription.patientId,
        schedule.dosage.prescription.medicationId
      );

      if (!safetyCheck.passed && safetyCheck.overallRiskLevel === 'CRITICAL') {
        this.logger.warn(`Tentativa de tomada bloqueada por segurança: ${safetyCheck.executiveSummary}`);
        throw new ConflictException(`Dose bloqueada por segurança: ${safetyCheck.executiveSummary}`);
      }
    }

    try {
      const taking = await this.prisma.dosageTaking.create({
        data: {
          patientId: schedule.dosage.prescription.patientId,
          scheduleId: recordTakingDto.scheduleId,
          scheduledTime: schedule.scheduledTime,
          actualTime: recordTakingDto.actualTime ? new Date(recordTakingDto.actualTime) : null,
          status: recordTakingDto.status,
          delayReason: recordTakingDto.delayReason,
          delayDescription: recordTakingDto.delayDescription,
          dosagePercentage: recordTakingDto.dosagePercentage ?? 100,
          administrationMethod: recordTakingDto.administrationMethod,
          takenWithFood: recordTakingDto.takenWithFood ?? false,
          sideEffects: recordTakingDto.sideEffects,
          symptomsAfterDose: recordTakingDto.symptomsAfterDose,
          perceivedEfficacy: recordTakingDto.perceivedEfficacy,
          location: recordTakingDto.location,
          patientNotes: recordTakingDto.patientNotes,
          additionalData: recordTakingDto.additionalData,
          automaticConfirmation: recordTakingDto.automaticConfirmation ?? false,
          deviceId: recordTakingDto.deviceId,
        },
      });

      // Atualiza estatísticas de aderência em background
      this.adherenceService.updateAdherenceStats(schedule.dosage.id).catch(error => {
        this.logger.error('Erro ao atualizar estatísticas de aderência:', error);
      });

      // Cancela lembretes pendentes para esta dose
      this.reminderService.cancelRemindersForSchedule(recordTakingDto.scheduleId).catch(error => {
        this.logger.error('Erro ao cancelar lembretes:', error);
      });

      this.logger.log(`Tomada registrada: ${taking.id}`);
      return plainToClass(TakingResponseDto, taking, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao registrar tomada:', error);
      throw new ConflictException('Erro ao registrar tomada');
    }
  }

  /**
   * Registra múltiplas tomadas em lote
   */
  async recordBulkTaking(bulkRecordDto: BulkRecordTakingDto): Promise<TakingResponseDto[]> {
    this.logger.log(`Registrando ${bulkRecordDto.takings.length} tomadas em lote`);

    const results = [];
    
    for (const taking of bulkRecordDto.takings) {
      try {
        const result = await this.recordTaking(taking);
        results.push(result);
      } catch (error) {
        this.logger.error(`Erro ao registrar tomada ${taking.scheduleId}:`, error);
        // Continue com as outras tomadas em caso de erro
      }
    }

    this.logger.log(`Lote processado: ${results.length}/${bulkRecordDto.takings.length} sucessos`);
    return results;
  }

  /**
   * Realiza verificação de segurança para dosagem
   */
  async performSafetyCheck(dosageId: string): Promise<SafetyCheckResultDto> {
    const dosage = await this.prisma.dosage.findUnique({
      where: { id: dosageId },
      include: {
        prescription: {
          include: {
            patient: true,
            medication: true,
          },
        },
      },
    });

    if (!dosage) {
      throw new NotFoundException(`Dosagem ${dosageId} não encontrada`);
    }

    return await this.safetyCheckService.performComprehensiveCheck(
      dosage.prescription.patientId,
      [dosage.prescription.medicationId],
      {
        includeAllergies: true,
        includeInteractions: true,
        includeDosageLimits: true,
        includeTimingConflicts: true,
      }
    );
  }

  /**
   * Inativa dosagem
   */
  async inactivate(id: string, reason?: string): Promise<DosageResponseDto> {
    this.logger.log(`Inativando dosagem: ${id}`);

    const dosage = await this.prisma.dosage.findUnique({
      where: { id },
    });

    if (!dosage) {
      throw new NotFoundException(`Dosagem ${id} não encontrada`);
    }

    try {
      const updatedDosage = await this.prisma.$transaction(async (tx) => {
        // Inativa a dosagem
        const updated = await tx.dosage.update({
          where: { id },
          data: {
            isActive: false,
            notes: reason ? `${dosage.notes || ''}\n\nInativado: ${reason}` : dosage.notes,
            updatedAt: new Date(),
          },
        });

        // Cancela agendamentos futuros
        await this.schedulingService.cancelFutureSchedules(id, tx);

        // Cancela lembretes
        await this.reminderService.cancelAllRemindersForDosage(id);

        return updated;
      });

      this.logger.log(`Dosagem inativada: ${id}`);
      return await this.findOne(updatedDosage.id);
    } catch (error) {
      this.logger.error('Erro ao inativar dosagem:', error);
      throw new ConflictException('Erro ao inativar dosagem');
    }
  }

  /**
   * Métodos utilitários privados
   */
  private compareRiskLevels(level1: string, level2: string): number {
    const levels = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    return levels.indexOf(level1) - levels.indexOf(level2);
  }
}