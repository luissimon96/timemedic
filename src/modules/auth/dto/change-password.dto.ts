import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAtual123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário (mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial)',
    example: 'NovaSenha123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}