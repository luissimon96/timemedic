import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'paciente@email.com',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial)',
    example: 'MinhaSenh@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    default: UserRole.PATIENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Papel deve ser PATIENT, PHYSICIAN, PHARMACIST ou ADMIN' })
  role?: UserRole;
}