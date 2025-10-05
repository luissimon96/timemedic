import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class PrescriptionValidationService {
  private readonly logger = new Logger(PrescriptionValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validatePrescriptionData(prescriptionData: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação básica
    if (!prescriptionData.patientId) errors.push('ID do paciente é obrigatório');
    if (!prescriptionData.medicationId) errors.push('ID do medicamento é obrigatório');
    if (!prescriptionData.prescriberId) errors.push('ID do prescritor é obrigatório');
    if (!prescriptionData.dosage) errors.push('Dosagem é obrigatória');
    if (!prescriptionData.frequency) errors.push('Frequência é obrigatória');
    if (!prescriptionData.route) errors.push('Via de administração é obrigatória');
    if (!prescriptionData.startDate) errors.push('Data de início é obrigatória');
    if (!prescriptionData.prescribedBy) errors.push('Nome do prescritor é obrigatório');

    // Validação de datas
    if (prescriptionData.startDate && prescriptionData.endDate) {
      const startDate = new Date(prescriptionData.startDate);
      const endDate = new Date(prescriptionData.endDate);
      
      if (endDate <= startDate) {
        errors.push('Data de fim deve ser posterior à data de início');
      }
    }

    // Verifica se paciente existe
    if (prescriptionData.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: prescriptionData.patientId },
      });
      if (!patient) {
        errors.push('Paciente não encontrado');
      }
    }

    // Verifica se medicamento existe
    if (prescriptionData.medicationId) {
      const medication = await this.prisma.medication.findUnique({
        where: { id: prescriptionData.medicationId },
      });
      if (!medication) {
        errors.push('Medicamento não encontrado');
      }
    }

    // Verifica se prescritor existe
    if (prescriptionData.prescriberId) {
      const prescriber = await this.prisma.user.findUnique({
        where: { id: prescriptionData.prescriberId },
      });
      if (!prescriber) {
        errors.push('Prescritor não encontrado');
      } else if (prescriber.role !== 'PHYSICIAN') {
        errors.push('Usuário não é um médico');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
