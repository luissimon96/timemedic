import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Gera segredo MFA e QR Code para configuração
   */
  async generateMfaSecret(userEmail: string): Promise<{ secret: string; qrCode: string }> {
    const appName = this.configService.get<string>('APP_NAME', 'TimeMedic');
    
    // Gera segredo
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    });

    // Gera QR Code
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: userEmail,
      issuer: appName,
      encoding: 'ascii',
    });

    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    this.logger.log(`MFA secret generated for user: ${userEmail}`);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verifica código MFA
   */
  async verifyMfaCode(secret: string, token: string): Promise<boolean> {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Permite códigos de até 2 períodos (60 segundos) de diferença
      });

      this.logger.debug(`MFA verification result: ${verified}`);
      return verified;
    } catch (error) {
      this.logger.error('MFA verification failed', error);
      return false;
    }
  }

  /**
   * Gera código MFA para testes (apenas em desenvolvimento)
   */
  async generateMfaCode(secret: string): Promise<string> {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    if (nodeEnv === 'production') {
      throw new Error('MFA code generation not allowed in production');
    }

    const token = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    this.logger.debug(`Generated MFA code for testing: ${token}`);
    return token;
  }

  /**
   * Valida formato do código MFA
   */
  isValidMfaCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  /**
   * Gera códigos de backup para recuperação
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Gera código alfanumérico de 8 caracteres
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }

    return codes;
  }
}