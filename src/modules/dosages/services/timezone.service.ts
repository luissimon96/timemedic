import { Injectable, Logger } from '@nestjs/common';
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz';
import { addHours, addMinutes } from 'date-fns';

@Injectable()
export class TimezoneService {
  private readonly logger = new Logger(TimezoneService.name);
  private readonly defaultTimezone = 'America/Sao_Paulo';

  /**
   * Converte UTC para timezone do Brasil
   */
  utcToBrazil(utcDate: Date): Date {
    return utcToZonedTime(utcDate, this.defaultTimezone);
  }

  /**
   * Converte timezone do Brasil para UTC
   */
  brazilToUtc(localDate: Date): Date {
    return zonedTimeToUtc(localDate, this.defaultTimezone);
  }

  /**
   * Formata data no timezone brasileiro
   */
  formatBrazilTime(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
    const localDate = this.utcToBrazil(date);
    return format(localDate, formatStr, { timeZone: this.defaultTimezone });
  }

  /**
   * Verifica se está no horário de verão brasileiro
   */
  isDaylightSaving(date: Date): boolean {
    // Implementação simplificada - o Brasil não usa mais horário de verão desde 2019
    return false;
  }

  /**
   * Ajusta horário para timezone específico
   */
  adjustToTimezone(date: Date, timezone: string): Date {
    return utcToZonedTime(date, timezone);
  }

  /**
   * Calcula diferença de fuso horário
   */
  getTimezoneOffset(timezone: string = this.defaultTimezone): number {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const localTime = new Date(utc + this.getOffsetMs(timezone));
    return (localTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  private getOffsetMs(timezone: string): number {
    // Simplificado para timezone brasileiro
    return -3 * 60 * 60 * 1000; // UTC-3
  }
}
