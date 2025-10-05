import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ConflictResult {
  hasConflicts: boolean;
  hasCriticalConflicts: boolean;
  conflicts: any[];
  summary: string;
}

@Injectable()
export class PrescriptionConflictService {
  private readonly logger = new Logger(PrescriptionConflictService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkPrescriptionConflicts(patientId: string, medicationId: string): Promise<ConflictResult> {
    const conflicts: any[] = [];
    
    // Busca prescrições ativas do paciente
    const activePrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        isActive: true,
        medicationId: { not: medicationId }, // Exclui o próprio medicamento
      },
      include: {
        medication: true,
      },
    });

    // Verifica interações medicamentosas
    for (const prescription of activePrescriptions) {
      const interaction = await this.prisma.drugInteraction.findFirst({
        where: {
          OR: [
            { medicationAId: medicationId, medicationBId: prescription.medicationId },
            { medicationAId: prescription.medicationId, medicationBId: medicationId },
          ],
        },
        include: {
          medicationA: true,
          medicationB: true,
        },
      });

      if (interaction) {
        conflicts.push({
          type: 'DRUG_INTERACTION',
          severity: interaction.severity,
          description: interaction.clinicalEffect,
          recommendation: interaction.recommendation,
          medications: [interaction.medicationA.commercialName, interaction.medicationB.commercialName],
        });
      }
    }

    // Verifica duplicação terapêutica
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (medication) {
      const sameMedication = activePrescriptions.find(p => p.medicationId === medicationId);
      if (sameMedication) {
        conflicts.push({
          type: 'DUPLICATE_MEDICATION',
          severity: 'MAJOR',
          description: `Medicamento já prescrito para o paciente`,
          recommendation: 'Verificar necessidade de prescrição dupla',
          medications: [medication.commercialName],
        });
      }

      // Verifica mesma classe terapêutica
      const sameClass = activePrescriptions.filter(p => 
        p.medication.therapeuticClass === medication.therapeuticClass
      );
      
      if (sameClass.length > 0) {
        conflicts.push({
          type: 'THERAPEUTIC_DUPLICATION',
          severity: 'MODERATE',
          description: `Medicamentos da mesma classe terapêutica: ${medication.therapeuticClass}`,
          recommendation: 'Avaliar necessidade de múltiplos medicamentos da mesma classe',
          medications: [medication.commercialName, ...sameClass.map(p => p.medication.commercialName)],
        });
      }
    }

    const hasCriticalConflicts = conflicts.some(c => 
      c.severity === 'CONTRAINDICATED' || c.severity === 'MAJOR'
    );

    const summary = conflicts.length > 0 ? 
      `${conflicts.length} conflito(s) detectado(s)` : 
      'Nenhum conflito detectado';

    return {
      hasConflicts: conflicts.length > 0,
      hasCriticalConflicts,
      conflicts,
      summary,
    };
  }
}
