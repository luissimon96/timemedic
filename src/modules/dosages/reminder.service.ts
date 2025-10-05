import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TimezoneService } from './services/timezone.service';
import {
  ReminderConfigDto,
  NotificationChannel,
  EscalationLevel,
} from './dto/reminder-config.dto';
import { addMinutes, isBefore, isAfter, format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timezoneService: TimezoneService,
    @InjectQueue('dosage-reminders') private readonly reminderQueue: Queue,
  ) {}

  /**
   * Configura lembretes para uma dosagem
   */
  async setupRemindersForDosage(dosageId: string, patientId: string): Promise<void> {
    this.logger.log(`Configurando lembretes para dosagem ${dosageId}`);

    // Busca configuração de lembretes do paciente
    const reminderConfig = await this.getReminderConfig(patientId);
    
    if (!reminderConfig.enabled) {
      this.logger.log(`Lembretes desabilitados para paciente ${patientId}`);
      return;
    }

    // Busca agendamentos futuros da dosagem
    const schedules = await this.prisma.dosageSchedule.findMany({
      where: {
        dosageId,
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                medication: true,
                patient: true,
              },
            },
          },
        },
      },
    });

    // Agenda lembretes para cada dose
    for (const schedule of schedules) {
      await this.scheduleRemindersForDose(schedule, reminderConfig);
    }

    this.logger.log(`Agendados lembretes para ${schedules.length} doses`);
  }

  /**
   * Agenda lembretes para uma dose específica
   */
  private async scheduleRemindersForDose(schedule: any, reminderConfig: ReminderConfigDto): Promise<void> {
    const timezone = reminderConfig.timezone || 'America/Sao_Paulo';
    const scheduledTime = utcToZonedTime(schedule.scheduledTime, timezone);
    
    // Verifica se está dentro do horário permitido
    if (!this.isWithinAllowedHours(scheduledTime, reminderConfig)) {
      this.logger.log(`Horário fora do período permitido para lembretes: ${format(scheduledTime, 'HH:mm')}`);
      return;
    }

    // Agenda lembrete antecipado
    const advanceReminderTime = addMinutes(scheduledTime, -reminderConfig.advanceReminderMinutes);
    if (isAfter(advanceReminderTime, new Date())) {
      await this.reminderQueue.add(
        'advance-reminder',
        {
          scheduleId: schedule.id,
          dosageId: schedule.dosageId,
          patientId: schedule.dosage.prescription.patientId,
          medicationName: schedule.dosage.prescription.medication.commercialName,
          scheduledTime: schedule.scheduledTime,
          reminderType: 'ADVANCE',
          channels: this.getChannelsForLevel(reminderConfig, EscalationLevel.LEVEL_1),
        },
        {
          delay: advanceReminderTime.getTime() - Date.now(),
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }

    // Agenda lembretes de escalação
    for (const escalationRule of reminderConfig.escalationRules) {
      const escalationTime = addMinutes(scheduledTime, escalationRule.triggerDelayMinutes);
      
      if (isAfter(escalationTime, new Date())) {
        await this.reminderQueue.add(
          'escalation-reminder',
          {
            scheduleId: schedule.id,
            dosageId: schedule.dosageId,
            patientId: schedule.dosage.prescription.patientId,
            medicationName: schedule.dosage.prescription.medication.commercialName,
            scheduledTime: schedule.scheduledTime,
            escalationLevel: escalationRule.level,
            reminderType: 'ESCALATION',
            channels: escalationRule.channels,
            maxRetries: escalationRule.maxRetries,
            retryInterval: escalationRule.retryIntervalMinutes,
            additionalContacts: escalationRule.additionalContacts,
            isCritical: schedule.dosage.isCritical,
          },
          {
            delay: escalationTime.getTime() - Date.now(),
            removeOnComplete: true,
            removeOnFail: false,
            attempts: escalationRule.maxRetries || 3,
            backoff: {
              type: 'fixed',
              settings: {
                delay: (escalationRule.retryIntervalMinutes || 15) * 60 * 1000,
              },
            },
          }
        );
      }
    }
  }

  /**
   * Processa lembretes antecipados
   */
  async processAdvanceReminder(job: any): Promise<void> {
    const { scheduleId, patientId, medicationName, scheduledTime, channels } = job.data;
    
    this.logger.log(`Processando lembrete antecipado para agendamento ${scheduleId}`);

    // Verifica se a dose já foi tomada
    const taking = await this.prisma.dosageTaking.findFirst({
      where: { scheduleId },
    });

    if (taking) {
      this.logger.log(`Dose já registrada para agendamento ${scheduleId}, cancelando lembrete`);
      return;
    }

    // Busca dados do paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      this.logger.error(`Paciente ${patientId} não encontrado`);
      return;
    }

    // Envia notificações pelos canais configurados
    const message = this.generateReminderMessage({
      type: 'ADVANCE',
      medicationName,
      scheduledTime: new Date(scheduledTime),
      patientName: await this.getPatientName(patientId),
    });

    await this.sendNotifications(channels, patient, message, 'ADVANCE_REMINDER');
  }

  /**
   * Processa lembretes de escalação
   */
  async processEscalationReminder(job: any): Promise<void> {
    const { 
      scheduleId, 
      patientId, 
      medicationName, 
      scheduledTime, 
      escalationLevel,
      channels,
      additionalContacts,
      isCritical 
    } = job.data;
    
    this.logger.log(`Processando escalação ${escalationLevel} para agendamento ${scheduleId}`);

    // Verifica se a dose já foi tomada
    const taking = await this.prisma.dosageTaking.findFirst({
      where: { scheduleId },
    });

    if (taking) {
      this.logger.log(`Dose já registrada para agendamento ${scheduleId}, cancelando escalação`);
      return;
    }

    // Busca dados do paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      this.logger.error(`Paciente ${patientId} não encontrado`);
      return;
    }

    // Gera mensagem de escalação
    const message = this.generateReminderMessage({
      type: 'ESCALATION',
      medicationName,
      scheduledTime: new Date(scheduledTime),
      patientName: await this.getPatientName(patientId),
      escalationLevel,
      isCritical,
      missedTime: new Date(scheduledTime),
    });

    // Envia para canais principais
    await this.sendNotifications(channels, patient, message, 'ESCALATION_REMINDER');

    // Envia para contatos adicionais se especificados
    if (additionalContacts && additionalContacts.length > 0) {
      await this.sendToAdditionalContacts(additionalContacts, message);
    }

    // Se for medicação crítica e escalação de nível alto, alerta equipe médica
    if (isCritical && escalationLevel === EscalationLevel.LEVEL_4) {
      await this.alertMedicalTeam(patientId, medicationName, scheduledTime);
    }
  }

  /**
   * Envia notificações pelos canais especificados
   */
  private async sendNotifications(
    channels: any[],
    patient: any,
    message: string,
    type: string
  ): Promise<void> {
    for (const channelConfig of channels) {
      if (!channelConfig.enabled) continue;

      try {
        switch (channelConfig.channel) {
          case NotificationChannel.PUSH:
            await this.sendPushNotification(patient.userId, message, type);
            break;
          case NotificationChannel.SMS:
            await this.sendSMSNotification(patient, message);
            break;
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(patient, message);
            break;
          case NotificationChannel.VOICE_CALL:
            await this.makeVoiceCall(patient, message);
            break;
          case NotificationChannel.WHATSAPP:
            await this.sendWhatsAppMessage(patient, message);
            break;
        }
      } catch (error) {
        this.logger.error(`Erro ao enviar notificação via ${channelConfig.channel}:`, error);
      }
    }
  }

  /**
   * Cancela lembretes para um agendamento específico
   */
  async cancelRemindersForSchedule(scheduleId: string): Promise<void> {
    try {
      // Remove jobs da fila relacionados ao agendamento
      const jobs = await this.reminderQueue.getJobs(['delayed', 'waiting']);
      
      for (const job of jobs) {
        if (job.data.scheduleId === scheduleId) {
          await job.remove();
        }
      }

      this.logger.log(`Lembretes cancelados para agendamento ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Erro ao cancelar lembretes para agendamento ${scheduleId}:`, error);
    }
  }

  /**
   * Cancela todos os lembretes para uma dosagem
   */
  async cancelAllRemindersForDosage(dosageId: string): Promise<void> {
    try {
      const jobs = await this.reminderQueue.getJobs(['delayed', 'waiting']);
      
      for (const job of jobs) {
        if (job.data.dosageId === dosageId) {
          await job.remove();
        }
      }

      this.logger.log(`Todos os lembretes cancelados para dosagem ${dosageId}`);
    } catch (error) {
      this.logger.error(`Erro ao cancelar lembretes para dosagem ${dosageId}:`, error);
    }
  }

  /**
   * Atualiza lembretes para uma dosagem
   */
  async updateRemindersForDosage(dosageId: string, patientId: string): Promise<void> {
    // Cancela lembretes existentes
    await this.cancelAllRemindersForDosage(dosageId);
    
    // Recria lembretes com nova configuração
    await this.setupRemindersForDosage(dosageId, patientId);
  }

  /**
   * Job para verificar doses perdidas periodicamente
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkMissedDoses(): Promise<void> {
    const now = new Date();
    const toleranceMinutes = 30; // Tolerância padrão

    // Busca agendamentos que passaram do horário sem registro
    const missedSchedules = await this.prisma.dosageSchedule.findMany({
      where: {
        scheduledTime: {
          lt: addMinutes(now, -toleranceMinutes),
        },
        status: 'SCHEDULED',
        takings: {
          none: {},
        },
      },
      include: {
        dosage: {
          include: {
            prescription: {
              include: {
                medication: true,
                patient: true,
              },
            },
          },
        },
      },
    });

    for (const schedule of missedSchedules) {
      // Atualiza status para perdido
      await this.prisma.dosageSchedule.update({
        where: { id: schedule.id },
        data: { status: 'MISSED' },
      });

      // Registra a dose como perdida
      await this.prisma.dosageTaking.create({
        data: {
          patientId: schedule.dosage.prescription.patientId,
          scheduleId: schedule.id,
          scheduledTime: schedule.scheduledTime,
          status: 'MISSED',
          delayReason: 'SYSTEM_DETECTED',
          delayDescription: 'Dose automaticamente marcada como perdida pelo sistema',
        },
      });

      this.logger.log(`Dose marcada como perdida: ${schedule.id}`);
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private async getReminderConfig(patientId: string): Promise<ReminderConfigDto> {
    // Busca configuração personalizada do paciente
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: `reminder_config_${patientId}` },
    });

    if (config) {
      return config.value as ReminderConfigDto;
    }

    // Retorna configuração padrão
    return {
      patientId,
      enabled: true,
      advanceReminderMinutes: 15,
      escalationRules: [
        {
          level: EscalationLevel.LEVEL_1,
          triggerDelayMinutes: 30,
          channels: [
            { channel: NotificationChannel.PUSH, enabled: true, priority: 1 },
          ],
          maxRetries: 3,
          retryIntervalMinutes: 15,
        },
        {
          level: EscalationLevel.LEVEL_2,
          triggerDelayMinutes: 60,
          channels: [
            { channel: NotificationChannel.PUSH, enabled: true, priority: 1 },
            { channel: NotificationChannel.SMS, enabled: true, priority: 2 },
          ],
          maxRetries: 2,
          retryIntervalMinutes: 30,
        },
      ],
      caregiverContacts: [],
      timezone: 'America/Sao_Paulo',
    };
  }

  private isWithinAllowedHours(scheduleTime: Date, config: ReminderConfigDto): boolean {
    if (!config.quietHoursStart || !config.quietHoursEnd) {
      return true;
    }

    const hour = scheduleTime.getHours();
    const [quietStart] = config.quietHoursStart.split(':').map(Number);
    const [quietEnd] = config.quietHoursEnd.split(':').map(Number);

    // Se horário de silêncio cruza meia-noite
    if (quietStart > quietEnd) {
      return hour < quietEnd || hour >= quietStart;
    }

    return hour < quietStart || hour >= quietEnd;
  }

  private getChannelsForLevel(config: ReminderConfigDto, level: EscalationLevel): any[] {
    const rule = config.escalationRules.find(r => r.level === level);
    return rule?.channels || [];
  }

  private generateReminderMessage(params: {
    type: string;
    medicationName: string;
    scheduledTime: Date;
    patientName: string;
    escalationLevel?: EscalationLevel;
    isCritical?: boolean;
    missedTime?: Date;
  }): string {
    const { type, medicationName, scheduledTime, patientName, escalationLevel, isCritical } = params;
    const timeStr = format(scheduledTime, 'HH:mm');

    if (type === 'ADVANCE') {
      return `🔔 Lembrete: Hora do seu medicamento ${medicationName} às ${timeStr}. Não esqueça!`;
    }

    if (type === 'ESCALATION') {
      const criticalMsg = isCritical ? ' [MEDICAÇÃO CRÍTICA]' : '';
      const levelMsg = {
        [EscalationLevel.LEVEL_1]: 'Você perdeu o horário do seu medicamento',
        [EscalationLevel.LEVEL_2]: 'ATENÇÃO: Medicamento ainda não tomado',
        [EscalationLevel.LEVEL_3]: 'URGENTE: Medicamento crítico não tomado',
        [EscalationLevel.LEVEL_4]: 'EMERGÊNCIA: Intervenção médica necessária',
      };

      return `⚠️ ${levelMsg[escalationLevel]} ${medicationName} (previsto para ${timeStr})${criticalMsg}. Tome assim que possível.`;
    }

    return `Lembrete sobre ${medicationName}`;
  }

  private async getPatientName(patientId: string): Promise<string> {
    // Implementação simplificada - retorna ID externo
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { externalId: true },
    });
    
    return patient?.externalId || 'Paciente';
  }

  // Implementações de notificação (stubs - implementar conforme necessário)
  private async sendPushNotification(userId: string, message: string, type: string): Promise<void> {
    // Implementar integração com serviço de push notifications
    this.logger.log(`Push notification enviada para usuário ${userId}: ${message}`);
  }

  private async sendSMSNotification(patient: any, message: string): Promise<void> {
    // Implementar integração com Twilio ou outro provedor SMS
    this.logger.log(`SMS enviado para paciente ${patient.id}: ${message}`);
  }

  private async sendEmailNotification(patient: any, message: string): Promise<void> {
    // Implementar integração com provedor de email
    this.logger.log(`Email enviado para paciente ${patient.id}: ${message}`);
  }

  private async makeVoiceCall(patient: any, message: string): Promise<void> {
    // Implementar integração com serviço de chamadas de voz
    this.logger.log(`Chamada de voz para paciente ${patient.id}: ${message}`);
  }

  private async sendWhatsAppMessage(patient: any, message: string): Promise<void> {
    // Implementar integração com WhatsApp Business API
    this.logger.log(`WhatsApp enviado para paciente ${patient.id}: ${message}`);
  }

  private async sendToAdditionalContacts(contacts: string[], message: string): Promise<void> {
    // Implementar envio para contatos adicionais
    this.logger.log(`Mensagem enviada para contatos adicionais: ${contacts.join(', ')}`);
  }

  private async alertMedicalTeam(patientId: string, medicationName: string, scheduledTime: Date): Promise<void> {
    // Implementar alerta para equipe médica
    this.logger.log(`Alerta médico enviado para paciente ${patientId} - medicação crítica ${medicationName}`);
  }
}