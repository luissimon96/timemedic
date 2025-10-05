import { Injectable, Logger } from '@nestjs/common';
import { CryptoService } from '../../../infrastructure/crypto/crypto.service';

@Injectable()
export class PatientEncryptionService {
  private readonly logger = new Logger(PatientEncryptionService.name);

  constructor(private readonly cryptoService: CryptoService) {}

  async encryptPatientPii(piiData: {
    name?: string;
    cpf?: string;
    phone?: string;
    address?: string;
  }): Promise<Buffer> {
    const dataString = JSON.stringify(piiData);
    return this.cryptoService.encrypt(dataString);
  }

  async decryptPatientPii(encryptedData: Buffer): Promise<{
    name?: string;
    cpf?: string;
    phone?: string;
    address?: string;
  }> {
    const decryptedString = this.cryptoService.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }

  async encryptEmergencyContact(contactData: any): Promise<Buffer> {
    const dataString = JSON.stringify(contactData);
    return this.cryptoService.encrypt(dataString);
  }

  async decryptEmergencyContact(encryptedData: Buffer): Promise<any> {
    const decryptedString = this.cryptoService.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }
}
