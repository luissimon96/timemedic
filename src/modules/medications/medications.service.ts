import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AnvisaService } from './services/anvisa.service';
import { MedicationValidationService } from './services/medication-validation.service';
import { 
  CreateMedicationDto, 
  UpdateMedicationDto, 
  SearchMedicationDto, 
  MedicationResponseDto,
  PaginatedMedicationResponseDto,
  AnvisaSyncDto,
  AnvisaSyncResultDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class MedicationsService {
  private readonly logger = new Logger(MedicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anvisaService: AnvisaService,
    private readonly validationService: MedicationValidationService,
  ) {}

  /**
   * Cria um novo medicamento
   */
  async create(createMedicationDto: CreateMedicationDto): Promise<MedicationResponseDto> {
    this.logger.log(`Criando medicamento: ${createMedicationDto.commercialName}`);

    // Valida estrutura dos dados
    const validation = await this.validationService.validateMedicationData(createMedicationDto);
    if (!validation.isValid) {
      throw new ConflictException(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Verifica se já existe medicamento com o mesmo código ANVISA
    const existingMedication = await this.prisma.medication.findUnique({
      where: { anvisaCode: createMedicationDto.anvisaCode },
    });

    if (existingMedication) {
      throw new ConflictException(`Medicamento com código ANVISA ${createMedicationDto.anvisaCode} já existe`);
    }

    try {
      const medication = await this.prisma.medication.create({
        data: {
          anvisaCode: createMedicationDto.anvisaCode,
          commercialName: createMedicationDto.commercialName,
          activeSubstance: createMedicationDto.activeSubstance,
          pharmaceuticalForm: createMedicationDto.pharmaceuticalForm,
          therapeuticClass: createMedicationDto.therapeuticClass,
          manufacturer: createMedicationDto.manufacturer,
          packageInfo: createMedicationDto.packageInfo || null,
          contraindications: createMedicationDto.contraindications || null,
          sideEffects: createMedicationDto.sideEffects || null,
          dosageGuidelines: createMedicationDto.dosageGuidelines || null,
        },
      });

      this.logger.log(`Medicamento criado com sucesso: ${medication.id}`);
      return plainToClass(MedicationResponseDto, medication, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao criar medicamento:', error);
      throw new ConflictException('Erro ao criar medicamento');
    }
  }

  /**
   * Busca medicamentos com filtros e paginação
   */
  async findAll(searchDto: SearchMedicationDto): Promise<PaginatedMedicationResponseDto> {
    const {
      search,
      anvisaCode,
      therapeuticClass,
      manufacturer,
      pharmaceuticalForm,
      page = 1,
      limit = 20,
      sortBy = 'commercialName',
      sortOrder = 'asc',
    } = searchDto;

    // Constrói filtros dinâmicos
    const where: any = {};

    if (search) {
      where.OR = [
        { commercialName: { contains: search, mode: 'insensitive' } },
        { 
          activeSubstance: {
            path: '$[*].name',
            string_contains: search,
          },
        },
      ];
    }

    if (anvisaCode) {
      where.anvisaCode = anvisaCode;
    }

    if (therapeuticClass) {
      where.therapeuticClass = { contains: therapeuticClass, mode: 'insensitive' };
    }

    if (manufacturer) {
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    }

    if (pharmaceuticalForm) {
      where.pharmaceuticalForm = { contains: pharmaceuticalForm, mode: 'insensitive' };
    }

    // Calcula offset para paginação
    const skip = (page - 1) * limit;

    try {
      // Executa consulta com contagem total
      const [medications, total] = await Promise.all([
        this.prisma.medication.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.medication.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedMedicationResponseDto = {
        data: medications.map(med => plainToClass(MedicationResponseDto, med, { excludeExtraneousValues: true })),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      this.logger.debug(`Busca retornou ${medications.length} medicamentos de ${total} total`);
      return response;
    } catch (error) {
      this.logger.error('Erro ao buscar medicamentos:', error);
      throw new Error('Erro interno ao buscar medicamentos');
    }
  }

  /**
   * Busca medicamento por ID
   */
  async findOne(id: string): Promise<MedicationResponseDto> {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    return plainToClass(MedicationResponseDto, medication, { excludeExtraneousValues: true });
  }

  /**
   * Busca medicamento por código ANVISA
   */
  async findByAnvisaCode(anvisaCode: string): Promise<MedicationResponseDto> {
    const medication = await this.prisma.medication.findUnique({
      where: { anvisaCode },
    });

    if (!medication) {
      throw new NotFoundException(`Medicamento com código ANVISA ${anvisaCode} não encontrado`);
    }

    return plainToClass(MedicationResponseDto, medication, { excludeExtraneousValues: true });
  }

  /**
   * Atualiza medicamento
   */
  async update(id: string, updateMedicationDto: UpdateMedicationDto): Promise<MedicationResponseDto> {
    this.logger.log(`Atualizando medicamento: ${id}`);

    // Verifica se o medicamento existe
    const existingMedication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!existingMedication) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    // Se está alterando o código ANVISA, verifica se não há conflito
    if (updateMedicationDto.anvisaCode && updateMedicationDto.anvisaCode !== existingMedication.anvisaCode) {
      const conflictingMedication = await this.prisma.medication.findUnique({
        where: { anvisaCode: updateMedicationDto.anvisaCode },
      });

      if (conflictingMedication) {
        throw new ConflictException(`Medicamento com código ANVISA ${updateMedicationDto.anvisaCode} já existe`);
      }
    }

    try {
      const updatedMedication = await this.prisma.medication.update({
        where: { id },
        data: {
          ...updateMedicationDto,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Medicamento atualizado com sucesso: ${id}`);
      return plainToClass(MedicationResponseDto, updatedMedication, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao atualizar medicamento:', error);
      throw new ConflictException('Erro ao atualizar medicamento');
    }
  }

  /**
   * Remove medicamento (soft delete)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo medicamento: ${id}`);

    const existingMedication = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        prescriptions: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!existingMedication) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    // Verifica se há prescrições ativas
    if (existingMedication.prescriptions.length > 0) {
      throw new ConflictException(
        `Não é possível remover medicamento com prescrições ativas. ` +
        `Encontradas ${existingMedication.prescriptions.length} prescrições ativas.`,
      );
    }

    try {
      await this.prisma.medication.delete({
        where: { id },
      });

      this.logger.log(`Medicamento removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error('Erro ao remover medicamento:', error);
      throw new ConflictException('Erro ao remover medicamento');
    }
  }

  /**
   * Sincroniza medicamento com ANVISA
   */
  async syncWithAnvisa(anvisaCode: string, forceUpdate: boolean = false): Promise<MedicationResponseDto> {
    this.logger.log(`Sincronizando medicamento ANVISA: ${anvisaCode}`);

    try {
      const syncedMedication = await this.anvisaService.syncMedication(anvisaCode, forceUpdate);
      return plainToClass(MedicationResponseDto, syncedMedication, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Erro na sincronização ANVISA para ${anvisaCode}:`, error);
      throw error;
    }
  }

  /**
   * Sincronização em lote com ANVISA
   */
  async batchSyncWithAnvisa(syncDto: AnvisaSyncDto): Promise<AnvisaSyncResultDto> {
    this.logger.log('Iniciando sincronização em lote com ANVISA');

    try {
      return await this.anvisaService.batchSync(syncDto);
    } catch (error) {
      this.logger.error('Erro na sincronização em lote:', error);
      throw error;
    }
  }

  /**
   * Busca medicamentos na ANVISA por termo
   */
  async searchAnvisa(searchTerm: string, limit: number = 50) {
    this.logger.log(`Buscando medicamentos na ANVISA: ${searchTerm}`);

    try {
      return await this.anvisaService.searchMedications(searchTerm, limit);
    } catch (error) {
      this.logger.error('Erro na busca ANVISA:', error);
      throw error;
    }
  }

  /**
   * Valida medicamento para prescrição
   */
  async validateForPrescription(medicationId: string, patientId: string, context?: any) {
    this.logger.debug(`Validando medicamento ${medicationId} para paciente ${patientId}`);

    try {
      return await this.validationService.validateMedicationForPatient(medicationId, patientId, context);
    } catch (error) {
      this.logger.error('Erro na validação de prescrição:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de medicamentos
   */
  async getStatistics() {
    try {
      const [
        totalMedications,
        medicationsByClass,
        medicationsByManufacturer,
        recentlyAdded,
      ] = await Promise.all([
        this.prisma.medication.count(),
        this.prisma.medication.groupBy({
          by: ['therapeuticClass'],
          _count: true,
          orderBy: { _count: { therapeuticClass: 'desc' } },
          take: 10,
        }),
        this.prisma.medication.groupBy({
          by: ['manufacturer'],
          _count: true,
          orderBy: { _count: { manufacturer: 'desc' } },
          take: 10,
        }),
        this.prisma.medication.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
          },
        }),
      ]);

      return {
        totalMedications,
        recentlyAdded,
        topTherapeuticClasses: medicationsByClass.map(item => ({
          therapeuticClass: item.therapeuticClass,
          count: item._count,
        })),
        topManufacturers: medicationsByManufacturer.map(item => ({
          manufacturer: item.manufacturer,
          count: item._count,
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro interno ao obter estatísticas');
    }
  }

  /**
   * Verifica conectividade com ANVISA
   */
  async checkAnvisaConnection(): Promise<{ connected: boolean; timestamp: Date }> {
    const connected = await this.anvisaService.validateConnection();
    return {
      connected,
      timestamp: new Date(),
    };
  }
}