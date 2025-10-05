import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AnvisaSyncDto, AnvisaSyncResultDto } from '../dto';

export interface AnvisaMedicationData {
  codigo: string;
  nomeComercial: string;
  principioAtivo: Array<{
    nome: string;
    concentracao: string;
    unidade: string;
  }>;
  formaFarmaceutica: string;
  classeTerapeutica: string;
  fabricante: string;
  registro: {
    numero: string;
    dataRegistro: string;
    dataVencimento: string;
    situacao: string;
  };
  bula?: {
    contraindicacoes: string[];
    efeitosAdversos: string[];
    posologia: Record<string, any>;
  };
  embalagem?: {
    apresentacao: string;
    quantidade: string;
    informacoes: string;
  };
}

@Injectable()
export class AnvisaService {
  private readonly logger = new Logger(AnvisaService.name);
  private readonly anvisaApiUrl: string;
  private readonly anvisaApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.anvisaApiUrl = this.configService.get<string>('ANVISA_API_URL') || 'https://consultas.anvisa.gov.br/api/consulta';
    this.anvisaApiKey = this.configService.get<string>('ANVISA_API_KEY');
  }

  /**
   * Busca medicamento na base ANVISA pelo código
   */
  async findMedicationByCode(anvisaCode: string): Promise<AnvisaMedicationData | null> {
    try {
      this.logger.debug(`Buscando medicamento ANVISA: ${anvisaCode}`);

      const response = await fetch(`${this.anvisaApiUrl}/medicamentos/${anvisaCode}`, {
        headers: {
          'Authorization': `Bearer ${this.anvisaApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TimeMedic/1.0.0',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`Medicamento não encontrado na ANVISA: ${anvisaCode}`);
          return null;
        }
        throw new HttpException(
          `Erro na consulta ANVISA: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      return this.normalizeAnvisaData(data);
    } catch (error) {
      this.logger.error(`Erro ao consultar ANVISA para código ${anvisaCode}:`, error);
      throw new HttpException(
        'Erro na consulta à base ANVISA',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Busca medicamentos na ANVISA por termo de busca
   */
  async searchMedications(searchTerm: string, limit: number = 50): Promise<AnvisaMedicationData[]> {
    try {
      this.logger.debug(`Buscando medicamentos ANVISA por termo: ${searchTerm}`);

      const response = await fetch(`${this.anvisaApiUrl}/medicamentos/buscar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anvisaApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TimeMedic/1.0.0',
        },
        body: JSON.stringify({
          termo: searchTerm,
          limite: limit,
          campos: ['codigo', 'nomeComercial', 'principioAtivo', 'fabricante'],
        }),
      });

      if (!response.ok) {
        throw new HttpException(
          `Erro na busca ANVISA: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      return data.resultados?.map((item: any) => this.normalizeAnvisaData(item)) || [];
    } catch (error) {
      this.logger.error(`Erro ao buscar medicamentos na ANVISA:`, error);
      throw new HttpException(
        'Erro na busca à base ANVISA',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Sincroniza medicamento com a base ANVISA
   */
  async syncMedication(anvisaCode: string, forceUpdate: boolean = false): Promise<any> {
    const existingMedication = await this.prisma.medication.findUnique({
      where: { anvisaCode },
    });

    if (existingMedication && !forceUpdate) {
      this.logger.debug(`Medicamento ${anvisaCode} já existe, pulando sincronização`);
      return existingMedication;
    }

    const anvisaData = await this.findMedicationByCode(anvisaCode);
    if (!anvisaData) {
      throw new HttpException(
        `Medicamento ${anvisaCode} não encontrado na base ANVISA`,
        HttpStatus.NOT_FOUND,
      );
    }

    const medicationData = {
      anvisaCode: anvisaData.codigo,
      commercialName: anvisaData.nomeComercial,
      activeSubstance: anvisaData.principioAtivo,
      pharmaceuticalForm: anvisaData.formaFarmaceutica,
      therapeuticClass: anvisaData.classeTerapeutica,
      manufacturer: anvisaData.fabricante,
      packageInfo: anvisaData.embalagem || null,
      contraindications: anvisaData.bula?.contraindicacoes || null,
      sideEffects: anvisaData.bula?.efeitosAdversos || null,
      dosageGuidelines: anvisaData.bula?.posologia || null,
    };

    if (existingMedication) {
      return await this.prisma.medication.update({
        where: { id: existingMedication.id },
        data: medicationData,
      });
    } else {
      return await this.prisma.medication.create({
        data: medicationData,
      });
    }
  }

  /**
   * Sincronização em lote de medicamentos
   */
  async batchSync(syncDto: AnvisaSyncDto): Promise<AnvisaSyncResultDto> {
    const startTime = Date.now();
    const result: AnvisaSyncResultDto = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
      duration: 0,
      timestamp: new Date(),
    };

    let codes: string[] = [];

    if (syncDto.anvisaCode) {
      codes = [syncDto.anvisaCode];
    } else if (syncDto.anvisaCodes) {
      codes = syncDto.anvisaCodes;
    } else {
      // Sincronização incremental ou completa
      codes = await this.getCodesForSync(syncDto);
    }

    this.logger.log(`Iniciando sincronização de ${codes.length} medicamentos`);

    for (const code of codes) {
      try {
        result.processed++;
        
        const existingMedication = await this.prisma.medication.findUnique({
          where: { anvisaCode: code },
        });

        if (existingMedication && !syncDto.forceUpdate) {
          continue; // Pula se já existe e não é para forçar atualização
        }

        const syncedMedication = await this.syncMedication(code, syncDto.forceUpdate);
        
        if (existingMedication) {
          result.updated++;
        } else {
          result.created++;
        }

        // Log de progresso a cada 50 medicamentos
        if (result.processed % 50 === 0) {
          this.logger.log(`Progresso: ${result.processed}/${codes.length} medicamentos processados`);
        }

      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          anvisaCode: code,
          error: error.message || 'Erro desconhecido',
        });
        this.logger.error(`Erro ao sincronizar medicamento ${code}:`, error);
      }
    }

    result.duration = (Date.now() - startTime) / 1000;
    
    this.logger.log(
      `Sincronização concluída: ${result.created} criados, ${result.updated} atualizados, ${result.errors} erros em ${result.duration}s`
    );

    return result;
  }

  /**
   * Obtém códigos para sincronização com base nos critérios
   */
  private async getCodesForSync(syncDto: AnvisaSyncDto): Promise<string[]> {
    // Em um cenário real, isso poderia buscar uma lista de códigos da ANVISA
    // ou usar uma base local de códigos conhecidos para atualizar
    
    if (syncDto.since) {
      // Busca medicamentos atualizados desde uma data específica
      const medications = await this.prisma.medication.findMany({
        where: {
          updatedAt: {
            lt: new Date(syncDto.since),
          },
        },
        select: { anvisaCode: true },
        take: 1000, // Limita para evitar sobrecarga
      });
      
      return medications.map(m => m.anvisaCode);
    }

    // Por padrão, retorna uma lista vazia para evitar sincronização em massa acidental
    this.logger.warn('Sincronização sem critérios específicos - retornando lista vazia');
    return [];
  }

  /**
   * Normaliza dados da ANVISA para o formato interno
   */
  private normalizeAnvisaData(data: any): AnvisaMedicationData {
    return {
      codigo: data.codigo || data.codigoAnvisa,
      nomeComercial: data.nomeComercial || data.nome,
      principioAtivo: this.normalizePrincipioAtivo(data.principioAtivo || data.principiosAtivos),
      formaFarmaceutica: data.formaFarmaceutica || data.forma,
      classeTerapeutica: data.classeTerapeutica || data.classe,
      fabricante: data.fabricante || data.laboratorio,
      registro: {
        numero: data.registro?.numero || data.numeroRegistro,
        dataRegistro: data.registro?.dataRegistro || data.dataRegistro,
        dataVencimento: data.registro?.dataVencimento || data.dataVencimento,
        situacao: data.registro?.situacao || data.situacao || 'ATIVO',
      },
      bula: data.bula ? {
        contraindicacoes: this.normalizeArray(data.bula.contraindicacoes),
        efeitosAdversos: this.normalizeArray(data.bula.efeitosAdversos),
        posologia: data.bula.posologia || {},
      } : undefined,
      embalagem: data.embalagem ? {
        apresentacao: data.embalagem.apresentacao || data.apresentacao,
        quantidade: data.embalagem.quantidade || data.quantidade,
        informacoes: data.embalagem.informacoes || data.informacoesEmbalagem,
      } : undefined,
    };
  }

  private normalizePrincipioAtivo(principios: any): Array<{ nome: string; concentracao: string; unidade: string }> {
    if (!principios) return [];
    
    if (Array.isArray(principios)) {
      return principios.map(p => ({
        nome: p.nome || p.principio || p,
        concentracao: p.concentracao || p.dose || '',
        unidade: p.unidade || p.unidadeMedida || 'mg',
      }));
    }

    if (typeof principios === 'string') {
      // Tenta extrair informações de uma string
      const match = principios.match(/^([^0-9]+)\s*(\d+(?:\.\d+)?)\s*(\w+)?/);
      if (match) {
        return [{
          nome: match[1].trim(),
          concentracao: match[2],
          unidade: match[3] || 'mg',
        }];
      }
      
      return [{
        nome: principios,
        concentracao: '',
        unidade: 'mg',
      }];
    }

    return [];
  }

  private normalizeArray(data: any): string[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(item => typeof item === 'string');
    if (typeof data === 'string') return [data];
    return [];
  }

  /**
   * Valida conectividade com a ANVISA
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.anvisaApiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.anvisaApiKey}`,
          'User-Agent': 'TimeMedic/1.0.0',
        },
        timeout: 5000,
      } as any);

      return response.ok;
    } catch (error) {
      this.logger.error('Erro ao validar conexão com ANVISA:', error);
      return false;
    }
  }
}