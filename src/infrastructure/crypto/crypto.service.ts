import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipher, createDecipher, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!this.encryptionKey || this.encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 characters (256 bits) in hexadecimal format');
    }
  }

  /**
   * Criptografa dados PII (Personally Identifiable Information)
   * Utiliza AES-256-GCM para criptografia autenticada
   */
  async encryptPII(data: any): Promise<Buffer> {
    try {
      const jsonData = JSON.stringify(data);
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = randomBytes(16); // 128 bits IV
      
      const cipher = require('crypto').createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('timemedic-pii', 'utf8'));
      
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combina IV + AuthTag + Dados criptografados
      const result = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);

      this.logger.debug('PII data encrypted successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to encrypt PII data', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Descriptografa dados PII
   */
  async decryptPII(encryptedData: Buffer): Promise<any> {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      
      // Extrai IV (16 bytes), AuthTag (16 bytes) e dados
      const iv = encryptedData.subarray(0, 16);
      const authTag = encryptedData.subarray(16, 32);
      const encrypted = encryptedData.subarray(32);
      
      const decipher = require('crypto').createDecipher(this.algorithm, key);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('timemedic-pii', 'utf8'));
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      this.logger.debug('PII data decrypted successfully');
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt PII data', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Gera hash seguro para senhas usando scrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(32);
    const scryptAsync = promisify(scrypt);
    
    const hash = await scryptAsync(password, salt, 64) as Buffer;
    
    // Combina salt + hash
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verifica se a senha corresponde ao hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [saltHex, hashHex] = hashedPassword.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const hash = Buffer.from(hashHex, 'hex');
      
      const scryptAsync = promisify(scrypt);
      const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
      
      return hash.equals(derivedKey);
    } catch (error) {
      this.logger.error('Password verification failed', error);
      return false;
    }
  }

  /**
   * Gera ID pseudonimizado para pacientes (LGPD compliance)
   */
  generatePseudonymizedId(realId: string): string {
    const hash = createHash('sha256');
    hash.update(realId + this.encryptionKey);
    return `p_${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Gera token seguro para recuperação de senha, etc.
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash para dados que precisam ser pesquisáveis mas não reversíveis
   */
  hashForSearch(data: string): string {
    const hash = createHash('sha256');
    hash.update(data.toLowerCase().trim());
    return hash.digest('hex');
  }

  /**
   * Criptografia simétrica para dados menos sensíveis
   */
  encrypt(text: string): string {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = randomBytes(16);
    
    const cipher = require('crypto').createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Descriptografia simétrica
   */
  decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = require('crypto').createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Gera chave de criptografia segura
   */
  static generateEncryptionKey(): string {
    return randomBytes(32).toString('hex'); // 256 bits
  }

  /**
   * Verifica se os dados estão criptografados corretamente
   */
  async verifyEncryption(encryptedData: Buffer): Promise<boolean> {
    try {
      await this.decryptPII(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}