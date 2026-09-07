import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/utils/mediaStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('ID de mídia inválido', { status: 400 });
    }

    const media = getMediaFile(id);
    if (!media) {
      return new NextResponse('Arquivo de mídia não encontrado', { status: 404 });
    }

    return new NextResponse(new Uint8Array(media.buffer), {
      status: 200,
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': media.buffer.length.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('[MediaRoute] Erro ao servir mídia:', error);
    return new NextResponse('Erro interno ao carregar mídia', { status: 500 });
  }
}
