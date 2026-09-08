import { Query, ID } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite/server';
import { MessageDocument, MessageDirection, MessageStatus, MessageOrigin, MessageMediaType } from '@/types/appwrite';
import { sanitizeWhatsAppJid, isSamePhone } from '@/lib/utils/whatsappUtils';

export { sanitizeWhatsAppJid, isSamePhone };

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const MESSAGES_COLLECTION_ID = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

export interface WebhookMessageUpsertPayload {
  wamid: string;
  fromMe: boolean;
  phone: string;
  content: string;
  timestamp: string; // ISO 8601
  tenantId?: string;
  pushName?: string;
  mediaType?: MessageMediaType;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
}

// Cache em memória de WAMIDs para verificação ultrarrápida O(1) sem bater no Appwrite a cada mensagem
const inMemoryWamidCache = new Set<string>();
const appSentWamidsCache = new Map<string, number>();

export class WhatsAppSyncService {
  /**
   * Registra um WAMID de mensagem enviada intencionalmente pelo sistema
   */
  static registerAppSentWamid(wamid: string): void {
    if (!wamid) return;
    appSentWamidsCache.set(wamid, Date.now());
    inMemoryWamidCache.add(wamid);

    // Limpeza de itens mais antigos que 3 minutos
    const now = Date.now();
    for (const [id, time] of appSentWamidsCache.entries()) {
      if (now - time > 180000) {
        appSentWamidsCache.delete(id);
      }
    }
  }

  /**
   * Checa se o WAMID foi enviado pelo próprio app recentemente
   */
  static isAppSentWamid(wamid: string): boolean {
    if (!wamid) return false;
    return appSentWamidsCache.has(wamid);
  }

  /**
   * Confirma entrega de mensagem originada pelo app
   */
  static async confirmAppMessageSent(wamid: string): Promise<void> {
    if (!wamid) return;
    try {
      const existing = await this.findMessageByWamid(wamid);
      if (existing && existing.status !== 'sent') {
        const { databases } = await createAdminClient();
        await databases.updateDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          existing.$id,
          { status: 'sent' as MessageStatus }
        );
      }
    } catch {
      // silencioso
    }
  }
  /**
   * Garante que um número de telefone possua cadastro no CRM (auto-cadastro de novos contatos)
   */
  static async ensureClientExistsForPhone(phone: string, pushName?: string): Promise<void> {
    if (!process.env.APPWRITE_API_KEY) return;
    const cleanPhone = sanitizeWhatsAppJid(phone);
    if (!cleanPhone || cleanPhone.length < 8) return;

    try {
      const { databases } = await createAdminClient();
      const COLLECTION_CLIENTS = process.env.APPWRITE_COLLECTION_CLIENTS || 'clients';

      const phoneVariants = [cleanPhone];
      if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
        phoneVariants.push(`${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}`);
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        phoneVariants.push(`${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}`);
      }

      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_CLIENTS,
        [Query.equal('phone', phoneVariants), Query.limit(1)]
      );

      if (existing.documents.length === 0) {
        const clientName = pushName?.trim() || `Contato WA (${cleanPhone.slice(-8)})`;
        console.log(`👤 [WhatsAppSyncService] Auto-cadastrando novo cliente no CRM: "${clientName}" (${cleanPhone})`);
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_CLIENTS,
          ID.unique(),
          {
            tenantId: 'tenant_01',
            name: clientName,
            document: '',
            email: '',
            phone: cleanPhone,
            status: 'active',
            totalPaid: 0,
            totalInvoices: 0,
            address: '',
            addressNumber: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            notes: 'Criado automaticamente ao receber mensagem no WhatsApp',
          }
        );
      }
    } catch (err) {
      console.warn('[WhatsAppSyncService] Aviso ao auto-cadastrar cliente:', err);
    }
  }

  /**
   * Busca uma mensagem existente pelo WAMID utilizando o índice de chave
   */
  static async findMessageByWamid(wamid: string): Promise<MessageDocument | null> {
    if (!wamid) return null;
    const { databases } = await createAdminClient();

    try {
      const result = await databases.listDocuments<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('whatsapp_message_id', wamid),
          Query.limit(1),
        ]
      );

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error('[WhatsAppSyncService] Erro ao buscar mensagem por WAMID:', error);
      return null;
    }
  }

  /**
   * Registra mensagem recebida de cliente (Inbound) e auto-cadastra contato no CRM se necessário
   */
  static async createInboundMessage(payload: WebhookMessageUpsertPayload): Promise<MessageDocument> {
    const cleanPhone = sanitizeWhatsAppJid(payload.phone);

    // 1. Checagem em memória ultra-rápida (0ms) contra duplicatas
    if (payload.wamid) {
      if (inMemoryWamidCache.has(payload.wamid)) {
        return { $id: `cached_${payload.wamid}`, whatsapp_message_id: payload.wamid } as any;
      }
      inMemoryWamidCache.add(payload.wamid);
      if (inMemoryWamidCache.size > 3000) {
        // Limpeza suave do cache mantendo os mais recentes
        const iterator = inMemoryWamidCache.values();
        for (let i = 0; i < 500; i++) {
          const val = iterator.next().value;
          if (val) inMemoryWamidCache.delete(val);
        }
      }
    }

    // 2. Auto-cadastro executado em background sem travar o pipeline da mensagem
    this.ensureClientExistsForPhone(cleanPhone, payload.pushName).catch(() => {});

    // 3. Gravação direta no Appwrite sem atrasos
    const { databases } = await createAdminClient();

    try {
      return await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          phone: cleanPhone,
          content: payload.content || '',
          direction: 'inbound' as MessageDirection,
          status: 'received' as MessageStatus,
          origin: 'whatsapp_native' as MessageOrigin,
          whatsapp_message_id: payload.wamid,
          created_at: payload.timestamp || new Date().toISOString(),
          tenantId: payload.tenantId || 'default',
          ...(payload.mediaType ? { mediaType: payload.mediaType } : {}),
          ...(payload.mediaUrl ? { mediaUrl: payload.mediaUrl } : {}),
          ...(payload.mimeType ? { mimeType: payload.mimeType } : {}),
          ...(payload.fileName ? { fileName: payload.fileName } : {}),
        }
      );
    } catch (err) {
      console.warn('[WhatsAppSyncService] Erro com atributos de mídia no Appwrite, salvando mensagem inbound reduzida:', err);
      const mediaTag = payload.mediaUrl
        ? `[Mídia: ${payload.mediaType || 'image'}] ${payload.mediaUrl}`
        : payload.mediaType
        ? `[Mídia: ${payload.mediaType}]`
        : '';
      const fallbackContent = payload.content ? `${payload.content}\n${mediaTag}` : mediaTag || payload.content || '';

      return await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          phone: cleanPhone,
          content: fallbackContent.trim(),
          direction: 'inbound' as MessageDirection,
          status: 'received' as MessageStatus,
          origin: 'whatsapp_native' as MessageOrigin,
          whatsapp_message_id: payload.wamid,
          created_at: payload.timestamp || new Date().toISOString(),
          tenantId: payload.tenantId || 'default',
        }
      );
    }
  }

  /**
   * Lógica de Idempotência e De-duplicação para mensagens fromMe: true
   * - Se já existir no Appwrite: atualiza status para 'sent' (mensagem já foi enviada pelo app)
   * - Se NÃO existir: operador respondeu pelo celular (whatsapp_native), cria novo registro
   */
  static async handleOutboundEcho(payload: WebhookMessageUpsertPayload): Promise<{
    action: 'updated_existing' | 'created_native';
    document: MessageDocument;
  }> {
    const { databases } = await createAdminClient();
    const cleanPhone = sanitizeWhatsAppJid(payload.phone);

    // 1. Busca por WAMID direto
    const existing = await this.findMessageByWamid(payload.wamid);

    if (existing) {
      // Mensagem originada pelo próprio sistema (app_ui) que aguardava confirmação de envio
      try {
        const updated = await databases.updateDocument<MessageDocument>(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          existing.$id,
          {
            status: 'sent' as MessageStatus,
            ...(payload.mediaType ? { mediaType: payload.mediaType } : {}),
            ...(payload.mediaUrl ? { mediaUrl: payload.mediaUrl } : {}),
          }
        );

        return {
          action: 'updated_existing',
          document: updated,
        };
      } catch {
        const updatedFallback = await databases.updateDocument<MessageDocument>(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          existing.$id,
          {
            status: 'sent' as MessageStatus,
          }
        );

        return {
          action: 'updated_existing',
          document: updatedFallback,
        };
      }
    }

    // 2. Se for WAMID registrado como enviado pelo app OU se existir mensagem recente do app aguardando WAMID real:
    // Evita a race condition onde o echo do Baileys chega antes de o route.ts/action terminar o databases.updateDocument
    try {
      const recentOutbounds = await databases.listDocuments<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('phone', cleanPhone),
          Query.equal('direction', 'outbound'),
          Query.orderDesc('created_at'),
          Query.limit(5),
        ]
      );

      const now = Date.now();
      const matchingPending = recentOutbounds.documents.find((doc) => {
        const docTime = new Date(doc.created_at || doc.$createdAt).getTime();
        const isRecent = Math.abs(now - docTime) < 30000; // últimos 30 segundos
        const isAppOrigin = doc.origin === 'app_ui' || doc.whatsapp_message_id?.startsWith('app_');
        return isRecent && (isAppOrigin || doc.status === 'pending');
      });

      if (matchingPending) {
        console.log(`🔗 [WhatsAppSyncService] Reconciliando eco Baileys com mensagem pendente do App: ${matchingPending.$id} -> WAMID: ${payload.wamid}`);
        const updated = await databases.updateDocument<MessageDocument>(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          matchingPending.$id,
          {
            status: 'sent' as MessageStatus,
            whatsapp_message_id: payload.wamid,
            ...(payload.mediaType && !matchingPending.mediaType ? { mediaType: payload.mediaType } : {}),
            ...(payload.mediaUrl && !matchingPending.mediaUrl ? { mediaUrl: payload.mediaUrl } : {}),
          }
        );

        return {
          action: 'updated_existing',
          document: updated,
        };
      }
    } catch (reconcileErr) {
      console.warn('[WhatsAppSyncService] Aviso ao reconciliar mensagem recente:', reconcileErr);
    }

    // 3. Se o WAMID já foi marcado pelo motor como enviado pelo app, não duplica como celular nativo
    if (this.isAppSentWamid(payload.wamid)) {
      console.log(`⏩ [WhatsAppSyncService] WAMID ${payload.wamid} marcado como appSent, ignorando criação nativa duplicada.`);
      return {
        action: 'updated_existing',
        document: { $id: `app_${payload.wamid}`, whatsapp_message_id: payload.wamid } as any,
      };
    }

    // 4. Operador enviou mensagem pelo celular (WhatsApp Nativo)
    try {
      const created = await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          phone: cleanPhone,
          content: payload.content || '',
          direction: 'outbound' as MessageDirection,
          status: 'sent' as MessageStatus,
          origin: 'whatsapp_native' as MessageOrigin,
          whatsapp_message_id: payload.wamid,
          created_at: payload.timestamp || new Date().toISOString(),
          tenantId: payload.tenantId || 'default',
          ...(payload.mediaType ? { mediaType: payload.mediaType } : {}),
          ...(payload.mediaUrl ? { mediaUrl: payload.mediaUrl } : {}),
          ...(payload.mimeType ? { mimeType: payload.mimeType } : {}),
          ...(payload.fileName ? { fileName: payload.fileName } : {}),
        }
      );

      return {
        action: 'created_native',
        document: created,
      };
    } catch (createErr) {
      console.warn('[WhatsAppSyncService] Erro com atributos de mídia no Appwrite ao salvar eco de celular, salvando modo reduzido:', createErr);
      const mediaTag = payload.mediaUrl ? `[Mídia: ${payload.mediaType || 'image'}] ${payload.mediaUrl}` : '';
      const fallbackContent = payload.content ? `${payload.content}\n${mediaTag}` : mediaTag || payload.content || '';

      const createdFallback = await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          phone: cleanPhone,
          content: fallbackContent.trim(),
          direction: 'outbound' as MessageDirection,
          status: 'sent' as MessageStatus,
          origin: 'whatsapp_native' as MessageOrigin,
          whatsapp_message_id: payload.wamid,
          created_at: payload.timestamp || new Date().toISOString(),
          tenantId: payload.tenantId || 'default',
        }
      );

      return {
        action: 'created_native',
        document: createdFallback,
      };
    }
  }

  /**
   * Cria registro preliminar disparado pela interface do sistema (app_ui)
   */
  static async createPendingAppMessage(params: {
    phone: string;
    content: string;
    tenantId?: string;
    mediaType?: MessageMediaType;
    mediaUrl?: string;
    mimeType?: string;
    fileName?: string;
  }): Promise<MessageDocument> {
    const { databases } = await createAdminClient();
    const cleanPhone = sanitizeWhatsAppJid(params.phone);
    const tempWamid = `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return await databases.createDocument<MessageDocument>(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        phone: cleanPhone,
        content: params.content,
        direction: 'outbound' as MessageDirection,
        status: 'pending' as MessageStatus,
        origin: 'app_ui' as MessageOrigin,
        whatsapp_message_id: tempWamid,
        created_at: new Date().toISOString(),
        tenantId: params.tenantId || 'default',
        ...(params.mediaType ? { mediaType: params.mediaType } : {}),
        ...(params.mediaUrl ? { mediaUrl: params.mediaUrl } : {}),
        ...(params.mimeType ? { mimeType: params.mimeType } : {}),
        ...(params.fileName ? { fileName: params.fileName } : {}),
      }
    );
  }

  /**
   * Vincula o WAMID real retornado pela Evolution API à mensagem criada na UI
   */
  static async attachRealWamid(documentId: string, realWamid: string): Promise<MessageDocument> {
    const { databases } = await createAdminClient();
    return await databases.updateDocument<MessageDocument>(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      documentId,
      {
        whatsapp_message_id: realWamid,
        status: 'sent' as MessageStatus,
      }
    );
  }
}
