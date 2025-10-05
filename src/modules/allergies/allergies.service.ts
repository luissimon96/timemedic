import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AllergyValidationService } from './services/allergy-validation.service';
import { AllergyCheckingService } from './services/allergy-checking.service';
import {
  CreateAllergyDto,
  UpdateAllergyDto,
  SearchAllergyDto,
  AllergyResponseDto,
  PaginatedAllergyResponseDto,
  AllergyCheckResultDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AllergiesService {
  private readonly logger = new Logger(AllergiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: AllergyValidationService,
    private readonly checkingService: AllergyCheckingService,
  ) {}

  /**
   * Cria uma nova alergia
   */
  async create(createAllergyDto: CreateAllergyDto): Promise<AllergyResponseDto> {
    this.logger.log(`Criando alergia: ${createAllergyDto.allergen} para paciente ${createAllergyDto.patientId}`);

    // Valida dados da alergia
    const validation = await this.validationService.validateAllergyData(
      createAllergyDto,
      createAllergyDto.patientId,
    );

    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Log de warnings se houver
    if (validation.warnings.length > 0) {
      this.logger.warn(`Warnings na criação de alergia: ${validation.warnings.join(', ')}`);
    }

    // Verifica se o paciente existe
    const patient = await this.prisma.patient.findUnique({
      where: { id: createAllergyDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Paciente com ID ${createAllergyDto.patientId} não encontrado`);
    }

    try {
      const allergy = await this.prisma.allergy.create({
        data: {
          patientId: createAllergyDto.patientId,
          medicationId: createAllergyDto.medicationId || null,
          allergen: createAllergyDto.allergen,
          allergyType: createAllergyDto.allergyType,
          severity: createAllergyDto.severity,
          reaction: createAllergyDto.reaction || null,
          onsetDate: createAllergyDto.onsetDate ? new Date(createAllergyDto.onsetDate) : null,
          clinicalEvidence: createAllergyDto.clinicalEvidence || null,
          laboratoryTests: createAllergyDto.laboratoryTests || null,
          isActive: createAllergyDto.isActive ?? true,
          // Campos extras para auditoria
          ...(createAllergyDto.notes && { notes: createAllergyDto.notes }),
          ...(createAllergyDto.informationSource && { informationSource: createAllergyDto.informationSource }),
          ...(createAllergyDto.reliability && { reliability: createAllergyDto.reliability }),
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
            },
          },
        },
      });

      this.logger.log(`Alergia criada com sucesso: ${allergy.id}`);
      return plainToClass(AllergyResponseDto, allergy, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao criar alergia:', error);
      throw new ConflictException('Erro ao criar alergia');
    }
  }

  /**
   * Busca alergias com filtros e paginação
   */
  async findAll(searchDto: SearchAllergyDto): Promise<PaginatedAllergyResponseDto> {
    const {
      patientId,
      search,
      allergyType,
      severity,
      activeOnly = true,
      withLabTestsOnly,
      minSeverity,
      page = 1,
      limit = 20,
      sortBy = 'severity',
      sortOrder = 'desc',
    } = searchDto;

    // Constrói filtros dinâmicos
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.allergen = { contains: search, mode: 'insensitive' };
    }

    if (allergyType) {
      where.allergyType = allergyType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    if (withLabTestsOnly) {
      where.laboratoryTests = { not: null };
    }

    if (minSeverity) {
      const severityLevels = this.getSeverityLevelsFromMinimum(minSeverity);
      where.severity = { in: severityLevels };
    }

    // Calcula offset para paginação
    const skip = (page - 1) * limit;

    try {
      // Executa consulta com contagem total
      const [allergies, total] = await Promise.all([
        this.prisma.allergy.findMany({
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
              },
            },
          },
        }),
        this.prisma.allergy.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedAllergyResponseDto = {
        data: allergies.map(allergy => plainToClass(AllergyResponseDto, allergy, { excludeExtraneousValues: true })),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      this.logger.debug(`Busca retornou ${allergies.length} alergias de ${total} total`);
      return response;
    } catch (error) {
      this.logger.error('Erro ao buscar alergias:', error);
      throw new Error('Erro interno ao buscar alergias');
    }
  }

  /**
   * Busca alergia por ID
   */
  async findOne(id: string): Promise<AllergyResponseDto> {
    const allergy = await this.prisma.allergy.findUnique({
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
          },
        },
      },
    });

    if (!allergy) {
      throw new NotFoundException(`Alergia com ID ${id} não encontrada`);
    }

    return plainToClass(AllergyResponseDto, allergy, { excludeExtraneousValues: true });
  }

  /**
   * Busca alergias de um paciente específico
   */
  async findByPatient(patientId: string, activeOnly: boolean = true): Promise<AllergyResponseDto[]> {
    const allergies = await this.prisma.allergy.findMany({
      where: {
        patientId,
        ...(activeOnly && { isActive: true }),
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
          },
        },
      },
      orderBy: { severity: 'desc' },
    });

    return allergies.map(allergy => plainToClass(AllergyResponseDto, allergy, { excludeExtraneousValues: true }));
  }

  /**
   * Atualiza alergia
   */
  async update(id: string, updateAllergyDto: UpdateAllergyDto): Promise<AllergyResponseDto> {
    this.logger.log(`Atualizando alergia: ${id}`);

    // Verifica se a alergia existe
    const existingAllergy = await this.prisma.allergy.findUnique({
      where: { id },
    });

    if (!existingAllergy) {
      throw new NotFoundException(`Alergia com ID ${id} não encontrada`);
    }

    // Valida dados da atualização
    const validation = await this.validationService.validateAllergyData(
      { ...existingAllergy, ...updateAllergyDto },
      existingAllergy.patientId,
    );

    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    try {
      const updatedAllergy = await this.prisma.allergy.update({
        where: { id },
        data: {
          ...updateAllergyDto,
          ...(updateAllergyDto.onsetDate && { onsetDate: new Date(updateAllergyDto.onsetDate) }),
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
            },
          },
        },
      });

      this.logger.log(`Alergia atualizada com sucesso: ${id}`);
      return plainToClass(AllergyResponseDto, updatedAllergy, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao atualizar alergia:', error);
      throw new ConflictException('Erro ao atualizar alergia');
    }
  }

  /**
   * Inativa uma alergia
   */
  async inactivate(id: string, reason?: string): Promise<AllergyResponseDto> {
    this.logger.log(`Inativando alergia: ${id}`);

    // Valida se pode ser inativada
    const validation = await this.validationService.validateInactivation(id);
    if (!validation.isValid) {
      throw new ConflictException(`Não é possível inativar: ${validation.errors.join(', ')}`);
    }

    try {
      const updatedAllergy = await this.prisma.allergy.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
          ...(reason && { notes: reason }),
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
            },
          },
        },
      });

      this.logger.log(`Alergia inativada com sucesso: ${id}`);
      return plainToClass(AllergyResponseDto, updatedAllergy, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao inativar alergia:', error);
      throw new ConflictException('Erro ao inativar alergia');
    }
  }

  /**
   * Remove alergia permanentemente
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo alergia: ${id}`);

    const existingAllergy = await this.prisma.allergy.findUnique({
      where: { id },
    });

    if (!existingAllergy) {
      throw new NotFoundException(`Alergia com ID ${id} não encontrada`);
    }

    try {
      await this.prisma.allergy.delete({
        where: { id },
      });

      this.logger.log(`Alergia removida com sucesso: ${id}`);
    } catch (error) {
      this.logger.error('Erro ao remover alergia:', error);
      throw new ConflictException('Erro ao remover alergia');
    }
  }

  /**
   * Verifica conflitos de alergia para medicamento
   */
  async checkMedicationConflict(
    patientId: string,
    medicationId: string,
    options?: any,
  ): Promise<AllergyCheckResultDto> {
    this.logger.debug(`Verificando conflitos - Paciente: ${patientId}, Medicamento: ${medicationId}`);

    try {
      const result = await this.checkingService.checkMedicationAllergy(patientId, medicationId, options);

      return {
        hasConflict: result.hasConflict,
        conflictingAllergies: result.conflicts.map(c => 
          plainToClass(AllergyResponseDto, c.allergy, { excludeExtraneousValues: true })
        ),
        riskLevel: result.overallRiskLevel,
        recommendations: result.conflicts.flatMap(c => c.recommendations),
        conflictDetails: result.summary,
      };
    } catch (error) {
      this.logger.error('Erro na verificação de conflitos:', error);
      throw error;
    }
  }

  /**
   * Verifica conflitos por nome do alérgeno
   */
  async checkAllergenConflict(
    patientId: string,
    allergenName: string,
    options?: any,
  ): Promise<AllergyCheckResultDto> {
    this.logger.debug(`Verificando conflitos por alérgeno - Paciente: ${patientId}, Alérgeno: ${allergenName}`);

    try {
      const result = await this.checkingService.checkAllergenByName(patientId, allergenName, options);

      return {
        hasConflict: result.hasConflict,
        conflictingAllergies: result.conflicts.map(c => 
          plainToClass(AllergyResponseDto, c.allergy, { excludeExtraneousValues: true })
        ),
        riskLevel: result.overallRiskLevel,
        recommendations: result.conflicts.flatMap(c => c.recommendations),
        conflictDetails: result.summary,
      };
    } catch (error) {
      this.logger.error('Erro na verificação de conflitos por alérgeno:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de alergias
   */
  async getStatistics() {
    try {
      const [
        totalAllergies,
        activeAllergies,
        allergiesByType,
        allergiesBySeverity,
        recentlyAdded,
      ] = await Promise.all([
        this.prisma.allergy.count(),
        this.prisma.allergy.count({ where: { isActive: true } }),
        this.prisma.allergy.groupBy({
          by: ['allergyType'],
          _count: true,
          where: { isActive: true },
        }),
        this.prisma.allergy.groupBy({
          by: ['severity'],
          _count: true,
          where: { isActive: true },
        }),
        this.prisma.allergy.count({
          where: {
            isActive: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
          },
        }),
      ]);

      return {
        totalAllergies,
        activeAllergies,
        recentlyAdded,
        distributionByType: allergiesByType.map(item => ({
          type: item.allergyType,
          count: item._count,
        })),
        distributionBySeverity: allergiesBySeverity.map(item => ({
          severity: item.severity,
          count: item._count,
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro interno ao obter estatísticas');
    }
  }

  /**
   * Utilitários privados
   */
  private getSeverityLevelsFromMinimum(minSeverity: any): any[] {
    const allSeverities = ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'];
    const minIndex = allSeverities.indexOf(minSeverity);
    return allSeverities.slice(minIndex);
  }
}