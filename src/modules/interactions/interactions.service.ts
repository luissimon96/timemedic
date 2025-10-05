import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { DrugInteractionAnalysisService } from './services/drug-interaction-analysis.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  SearchInteractionDto,
  InteractionResponseDto,
  PaginatedInteractionResponseDto,
  InteractionAnalysisResultDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: DrugInteractionAnalysisService,
  ) {}

  /**
   * Cria uma nova interação medicamentosa
   */
  async create(createInteractionDto: CreateInteractionDto): Promise<InteractionResponseDto> {
    this.logger.log(`Criando interação: ${createInteractionDto.medicationAId} <-> ${createInteractionDto.medicationBId}`);

    // Verifica se os medicamentos existem
    const [medicationA, medicationB] = await Promise.all([
      this.prisma.medication.findUnique({ where: { id: createInteractionDto.medicationAId } }),
      this.prisma.medication.findUnique({ where: { id: createInteractionDto.medicationBId } }),
    ]);

    if (!medicationA || !medicationB) {
      throw new NotFoundException('Um ou ambos medicamentos não foram encontrados');
    }

    // Verifica se a interação já existe
    const existingInteraction = await this.prisma.drugInteraction.findFirst({
      where: {
        OR: [
          {
            medicationAId: createInteractionDto.medicationAId,
            medicationBId: createInteractionDto.medicationBId,
          },
          {
            medicationAId: createInteractionDto.medicationBId,
            medicationBId: createInteractionDto.medicationAId,
          },
        ],
      },
    });

    if (existingInteraction) {
      throw new ConflictException('Interação já existe entre estes medicamentos');
    }

    try {
      const interaction = await this.prisma.drugInteraction.create({
        data: {
          medicationAId: createInteractionDto.medicationAId,
          medicationBId: createInteractionDto.medicationBId,
          severity: createInteractionDto.severity,
          mechanism: createInteractionDto.mechanism,
          clinicalEffect: createInteractionDto.clinicalEffect,
          recommendation: createInteractionDto.recommendation,
          evidenceLevel: createInteractionDto.evidenceLevel,
          references: createInteractionDto.references || null,
          // Campos adicionais
          ...(createInteractionDto.elderlyConsiderations && {
            elderlyConsiderations: createInteractionDto.elderlyConsiderations,
          }),
          ...(createInteractionDto.renalConsiderations && {
            renalConsiderations: createInteractionDto.renalConsiderations,
          }),
          ...(createInteractionDto.hepaticConsiderations && {
            hepaticConsiderations: createInteractionDto.hepaticConsiderations,
          }),
          ...(createInteractionDto.onsetTime && { onsetTime: createInteractionDto.onsetTime }),
          ...(createInteractionDto.duration && { duration: createInteractionDto.duration }),
          ...(createInteractionDto.confidenceLevel && {
            confidenceLevel: createInteractionDto.confidenceLevel,
          }),
          ...(createInteractionDto.tags && { tags: createInteractionDto.tags }),
        },
        include: {
          medicationA: {
            select: {
              id: true,
              commercialName: true,
              anvisaCode: true,
              therapeuticClass: true,
            },
          },
          medicationB: {
            select: {
              id: true,
              commercialName: true,
              anvisaCode: true,
              therapeuticClass: true,
            },
          },
        },
      });

      this.logger.log(`Interação criada com sucesso: ${interaction.id}`);
      return plainToClass(InteractionResponseDto, interaction, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao criar interação:', error);
      throw new ConflictException('Erro ao criar interação');
    }
  }

  /**
   * Busca interações com filtros e paginação
   */
  async findAll(searchDto: SearchInteractionDto): Promise<PaginatedInteractionResponseDto> {
    const {
      medicationAId,
      medicationBId,
      medicationIds,
      search,
      severity,
      minSeverity,
      evidenceLevel,
      tags,
      elderlyOnly,
      minConfidence,
      page = 1,
      limit = 20,
      sortBy = 'severity',
      sortOrder = 'desc',
    } = searchDto;

    // Constrói filtros dinâmicos
    const where: any = {};

    if (medicationAId || medicationBId) {
      where.OR = [];
      if (medicationAId) {
        where.OR.push(
          { medicationAId },
          { medicationBId: medicationAId }
        );
      }
      if (medicationBId) {
        where.OR.push(
          { medicationBId },
          { medicationAId: medicationBId }
        );
      }
    }

    if (medicationIds && medicationIds.length > 0) {
      where.OR = where.OR || [];
      where.OR.push(
        { medicationAId: { in: medicationIds } },
        { medicationBId: { in: medicationIds } }
      );
    }

    if (search) {
      where.OR = where.OR || [];
      where.OR.push(
        { mechanism: { contains: search, mode: 'insensitive' } },
        { clinicalEffect: { contains: search, mode: 'insensitive' } },
        { recommendation: { contains: search, mode: 'insensitive' } }
      );
    }

    if (severity) {
      where.severity = severity;
    }

    if (minSeverity) {
      const severityLevels = this.getSeverityLevelsFromMinimum(minSeverity);
      where.severity = { in: severityLevels };
    }

    if (evidenceLevel) {
      where.evidenceLevel = evidenceLevel;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (elderlyOnly) {
      where.elderlyConsiderations = { not: null };
    }

    if (minConfidence) {
      where.confidenceLevel = { gte: minConfidence };
    }

    const skip = (page - 1) * limit;

    try {
      const [interactions, total] = await Promise.all([
        this.prisma.drugInteraction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            medicationA: {
              select: {
                id: true,
                commercialName: true,
                anvisaCode: true,
                therapeuticClass: true,
              },
            },
            medicationB: {
              select: {
                id: true,
                commercialName: true,
                anvisaCode: true,
                therapeuticClass: true,
              },
            },
          },
        }),
        this.prisma.drugInteraction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedInteractionResponseDto = {
        data: interactions.map(interaction => 
          plainToClass(InteractionResponseDto, interaction, { excludeExtraneousValues: true })
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

      this.logger.debug(`Busca retornou ${interactions.length} interações de ${total} total`);
      return response;
    } catch (error) {
      this.logger.error('Erro ao buscar interações:', error);
      throw new Error('Erro interno ao buscar interações');
    }
  }

  /**
   * Busca interação por ID
   */
  async findOne(id: string): Promise<InteractionResponseDto> {
    const interaction = await this.prisma.drugInteraction.findUnique({
      where: { id },
      include: {
        medicationA: {
          select: {
            id: true,
            commercialName: true,
            anvisaCode: true,
            therapeuticClass: true,
          },
        },
        medicationB: {
          select: {
            id: true,
            commercialName: true,
            anvisaCode: true,
            therapeuticClass: true,
          },
        },
      },
    });

    if (!interaction) {
      throw new NotFoundException(`Interação com ID ${id} não encontrada`);
    }

    return plainToClass(InteractionResponseDto, interaction, { excludeExtraneousValues: true });
  }

  /**
   * Atualiza interação
   */
  async update(id: string, updateInteractionDto: UpdateInteractionDto): Promise<InteractionResponseDto> {
    this.logger.log(`Atualizando interação: ${id}`);

    const existingInteraction = await this.prisma.drugInteraction.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new NotFoundException(`Interação com ID ${id} não encontrada`);
    }

    try {
      const updatedInteraction = await this.prisma.drugInteraction.update({
        where: { id },
        data: {
          ...updateInteractionDto,
          updatedAt: new Date(),
        },
        include: {
          medicationA: {
            select: {
              id: true,
              commercialName: true,
              anvisaCode: true,
              therapeuticClass: true,
            },
          },
          medicationB: {
            select: {
              id: true,
              commercialName: true,
              anvisaCode: true,
              therapeuticClass: true,
            },
          },
        },
      });

      this.logger.log(`Interação atualizada com sucesso: ${id}`);
      return plainToClass(InteractionResponseDto, updatedInteraction, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao atualizar interação:', error);
      throw new ConflictException('Erro ao atualizar interação');
    }
  }

  /**
   * Remove interação
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo interação: ${id}`);

    const existingInteraction = await this.prisma.drugInteraction.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new NotFoundException(`Interação com ID ${id} não encontrada`);
    }

    try {
      await this.prisma.drugInteraction.delete({
        where: { id },
      });

      this.logger.log(`Interação removida com sucesso: ${id}`);
    } catch (error) {
      this.logger.error('Erro ao remover interação:', error);
      throw new ConflictException('Erro ao remover interação');
    }
  }

  /**
   * Analisa interações para lista de medicamentos
   */
  async analyzeInteractions(
    medicationIds: string[],
    options?: any,
  ): Promise<InteractionAnalysisResultDto> {
    this.logger.debug(`Analisando interações para ${medicationIds.length} medicamentos`);

    try {
      const result = await this.analysisService.analyzeMedicationList(medicationIds, options);

      return {
        hasInteractions: result.hasInteractions,
        interactions: result.interactions.map(interaction => 
          plainToClass(InteractionResponseDto, interaction, { excludeExtraneousValues: true })
        ),
        overallRiskLevel: result.overallRiskLevel,
        recommendations: result.recommendations,
        hasContraindications: result.hasContraindications,
        summary: result.summary,
        elderlyConsiderations: result.elderlyConsiderations,
      };
    } catch (error) {
      this.logger.error('Erro na análise de interações:', error);
      throw error;
    }
  }

  /**
   * Analisa interações para um paciente específico
   */
  async analyzePatientInteractions(
    patientId: string,
    newMedicationId?: string,
    options?: any,
  ): Promise<InteractionAnalysisResultDto> {
    this.logger.debug(`Analisando interações do paciente: ${patientId}`);

    try {
      const result = await this.analysisService.analyzePatientMedications(patientId, newMedicationId, options);

      return {
        hasInteractions: result.hasInteractions,
        interactions: result.interactions.map(interaction => 
          plainToClass(InteractionResponseDto, interaction, { excludeExtraneousValues: true })
        ),
        overallRiskLevel: result.overallRiskLevel,
        recommendations: result.recommendations,
        hasContraindications: result.hasContraindications,
        summary: result.summary,
        elderlyConsiderations: result.elderlyConsiderations,
      };
    } catch (error) {
      this.logger.error('Erro na análise de interações do paciente:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de interações
   */
  async getStatistics() {
    try {
      const [
        totalInteractions,
        interactionsBySeverity,
        interactionsByEvidenceLevel,
        recentlyAdded,
      ] = await Promise.all([
        this.prisma.drugInteraction.count(),
        this.prisma.drugInteraction.groupBy({
          by: ['severity'],
          _count: true,
          orderBy: { _count: { severity: 'desc' } },
        }),
        this.prisma.drugInteraction.groupBy({
          by: ['evidenceLevel'],
          _count: true,
          orderBy: { _count: { evidenceLevel: 'desc' } },
        }),
        this.prisma.drugInteraction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
          },
        }),
      ]);

      return {
        totalInteractions,
        recentlyAdded,
        distributionBySeverity: interactionsBySeverity.map(item => ({
          severity: item.severity,
          count: item._count,
        })),
        distributionByEvidenceLevel: interactionsByEvidenceLevel.map(item => ({
          evidenceLevel: item.evidenceLevel,
          count: item._count,
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro interno ao obter estatísticas');
    }
  }

  /**
   * Utilitários
   */
  private getSeverityLevelsFromMinimum(minSeverity: any): any[] {
    const allSeverities = ['MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED'];
    const minIndex = allSeverities.indexOf(minSeverity);
    return allSeverities.slice(minIndex);
  }
}