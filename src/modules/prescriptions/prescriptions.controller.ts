import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { PrescriptionsService } from './prescriptions.service';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SearchPrescriptionDto,
  PrescriptionResponseDto,
  PaginatedPrescriptionResponseDto,
} from './dto';

@ApiTags('Prescrições Médicas')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('prescriptions')
export class PrescriptionsController {
  private readonly logger = new Logger(PrescriptionsController.name);

  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova prescrição',
    description: 'Cria uma nova prescrição médica com verificações de segurança automáticas.',
  })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Prescrição criada com sucesso',
    type: PrescriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito de alergia ou interação medicamentosa',
  })
  async create(@Body() createPrescriptionDto: CreatePrescriptionDto): Promise<PrescriptionResponseDto> {
    this.logger.log(`POST /prescriptions - Criando prescrição para paciente ${createPrescriptionDto.patientId}`);
    return await this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar prescrições',
    description: 'Busca prescrições com filtros avançados e paginação.',
  })
  @ApiQuery({ name: 'patientId', required: false, description: 'ID do paciente' })
  @ApiQuery({ name: 'medicationId', required: false, description: 'ID do medicamento' })
  @ApiQuery({ name: 'prescriberId', required: false, description: 'ID do prescritor' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Apenas prescrições ativas (padrão: true)' })
  @ApiQuery({ name: 'startDateFrom', required: false, description: 'Data de início - filtro a partir de' })
  @ApiQuery({ name: 'startDateTo', required: false, description: 'Data de início - filtro até' })
  @ApiQuery({ name: 'therapeuticClass', required: false, description: 'Classe terapêutica' })
  @ApiQuery({ name: 'indication', required: false, description: 'Indicação clínica' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por texto' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['prescriptionDate', 'startDate', 'medicationName'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de prescrições com paginação',
    type: PaginatedPrescriptionResponseDto,
  })
  async findAll(@Query() searchDto: SearchPrescriptionDto): Promise<PaginatedPrescriptionResponseDto> {
    this.logger.log(`GET /prescriptions - Buscando prescrições com filtros: ${JSON.stringify(searchDto)}`);
    return await this.prescriptionsService.findAll(searchDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Estatísticas de prescrições',
    description: 'Retorna estatísticas gerais das prescrições.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas das prescrições',
  })
  async getStatistics() {
    this.logger.log('GET /prescriptions/statistics');
    return await this.prescriptionsService.getStatistics();
  }

  @Get('patient/:patientId/active')
  @ApiOperation({
    summary: 'Prescrições ativas do paciente',
    description: 'Retorna todas as prescrições ativas de um paciente específico.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de prescrições ativas do paciente',
    type: [PrescriptionResponseDto],
  })
  async findActiveByPatient(@Param('patientId') patientId: string): Promise<PrescriptionResponseDto[]> {
    this.logger.log(`GET /prescriptions/patient/${patientId}/active`);
    return await this.prescriptionsService.findActiveByPatient(patientId);
  }

  @Post('check-conflicts')
  @ApiOperation({
    summary: 'Verificar conflitos de prescrição',
    description: 'Verifica conflitos de alergia e interações medicamentosas antes de prescrever.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'ID do paciente' },
        medicationId: { type: 'string', description: 'ID do medicamento' },
      },
      required: ['patientId', 'medicationId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da verificação de conflitos',
  })
  async checkConflicts(@Body() body: {
    patientId: string;
    medicationId: string;
  }) {
    this.logger.log(`POST /prescriptions/check-conflicts - Paciente: ${body.patientId}, Medicamento: ${body.medicationId}`);
    return await this.prescriptionsService.checkConflicts(body.patientId, body.medicationId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar prescrição por ID',
    description: 'Retorna detalhes completos de uma prescrição específica.',
  })
  @ApiParam({ name: 'id', description: 'ID único da prescrição' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescrição encontrada',
    type: PrescriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescrição não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<PrescriptionResponseDto> {
    this.logger.log(`GET /prescriptions/${id}`);
    return await this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar prescrição',
    description: 'Atualiza informações de uma prescrição existente com verificações de segurança.',
  })
  @ApiParam({ name: 'id', description: 'ID único da prescrição' })
  @ApiBody({ type: UpdatePrescriptionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescrição atualizada com sucesso',
    type: PrescriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescrição não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dados inconsistentes ou conflito de segurança',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    this.logger.log(`PATCH /prescriptions/${id}`);
    return await this.prescriptionsService.update(id, updatePrescriptionDto);
  }

  @Patch(':id/inactivate')
  @ApiOperation({
    summary: 'Inativar prescrição',
    description: 'Inativa uma prescrição e suas dosagens relacionadas.',
  })
  @ApiParam({ name: 'id', description: 'ID único da prescrição' })
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
    description: 'Prescrição inativada com sucesso',
    type: PrescriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescrição não encontrada',
  })
  async inactivate(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ): Promise<PrescriptionResponseDto> {
    this.logger.log(`PATCH /prescriptions/${id}/inactivate`);
    return await this.prescriptionsService.inactivate(id, body?.reason);
  }
}