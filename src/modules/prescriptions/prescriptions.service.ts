import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AllergiesService } from '../allergies/allergies.service';
import { PrescriptionValidationService } from './services/prescription-validation.service';
import { PrescriptionConflictService } from './services/prescription-conflict.service';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SearchPrescriptionDto,
  PrescriptionResponseDto,
  PaginatedPrescriptionResponseDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly allergiesService: AllergiesService,
    private readonly validationService: PrescriptionValidationService,
    private readonly conflictService: PrescriptionConflictService,
  ) {}

  /**
   * Cria uma nova prescrição com validações de segurança
   */
  async create(createPrescriptionDto: CreatePrescriptionDto): Promise<PrescriptionResponseDto> {
    this.logger.log(`Criando prescrição para paciente: ${createPrescriptionDto.patientId}`);

    // Validação de dados
    const validation = await this.validationService.validatePrescriptionData(createPrescriptionDto);
    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificação de conflitos de alergia
    const allergyConflict = await this.allergiesService.checkMedicationConflict(
      createPrescriptionDto.patientId,
      createPrescriptionDto.medicationId
    );

    if (allergyConflict.hasConflict && allergyConflict.riskLevel === 'CRITICAL') {
      throw new ConflictException(`Alergia crítica detectada: ${allergyConflict.conflictDetails}`);
    }

    // Verificação de conflitos com outras prescrições
    const prescriptionConflicts = await this.conflictService.checkPrescriptionConflicts(
      createPrescriptionDto.patientId,
      createPrescriptionDto.medicationId
    );

    if (prescriptionConflicts.hasCriticalConflicts) {
      throw new ConflictException(`Conflitos críticos detectados: ${prescriptionConflicts.summary}`);
    }

    try {
      const prescription = await this.prisma.prescription.create({
        data: {
          patientId: createPrescriptionDto.patientId,
          medicationId: createPrescriptionDto.medicationId,
          userId: createPrescriptionDto.prescriberId,
          dosage: createPrescriptionDto.dosage,
          frequency: createPrescriptionDto.frequency,
          route: createPrescriptionDto.route,
          instructions: createPrescriptionDto.instructions,
          startDate: new Date(createPrescriptionDto.startDate),
          endDate: createPrescriptionDto.endDate ? new Date(createPrescriptionDto.endDate) : null,
          indication: createPrescriptionDto.indication,
          prescribedBy: createPrescriptionDto.prescribedBy,
          prescriptionDate: createPrescriptionDto.prescriptionDate ? 
            new Date(createPrescriptionDto.prescriptionDate) : new Date(),
          isActive: true,
        },
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
              activeSubstance: true,
              therapeuticClass: true,
            },
          },
          prescriber: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Prescrição criada com sucesso: ${prescription.id}`);
      return plainToClass(PrescriptionResponseDto, prescription, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao criar prescrição:', error);
      throw new ConflictException('Erro ao criar prescrição');
    }
  }

  /**
   * Busca prescrições com filtros e paginação
   */
  async findAll(searchDto: SearchPrescriptionDto): Promise<PaginatedPrescriptionResponseDto> {
    const {
      patientId,
      medicationId,
      prescriberId,
      activeOnly = true,
      startDateFrom,
      startDateTo,
      therapeuticClass,
      indication,
      search,
      page = 1,
      limit = 20,
      sortBy = 'prescriptionDate',
      sortOrder = 'desc',
    } = searchDto;

    // Constrói filtros dinâmicos
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (medicationId) {
      where.medicationId = medicationId;
    }

    if (prescriberId) {
      where.userId = prescriberId;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    if (therapeuticClass) {
      where.medication = {
        therapeuticClass: { contains: therapeuticClass, mode: 'insensitive' }
      };
    }

    if (indication) {
      where.indication = { contains: indication, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        {
          medication: {
            commercialName: { contains: search, mode: 'insensitive' }
          }
        },
        {
          indication: { contains: search, mode: 'insensitive' }
        },
        {
          instructions: { contains: search, mode: 'insensitive' }
        },
      ];
    }

    const skip = (page - 1) * limit;

    try {
      const [prescriptions, total] = await Promise.all([
        this.prisma.prescription.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
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
                activeSubstance: true,
                therapeuticClass: true,
              },
            },
            prescriber: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.prescription.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedPrescriptionResponseDto = {
        data: prescriptions.map(prescription => 
          plainToClass(PrescriptionResponseDto, prescription, { excludeExtraneousValues: true })
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
      this.logger.error('Erro ao buscar prescrições:', error);
      throw new Error('Erro interno ao buscar prescrições');
    }
  }

  /**
   * Busca prescrição por ID
   */
  async findOne(id: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
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
            activeSubstance: true,
            therapeuticClass: true,
            contraindications: true,
            sideEffects: true,
          },
        },
        prescriber: {
          select: {
            id: true,
            email: true,
          },
        },
        dosageSchedules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescrição ${id} não encontrada`);
    }

    return plainToClass(PrescriptionResponseDto, prescription, { excludeExtraneousValues: true });
  }

  /**
   * Atualiza prescrição
   */
  async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto): Promise<PrescriptionResponseDto> {
    this.logger.log(`Atualizando prescrição: ${id}`);

    const existingPrescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        medication: true,
      },
    });

    if (!existingPrescription) {
      throw new NotFoundException(`Prescrição ${id} não encontrada`);
    }

    // Validação da atualização
    const mergedData = { ...existingPrescription, ...updatePrescriptionDto };
    const validation = await this.validationService.validatePrescriptionData(mergedData);
    
    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Se mudou medicação, verificar alergias novamente
    if (updatePrescriptionDto.medicationId && updatePrescriptionDto.medicationId !== existingPrescription.medicationId) {
      const allergyConflict = await this.allergiesService.checkMedicationConflict(
        existingPrescription.patientId,
        updatePrescriptionDto.medicationId
      );

      if (allergyConflict.hasConflict && allergyConflict.riskLevel === 'CRITICAL') {
        throw new ConflictException(`Alergia crítica detectada: ${allergyConflict.conflictDetails}`);
      }
    }

    try {
      const updatedPrescription = await this.prisma.prescription.update({
        where: { id },
        data: {
          ...updatePrescriptionDto,
          ...(updatePrescriptionDto.startDate && { startDate: new Date(updatePrescriptionDto.startDate) }),
          ...(updatePrescriptionDto.endDate && { endDate: new Date(updatePrescriptionDto.endDate) }),
          ...(updatePrescriptionDto.prescriptionDate && { 
            prescriptionDate: new Date(updatePrescriptionDto.prescriptionDate) 
          }),
          updatedAt: new Date(),
        },
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
              activeSubstance: true,
              therapeuticClass: true,
            },
          },
          prescriber: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Prescrição atualizada: ${id}`);
      return plainToClass(PrescriptionResponseDto, updatedPrescription, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao atualizar prescrição:', error);
      throw new ConflictException('Erro ao atualizar prescrição');
    }
  }

  /**
   * Inativa prescrição
   */
  async inactivate(id: string, reason?: string): Promise<PrescriptionResponseDto> {
    this.logger.log(`Inativando prescrição: ${id}`);

    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescrição ${id} não encontrada`);
    }

    try {
      const updatedPrescription = await this.prisma.$transaction(async (tx) => {
        // Inativa a prescrição
        const updated = await tx.prescription.update({
          where: { id },
          data: {
            isActive: false,
            endDate: new Date(),
            instructions: reason ? 
              `${prescription.instructions || ''}\n\nInativado: ${reason}` : 
              prescription.instructions,
            updatedAt: new Date(),
          },
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
                activeSubstance: true,
                therapeuticClass: true,
              },
            },
            prescriber: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        // Inativa dosagens relacionadas
        await tx.dosage.updateMany({
          where: { prescriptionId: id },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        return updated;
      });

      this.logger.log(`Prescrição inativada: ${id}`);
      return plainToClass(PrescriptionResponseDto, updatedPrescription, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao inativar prescrição:', error);
      throw new ConflictException('Erro ao inativar prescrição');
    }
  }

  /**
   * Busca prescrições ativas de um paciente
   */
  async findActiveByPatient(patientId: string): Promise<PrescriptionResponseDto[]> {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        medication: {
          select: {
            id: true,
            commercialName: true,
            anvisaCode: true,
            activeSubstance: true,
            therapeuticClass: true,
          },
        },
        prescriber: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { prescriptionDate: 'desc' },
    });

    return prescriptions.map(prescription => 
      plainToClass(PrescriptionResponseDto, prescription, { excludeExtraneousValues: true })
    );
  }

  /**
   * Verifica conflitos para uma nova prescrição
   */
  async checkConflicts(patientId: string, medicationId: string) {
    const [allergyConflict, prescriptionConflicts] = await Promise.all([
      this.allergiesService.checkMedicationConflict(patientId, medicationId),
      this.conflictService.checkPrescriptionConflicts(patientId, medicationId),
    ]);

    return {
      allergyConflict,
      prescriptionConflicts,
      hasAnyConflict: allergyConflict.hasConflict || prescriptionConflicts.hasConflicts,
      hasCriticalConflict: 
        (allergyConflict.hasConflict && allergyConflict.riskLevel === 'CRITICAL') ||
        prescriptionConflicts.hasCriticalConflicts,
    };
  }

  /**
   * Obtém estatísticas de prescrições
   */
  async getStatistics() {
    try {
      const [
        totalPrescriptions,
        activePrescriptions,
        prescriptionsByTherapeuticClass,
        recentPrescriptions,
      ] = await Promise.all([
        this.prisma.prescription.count(),
        this.prisma.prescription.count({ where: { isActive: true } }),
        this.prisma.prescription.groupBy({
          by: ['medication'],
          _count: true,
          where: { isActive: true },
          orderBy: { _count: { medication: 'desc' } },
          take: 10,
        }),
        this.prisma.prescription.count({
          where: {
            prescriptionDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
          },
        }),
      ]);

      return {
        totalPrescriptions,
        activePrescriptions,
        recentPrescriptions,
        topMedications: prescriptionsByTherapeuticClass,
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro interno ao obter estatísticas');
    }
  }
}