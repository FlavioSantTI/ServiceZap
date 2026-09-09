import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddedWhatsAppEngine } from '@/lib/whatsapp/embeddedEngine';
import { saveMediaBuffer } from '@/lib/utils/mediaStorage';
import { sanitizeWhatsAppJid } from '@/lib/utils/whatsappUtils';
import { getTenantId } from '@/lib/utils/getTenantId';
import { createAdminClient } from '@/lib/appwrite/server';
import { ID } from 'node-appwrite';
import { MessageDocument } from '@/types/appwrite';
import { WhatsAppSyncService } from '@/lib/services/whatsappSyncService';
import { convertToWhatsAppPttOgg } from '@/lib/utils/audioConverter';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_MESSAGES = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

export const dynamic = 'force-dynamic';
// Permitir execuções de upload sem timeout prematuro (até 5 minutos para vídeos grandes/longos)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const formData = await req.formData();
    const phoneNumber = formData.get('phoneNumber') as string;
    const mediaType = formData.get('mediaType') as 'image' | 'video' | 'audio' | 'document';
    const caption = (formData.get('caption') as string) || '';
    const file = formData.get('file') as File;

    const cleanPhone = sanitizeWhatsAppJid(phoneNumber);
    if (!cleanPhone) {
      return NextResponse.json({ success: false, error: 'Número de telefone inválido.' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let mediaBuffer: Buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type || 'application/octet-stream';
    let fileName = file.name || 'arquivo';

    // Se for áudio gravado ou enviado, converte para OGG Opus mono 48kHz (padrão 100% compatível com WhatsApp Voice Notes)
    if (mediaType === 'audio') {
      try {
        const converted = await convertToWhatsAppPttOgg(mediaBuffer);
        mediaBuffer = converted.buffer;
        mimeType = converted.mimeType;
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.ogg';
      } catch (audioConvErr) {
        console.warn('[Route:send-media] Fallback na conversão do áudio:', audioConvErr);
      }
    }

    // 1. Salva mídia localmente de forma resiliente
    const { mediaUrl } = await saveMediaBuffer(mediaBuffer, mimeType, fileName);

    let docId = `msg_${Date.now()}`;
    const initialWamid = `app_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    WhatsAppSyncService.registerAppSentWamid(initialWamid);

    // 2. Cria registro inicial no Appwrite
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
            tenantId,
            mediaType,
            mediaUrl,
            mimeType,
            fileName,
          }
        );
        docId = created.$id;
      } catch (dbErr) {
        console.warn('[Route:send-media] Aviso ao salvar documento no Appwrite (tentando fallback):', dbErr);
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
              tenantId,
            }
          );
          docId = createdFallback.$id;
        } catch {
          // ignora falha no Appwrite para não impedir envio
        }
      }
    }

    // 3. Dispara via Baileys motor nativo do tenant
    const engine = getEmbeddedWhatsAppEngine(tenantId);
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
        WhatsAppSyncService.registerAppSentWamid(realWamid);
      }
    } catch (engineErr: any) {
      console.error('[Route:send-media] Erro ao enviar mídia via Baileys:', engineErr);
      return NextResponse.json(
        {
          success: false,
          error: engineErr.message || 'WhatsApp não conectado.',
        },
        { status: 500 }
      );
    }

    // 4. Atualiza no Appwrite com status 'sent' e WAMID real
    let finalDoc: Partial<MessageDocument> = {
      $id: docId,
      phone: cleanPhone,
      content: caption,
      direction: 'outbound',
      status: 'sent',
      origin: 'app_ui',
      whatsapp_message_id: realWamid,
      created_at: new Date().toISOString(),
      tenantId,
      mediaType,
      mediaUrl,
      mimeType,
      fileName,
    };

    if (process.env.APPWRITE_API_KEY && !docId.startsWith('msg_')) {
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
        console.warn('[Route:send-media] Erro ao atualizar status no Appwrite:', upErr);
      }
    }

    return NextResponse.json({
      success: true,
      messageDoc: finalDoc,
    });
  } catch (err: any) {
    console.error('[Route:send-media] Erro geral no processamento de mídia:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Falha interna ao processar mídia.',
      },
      { status: 500 }
    );
  }
}
