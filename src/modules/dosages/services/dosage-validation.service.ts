import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateDosageDto, DosageFrequencyType, MealTiming } from '../dto/create-dosage.dto';
import { isAfter, isBefore, addDays, differenceInHours } from 'date-fns';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class DosageValidationService {
  private readonly logger = new Logger(DosageValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida dados de dosagem completos
   */
  async validateDosageData(
    dosageData: any,
    prescription: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação básica de dados
    this.validateBasicData(dosageData, errors);

    // Validação de frequência
    this.validateFrequency(dosageData.frequency, errors, warnings);

    // Validação de datas
    this.validateDates(dosageData, errors, warnings);

    // Validação de dosagem vs prescrição
    await this.validateAgainstPrescription(dosageData, prescription, errors, warnings);

    // Validação de timing de refeições
    this.validateMealTiming(dosageData, errors, warnings);

    // Validações específicas por tipo de medicamento
    await this.validateMedicationSpecificRules(dosageData, prescription, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validação básica de dados obrigatórios
   */
  private validateBasicData(dosageData: any, errors: string[]): void {
    if (!dosageData.prescriptionId) {
      errors.push('ID da prescrição é obrigatório');
    }

    if (!dosageData.dosagePerAdministration) {
      errors.push('Dosagem por administração é obrigatória');
    }

    if (!dosageData.frequency) {
      errors.push('Configuração de frequência é obrigatória');
    }

    if (!dosageData.startDate) {
      errors.push('Data de início é obrigatória');
    }

    // Validação de tolerância
    if (dosageData.toleranceWindowMinutes !== undefined) {
      if (dosageData.toleranceWindowMinutes < 5 || dosageData.toleranceWindowMinutes > 240) {
        errors.push('Janela de tolerância deve estar entre 5 e 240 minutos');
      }
    }

    // Validação de offset de refeição
    if (dosageData.mealOffset !== undefined) {
      if (dosageData.mealOffset < -120 || dosageData.mealOffset > 120) {
        errors.push('Offset de refeição deve estar entre -120 e 120 minutos');
      }
    }
  }

  /**
   * Validação de configuração de frequência
   */
  private validateFrequency(frequency: any, errors: string[], warnings: string[]): void {
    if (!frequency.type) {
      errors.push('Tipo de frequência é obrigatório');
      return;
    }

    switch (frequency.type) {
      case DosageFrequencyType.FIXED_INTERVAL:
        this.validateFixedInterval(frequency, errors, warnings);
        break;
      case DosageFrequencyType.DAILY_TIMES:
        this.validateDailyTimes(frequency, errors, warnings);
        break;
      case DosageFrequencyType.WEEKLY_SCHEDULE:
        this.validateWeeklySchedule(frequency, errors, warnings);
        break;
      case DosageFrequencyType.CUSTOM:
        this.validateCustomPattern(frequency, errors, warnings);
        break;
      case DosageFrequencyType.PRN:
        this.validatePRN(frequency, errors, warnings);
        break;
      default:
        errors.push(`Tipo de frequência não suportado: ${frequency.type}`);
    }
  }

  private validateFixedInterval(frequency: any, errors: string[], warnings: string[]): void {
    if (!frequency.intervalHours) {
      errors.push('Intervalo em horas é obrigatório para frequência fixa');
      return;
    }

    if (frequency.intervalHours < 1 || frequency.intervalHours > 168) {
      errors.push('Intervalo deve estar entre 1 e 168 horas (1 semana)');
    }

    if (frequency.intervalHours < 4) {
      warnings.push('Intervalo muito curto pode afetar a qualidade do sono');
    }

    if (frequency.intervalHours > 24) {
      warnings.push('Intervalo longo pode afetar a eficácia do tratamento');
    }
  }

  private validateDailyTimes(frequency: any, errors: string[], warnings: string[]): void {
    if (!frequency.timesPerDay) {
      errors.push('Número de vezes por dia é obrigatório');
      return;
    }

    if (frequency.timesPerDay < 1 || frequency.timesPerDay > 24) {
      errors.push('Número de vezes por dia deve estar entre 1 e 24');
    }

    if (frequency.specificTimes) {
      if (frequency.specificTimes.length !== frequency.timesPerDay) {
        errors.push('Número de horários específicos deve coincidir com vezes por dia');
      }

      // Valida formato dos horários
      for (const time of frequency.specificTimes) {
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
          errors.push(`Formato de horário inválido: ${time}`);
        }
      }

      // Verifica espaçamento mínimo entre doses
      const times = frequency.specificTimes.map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      }).sort((a, b) => a - b);

      for (let i = 1; i < times.length; i++) {
        const diff = times[i] - times[i - 1];
        if (diff < 120) { // Menos de 2 horas
          warnings.push('Intervalo muito curto entre doses pode causar problemas');
        }
      }
    }

    if (frequency.timesPerDay > 6) {
      warnings.push('Muitas doses por dia podem afetar a aderência');
    }
  }

  private validateWeeklySchedule(frequency: any, errors: string[], warnings: string[]): void {
    if (!frequency.weekDays || frequency.weekDays.length === 0) {
      errors.push('Dias da semana são obrigatórios para agendamento semanal');
      return;
    }

    for (const day of frequency.weekDays) {
      if (day < 0 || day > 6) {
        errors.push(`Dia da semana inválido: ${day} (deve ser 0-6)`);
      }
    }

    if (!frequency.specificTimes || frequency.specificTimes.length === 0) {
      errors.push('Horários específicos são obrigatórios para agendamento semanal');
    }

    if (frequency.weekDays.length < 3) {
      warnings.push('Poucas doses por semana podem afetar a eficácia');
    }
  }

  private validateCustomPattern(frequency: any, errors: string[], warnings: string[]): void {
    if (!frequency.customPattern) {
      errors.push('Padrão customizado é obrigatório');
      return;
    }

    try {
      // Validação básica de sintaxe cron
      const parts = frequency.customPattern.split(' ');
      if (parts.length !== 5) {
        errors.push('Padrão cron deve ter 5 componentes');
      }
    } catch (error) {
      errors.push('Padrão cron inválido');
    }

    warnings.push('Padrões customizados requerem validação adicional');
  }

  private validatePRN(frequency: any, errors: string[], warnings: string[]): void {
    // PRN (Pro Re Nata) não tem validações específicas de frequência
    warnings.push('Medicação PRN requer monitoramento especial de uso');
  }

  /**
   * Validação de datas
   */
  private validateDates(dosageData: any, errors: string[], warnings: string[]): void {
    const startDate = new Date(dosageData.startDate);
    const now = new Date();

    // Valida data de início
    if (isNaN(startDate.getTime())) {
      errors.push('Data de início inválida');
      return;
    }

    // Data de início muito no passado
    if (isBefore(startDate, addDays(now, -7))) {
      warnings.push('Data de início no passado pode gerar muitos agendamentos');
    }

    // Data de início muito no futuro
    if (isAfter(startDate, addDays(now, 365))) {
      warnings.push('Data de início muito distante');
    }

    // Validação de data de fim
    if (dosageData.endDate) {
      const endDate = new Date(dosageData.endDate);
      
      if (isNaN(endDate.getTime())) {
        errors.push('Data de fim inválida');
        return;
      }

      if (isBefore(endDate, startDate)) {
        errors.push('Data de fim deve ser posterior à data de início');
      }

      if (isAfter(endDate, addDays(startDate, 365))) {
        warnings.push('Tratamento muito longo (mais de 1 ano)');
      }
    }

    // Validação de duração máxima
    if (dosageData.maxDurationDays) {
      if (dosageData.maxDurationDays < 1 || dosageData.maxDurationDays > 365) {
        errors.push('Duração máxima deve estar entre 1 e 365 dias');
      }

      if (dosageData.endDate) {
        const endDate = new Date(dosageData.endDate);
        const calculatedEnd = addDays(startDate, dosageData.maxDurationDays);
        
        if (isAfter(endDate, calculatedEnd)) {
          warnings.push('Data de fim excede duração máxima especificada');
        }
      }
    }
  }

  /**
   * Validação contra prescrição
   */
  private async validateAgainstPrescription(
    dosageData: any,
    prescription: any,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    if (!prescription) {
      errors.push('Prescrição não encontrada');
      return;
    }

    // Verifica se prescrição está ativa
    if (!prescription.isActive) {
      errors.push('Prescrição não está ativa');
    }

    // Verifica datas da prescrição
    const dosageStart = new Date(dosageData.startDate);
    const prescriptionStart = new Date(prescription.startDate);
    
    if (isBefore(dosageStart, prescriptionStart)) {
      errors.push('Data de início da dosagem não pode ser anterior à prescrição');
    }

    if (prescription.endDate) {
      const prescriptionEnd = new Date(prescription.endDate);
      const dosageEnd = dosageData.endDate ? 
        new Date(dosageData.endDate) : 
        addDays(dosageStart, dosageData.maxDurationDays || 30);

      if (isAfter(dosageEnd, prescriptionEnd)) {
        warnings.push('Dosagem se estende além do período da prescrição');
      }
    }

    // Validação de dosagem
    if (prescription.dosage && prescription.dosage !== dosageData.dosagePerAdministration) {
      warnings.push('Dosagem difere da prescrita originalmente');
    }

    // Verificar se já existe dosagem ativa para esta prescrição
    const existingDosage = await this.prisma.dosage.findFirst({
      where: {
        prescriptionId: dosageData.prescriptionId,
        isActive: true,
        id: { not: dosageData.id }, // Excluir própria dosagem se for atualização
      },
    });

    if (existingDosage) {
      errors.push('Já existe dosagem ativa para esta prescrição');
    }
  }

  /**
   * Validação de timing de refeições
   */
  private validateMealTiming(dosageData: any, errors: string[], warnings: string[]): void {
    if (!dosageData.mealTiming || dosageData.mealTiming === MealTiming.ANY_TIME) {
      return;
    }

    // Se tem timing de refeição mas não tem offset, usar padrão
    if (dosageData.mealOffset === undefined) {
      switch (dosageData.mealTiming) {
        case MealTiming.BEFORE_MEAL:
          warnings.push('Recomenda-se especificar tempo antes da refeição (padrão: 30min)');
          break;
        case MealTiming.AFTER_MEAL:
          warnings.push('Recomenda-se especificar tempo após a refeição (padrão: 30min)');
          break;
      }
    }

    // Validações específicas por tipo
    switch (dosageData.mealTiming) {
      case MealTiming.EMPTY_STOMACH:
        if (dosageData.mealOffset && Math.abs(dosageData.mealOffset) < 60) {
          warnings.push('Estômago vazio requer pelo menos 1 hora de distância das refeições');
        }
        break;
      case MealTiming.WITH_MEAL:
        if (dosageData.mealOffset && Math.abs(dosageData.mealOffset) > 15) {
          warnings.push('Medicação com refeição deve ser tomada próximo ao horário da refeição');
        }
        break;
    }
  }

  /**
   * Validações específicas por tipo de medicamento
   */
  private async validateMedicationSpecificRules(
    dosageData: any,
    prescription: any,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    if (!prescription.medication) return;

    const medication = prescription.medication;
    const therapeuticClass = medication.therapeuticClass?.toLowerCase() || '';

    // Validações para classes terapêuticas específicas
    if (therapeuticClass.includes('anticoagulant')) {
      this.validateAnticoagulant(dosageData, medication, errors, warnings);
    }

    if (therapeuticClass.includes('antibiotic')) {
      this.validateAntibiotic(dosageData, medication, errors, warnings);
    }

    if (therapeuticClass.includes('diabetes') || therapeuticClass.includes('insulin')) {
      this.validateDiabetesMedication(dosageData, medication, errors, warnings);
    }

    if (therapeuticClass.includes('cardiac') || therapeuticClass.includes('heart')) {
      this.validateCardiacMedication(dosageData, medication, errors, warnings);
    }

    // Validação de contraindicações gerais
    if (medication.contraindications) {
      warnings.push('Verificar contraindicações do medicamento antes do uso');
    }
  }

  private validateAnticoagulant(dosageData: any, medication: any, errors: string[], warnings: string[]): void {
    // Anticoagulantes são medicações críticas
    if (!dosageData.isCritical) {
      warnings.push('Anticoagulantes devem ser marcados como medicação crítica');
    }

    // Horários consistentes são importantes
    if (dosageData.frequency.type !== DosageFrequencyType.DAILY_TIMES || !dosageData.frequency.specificTimes) {
      warnings.push('Anticoagulantes requerem horários fixos e consistentes');
    }

    warnings.push('Monitoramento regular de INR/coagulação necessário');
  }

  private validateAntibiotic(dosageData: any, medication: any, errors: string[], warnings: string[]): void {
    // Intervalo mínimo entre doses
    if (dosageData.frequency.type === DosageFrequencyType.FIXED_INTERVAL) {
      if (dosageData.frequency.intervalHours < 6) {
        warnings.push('Intervalo muito curto para antibiótico pode causar resistência');
      }
    }

    // Duração do tratamento
    if (dosageData.maxDurationDays && dosageData.maxDurationDays > 14) {
      warnings.push('Tratamento antibiótico prolongado requer monitoramento');
    }

    warnings.push('Completar curso antibiótico mesmo com melhora dos sintomas');
  }

  private validateDiabetesMedication(dosageData: any, medication: any, errors: string[], warnings: string[]): void {
    // Medicações de diabetes são críticas
    if (!dosageData.isCritical) {
      warnings.push('Medicações para diabetes devem ser marcadas como críticas');
    }

    // Timing com refeições é importante
    if (dosageData.mealTiming === MealTiming.ANY_TIME) {
      warnings.push('Medicações para diabetes geralmente requerem timing específico com refeições');
    }

    warnings.push('Monitoramento de glicemia recomendado');
  }

  private validateCardiacMedication(dosageData: any, medication: any, errors: string[], warnings: string[]): void {
    // Medicações cardíacas são críticas
    if (!dosageData.isCritical) {
      warnings.push('Medicações cardíacas devem ser marcadas como críticas');
    }

    // Horários consistentes
    if (!dosageData.frequency.specificTimes) {
      warnings.push('Medicações cardíacas se beneficiam de horários fixos');
    }

    warnings.push('Monitoramento de pressão arterial e frequência cardíaca recomendado');
  }

  /**
   * Validação de inativação
   */
  async validateInactivation(dosageId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dosage = await this.prisma.dosage.findUnique({
      where: { id: dosageId },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!dosage) {
      errors.push('Dosagem não encontrada');
      return { isValid: false, errors, warnings };
    }

    if (!dosage.isActive) {
      errors.push('Dosagem já está inativa');
    }

    // Verificar se há tomadas pendentes
    const pendingTakings = await this.prisma.dosageSchedule.count({
      where: {
        dosageId,
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
    });

    if (pendingTakings > 0) {
      warnings.push(`${pendingTakings} doses futuras serão canceladas`);
    }

    // Medicações críticas requerem justificativa
    if (dosage.isCritical) {
      warnings.push('Medicação crítica - justificativa recomendada para inativação');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}