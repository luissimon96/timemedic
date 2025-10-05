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
import { InteractionsService } from './interactions.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  SearchInteractionDto,
  InteractionResponseDto,
  PaginatedInteractionResponseDto,
  InteractionAnalysisResultDto,
} from './dto';

@ApiTags('Interações Medicamentosas')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('interactions')
export class InteractionsController {
  private readonly logger = new Logger(InteractionsController.name);

  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova interação medicamentosa',
    description: 'Registra uma nova interação entre dois medicamentos com evidências científicas.',
  })
  @ApiBody({ type: CreateInteractionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Interação criada com sucesso',
    type: InteractionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Interação já existe ou conflito de dados',
  })
  async create(@Body() createInteractionDto: CreateInteractionDto): Promise<InteractionResponseDto> {
    this.logger.log(`POST /interactions - Criando interação: ${createInteractionDto.medicationAId} <-> ${createInteractionDto.medicationBId}`);
    return await this.interactionsService.create(createInteractionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar interações medicamentosas',
    description: 'Busca interações com filtros opcionais e paginação. Suporte a filtros por medicamento, severidade, evidência, etc.',
  })
  @ApiQuery({ name: 'medicationAId', required: false, description: 'ID do medicamento A' })
  @ApiQuery({ name: 'medicationBId', required: false, description: 'ID do medicamento B' })
  @ApiQuery({ name: 'medicationIds', required: false, description: 'Lista de IDs de medicamentos' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca para mecanismo ou efeito' })
  @ApiQuery({ name: 'severity', required: false, enum: ['MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED'] })
  @ApiQuery({ name: 'minSeverity', required: false, enum: ['MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED'] })
  @ApiQuery({ name: 'evidenceLevel', required: false, enum: ['A', 'B', 'C', 'D'] })
  @ApiQuery({ name: 'tags', required: false, description: 'Tags para filtrar' })
  @ApiQuery({ name: 'elderlyOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'minConfidence', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['severity', 'evidenceLevel', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de interações com paginação',
    type: PaginatedInteractionResponseDto,
  })
  async findAll(@Query() searchDto: SearchInteractionDto): Promise<PaginatedInteractionResponseDto> {
    this.logger.log(`GET /interactions - Buscando interações com filtros: ${JSON.stringify(searchDto)}`);
    return await this.interactionsService.findAll(searchDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Estatísticas de interações',
    description: 'Retorna estatísticas gerais das interações medicamentosas registradas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas das interações',
  })
  async getStatistics() {
    this.logger.log('GET /interactions/statistics');
    return await this.interactionsService.getStatistics();
  }

  @Post('analyze')
  @ApiOperation({
    summary: 'Analisar interações entre medicamentos',
    description: 'Analisa interações medicamentosas para uma lista de medicamentos.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        medicationIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de IDs de medicamentos',
        },
        options: {
          type: 'object',
          properties: {
            includeMinor: { type: 'boolean', description: 'Incluir interações menores' },
            checkElderlySpecific: { type: 'boolean', description: 'Verificar considerações para idosos' },
            patientAge: { type: 'number', description: 'Idade do paciente' },
            renalFunction: { type: 'string', description: 'Função renal' },
            hepaticFunction: { type: 'string', description: 'Função hepática' },
          },
        },
      },
      required: ['medicationIds'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da análise de interações',
    type: InteractionAnalysisResultDto,
  })
  async analyzeInteractions(@Body() body: {
    medicationIds: string[];
    options?: any;
  }): Promise<InteractionAnalysisResultDto> {
    this.logger.log(`POST /interactions/analyze - Analisando ${body.medicationIds.length} medicamentos`);
    return await this.interactionsService.analyzeInteractions(body.medicationIds, body.options);
  }

  @Post('analyze/patient/:patientId')
  @ApiOperation({
    summary: 'Analisar interações para paciente',
    description: 'Analisa interações medicamentosas para as prescrições ativas de um paciente, com opção de incluir novo medicamento.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        newMedicationId: { type: 'string', description: 'ID de novo medicamento a ser adicionado' },
        options: {
          type: 'object',
          properties: {
            includeMinor: { type: 'boolean', description: 'Incluir interações menores' },
            checkElderlySpecific: { type: 'boolean', description: 'Verificar considerações para idosos' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da análise de interações do paciente',
    type: InteractionAnalysisResultDto,
  })
  async analyzePatientInteractions(
    @Param('patientId') patientId: string,
    @Body() body?: { newMedicationId?: string; options?: any },
  ): Promise<InteractionAnalysisResultDto> {
    this.logger.log(`POST /interactions/analyze/patient/${patientId}`);
    return await this.interactionsService.analyzePatientInteractions(
      patientId,
      body?.newMedicationId,
      body?.options,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar interação por ID',
    description: 'Retorna detalhes completos de uma interação medicamentosa específica.',
  })
  @ApiParam({ name: 'id', description: 'ID único da interação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Interação encontrada',
    type: InteractionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interação não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<InteractionResponseDto> {
    this.logger.log(`GET /interactions/${id}`);
    return await this.interactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar interação medicamentosa',
    description: 'Atualiza informações de uma interação existente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da interação' })
  @ApiBody({ type: UpdateInteractionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Interação atualizada com sucesso',
    type: InteractionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interação não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito de dados',
  })
  async update(
    @Param('id') id: string,
    @Body() updateInteractionDto: UpdateInteractionDto,
  ): Promise<InteractionResponseDto> {
    this.logger.log(`PATCH /interactions/${id}`);
    return await this.interactionsService.update(id, updateInteractionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover interação medicamentosa',
    description: 'Remove permanentemente uma interação do sistema.',
  })
  @ApiParam({ name: 'id', description: 'ID único da interação' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Interação removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interação não encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /interactions/${id}`);
    await this.interactionsService.remove(id);
  }
}