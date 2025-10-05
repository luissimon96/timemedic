import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PatientEncryptionService } from './services/patient-encryption.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  SearchPatientDto,
  PatientResponseDto,
  PaginatedPatientResponseDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: PatientEncryptionService,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    this.logger.log('Criando novo paciente');

    // Criptografa dados sensíveis
    const encryptedPii = await this.encryptionService.encryptPatientPii({
      name: createPatientDto.name,
      cpf: createPatientDto.cpf,
      phone: createPatientDto.phone,
      address: createPatientDto.address,
    });

    const encryptedEmergencyContact = createPatientDto.emergencyContact ?
      await this.encryptionService.encryptEmergencyContact(createPatientDto.emergencyContact) :
      null;

    const patient = await this.prisma.patient.create({
      data: {
        userId: createPatientDto.userId,
        externalId: `PAT${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
        encryptedPii,
        dateOfBirth: createPatientDto.dateOfBirth ? new Date(createPatientDto.dateOfBirth) : null,
        gender: createPatientDto.gender,
        weight: createPatientDto.weight,
        height: createPatientDto.height,
        chronicConditions: createPatientDto.chronicConditions,
        renalFunction: createPatientDto.renalFunction,
        hepaticFunction: createPatientDto.hepaticFunction,
        emergencyContact: encryptedEmergencyContact,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return plainToClass(PatientResponseDto, patient, { excludeExtraneousValues: true });
  }

  async findAll(searchDto: SearchPatientDto): Promise<PaginatedPatientResponseDto> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = searchDto;
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.patient.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: patients.map(patient => 
        plainToClass(PatientResponseDto, patient, { excludeExtraneousValues: true })
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
  }

  async findOne(id: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Paciente ${id} não encontrado`);
    }

    return plainToClass(PatientResponseDto, patient, { excludeExtraneousValues: true });
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<PatientResponseDto> {
    const existingPatient = await this.findOne(id);

    // Atualiza dados criptografados se necessário
    let encryptedPii = existingPatient.encryptedPii;
    let encryptedEmergencyContact = existingPatient.emergencyContact;

    if (updatePatientDto.name || updatePatientDto.cpf || updatePatientDto.phone || updatePatientDto.address) {
      const currentPii = await this.encryptionService.decryptPatientPii(existingPatient.encryptedPii);
      encryptedPii = await this.encryptionService.encryptPatientPii({
        ...currentPii,
        ...(updatePatientDto.name && { name: updatePatientDto.name }),
        ...(updatePatientDto.cpf && { cpf: updatePatientDto.cpf }),
        ...(updatePatientDto.phone && { phone: updatePatientDto.phone }),
        ...(updatePatientDto.address && { address: updatePatientDto.address }),
      });
    }

    if (updatePatientDto.emergencyContact) {
      encryptedEmergencyContact = await this.encryptionService.encryptEmergencyContact(
        updatePatientDto.emergencyContact
      );
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...updatePatientDto,
        encryptedPii,
        emergencyContact: encryptedEmergencyContact,
        ...(updatePatientDto.dateOfBirth && { dateOfBirth: new Date(updatePatientDto.dateOfBirth) }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return plainToClass(PatientResponseDto, updatedPatient, { excludeExtraneousValues: true });
  }

  // Método para descriptografar dados do paciente (uso interno)
  async getDecryptedPatientData(id: string) {
    const patient = await this.findOne(id);
    
    const decryptedPii = await this.encryptionService.decryptPatientPii(patient.encryptedPii);
    const decryptedEmergencyContact = patient.emergencyContact ?
      await this.encryptionService.decryptEmergencyContact(patient.emergencyContact) :
      null;

    return {
      ...patient,
      pii: decryptedPii,
      emergencyContactData: decryptedEmergencyContact,
    };
  }
}
