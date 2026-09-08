import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/utils/mediaStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_\-\.]+$/.test(id)) {
      return new NextResponse('ID de mídia inválido', { status: 400 });
    }

    const media = getMediaFile(id);
    if (!media) {
      return new NextResponse('Arquivo de mídia não encontrado', { status: 404 });
    }

    const rangeHeader = request.headers.get('range');
    const totalSize = media.buffer.length;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      const chunk = media.buffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          'Content-Type': media.mimeType,
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Content-Length': chunk.length.toString(),
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `inline; filename="${encodeURIComponent(media.fileName)}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    return new NextResponse(new Uint8Array(media.buffer), {
      status: 200,
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': totalSize.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[MediaRoute] Erro ao servir mídia:', error);
    return new NextResponse('Erro interno ao carregar mídia', { status: 500 });
  }
}
