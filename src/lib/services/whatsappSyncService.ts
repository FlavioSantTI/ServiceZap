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

export class WhatsAppSyncService {
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
    const { databases } = await createAdminClient();
    const cleanPhone = sanitizeWhatsAppJid(payload.phone);

    // Auto-cadastra o cliente no CRM se o número ainda não existir
    await this.ensureClientExistsForPhone(cleanPhone, payload.pushName);

    // Proteção contra duplicação de inbound
    const existing = await this.findMessageByWamid(payload.wamid);
    if (existing) {
      return existing;
    }

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
      } catch (upErr) {
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

    // Operador enviou mensagem pelo celular (WhatsApp Nativo)
    const cleanPhone = sanitizeWhatsAppJid(payload.phone);
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
