import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppSyncService, WebhookMessageUpsertPayload } from '@/lib/services/whatsappSyncService';

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

      const content =
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
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
