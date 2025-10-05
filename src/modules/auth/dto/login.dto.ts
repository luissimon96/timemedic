import { IsEmail, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'paciente@email.com',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Código MFA (obrigatório se MFA estiver habilitado)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Código MFA deve ter 6 dígitos' })
  mfaCode?: string;
}