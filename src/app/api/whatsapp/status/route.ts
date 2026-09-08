import { NextResponse } from 'next/server';
import { getEmbeddedWhatsAppEngine } from '@/lib/whatsapp/embeddedEngine';
import { getWhatsAppInstanceAction } from '@/app/actions/whatsapp';

export async function GET() {
  try {
    const engine = getEmbeddedWhatsAppEngine();
    const status = engine.getStatus();
    const instance = await getWhatsAppInstanceAction();

    return NextResponse.json({
      success: true,
      engine: {
        status: status.status,
        phone: status.phone,
      },
      instance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao obter status' },
      { status: 500 }
    );
  }
}
