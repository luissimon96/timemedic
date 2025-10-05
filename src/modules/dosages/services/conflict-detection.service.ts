import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { addMinutes, isBefore, isAfter, differenceInMinutes } from 'date-fns';

export interface SchedulingConflict {
  conflictTime: Date;
  conflictType: 'TIMING_TOO_CLOSE' | 'MEAL_CONFLICT' | 'INTERACTION_TIMING' | 'SLEEP_CONFLICT';
  description: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  suggestedAlternatives: Date[];
  involvedMedications: string[];
}

@Injectable()
export class ConflictDetectionService {
  private readonly logger = new Logger(ConflictDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detecta conflitos de agendamento
   */
  async detectSchedulingConflicts(
    proposedSchedules: Date[],
    patientId: string,
    dosageId?: string
  ): Promise<SchedulingConflict[]> {
    const conflicts: SchedulingConflict[] = [];

    // Busca agendamentos existentes do paciente
    const existingSchedules = await this.getExistingSchedules(patientId, dosageId);

    for (const proposedTime of proposedSchedules) {
      // Verifica conflitos de timing
      const timingConflicts = this.detectTimingConflicts(
        proposedTime,
        existingSchedules
      );
      conflicts.push(...timingConflicts);

      // Verifica conflitos com refeições
      const mealConflicts = await this.detectMealConflicts(
        proposedTime,
        patientId
      );
      conflicts.push(...mealConflicts);

      // Verifica conflitos com sono
      const sleepConflicts = this.detectSleepConflicts(
        proposedTime,
        patientId
      );
      conflicts.push(...sleepConflicts);

      // Verifica conflitos de interação
      const interactionConflicts = await this.detectInteractionTimingConflicts(
        proposedTime,
        existingSchedules,
        dosageId
      );
      conflicts.push(...interactionConflicts);
    }

    return conflicts;
  }

  /**
   * Detecta conflitos de timing (muito próximos)
   */
  private detectTimingConflicts(
    proposedTime: Date,
    existingSchedules: any[]
  ): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    const minInterval = 15; // Mínimo 15 minutos entre doses

    for (const existing of existingSchedules) {
      const timeDiff = Math.abs(
        differenceInMinutes(proposedTime, existing.scheduledTime)
      );

      if (timeDiff < minInterval) {
        const alternatives = this.generateTimingAlternatives(
          proposedTime,
          existing.scheduledTime
        );

        conflicts.push({
          conflictTime: proposedTime,
          conflictType: 'TIMING_TOO_CLOSE',
          description: `Muito próximo de outra dose (${timeDiff} min de diferença)`,
          severity: timeDiff < 5 ? 'HIGH' : 'MODERATE',
          suggestedAlternatives: alternatives,
          involvedMedications: [existing.medicationName],
        });
      }
    }

    return conflicts;
  }

  /**
   * Detecta conflitos com refeições
   */
  private async detectMealConflicts(
    proposedTime: Date,
    patientId: string
  ): Promise<SchedulingConflict[]> {
    // Implementação simplificada
    const conflicts: SchedulingConflict[] = [];
    
    // Horários típicos de refeição no Brasil
    const mealTimes = [
      { name: 'Café da manhã', time: 7 },
      { name: 'Almoço', time: 12 },
      { name: 'Jantar', time: 19 },
    ];

    const proposedHour = proposedTime.getHours();
    
    for (const meal of mealTimes) {
      if (Math.abs(proposedHour - meal.time) < 0.5) { // 30 minutos
        conflicts.push({
          conflictTime: proposedTime,
          conflictType: 'MEAL_CONFLICT',
          description: `Conflito potencial com ${meal.name}`,
          severity: 'LOW',
          suggestedAlternatives: [
            addMinutes(proposedTime, -60),
            addMinutes(proposedTime, 60),
          ],
          involvedMedications: [],
        });
      }
    }

    return conflicts;
  }

  /**
   * Detecta conflitos com sono
   */
  private detectSleepConflicts(
    proposedTime: Date,
    patientId: string
  ): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    const hour = proposedTime.getHours();

    // Horário típico de sono (22h às 6h)
    if (hour >= 22 || hour <= 6) {
      conflicts.push({
        conflictTime: proposedTime,
        conflictType: 'SLEEP_CONFLICT',
        description: 'Horário pode interferir no sono',
        severity: hour >= 0 && hour <= 4 ? 'HIGH' : 'MODERATE',
        suggestedAlternatives: [
          new Date(proposedTime.getFullYear(), proposedTime.getMonth(), proposedTime.getDate(), 21, 0),
          new Date(proposedTime.getFullYear(), proposedTime.getMonth(), proposedTime.getDate(), 7, 0),
        ],
        involvedMedications: [],
      });
    }

    return conflicts;
  }

  /**
   * Detecta conflitos de timing de interação
   */
  private async detectInteractionTimingConflicts(
    proposedTime: Date,
    existingSchedules: any[],
    dosageId?: string
  ): Promise<SchedulingConflict[]> {
    // Implementação simplificada
    // Verificaria medicamentos que não podem ser tomados próximos
    return [];
  }

  /**
   * Gera alternativas de timing
   */
  private generateTimingAlternatives(
    proposedTime: Date,
    conflictTime: Date
  ): Date[] {
    const alternatives: Date[] = [];
    
    // Alternativas com intervalos de 15 minutos
    for (const offset of [-45, -30, -15, 15, 30, 45]) {
      alternatives.push(addMinutes(proposedTime, offset));
    }

    return alternatives.filter(alt => 
      Math.abs(differenceInMinutes(alt, conflictTime)) >= 15
    );
  }

  /**
   * Busca agendamentos existentes
   */
  private async getExistingSchedules(
    patientId: string,
    excludeDosageId?: string
  ): Promise<any[]> {
    return await this.prisma.dosageSchedule.findMany({
      where: {
        dosage: {
          prescription: { patientId },
          isActive: true,
          id: excludeDosageId ? { not: excludeDosageId } : undefined,
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
    }).then(schedules => schedules.map(s => ({
      ...s,
      medicationName: s.dosage.prescription.medication.commercialName,
    })));
  }
}
