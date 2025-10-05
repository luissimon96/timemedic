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
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  SearchPatientDto,
  PatientResponseDto,
  PaginatedPatientResponseDto,
} from './dto';

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo paciente',
    description: 'Cria um novo paciente com criptografia de dados pessoais conforme LGPD.',
  })
  @ApiBody({ type: CreatePatientDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Paciente criado com sucesso',
    type: PatientResponseDto,
  })
  async create(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    this.logger.log('POST /patients - Criando novo paciente');
    return await this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pacientes',
    description: 'Lista pacientes com paginação (dados pseudonimizados).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'externalId'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pacientes com paginação',
    type: PaginatedPatientResponseDto,
  })
  async findAll(@Query() searchDto: SearchPatientDto): Promise<PaginatedPatientResponseDto> {
    this.logger.log('GET /patients');
    return await this.patientsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar paciente por ID',
    description: 'Retorna dados não sensíveis de um paciente específico.',
  })
  @ApiParam({ name: 'id', description: 'ID único do paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paciente encontrado',
    type: PatientResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<PatientResponseDto> {
    this.logger.log(`GET /patients/${id}`);
    return await this.patientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar paciente',
    description: 'Atualiza informações de um paciente existente.',
  })
  @ApiParam({ name: 'id', description: 'ID único do paciente' })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paciente atualizado com sucesso',
    type: PatientResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    this.logger.log(`PATCH /patients/${id}`);
    return await this.patientsService.update(id, updatePatientDto);
  }
}
