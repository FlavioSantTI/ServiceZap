import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  Browsers,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { WhatsAppStatus } from '@/types/appwrite';
import { WhatsAppSyncService, sanitizeWhatsAppJid } from '@/lib/services/whatsappSyncService';
import { createAdminClient } from '@/lib/appwrite/server';
import { saveMediaBuffer } from '@/lib/utils/mediaStorage';

const SESSIONS_DIR = path.resolve(process.cwd(), '.whatsapp_sessions');
const DEFAULT_SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || 'servicezap_main';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_WHATSAPP = process.env.APPWRITE_COLLECTION_WHATSAPP || 'whatsapp_instances';

export class EmbeddedWhatsAppEngine {
  private sock: WASocket | null = null;
  private status: WhatsAppStatus = 'disconnected';
  private sessionName: string = DEFAULT_SESSION_NAME;
  private isInitializing: boolean = false;
  private isReadyForPairing: boolean = false;
  private connectedPhone: string = '';
  private lidToPhoneMap: Map<string, string> = new Map();

  constructor(sessionName: string = DEFAULT_SESSION_NAME) {
    this.sessionName = sessionName;
  }

  /**
   * Garante a existência do diretório de sessões
   */
  private ensureSessionDir(): string {
    const dir = path.join(SESSIONS_DIR, this.sessionName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Inicializa o socket do Baileys com MultiFileAuthState
   */
  public async init(): Promise<WASocket> {
    if (this.sock && (this.status === 'connected' || this.isReadyForPairing || this.sock.ws?.isOpen)) {
      return this.sock;
    }

    if (this.isInitializing && this.sock) {
      return this.sock;
    }

    this.isInitializing = true;
    const sessionDir = this.ensureSessionDir();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
    });

    this.sock = sock;

    // 1. Persistência contínua de credenciais
    sock.ev.on('creds.update', saveCreds);

    // 2. Monitoramento de conexão e ciclo de vida
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.isReadyForPairing = true;
      }

      if (connection === 'connecting') {
        this.status = 'connecting';
        await this.syncInstanceStatusToAppwrite('connecting');
      }

      if (connection === 'open') {
        this.status = 'connected';
        this.isInitializing = false;
        this.isReadyForPairing = false;
        const userJid = sock.user?.id || '';
        this.connectedPhone = sanitizeWhatsAppJid(userJid);
        console.log(`✅ [EmbeddedWhatsApp] Conectado com sucesso! Tel: ${this.connectedPhone}`);
        await this.syncInstanceStatusToAppwrite('connected', this.connectedPhone);
      }

      if (connection === 'close') {
        this.isInitializing = false;
        this.isReadyForPairing = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.warn(
          `⚠️ [EmbeddedWhatsApp] Conexão fechada. Motivo: ${statusCode}. Reconectar: ${shouldReconnect}`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          this.status = 'disconnected';
          this.sock = null;
          await this.syncInstanceStatusToAppwrite('disconnected');
          // Remove arquivos da sessão deslogada
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          } catch (e) {
            // ignora
          }
        } else if (shouldReconnect) {
          this.status = 'connecting';
          await this.syncInstanceStatusToAppwrite('connecting');
          setTimeout(() => this.init(), 3000);
        } else {
          this.status = 'disconnected';
          this.sock = null;
          await this.syncInstanceStatusToAppwrite('disconnected');
        }
      }
    });

    // 3. Barramento de Eventos de Mensagens (Inbound & Outbound Native)
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        await this.handleMessageUpsert(msg);
      }
    });

    return sock;
  }

  /**
   * Processa cada mensagem recebida pelo socket Baileys com de-duplicação
   */
  private async handleMessageUpsert(msg: proto.IWebMessageInfo) {
    try {
      if (!msg.message || !msg.key) return;
      const key = msg.key;
      const wamid = key.id || '';
      const fromMe = Boolean(key.fromMe);
      let rawJid = key.remoteJid || '';

      // Ignora mensagens de broadcast de status e grupos
      if (rawJid === 'status@broadcast' || rawJid.endsWith('@g.us')) {
        return;
      }

      // Tratamento para LIDs (Linked Device IDs do WhatsApp Business / iOS)
      if (rawJid.endsWith('@lid')) {
        const cleanLid = sanitizeWhatsAppJid(rawJid);
        if (key.participant && key.participant.endsWith('@s.whatsapp.net')) {
          rawJid = key.participant;
        } else if (msg.participant && msg.participant.endsWith('@s.whatsapp.net')) {
          rawJid = msg.participant;
        } else if (this.sock && (this.sock as any).signalRepository?.lidMapping?.getPNForLID) {
          try {
            const pn = await (this.sock as any).signalRepository.lidMapping.getPNForLID(rawJid);
            if (pn) {
              rawJid = pn;
              console.log(`🔎 [EmbeddedWhatsApp] LID ${key.remoteJid} resolvido via lidMapping para PN: ${pn}`);
            }
          } catch (lidErr) {
            // fallback silencioso
          }
        }

        if (rawJid.endsWith('@lid') && this.lidToPhoneMap.has(cleanLid)) {
          const mappedPhone = this.lidToPhoneMap.get(cleanLid)!;
          console.log(`🔎 [EmbeddedWhatsApp] LID ${key.remoteJid} resolvido via mapa local para número: ${mappedPhone}`);
          rawJid = `${mappedPhone}@s.whatsapp.net`;
        }
      }

      const cleanPhone = sanitizeWhatsAppJid(rawJid);
      if (!cleanPhone) return;

      // Desembrulha mensagens aninhadas (ephemeral, viewOnce, documentWithCaption)
      const unwrapMessage = (message: proto.IMessage | null | undefined): proto.IMessage | null | undefined => {
        if (!message) return message;
        if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
        if (message.viewOnceMessage?.message) return unwrapMessage(message.viewOnceMessage.message);
        if (message.viewOnceMessageV2?.message) return unwrapMessage(message.viewOnceMessageV2.message);
        if (message.viewOnceMessageV2Extension?.message) return unwrapMessage(message.viewOnceMessageV2Extension.message);
        if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
        return message;
      };

      const rawMsg = unwrapMessage(msg.message);
      if (!rawMsg) return;

      // Extração de Mídia e Conteúdo de texto
      let mediaType: 'image' | 'video' | 'audio' | 'document' | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let mediaUrl: string | undefined = undefined;

      const imgMsg = rawMsg.imageMessage;
      const vidMsg = rawMsg.videoMessage || rawMsg.ptvMessage;
      const audMsg = rawMsg.audioMessage;
      const docMsg = rawMsg.documentMessage;
      const stickerMsg = rawMsg.stickerMessage;

      if (imgMsg) {
        mediaType = 'image';
        mimeType = imgMsg.mimetype || 'image/jpeg';
      } else if (vidMsg) {
        mediaType = 'video';
        mimeType = vidMsg.mimetype || 'video/mp4';
      } else if (audMsg) {
        mediaType = 'audio';
        mimeType = audMsg.mimetype || 'audio/ogg';
      } else if (docMsg) {
        mediaType = 'document';
        mimeType = docMsg.mimetype || 'application/octet-stream';
        fileName = docMsg.fileName || 'documento';
      } else if (stickerMsg) {
        mediaType = 'image';
        mimeType = stickerMsg.mimetype || 'image/webp';
        fileName = 'figurinha.webp';
      }

      if (mediaType) {
        try {
          let buffer: Buffer | null = null;
          try {
            buffer = await downloadMediaMessage(
              msg as any,
              'buffer',
              {},
              {
                logger: pino({ level: 'silent' }),
                reuploadRequest: this.sock?.updateMediaMessage ? (this.sock as any).updateMediaMessage.bind(this.sock) : undefined,
              } as any
            );
          } catch {
            // Fallback com mensagem unwrapped para envelopes aninhados
            buffer = await downloadMediaMessage(
              { key: msg.key, message: rawMsg } as any,
              'buffer',
              {},
              {
                logger: pino({ level: 'silent' }),
                reuploadRequest: this.sock?.updateMediaMessage ? (this.sock as any).updateMediaMessage.bind(this.sock) : undefined,
              } as any
            );
          }

          if (buffer && buffer.length > 0) {
            const saved = await saveMediaBuffer(buffer, mimeType || 'application/octet-stream', fileName);
            mediaUrl = saved.mediaUrl;
            console.log(`📸 [EmbeddedWhatsApp] Mídia recebida e salva com sucesso em disk local: ${mediaUrl}`);
          }
        } catch (mediaErr) {
          console.warn('[EmbeddedWhatsApp] Erro ao baixar mídia recebida:', mediaErr);
        }
      }

      const messageContent =
        rawMsg.conversation ||
        rawMsg.extendedTextMessage?.text ||
        imgMsg?.caption ||
        vidMsg?.caption ||
        docMsg?.caption ||
        '';

      console.log(`📩 [EmbeddedWhatsApp] Mensagem ${fromMe ? 'outbound (eco)' : 'inbound (recebida)'} - De/Para: ${cleanPhone} | Mídia: ${mediaType || 'nenhuma'} (${mediaUrl || 'sem url'}) | Conteúdo: "${messageContent}"`);

      const timestamp = msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const payload = {
        wamid,
        fromMe,
        phone: cleanPhone,
        content: messageContent,
        timestamp,
        tenantId: 'tenant_01',
        pushName: msg.pushName || '',
        mediaType,
        mediaUrl,
        mimeType,
        fileName,
      };

      if (!fromMe) {
        // Inbound: gravado no Appwrite
        await WhatsAppSyncService.createInboundMessage(payload);
      } else {
        // Outbound: resolve de-duplicação e eco de celular nativo
        await WhatsAppSyncService.handleOutboundEcho(payload);
      }
    } catch (error) {
      console.error('[EmbeddedWhatsApp] Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Aguarda o socket estabelecer o handshake e estar pronto para o registro por Pairing Code
   */
  private async waitForPairingReadiness(sock: WASocket, timeoutMs = 15000): Promise<void> {
    if (this.isReadyForPairing) return;

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        if (sock.ws?.isOpen) {
          resolve();
        } else {
          reject(
            new Error('Tempo limite aguardando conexão com os servidores do WhatsApp. Tente novamente em instantes.')
          );
        }
      }, timeoutMs);

      const interval = setInterval(() => {
        if (this.isReadyForPairing) {
          cleanup();
          setTimeout(resolve, 400);
        }
      }, 250);

      const cleanup = () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    });
  }

  /**
   * Solicita o Pairing Code nativo de 8 dígitos para o número informado
   */
  public async requestPairingCode(phoneNumber: string): Promise<string> {
    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Informe um número de telefone válido com DDI e DDD (ex: 5511999998888).');
    }

    if (this.status === 'connected') {
      throw new Error('Esta sessão do WhatsApp já está conectada.');
    }

    // Se houver uma tentativa anterior que não conectou, reinicia a sessão do zero
    // para que a Meta permita um novo canal de pareamento
    await this.resetForNewPairing();

    // Inicializa o socket Baileys com estado limpo
    const sock = await this.init();

    // Aguarda o handshake do WhatsApp para receber a prontidão de pareamento
    await this.waitForPairingReadiness(sock, 15000);

    try {
      // Método nativo do Baileys para gerar o código de pareamento
      const rawCode = await sock.requestPairingCode(cleanPhone);
      
      // Formata em 8 caracteres limpos com hífen no meio: ABCD-1234
      let formattedCode = rawCode;
      if (rawCode && rawCode.length === 8) {
        formattedCode = `${rawCode.substring(0, 4)}-${rawCode.substring(4)}`;
      }

      this.status = 'connecting';
      await this.syncInstanceStatusToAppwrite('connecting', cleanPhone);

      return formattedCode;
    } catch (error: any) {
      console.error('[EmbeddedWhatsApp] Falha ao solicitar Pairing Code via Baileys:', error);
      await this.resetForNewPairing();
      throw new Error(error.message || 'Falha ao gerar código de pareamento no Baileys.');
    }
  }

  /**
   * Reseta o socket e arquivos residuais de pareamento para permitir uma nova tentativa
   */
  public async resetForNewPairing(): Promise<void> {
    this.isReadyForPairing = false;
    this.isInitializing = false;
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
      } catch (e) {
        // ignora
      }
      this.sock = null;
    }
    this.status = 'disconnected';
    const sessionDir = this.ensureSessionDir();
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignora
    }
  }

  /**
   * Garante que o socket esteja ativo e em estado 'connected' antes de realizar operações de envio
   */
  public async ensureConnectionReady(timeoutMs = 10000): Promise<WASocket> {
    const sock = await this.init();

    if (this.status === 'connected' && sock) {
      return sock;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        if (this.status === 'connected' && this.sock) {
          resolve(this.sock);
        } else {
          reject(new Error('O WhatsApp está reconectando. Aguarde alguns segundos e tente novamente.'));
        }
      }, timeoutMs);

      const checkInterval = setInterval(() => {
        if (this.status === 'connected' && this.sock) {
          cleanup();
          resolve(this.sock);
        }
      }, 300);

      const cleanup = () => {
        clearTimeout(timer);
        clearInterval(checkInterval);
      };
    });
  }

  /**
   * Envia mensagem de texto diretamente pelo socket Baileys em memória sem latência de bloqueio
   */
  public async sendTextMessage(phoneNumber: string, text: string): Promise<{ wamid: string }> {
    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone) throw new Error('Número de telefone inválido.');

    const sock = await this.ensureConnectionReady(12000);

    const targetJid = `${cleanPhone}@s.whatsapp.net`;

    // 1. Mapeamento background não-bloqueante para registrar LIDs de dispositivos vinculados
    const phonesToTest = [cleanPhone];
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
      phonesToTest.push(`${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}`);
    } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
      phonesToTest.push(`${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}`);
    }

    sock.onWhatsApp(...phonesToTest)
      .then((results) => {
        if (results && results.length > 0) {
          for (const res of results) {
            if (res && res.jid) {
              const cleanJidPhone = sanitizeWhatsAppJid(res.jid);
              this.lidToPhoneMap.set(cleanJidPhone, cleanPhone);
              if ((res as any).lid) {
                const cleanLid = sanitizeWhatsAppJid((res as any).lid);
                this.lidToPhoneMap.set(cleanLid, cleanPhone);
                console.log(`📌 [EmbeddedWhatsApp] Mapeamento LID ↔ Telefone registrado: ${cleanLid} -> ${cleanPhone}`);
              }
            }
          }
        }
      })
      .catch(() => {});

    // 2. Disparo imediato via socket (latência ~100ms)
    try {
      console.log(`📤 [EmbeddedWhatsApp] Disparando mensagem Baileys para: ${targetJid} | Texto: "${text}"`);
      const sent = await sock.sendMessage(targetJid, { text });
      const wamid = sent?.key?.id || `app_${Date.now()}`;
      console.log(`✅ [EmbeddedWhatsApp] Mensagem entregue com sucesso! WAMID: ${wamid}`);
      return { wamid };
    } catch (err: any) {
      console.warn('[EmbeddedWhatsApp] Tentativa padrão falhou, tentando número alternativo (com/sem 9)...', err?.message);
      // Se era 13 dígitos, tenta 12 dígitos
      let altJid = targetJid;
      if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
        altJid = `${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}@s.whatsapp.net`;
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        altJid = `${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}@s.whatsapp.net`;
      }

      const sent = await sock.sendMessage(altJid, { text });
      const wamid = sent?.key?.id || `app_${Date.now()}`;
      console.log(`✅ [EmbeddedWhatsApp] Mensagem entregue no JID alternativo! WAMID: ${wamid}`);
      return { wamid };
    }
  }

  /**
   * Envia mensagem de mídia (Imagem, Vídeo, Áudio ou Documento) via Baileys
   */
  public async sendMediaMessage(params: {
    phoneNumber: string;
    mediaBuffer: Buffer;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    caption?: string;
    fileName?: string;
    mimetype?: string;
  }): Promise<{ wamid: string }> {
    const cleanPhone = sanitizeWhatsAppJid(params.phoneNumber);
    if (!cleanPhone) throw new Error('Número de telefone inválido.');

    const sock = await this.ensureConnectionReady(12000);
    const targetJid = `${cleanPhone}@s.whatsapp.net`;

    let contentPayload: any = {};
    if (params.mediaType === 'image') {
      contentPayload = {
        image: params.mediaBuffer,
        caption: params.caption || '',
        mimetype: params.mimetype || 'image/jpeg',
      };
    } else if (params.mediaType === 'video') {
      contentPayload = {
        video: params.mediaBuffer,
        caption: params.caption || '',
        mimetype: params.mimetype || 'video/mp4',
      };
    } else if (params.mediaType === 'audio') {
      contentPayload = {
        audio: params.mediaBuffer,
        ptt: true,
        mimetype: params.mimetype || 'audio/mp4',
      };
    } else if (params.mediaType === 'document') {
      contentPayload = {
        document: params.mediaBuffer,
        caption: params.caption || '',
        fileName: params.fileName || 'documento',
        mimetype: params.mimetype || 'application/octet-stream',
      };
    }

    try {
      console.log(`📤 [EmbeddedWhatsApp] Disparando mídia (${params.mediaType}) Baileys para: ${targetJid}`);
      const sent = await sock.sendMessage(targetJid, contentPayload);
      const wamid = sent?.key?.id || `app_${Date.now()}`;
      console.log(`✅ [EmbeddedWhatsApp] Mídia entregue com sucesso! WAMID: ${wamid}`);
      return { wamid };
    } catch (err: any) {
      console.warn('[EmbeddedWhatsApp] Envio de mídia falhou no JID principal, tentando número alternativo...', err?.message);
      let altJid = targetJid;
      if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
        altJid = `${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}@s.whatsapp.net`;
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        altJid = `${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}@s.whatsapp.net`;
      }

      const sent = await sock.sendMessage(altJid, contentPayload);
      const wamid = sent?.key?.id || `app_${Date.now()}`;
      console.log(`✅ [EmbeddedWhatsApp] Mídia entregue no JID alternativo! WAMID: ${wamid}`);
      return { wamid };
    }
  }

  /**
   * Desconecta e limpa a sessão
   */
  public async logout(): Promise<void> {
    this.isReadyForPairing = false;
    this.isInitializing = false;
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
      } catch (e) {
        // ignora
      }
      this.sock = null;
    }
    this.status = 'disconnected';
    const sessionDir = this.ensureSessionDir();
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (e) {
      // ignora
    }
    await this.syncInstanceStatusToAppwrite('disconnected');
  }

  /**
   * Retorna o status atual da conexão
   */
  public getStatus(): { status: WhatsAppStatus; phone: string } {
    return {
      status: this.status,
      phone: this.connectedPhone,
    };
  }

  /**
   * Sincroniza o status da instância com o Appwrite Database
   */
  private async syncInstanceStatusToAppwrite(status: WhatsAppStatus, phone?: string) {
    if (!process.env.APPWRITE_API_KEY) return;

    try {
      const { databases } = await createAdminClient();
      const list = await databases.listDocuments(DATABASE_ID, COLLECTION_WHATSAPP);

      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (phone) updateData.phone = phone;

      if (list.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_WHATSAPP,
          list.documents[0].$id,
          updateData
        );
      }
    } catch (err) {
      console.warn('[EmbeddedWhatsApp] Aviso ao sincronizar status no Appwrite:', err);
    }
  }
}

// Singleton no ambiente global do Node.js para persistir durante HMR e requisições
declare global {
  var __embeddedWhatsAppEngineInstance: EmbeddedWhatsAppEngine | undefined;
}

export function getEmbeddedWhatsAppEngine(): EmbeddedWhatsAppEngine {
  if (!global.__embeddedWhatsAppEngineInstance) {
    const instance = new EmbeddedWhatsAppEngine();
    global.__embeddedWhatsAppEngineInstance = instance;

    // Se já existem credenciais salvas de uma conexão prévia, inicializa automaticamente
    const sessionDir = path.resolve(process.cwd(), '.whatsapp_sessions', process.env.WHATSAPP_SESSION_NAME || 'servicezap_main');
    const credsFile = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      instance.init().catch((err) => console.warn('[EmbeddedWhatsApp] Erro na auto-conexão:', err));
    }
  }
  return global.__embeddedWhatsAppEngineInstance;
}
