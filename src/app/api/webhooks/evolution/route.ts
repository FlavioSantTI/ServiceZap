import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppSyncService, WebhookMessageUpsertPayload } from '@/lib/services/whatsappSyncService';
import { saveMediaBuffer } from '@/lib/utils/mediaStorage';

/**
 * Endpoint de fallback/integração para receber eventos MESSAGES_UPSERT da Evolution API
 * ou payloads intermediados e normalizados pelo n8n.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Caso o payload já venha limpo pelo n8n
    if (body.wamid && typeof body.fromMe === 'boolean') {
      const payload = body as WebhookMessageUpsertPayload;

      if (!payload.fromMe) {
        const doc = await WhatsAppSyncService.createInboundMessage(payload);
        return NextResponse.json({ success: true, action: 'inbound_created', docId: doc.$id });
      } else {
        const result = await WhatsAppSyncService.handleOutboundEcho(payload);
        return NextResponse.json({ success: true, action: result.action, docId: result.document.$id });
      }
    }

    // Caso o payload venha no formato bruto da Evolution API (MESSAGES_UPSERT)
    if (body.event === 'messages.upsert' && body.data) {
      const messageData = body.data;
      const key = messageData.key || {};
      const message = messageData.message || {};

      const wamid = key.id || '';
      const fromMe = Boolean(key.fromMe);
      const rawJid = key.remoteJid || '';

      // Identificação e extração de Mídia
      let mediaType: 'image' | 'video' | 'audio' | 'document' | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let mediaUrl: string | undefined = undefined;

      const imgMsg = message.imageMessage;
      const vidMsg = message.videoMessage || message.ptvMessage;
      const audMsg = message.audioMessage;
      const docMsg = message.documentMessage;
      const stickerMsg = message.stickerMessage;

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

      // Se a Evolution enviou base64 diretamente
      const base64Data =
        messageData.base64 ||
        message.base64 ||
        imgMsg?.base64 ||
        vidMsg?.base64 ||
        audMsg?.base64 ||
        docMsg?.base64;

      if (base64Data && mediaType) {
        try {
          const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
          const buffer = Buffer.from(cleanBase64, 'base64');
          if (buffer.length > 0) {
            const saved = await saveMediaBuffer(buffer, mimeType || 'application/octet-stream', fileName);
            mediaUrl = saved.mediaUrl;
            console.log(`📸 [EvolutionWebhook] Mídia base64 salva com sucesso: ${mediaUrl}`);
          }
        } catch (mediaErr) {
          console.warn('[EvolutionWebhook] Erro ao salvar buffer base64 da mídia:', mediaErr);
        }
      }

      const content =
        message.conversation ||
        message.extendedTextMessage?.text ||
        imgMsg?.caption ||
        vidMsg?.caption ||
        docMsg?.caption ||
        '';

      const timestamp = messageData.messageTimestamp
        ? new Date(Number(messageData.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const normalizedPayload: WebhookMessageUpsertPayload = {
        wamid,
        fromMe,
        phone: rawJid,
        content,
        timestamp,
        tenantId: body.instance || 'default',
        mediaType,
        mediaUrl,
        mimeType,
        fileName,
      };

      if (!fromMe) {
        const doc = await WhatsAppSyncService.createInboundMessage(normalizedPayload);
        return NextResponse.json({ success: true, action: 'inbound_created', docId: doc.$id });
      } else {
        const result = await WhatsAppSyncService.handleOutboundEcho(normalizedPayload);
        return NextResponse.json({ success: true, action: result.action, docId: result.document.$id });
      }
    }

    return NextResponse.json({ message: 'Event ignored or format unrecognized' }, { status: 200 });
  } catch (error: any) {
    console.error('[EvolutionWebhookRouter] Erro ao processar webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
