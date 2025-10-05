import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TimezoneService } from './services/timezone.service';
import { ConflictDetectionService } from './services/conflict-detection.service';
import { DosageFrequencyType, MealTiming } from './dto/create-dosage.dto';
import { addDays, addHours, addMinutes, startOfDay, isAfter, isBefore, format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import * as cron from 'cron';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timezoneService: TimezoneService,
    private readonly conflictDetectionService: ConflictDetectionService,
  ) {}

  /**
   * Gera agendamentos automáticos para uma dosagem
   */
  async generateSchedulesForDosage(dosageId: string, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    
    const dosage = await prisma.dosage.findUnique({
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
      throw new Error(`Dosagem ${dosageId} não encontrada`);
    }

    const timezone = 'America/Sao_Paulo'; // Timezone padrão do Brasil
    const startDate = utcToZonedTime(dosage.startDate, timezone);
    const endDate = dosage.endDate ? 
      utcToZonedTime(dosage.endDate, timezone) : 
      addDays(startDate, dosage.maxDurationDays || 30);

    this.logger.log(`Gerando agendamentos para dosagem ${dosageId} de ${format(startDate, 'yyyy-MM-dd')} até ${format(endDate, 'yyyy-MM-dd')}`);

    const schedules = this.calculateScheduleTimes(dosage.frequency, startDate, endDate, timezone);
    
    // Aplica ajustes de refeição se necessário
    const adjustedSchedules = await this.applyMealTimingAdjustments(
      schedules,
      dosage.mealTiming,
      dosage.mealOffset,
      dosage.prescription.patientId,
      timezone
    );

    // Detecta e resolve conflitos
    const finalSchedules = await this.resolveSchedulingConflicts(
      adjustedSchedules,
      dosage.prescription.patientId,
      dosageId
    );

    // Cria os registros no banco
    const createPromises = finalSchedules.map((scheduleTime, index) => 
      prisma.dosageSchedule.create({
        data: {
          dosageId,
          scheduledTime: zonedTimeToUtc(scheduleTime, timezone),
          dosage: dosage.dosagePerAdministration,
          instructions: this.generateInstructions(dosage, scheduleTime, index),
          status: 'SCHEDULED',
        },
      })
    );

    await Promise.all(createPromises);
    this.logger.log(`Criados ${finalSchedules.length} agendamentos para dosagem ${dosageId}`);
  }

  /**
   * Calcula horários baseado na frequência especificada
   */
  private calculateScheduleTimes(
    frequency: any,
    startDate: Date,
    endDate: Date,
    timezone: string
  ): Date[] {
    const schedules: Date[] = [];
    
    switch (frequency.type) {
      case DosageFrequencyType.FIXED_INTERVAL:
        schedules.push(...this.generateFixedIntervalSchedules(
          startDate, 
          endDate, 
          frequency.intervalHours
        ));
        break;

      case DosageFrequencyType.DAILY_TIMES:
        schedules.push(...this.generateDailyTimesSchedules(
          startDate,
          endDate,
          frequency.timesPerDay,
          frequency.specificTimes
        ));
        break;

      case DosageFrequencyType.WEEKLY_SCHEDULE:
        schedules.push(...this.generateWeeklySchedules(
          startDate,
          endDate,
          frequency.weekDays,
          frequency.specificTimes
        ));
        break;

      case DosageFrequencyType.CUSTOM:
        schedules.push(...this.generateCustomSchedules(
          startDate,
          endDate,
          frequency.customPattern,
          timezone
        ));
        break;

      case DosageFrequencyType.PRN:
        // PRN (Pro Re Nata) não gera agendamentos automáticos
        this.logger.log('Medicação PRN - sem agendamentos automáticos');
        break;

      default:
        throw new Error(`Tipo de frequência não suportado: ${frequency.type}`);
    }

    return schedules.filter(schedule => 
      isAfter(schedule, startDate) && isBefore(schedule, endDate)
    );
  }

  /**
   * Gera agendamentos com intervalo fixo
   */
  private generateFixedIntervalSchedules(
    startDate: Date,
    endDate: Date,
    intervalHours: number
  ): Date[] {
    const schedules: Date[] = [];
    let currentTime = startDate;

    while (isBefore(currentTime, endDate)) {
      schedules.push(new Date(currentTime));
      currentTime = addHours(currentTime, intervalHours);
    }

    return schedules;
  }

  /**
   * Gera agendamentos por número de vezes por dia
   */
  private generateDailyTimesSchedules(
    startDate: Date,
    endDate: Date,
    timesPerDay: number,
    specificTimes?: string[]
  ): Date[] {
    const schedules: Date[] = [];
    let currentDate = startOfDay(startDate);

    while (isBefore(currentDate, endDate)) {
      if (specificTimes && specificTimes.length > 0) {
        // Usa horários específicos
        specificTimes.slice(0, timesPerDay).forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduleTime = new Date(currentDate);
          scheduleTime.setHours(hours, minutes, 0, 0);
          
          if (isAfter(scheduleTime, startDate) && isBefore(scheduleTime, endDate)) {
            schedules.push(scheduleTime);
          }
        });
      } else {
        // Distribui uniformemente ao longo do dia
        const intervalHours = 24 / timesPerDay;
        for (let i = 0; i < timesPerDay; i++) {
          const scheduleTime = addHours(currentDate, i * intervalHours);
          if (isAfter(scheduleTime, startDate) && isBefore(scheduleTime, endDate)) {
            schedules.push(scheduleTime);
          }
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return schedules;
  }

  /**
   * Gera agendamentos semanais
   */
  private generateWeeklySchedules(
    startDate: Date,
    endDate: Date,
    weekDays: number[],
    specificTimes?: string[]
  ): Date[] {
    const schedules: Date[] = [];
    let currentDate = startOfDay(startDate);

    while (isBefore(currentDate, endDate)) {
      const dayOfWeek = currentDate.getDay();
      
      if (weekDays.includes(dayOfWeek)) {
        const times = specificTimes || ['08:00']; // Padrão manhã
        
        times.forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduleTime = new Date(currentDate);
          scheduleTime.setHours(hours, minutes, 0, 0);
          
          if (isAfter(scheduleTime, startDate) && isBefore(scheduleTime, endDate)) {
            schedules.push(scheduleTime);
          }
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return schedules;
  }

  /**
   * Gera agendamentos customizados usando padrão cron
   */
  private generateCustomSchedules(
    startDate: Date,
    endDate: Date,
    cronPattern: string,
    timezone: string
  ): Date[] {
    const schedules: Date[] = [];
    
    try {
      const cronJob = new cron.CronJob(cronPattern, () => {}, null, false, timezone);
      let currentTime = startDate;

      // Gera até 1000 ocorrências para evitar loops infinitos
      for (let i = 0; i < 1000 && isBefore(currentTime, endDate); i++) {
        const nextTime = cronJob.nextDate(currentTime);
        if (nextTime && isBefore(nextTime.toDate(), endDate)) {
          schedules.push(nextTime.toDate());
          currentTime = nextTime.toDate();
        } else {
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar padrão cron ${cronPattern}:`, error);
      throw new Error('Padrão de frequência customizada inválido');
    }

    return schedules;
  }

  /**
   * Aplica ajustes baseados no timing das refeições
   */
  private async applyMealTimingAdjustments(
    schedules: Date[],
    mealTiming: MealTiming,
    mealOffset: number = 0,
    patientId: string,
    timezone: string
  ): Promise<Date[]> {
    if (mealTiming === MealTiming.ANY_TIME) {
      return schedules;
    }

    // Busca horários típicos de refeição do paciente
    const mealTimes = await this.getMealTimesForPatient(patientId);

    return schedules.map(schedule => {
      switch (mealTiming) {
        case MealTiming.BEFORE_MEAL:
          return this.adjustToBeforeMeal(schedule, mealTimes, mealOffset);
        case MealTiming.WITH_MEAL:
          return this.adjustToWithMeal(schedule, mealTimes);
        case MealTiming.AFTER_MEAL:
          return this.adjustToAfterMeal(schedule, mealTimes, mealOffset);
        case MealTiming.EMPTY_STOMACH:
          return this.adjustToEmptyStomach(schedule, mealTimes);
        default:
          return schedule;
      }
    });
  }

  /**
   * Resolve conflitos de agendamento
   */
  private async resolveSchedulingConflicts(
    schedules: Date[],
    patientId: string,
    dosageId: string
  ): Promise<Date[]> {
    const conflicts = await this.conflictDetectionService.detectSchedulingConflicts(
      schedules,
      patientId,
      dosageId
    );

    if (conflicts.length === 0) {
      return schedules;
    }

    this.logger.log(`Detectados ${conflicts.length} conflitos de agendamento`);

    // Resolve conflitos movendo horários em intervalos de 15 minutos
    const resolvedSchedules = [...schedules];
    
    for (const conflict of conflicts) {
      const conflictIndex = schedules.findIndex(s => 
        Math.abs(s.getTime() - conflict.conflictTime.getTime()) < 60000 // 1 minuto
      );
      
      if (conflictIndex !== -1) {
        const newTime = this.findNearestAvailableTime(
          schedules[conflictIndex],
          conflict.suggestedAlternatives
        );
        resolvedSchedules[conflictIndex] = newTime;
      }
    }

    return resolvedSchedules;
  }

  /**
   * Regenera agendamentos para uma dosagem (após mudanças)
   */
  async regenerateSchedulesForDosage(dosageId: string, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    
    // Remove agendamentos futuros
    await this.cancelFutureSchedules(dosageId, prisma);
    
    // Gera novos agendamentos
    await this.generateSchedulesForDosage(dosageId, prisma);
  }

  /**
   * Cancela agendamentos futuros
   */
  async cancelFutureSchedules(dosageId: string, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    const now = new Date();

    await prisma.dosageSchedule.updateMany({
      where: {
        dosageId,
        scheduledTime: { gt: now },
        status: 'SCHEDULED',
      },
      data: {
        status: 'CANCELLED',
        updatedAt: now,
      },
    });

    this.logger.log(`Agendamentos futuros cancelados para dosagem ${dosageId}`);
  }

  /**
   * Métodos auxiliares privados
   */
  private async getMealTimesForPatient(patientId: string) {
    // Implementação padrão para horários de refeição brasileiros
    return {
      breakfast: { hour: 7, minute: 0 },   // 07:00
      lunch: { hour: 12, minute: 0 },      // 12:00
      dinner: { hour: 19, minute: 0 },     // 19:00
      snack: { hour: 15, minute: 0 },      // 15:00 (lanche)
    };
  }

  private adjustToBeforeMeal(schedule: Date, mealTimes: any, offset: number = 30): Date {
    const nearestMeal = this.findNearestMealTime(schedule, mealTimes);
    return addMinutes(nearestMeal, -offset);
  }

  private adjustToWithMeal(schedule: Date, mealTimes: any): Date {
    return this.findNearestMealTime(schedule, mealTimes);
  }

  private adjustToAfterMeal(schedule: Date, mealTimes: any, offset: number = 30): Date {
    const nearestMeal = this.findNearestMealTime(schedule, mealTimes);
    return addMinutes(nearestMeal, offset);
  }

  private adjustToEmptyStomach(schedule: Date, mealTimes: any): Date {
    // Ajusta para pelo menos 2 horas após refeição ou 1 hora antes
    const nearestMeal = this.findNearestMealTime(schedule, mealTimes);
    const beforeMeal = addMinutes(nearestMeal, -60);
    const afterMeal = addMinutes(nearestMeal, 120);
    
    // Escolhe o horário mais próximo do agendamento original
    const diffBefore = Math.abs(schedule.getTime() - beforeMeal.getTime());
    const diffAfter = Math.abs(schedule.getTime() - afterMeal.getTime());
    
    return diffBefore < diffAfter ? beforeMeal : afterMeal;
  }

  private findNearestMealTime(schedule: Date, mealTimes: any): Date {
    const scheduleMinutes = schedule.getHours() * 60 + schedule.getMinutes();
    
    const mealMinutes = Object.values(mealTimes).map((meal: any) => 
      meal.hour * 60 + meal.minute
    );

    const nearestMealMinutes = mealMinutes.reduce((prev, curr) => 
      Math.abs(curr - scheduleMinutes) < Math.abs(prev - scheduleMinutes) ? curr : prev
    );

    const result = new Date(schedule);
    result.setHours(Math.floor(nearestMealMinutes / 60), nearestMealMinutes % 60, 0, 0);
    
    return result;
  }

  private findNearestAvailableTime(originalTime: Date, alternatives: Date[]): Date {
    if (alternatives.length === 0) {
      // Move 15 minutos para frente como fallback
      return addMinutes(originalTime, 15);
    }

    return alternatives.reduce((nearest, current) => 
      Math.abs(current.getTime() - originalTime.getTime()) < 
      Math.abs(nearest.getTime() - originalTime.getTime()) ? current : nearest
    );
  }

  private generateInstructions(dosage: any, scheduleTime: Date, index: number): string {
    let instructions = dosage.specialInstructions || '';
    
    // Adiciona instruções baseadas no horário
    const hour = scheduleTime.getHours();
    if (hour >= 6 && hour < 12) {
      instructions += instructions ? ' ' : '';
      instructions += 'Dose matinal.';
    } else if (hour >= 12 && hour < 18) {
      instructions += instructions ? ' ' : '';
      instructions += 'Dose vespertina.';
    } else {
      instructions += instructions ? ' ' : '';
      instructions += 'Dose noturna.';
    }

    // Adiciona instruções de refeição
    if (dosage.mealTiming && dosage.mealTiming !== MealTiming.ANY_TIME) {
      const mealInstructions = {
        [MealTiming.BEFORE_MEAL]: 'Tomar antes da refeição.',
        [MealTiming.WITH_MEAL]: 'Tomar durante a refeição.',
        [MealTiming.AFTER_MEAL]: 'Tomar após a refeição.',
        [MealTiming.EMPTY_STOMACH]: 'Tomar com estômago vazio.',
      };
      
      instructions += instructions ? ' ' : '';
      instructions += mealInstructions[dosage.mealTiming];
    }

    return instructions.trim();
  }
}