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
import { AllergiesService } from './allergies.service';
import {
  CreateAllergyDto,
  UpdateAllergyDto,
  SearchAllergyDto,
  AllergyResponseDto,
  PaginatedAllergyResponseDto,
  AllergyCheckResultDto,
} from './dto';

@ApiTags('Alergias')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('allergies')
export class AllergiesController {
  private readonly logger = new Logger(AllergiesController.name);

  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar nova alergia',
    description: 'Registra uma nova alergia para um paciente com validação de duplicatas e consistência clínica.',
  })
  @ApiBody({ type: CreateAllergyDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Alergia registrada com sucesso',
    type: AllergyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Alergia duplicada ou dados inconsistentes',
  })
  async create(@Body() createAllergyDto: CreateAllergyDto): Promise<AllergyResponseDto> {
    this.logger.log(`POST /allergies - Registrando alergia: ${createAllergyDto.allergen} para paciente ${createAllergyDto.patientId}`);
    return await this.allergiesService.create(createAllergyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar alergias',
    description: 'Busca alergias com filtros opcionais e paginação. Suporte a filtros por paciente, tipo, severidade, etc.',
  })
  @ApiQuery({ name: 'patientId', required: false, description: 'ID do paciente' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca para nome do alérgeno' })
  @ApiQuery({ name: 'allergyType', required: false, enum: ['DRUG', 'FOOD', 'ENVIRONMENTAL'] })
  @ApiQuery({ name: 'severity', required: false, enum: ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'] })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Apenas alergias ativas (padrão: true)' })
  @ApiQuery({ name: 'withLabTestsOnly', required: false, type: Boolean, description: 'Apenas com testes laboratoriais' })
  @ApiQuery({ name: 'minSeverity', required: false, enum: ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['allergen', 'severity', 'onsetDate', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de alergias com paginação',
    type: PaginatedAllergyResponseDto,
  })
  async findAll(@Query() searchDto: SearchAllergyDto): Promise<PaginatedAllergyResponseDto> {
    this.logger.log(`GET /allergies - Buscando alergias com filtros: ${JSON.stringify(searchDto)}`);
    return await this.allergiesService.findAll(searchDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Estatísticas de alergias',
    description: 'Retorna estatísticas gerais das alergias registradas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas das alergias',
  })
  async getStatistics() {
    this.logger.log('GET /allergies/statistics');
    return await this.allergiesService.getStatistics();
  }

  @Get('patient/:patientId')
  @ApiOperation({
    summary: 'Listar alergias de um paciente',
    description: 'Retorna todas as alergias de um paciente específico.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Apenas alergias ativas (padrão: true)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de alergias do paciente',
    type: [AllergyResponseDto],
  })
  async findByPatient(
    @Param('patientId') patientId: string,
    @Query('activeOnly') activeOnly: boolean = true,
  ): Promise<AllergyResponseDto[]> {
    this.logger.log(`GET /allergies/patient/${patientId}`);
    return await this.allergiesService.findByPatient(patientId, activeOnly);
  }

  @Post('check/medication')
  @ApiOperation({
    summary: 'Verificar conflitos com medicamento',
    description: 'Verifica se há conflitos de alergia para um medicamento específico.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'ID do paciente' },
        medicationId: { type: 'string', description: 'ID do medicamento' },
        options: {
          type: 'object',
          properties: {
            checkCrossReactivity: { type: 'boolean', description: 'Verificar reatividade cruzada' },
            includeInactive: { type: 'boolean', description: 'Incluir alergias inativas' },
            minimumSeverity: { type: 'string', enum: ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'] },
          },
        },
      },
      required: ['patientId', 'medicationId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da verificação de conflitos',
    type: AllergyCheckResultDto,
  })
  async checkMedicationConflict(@Body() body: {
    patientId: string;
    medicationId: string;
    options?: any;
  }): Promise<AllergyCheckResultDto> {
    this.logger.log(`POST /allergies/check/medication - Paciente: ${body.patientId}, Medicamento: ${body.medicationId}`);
    return await this.allergiesService.checkMedicationConflict(body.patientId, body.medicationId, body.options);
  }

  @Post('check/allergen')
  @ApiOperation({
    summary: 'Verificar conflitos com alérgeno',
    description: 'Verifica se há conflitos de alergia para um alérgeno específico por nome.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'ID do paciente' },
        allergenName: { type: 'string', description: 'Nome do alérgeno' },
        options: {
          type: 'object',
          properties: {
            checkCrossReactivity: { type: 'boolean', description: 'Verificar reatividade cruzada' },
            includeInactive: { type: 'boolean', description: 'Incluir alergias inativas' },
            minimumSeverity: { type: 'string', enum: ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'] },
          },
        },
      },
      required: ['patientId', 'allergenName'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da verificação de conflitos',
    type: AllergyCheckResultDto,
  })
  async checkAllergenConflict(@Body() body: {
    patientId: string;
    allergenName: string;
    options?: any;
  }): Promise<AllergyCheckResultDto> {
    this.logger.log(`POST /allergies/check/allergen - Paciente: ${body.patientId}, Alérgeno: ${body.allergenName}`);
    return await this.allergiesService.checkAllergenConflict(body.patientId, body.allergenName, body.options);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar alergia por ID',
    description: 'Retorna detalhes completos de uma alergia específica.',
  })
  @ApiParam({ name: 'id', description: 'ID único da alergia' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alergia encontrada',
    type: AllergyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alergia não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<AllergyResponseDto> {
    this.logger.log(`GET /allergies/${id}`);
    return await this.allergiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar alergia',
    description: 'Atualiza informações de uma alergia existente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da alergia' })
  @ApiBody({ type: UpdateAllergyDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alergia atualizada com sucesso',
    type: AllergyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alergia não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dados inconsistentes ou conflito',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAllergyDto: UpdateAllergyDto,
  ): Promise<AllergyResponseDto> {
    this.logger.log(`PATCH /allergies/${id}`);
    return await this.allergiesService.update(id, updateAllergyDto);
  }

  @Patch(':id/inactivate')
  @ApiOperation({
    summary: 'Inativar alergia',
    description: 'Inativa uma alergia ao invés de removê-la permanentemente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da alergia' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da inativação' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alergia inativada com sucesso',
    type: AllergyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alergia não encontrada',
  })
  async inactivate(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ): Promise<AllergyResponseDto> {
    this.logger.log(`PATCH /allergies/${id}/inactivate`);
    return await this.allergiesService.inactivate(id, body?.reason);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover alergia',
    description: 'Remove permanentemente uma alergia do sistema.',
  })
  @ApiParam({ name: 'id', description: 'ID único da alergia' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Alergia removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alergia não encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /allergies/${id}`);
    await this.allergiesService.remove(id);
  }
}