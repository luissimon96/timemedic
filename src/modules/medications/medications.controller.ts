import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MedicationsService } from './medications.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
  SearchMedicationDto,
  MedicationResponseDto,
  PaginatedMedicationResponseDto,
  AnvisaSyncDto,
  AnvisaSyncResultDto,
} from './dto';

@ApiTags('Medicamentos')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('medications')
export class MedicationsController {
  private readonly logger = new Logger(MedicationsController.name);

  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo medicamento',
    description: 'Cria um novo medicamento no catálogo com validação de dados e verificação de duplicatas.',
  })
  @ApiBody({ type: CreateMedicationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Medicamento criado com sucesso',
    type: MedicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Medicamento com código ANVISA já existe',
  })
  async create(@Body() createMedicationDto: CreateMedicationDto): Promise<MedicationResponseDto> {
    this.logger.log(`POST /medications - Criando medicamento: ${createMedicationDto.commercialName}`);
    return await this.medicationsService.create(createMedicationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar medicamentos',
    description: 'Busca medicamentos com filtros opcionais e paginação. Suporte a busca por texto, classe terapêutica, fabricante, etc.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca para nome ou princípio ativo' })
  @ApiQuery({ name: 'anvisaCode', required: false, description: 'Código ANVISA específico' })
  @ApiQuery({ name: 'therapeuticClass', required: false, description: 'Classe terapêutica' })
  @ApiQuery({ name: 'manufacturer', required: false, description: 'Fabricante' })
  @ApiQuery({ name: 'pharmaceuticalForm', required: false, description: 'Forma farmacêutica' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20, máx: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['commercialName', 'therapeuticClass', 'manufacturer', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de medicamentos com paginação',
    type: PaginatedMedicationResponseDto,
  })
  async findAll(@Query() searchDto: SearchMedicationDto): Promise<PaginatedMedicationResponseDto> {
    this.logger.log(`GET /medications - Buscando medicamentos com filtros: ${JSON.stringify(searchDto)}`);
    return await this.medicationsService.findAll(searchDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Estatísticas de medicamentos',
    description: 'Retorna estatísticas gerais do catálogo de medicamentos.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas do catálogo',
  })
  async getStatistics() {
    this.logger.log('GET /medications/statistics');
    return await this.medicationsService.getStatistics();
  }

  @Get('anvisa/status')
  @ApiOperation({
    summary: 'Status da conexão ANVISA',
    description: 'Verifica conectividade com a base de dados da ANVISA.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status da conexão ANVISA',
  })
  async checkAnvisaStatus() {
    this.logger.log('GET /medications/anvisa/status');
    return await this.medicationsService.checkAnvisaConnection();
  }

  @Post('anvisa/search')
  @ApiOperation({
    summary: 'Buscar medicamentos na ANVISA',
    description: 'Busca medicamentos diretamente na base da ANVISA por termo de busca.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: 'Termo de busca' },
        limit: { type: 'number', description: 'Limite de resultados (padrão: 50)' },
      },
      required: ['searchTerm'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultados da busca ANVISA',
  })
  async searchAnvisa(@Body() body: { searchTerm: string; limit?: number }) {
    this.logger.log(`POST /medications/anvisa/search - Termo: ${body.searchTerm}`);
    return await this.medicationsService.searchAnvisa(body.searchTerm, body.limit);
  }

  @Post('anvisa/sync')
  @ApiOperation({
    summary: 'Sincronizar com ANVISA',
    description: 'Sincroniza medicamentos com a base da ANVISA. Suporte a sincronização individual, em lote ou incremental.',
  })
  @ApiBody({ type: AnvisaSyncDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da sincronização',
    type: AnvisaSyncResultDto,
  })
  async syncWithAnvisa(@Body() syncDto: AnvisaSyncDto): Promise<AnvisaSyncResultDto> {
    this.logger.log(`POST /medications/anvisa/sync - Iniciando sincronização`);
    return await this.medicationsService.batchSyncWithAnvisa(syncDto);
  }

  @Post(':id/anvisa/sync')
  @ApiOperation({
    summary: 'Sincronizar medicamento específico com ANVISA',
    description: 'Sincroniza um medicamento específico com a base da ANVISA pelo código ANVISA.',
  })
  @ApiParam({ name: 'id', description: 'Código ANVISA do medicamento' })
  @ApiQuery({ name: 'forceUpdate', required: false, type: Boolean, description: 'Forçar atualização' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medicamento sincronizado',
    type: MedicationResponseDto,
  })
  async syncMedicationWithAnvisa(
    @Param('id') anvisaCode: string,
    @Query('forceUpdate') forceUpdate: boolean = false,
  ): Promise<MedicationResponseDto> {
    this.logger.log(`POST /medications/${anvisaCode}/anvisa/sync`);
    return await this.medicationsService.syncWithAnvisa(anvisaCode, forceUpdate);
  }

  @Get('anvisa/:code')
  @ApiOperation({
    summary: 'Buscar por código ANVISA',
    description: 'Busca medicamento pelo código ANVISA.',
  })
  @ApiParam({ name: 'code', description: 'Código ANVISA (13 dígitos)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medicamento encontrado',
    type: MedicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Medicamento não encontrado',
  })
  async findByAnvisaCode(@Param('code') anvisaCode: string): Promise<MedicationResponseDto> {
    this.logger.log(`GET /medications/anvisa/${anvisaCode}`);
    return await this.medicationsService.findByAnvisaCode(anvisaCode);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar medicamento por ID',
    description: 'Retorna detalhes completos de um medicamento específico.',
  })
  @ApiParam({ name: 'id', description: 'ID único do medicamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medicamento encontrado',
    type: MedicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Medicamento não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<MedicationResponseDto> {
    this.logger.log(`GET /medications/${id}`);
    return await this.medicationsService.findOne(id);
  }

  @Post(':medicationId/validate/:patientId')
  @ApiOperation({
    summary: 'Validar medicamento para paciente',
    description: 'Valida se um medicamento pode ser prescrito para um paciente específico, verificando alergias, interações e contraindicações.',
  })
  @ApiParam({ name: 'medicationId', description: 'ID do medicamento' })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        dosage: { type: 'string', description: 'Dosagem prescrita' },
        frequency: { type: 'string', description: 'Frequência de administração' },
        route: { type: 'string', description: 'Via de administração' },
        indication: { type: 'string', description: 'Indicação clínica' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da validação',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateForPatient(
    @Param('medicationId') medicationId: string,
    @Param('patientId') patientId: string,
    @Body() context?: any,
  ) {
    this.logger.log(`POST /medications/${medicationId}/validate/${patientId}`);
    return await this.medicationsService.validateForPrescription(medicationId, patientId, context);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar medicamento',
    description: 'Atualiza informações de um medicamento existente.',
  })
  @ApiParam({ name: 'id', description: 'ID único do medicamento' })
  @ApiBody({ type: UpdateMedicationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medicamento atualizado com sucesso',
    type: MedicationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Medicamento não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito de dados (ex: código ANVISA duplicado)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMedicationDto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    this.logger.log(`PATCH /medications/${id}`);
    return await this.medicationsService.update(id, updateMedicationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover medicamento',
    description: 'Remove um medicamento do catálogo. Não é possível remover medicamentos com prescrições ativas.',
  })
  @ApiParam({ name: 'id', description: 'ID único do medicamento' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Medicamento removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Medicamento não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Medicamento possui prescrições ativas',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /medications/${id}`);
    await this.medicationsService.remove(id);
  }
}