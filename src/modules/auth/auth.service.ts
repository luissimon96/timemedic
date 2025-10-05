import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CryptoService } from '../../infrastructure/crypto/crypto.service';
import { UserRole } from '@prisma/client';
import { RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto } from './dto';
import { MfaService } from './mfa.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
    mfaEnabled: boolean;
  };
  accessToken: string;
  refreshToken: string;
  requiresMfa?: boolean;
  mfaToken?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private mfaService: MfaService,
  ) {}

  /**
   * Registra um novo usuário no sistema
   */
  async register(registerDto: RegisterDto): Promise<{ message: string; userId: string }> {
    const { email, password, role = UserRole.PATIENT } = registerDto;

    // Verifica se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Validação de senha forte
    this.validatePasswordStrength(password);

    try {
      // Hash da senha
      const passwordHash = await this.cryptoService.hashPassword(password);

      // Cria o usuário
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role,
        },
      });

      // Se for paciente, cria o registro de paciente
      if (role === UserRole.PATIENT) {
        const externalId = this.cryptoService.generatePseudonymizedId(user.id);
        
        await this.prisma.patient.create({
          data: {
            userId: user.id,
            externalId,
          },
        });
      }

      // Log de auditoria
      await this.createAuditLog(user.id, 'USER_REGISTERED', user.id, {
        email: user.email,
        role: user.role,
      });

      this.logger.log(`New user registered: ${email} (${role})`);

      return {
        message: 'Usuário registrado com sucesso',
        userId: user.id,
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${email}`, error);
      throw new BadRequestException('Falha ao registrar usuário');
    }
  }

  /**
   * Autentica usuário com email e senha
   */
  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password, mfaCode } = loginDto;

    // Busca o usuário
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica a senha
    const isPasswordValid = await this.cryptoService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.createAuditLog(user.id, 'LOGIN_FAILED', user.id, {
        reason: 'invalid_password',
        email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica MFA se habilitado
    if (user.mfaEnabled) {
      if (!mfaCode) {
        // Primeira etapa: senha válida, solicita MFA
        const mfaToken = await this.generateMfaToken(user.id);
        return {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
          },
          requiresMfa: true,
          mfaToken,
          accessToken: '',
          refreshToken: '',
        };
      }

      // Verifica o código MFA
      const isMfaValid = await this.mfaService.verifyMfaCode(user.mfaSecret, mfaCode);
      if (!isMfaValid) {
        await this.createAuditLog(user.id, 'MFA_FAILED', user.id, { email });
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    // Atualiza último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Gera tokens
    const tokens = await this.generateTokens(user);

    // Log de auditoria
    await this.createAuditLog(user.id, 'LOGIN_SUCCESS', user.id, {
      email: user.email,
      mfaUsed: user.mfaEnabled,
    });

    this.logger.log(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      ...tokens,
    };
  }

  /**
   * Valida token JWT e retorna dados do usuário
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token inválido');
    }

    return user;
  }

  /**
   * Refresh dos tokens de acesso
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token de refresh inválido');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Refresh token validation failed', error);
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Verifica senha atual
    const isCurrentPasswordValid = await this.cryptoService.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Valida nova senha
    this.validatePasswordStrength(newPassword);

    // Hash da nova senha
    const newPasswordHash = await this.cryptoService.hashPassword(newPassword);

    // Atualiza a senha
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Log de auditoria
    await this.createAuditLog(userId, 'PASSWORD_CHANGED', userId, {});

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Configura MFA para o usuário
   */
  async setupMfa(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const { secret, qrCode } = await this.mfaService.generateMfaSecret(user.email);

    // Salva o secret temporário (será confirmado na verificação)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { qrCode, secret };
  }

  /**
   * Confirma e ativa MFA
   */
  async confirmMfa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('Setup MFA não encontrado');
    }

    const isValid = await this.mfaService.verifyMfaCode(user.mfaSecret, code);
    if (!isValid) {
      throw new BadRequestException('Código MFA inválido');
    }

    // Ativa MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    // Log de auditoria
    await this.createAuditLog(userId, 'MFA_ENABLED', userId, {});

    this.logger.log(`MFA enabled for user: ${user.email}`);

    return { message: 'MFA ativado com sucesso' };
  }

  /**
   * Gera tokens de acesso e refresh
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Gera token temporário para MFA
   */
  private async generateMfaToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, purpose: 'mfa' },
      { expiresIn: '5m' },
    );
  }

  /**
   * Valida força da senha
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(`Senha deve ter pelo menos ${minLength} caracteres`);
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new BadRequestException(
        'Senha deve conter pelo menos: uma letra maiúscula, uma minúscula, um número e um caractere especial',
      );
    }
  }

  /**
   * Cria registro de auditoria
   */
  private async createAuditLog(actorId: string, action: string, entityId: string, changes: any = {}) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'USER',
          entityId,
          action,
          actorId,
          changes,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }
}