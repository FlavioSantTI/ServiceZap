'use server';

import { createAdminClient } from '@/lib/appwrite/server';
import { Query, ID } from 'node-appwrite';
import { WhatsAppInstanceDocument, WhatsAppStatus, MessageDocument } from '@/types/appwrite';
import { getEmbeddedWhatsAppEngine } from '@/lib/whatsapp/embeddedEngine';
import { WhatsAppSyncService, sanitizeWhatsAppJid } from '@/lib/services/whatsappSyncService';
import { saveMediaBuffer } from '@/lib/utils/mediaStorage';
import { mockWhatsAppInstance } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_WHATSAPP = process.env.APPWRITE_COLLECTION_WHATSAPP || 'whatsapp_instances';
const COLLECTION_MESSAGES = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
const DEFAULT_INSTANCE_NAME = process.env.WHATSAPP_SESSION_NAME || 'servicezap_main';

/**
 * Obtém a instância de WhatsApp ativa no Appwrite sincronizada com o motor embutido
 */
export async function getWhatsAppInstanceAction(): Promise<Partial<WhatsAppInstanceDocument>> {
  try {
    const engine = getEmbeddedWhatsAppEngine();
    const engineStatus = engine.getStatus();

    if (!process.env.APPWRITE_API_KEY || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      return {
        ...mockWhatsAppInstance,
        status: engineStatus.status,
        phone: engineStatus.phone || mockWhatsAppInstance.phone,
      };
    }

    const { databases } = await createAdminClient();
    const response = await databases.listDocuments<WhatsAppInstanceDocument>(
      DATABASE_ID,
      COLLECTION_WHATSAPP,
      [Query.limit(1)]
    );

    if (response.documents.length === 0) {
      // Cria instância inicial padrão
      const newInst = await databases.createDocument<WhatsAppInstanceDocument>(
        DATABASE_ID,
        COLLECTION_WHATSAPP,
        ID.unique(),
        {
          tenantId: 'tenant_01',
          instanceName: DEFAULT_INSTANCE_NAME,
          instanceId: `inst_${DEFAULT_INSTANCE_NAME}`,
          status: engineStatus.status,
          phone: engineStatus.phone || '',
          updatedAt: new Date().toISOString(),
        }
      );
      return JSON.parse(JSON.stringify(newInst));
    }

    const currentDoc = response.documents[0];
    return {
      ...JSON.parse(JSON.stringify(currentDoc)),
      status: engineStatus.status !== 'disconnected' ? engineStatus.status : currentDoc.status,
      phone: engineStatus.phone || currentDoc.phone,
    };
  } catch (error) {
    console.warn('[WhatsAppAction] Fallback para mockWhatsAppInstance:', error);
    return mockWhatsAppInstance;
  }
}

/**
 * Solicita o Pairing Code nativo de 8 dígitos (Sem QR Code e sem Docker)
 */
export async function requestPairingCodeAction(phoneNumber: string): Promise<{
  success: boolean;
  pairingCode?: string;
  error?: string;
}> {
  try {
    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: 'Por favor, informe um número válido com DDD (ex: 5511999998888).' };
    }

    // Chama o motor nativo embutido
    const engine = getEmbeddedWhatsAppEngine();
    const pairingCode = await engine.requestPairingCode(cleanPhone);

    const instance = await getWhatsAppInstanceAction();

    // Registra o status de 'connecting' no Appwrite
    if (process.env.APPWRITE_API_KEY && instance.$id && instance.$id !== 'wa_01') {
      try {
        const { databases } = await createAdminClient();
        await databases.updateDocument(DATABASE_ID, COLLECTION_WHATSAPP, instance.$id, {
          status: 'connecting',
          phone: cleanPhone,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('[WhatsAppAction] Aviso ao salvar status no Appwrite:', dbErr);
      }
    }

    try {
      revalidatePath('/dashboard/whatsapp');
      revalidatePath('/dashboard');
    } catch {
      // no-op if outside request store
    }

    return {
      success: true,
      pairingCode,
    };
  } catch (error: any) {
    console.error('[WhatsAppAction] Erro ao solicitar Pairing Code nativo:', error);
    return {
      success: false,
      error: error.message || 'Falha ao solicitar código de pareamento no motor do WhatsApp.',
    };
  }
}

/**
 * Checa o estado da conexão do motor incorporado e sincroniza com o Appwrite
 */
export async function checkWhatsAppConnectionAction(): Promise<{
  status: WhatsAppStatus;
  instanceName: string;
  phone?: string;
}> {
  try {
    const engine = getEmbeddedWhatsAppEngine();
    const { status, phone } = engine.getStatus();

    const instance = await getWhatsAppInstanceAction();

    if (process.env.APPWRITE_API_KEY && instance.$id && instance.$id !== 'wa_01') {
      try {
        const { databases } = await createAdminClient();
        await databases.updateDocument(DATABASE_ID, COLLECTION_WHATSAPP, instance.$id, {
          status,
          phone: phone || instance.phone || '',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // ignora erro silencioso de sync
      }
    }

    revalidatePath('/dashboard/whatsapp');
    revalidatePath('/dashboard');

    return {
      status,
      instanceName: DEFAULT_INSTANCE_NAME,
      phone,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      instanceName: DEFAULT_INSTANCE_NAME,
    };
  }
}

/**
 * Envio direto de mensagem pela UI através do motor incorporado Baileys
 * 1. Grava 'pending' no Appwrite
 * 2. Envia via socket em memória
 * 3. Atualiza 'sent' com o WAMID real no Appwrite
 */
export async function sendWhatsAppMessageDirectAction(
  phoneNumber: string,
  content: string
): Promise<{
  success: boolean;
  messageDoc?: Partial<MessageDocument>;
  error?: string;
}> {
  try {
    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone) {
      return { success: false, error: 'Número de telefone inválido.' };
    }
    if (!content.trim()) {
      return { success: false, error: 'O conteúdo da mensagem não pode ser vazio.' };
    }

    let docId = `msg_${Date.now()}`;
    const initialWamid = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    WhatsAppSyncService.registerAppSentWamid(initialWamid);

    // 1. Persistência inicial no Appwrite (status: pending, origin: app_ui)
    if (process.env.APPWRITE_API_KEY) {
      try {
        const { databases } = await createAdminClient();
        const created = await databases.createDocument<MessageDocument>(
          DATABASE_ID,
          COLLECTION_MESSAGES,
          ID.unique(),
          {
            phone: cleanPhone,
            content: content.trim(),
            direction: 'outbound',
            status: 'pending',
            origin: 'app_ui',
            whatsapp_message_id: initialWamid,
            created_at: new Date().toISOString(),
            tenantId: 'tenant_01',
          }
        );
        docId = created.$id;
      } catch (dbErr) {
        console.warn('[WhatsAppAction] Não foi possível salvar mensagem pendente no Appwrite:', dbErr);
      }
    }

    // 2. Disparo direto pelo motor nativo Baileys em memória
    let realWamid = initialWamid;
    const engine = getEmbeddedWhatsAppEngine();

    try {
      const sendResult = await engine.sendTextMessage(cleanPhone, content.trim());
      if (sendResult?.wamid) {
        realWamid = sendResult.wamid;
        WhatsAppSyncService.registerAppSentWamid(realWamid);
      }
    } catch (engineErr: any) {
      console.warn('[WhatsAppAction] Erro no envio via motor embutido:', engineErr.message);
      // Se não conectado ou erro, falha a ação
      return {
        success: false,
        error: engineErr.message || 'WhatsApp não conectado.',
      };
    }

    // 3. Atualização no Appwrite com status 'sent' e WAMID real
    let finalDoc: Partial<MessageDocument> = {
      $id: docId,
      phone: cleanPhone,
      content: content.trim(),
      direction: 'outbound',
      status: 'sent',
      origin: 'app_ui',
      whatsapp_message_id: realWamid,
      created_at: new Date().toISOString(),
    };

    if (process.env.APPWRITE_API_KEY && docId.startsWith('msg_') === false) {
      try {
        const { databases } = await createAdminClient();
        const updated = await databases.updateDocument<MessageDocument>(
          DATABASE_ID,
          COLLECTION_MESSAGES,
          docId,
          {
            status: 'sent',
            whatsapp_message_id: realWamid,
          }
        );
        finalDoc = JSON.parse(JSON.stringify(updated));
      } catch (upErr) {
        console.warn('[WhatsAppAction] Erro ao atualizar status no Appwrite:', upErr);
      }
    }

    return {
      success: true,
      messageDoc: finalDoc,
    };
  } catch (error: any) {
    console.error('[WhatsAppAction] Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error.message || 'Falha ao processar envio de mensagem.',
    };
  }
}

/**
 * Envio de mídia (Imagem, Vídeo, Áudio ou Documento) via FormData e motor Baileys
 */
export async function sendWhatsAppMediaDirectAction(formData: FormData): Promise<{
  success: boolean;
  messageDoc?: Partial<MessageDocument>;
  error?: string;
}> {
  try {
    const phoneNumber = formData.get('phoneNumber') as string;
    const mediaType = formData.get('mediaType') as 'image' | 'video' | 'audio' | 'document';
    const caption = (formData.get('caption') as string) || '';
    const file = formData.get('file') as File;

    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone) {
      return { success: false, error: 'Número de telefone inválido.' };
    }
    if (!file) {
      return { success: false, error: 'Nenhum arquivo selecionado.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const mediaBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const fileName = file.name || 'arquivo';

    // Salvar mídia no diretório local e obter a URL (/api/media/...)
    const { mediaUrl } = await saveMediaBuffer(mediaBuffer, mimeType, fileName);

    let docId = `msg_${Date.now()}`;
    const initialWamid = `app_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Persistência inicial no Appwrite
    if (process.env.APPWRITE_API_KEY) {
      try {
        const { databases } = await createAdminClient();
        const created = await databases.createDocument<MessageDocument>(
          DATABASE_ID,
          COLLECTION_MESSAGES,
          ID.unique(),
          {
            phone: cleanPhone,
            content: caption,
            direction: 'outbound',
            status: 'pending',
            origin: 'app_ui',
            whatsapp_message_id: initialWamid,
            created_at: new Date().toISOString(),
            tenantId: 'tenant_01',
            mediaType,
            mediaUrl,
            mimeType,
            fileName,
          }
        );
        docId = created.$id;
      } catch (dbErr) {
        console.warn('[WhatsAppAction] Erro ao salvar mensagem com atributos de mídia no Appwrite, tentando modo reduzido:', dbErr);
        try {
          const { databases } = await createAdminClient();
          const fallbackTag = `[Mídia: ${mediaType}] ${mediaUrl}`;
          const fallbackContent = caption ? `${caption}\n${fallbackTag}` : fallbackTag;

          const createdFallback = await databases.createDocument<MessageDocument>(
            DATABASE_ID,
            COLLECTION_MESSAGES,
            ID.unique(),
            {
              phone: cleanPhone,
              content: fallbackContent,
              direction: 'outbound',
              status: 'pending',
              origin: 'app_ui',
              whatsapp_message_id: initialWamid,
              created_at: new Date().toISOString(),
              tenantId: 'tenant_01',
            }
          );
          docId = createdFallback.$id;
        } catch {
          // fallback silencioso se Appwrite falhar totalmente
        }
      }
    }

    // 2. Envio via motor nativo Baileys
    const engine = getEmbeddedWhatsAppEngine();
    let realWamid = initialWamid;
    try {
      const sendResult = await engine.sendMediaMessage({
        phoneNumber: cleanPhone,
        mediaBuffer,
        mediaType,
        caption,
        fileName,
        mimetype: mimeType,
      });
      if (sendResult?.wamid) {
        realWamid = sendResult.wamid;
      }
    } catch (engineErr: any) {
      console.warn('[WhatsAppAction] Erro no envio de mídia via motor embutido:', engineErr.message);
      return {
        success: false,
        error: engineErr.message || 'WhatsApp não conectado.',
      };
    }

    // 3. Atualizar no Appwrite com status 'sent' e WAMID real
    let finalDoc: Partial<MessageDocument> = {
      $id: docId,
      phone: cleanPhone,
      content: caption,
      direction: 'outbound',
      status: 'sent',
      origin: 'app_ui',
      whatsapp_message_id: realWamid,
      created_at: new Date().toISOString(),
      mediaType,
      mediaUrl,
      mimeType,
      fileName,
    };

    if (process.env.APPWRITE_API_KEY && docId.startsWith('msg_') === false) {
      try {
        const { databases } = await createAdminClient();
        const updated = await databases.updateDocument<MessageDocument>(
          DATABASE_ID,
          COLLECTION_MESSAGES,
          docId,
          {
            status: 'sent',
            whatsapp_message_id: realWamid,
          }
        );
        finalDoc = JSON.parse(JSON.stringify(updated));
      } catch (upErr) {
        console.warn('[WhatsAppAction] Erro ao atualizar status no Appwrite:', upErr);
      }
    }

    return {
      success: true,
      messageDoc: finalDoc,
    };
  } catch (error: any) {
    console.error('[WhatsAppAction] Erro ao enviar mídia:', error);
    return {
      success: false,
      error: error.message || 'Falha ao enviar arquivo de mídia.',
    };
  }
}

/**
 * Desconecta a sessão do WhatsApp no motor embutido
 */
export async function disconnectWhatsAppAction(): Promise<{ success: boolean }> {
  try {
    const engine = getEmbeddedWhatsAppEngine();
    await engine.logout();

    const instance = await getWhatsAppInstanceAction();
    if (process.env.APPWRITE_API_KEY && instance.$id && instance.$id !== 'wa_01') {
      try {
        const { databases } = await createAdminClient();
        await databases.updateDocument(DATABASE_ID, COLLECTION_WHATSAPP, instance.$id, {
          status: 'disconnected',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // ignora
      }
    }

    revalidatePath('/dashboard/whatsapp');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Busca histórico de mensagens de uma conversa com credenciais admin do Appwrite
 */
export async function getWhatsAppMessagesAction(
  phone?: string,
  limit = 100
): Promise<MessageDocument[]> {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      return [];
    }

    const { databases } = await createAdminClient();
    const queries = [
      Query.orderDesc('created_at'),
      Query.limit(limit),
    ];

    if (phone) {
      const cleanPhone = sanitizeWhatsAppJid(phone);
      const phoneVariants = [cleanPhone];

      if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
        phoneVariants.push(`${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}`);
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        phoneVariants.push(`${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}`);
      }

      queries.push(Query.equal('phone', phoneVariants));
    }

    const response = await databases.listDocuments<MessageDocument>(
      DATABASE_ID,
      COLLECTION_MESSAGES,
      queries
    );

    // Reverte para ordem cronológica ascendente (mais antigas em cima, mais novas embaixo)
    const docs = response.documents.reverse();
    return JSON.parse(JSON.stringify(docs));
  } catch (error) {
    console.error('[WhatsAppAction] Erro ao buscar mensagens via Server Action:', error);
    return [];
  }
}
