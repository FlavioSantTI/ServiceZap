/**
 * Serviço de integração direta com a Evolution API v2 (Node.js / Baileys).
 * Opera de forma autônoma e independente de pipelines n8n.
 */

export interface EvolutionConnectionStateResponse {
  instance: {
    instanceName: string;
    state: 'open' | 'connecting' | 'close' | 'refused';
  };
}

export interface EvolutionPairingCodeResponse {
  pairingCode?: string;
  code?: string;
  count?: number;
}

export interface EvolutionSendTextResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string; // WAMID
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: string | number;
  status: string;
}

export class EvolutionApiService {
  private static getBaseUrl(): string {
    return process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080';
  }

  private static getApiKey(): string {
    return process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '';
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const apiKey = this.getApiKey();
    if (apiKey) {
      headers['apikey'] = apiKey;
    }
    return headers;
  }

  /**
   * Garante a criação da instância configurada com o driver WHATSAPP-BAILEYS
   * Desabilita QR Code e habilita pareamento via código numérico
   */
  static async createInstanceIfNotExists(instanceName: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    try {
      // Verifica se já existe
      const checkRes = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });

      if (checkRes.ok) {
        return true;
      }

      // Cria a instância
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName,
          token: Math.random().toString(36).substring(2, 15),
          qrcode: false,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: false,
          msgCall: '',
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
        }),
      });

      return createRes.ok;
    } catch (error) {
      console.warn('[EvolutionApiService] Falha ao comunicar com Evolution API para criar instância:', error);
      return false;
    }
  }

  /**
   * Solicita o Pairing Code de 8 dígitos para o número fornecido
   * O Baileys gera o código numérico para digitar no WhatsApp do celular
   */
  static async requestPairingCode(instanceName: string, phoneNumber: string): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (!cleanNumber) {
      throw new Error('Número de telefone inválido para pareamento.');
    }

    await this.createInstanceIfNotExists(instanceName);

    try {
      // Endpoint oficial da Evolution API v2 para pairing code
      const response = await fetch(
        `${baseUrl}/instance/connect/${encodeURIComponent(instanceName)}?number=${cleanNumber}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        // Tenta alternativa via POST com body
        const postRes = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ number: cleanNumber }),
        });

        if (!postRes.ok) {
          const errText = await postRes.text();
          throw new Error(`Falha na Evolution API (${postRes.status}): ${errText}`);
        }

        const postData = (await postRes.json()) as EvolutionPairingCodeResponse;
        return postData.pairingCode || postData.code || '';
      }

      const data = (await response.json()) as EvolutionPairingCodeResponse;
      const code = data.pairingCode || data.code || '';
      return code;
    } catch (error: any) {
      console.error('[EvolutionApiService] Erro ao obter Pairing Code:', error);
      // Se não houver Evolution API ativa localmente durante testes, retorna mock simulado de 8 dígitos
      if (!process.env.EVOLUTION_API_URL) {
        const mockChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let mockCode = '';
        for (let i = 0; i < 8; i++) {
          mockCode += mockChars.charAt(Math.floor(Math.random() * mockChars.length));
        }
        return `${mockCode.substring(0, 4)}-${mockCode.substring(4)}`;
      }
      throw error;
    }
  }

  /**
   * Consulta o estado atual da conexão da instância ('open' = conectado)
   */
  static async getConnectionState(instanceName: string): Promise<'connected' | 'connecting' | 'disconnected'> {
    const baseUrl = this.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        return 'disconnected';
      }

      const data = (await response.json()) as EvolutionConnectionStateResponse;
      const state = data?.instance?.state;

      if (state === 'open') return 'connected';
      if (state === 'connecting') return 'connecting';
      return 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  }

  /**
   * Envia uma mensagem de texto simples diretamente via Evolution API
   */
  static async sendTextMessage(
    instanceName: string,
    phoneNumber: string,
    text: string
  ): Promise<EvolutionSendTextResponse> {
    const baseUrl = this.getBaseUrl();
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
        delay: 1200,
        linkPreview: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Falha no envio via Evolution API (${response.status}): ${errText}`);
    }

    return (await response.json()) as EvolutionSendTextResponse;
  }

  /**
   * Desconecta e faz logout da sessão
   */
  static async logoutInstance(instanceName: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch (error) {
      return false;
    }
  }
}
