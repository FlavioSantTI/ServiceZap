import fs from 'fs';
import path from 'path';

const MEDIA_DIR = path.resolve(process.cwd(), '.media_storage');

/**
 * Garante a existência do diretório de armazenamento de mídias
 */
function ensureMediaDir(): string {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
  return MEDIA_DIR;
}

/**
 * Salva um buffer de mídia em disco e retorna a URL curta local (/api/media/...)
 */
export async function saveMediaBuffer(
  buffer: Buffer,
  mimeType: string,
  originalFileName?: string
): Promise<{ fileId: string; mediaUrl: string }> {
  const dir = ensureMediaDir();
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/3gpp': '.3gp',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a',
    'audio/mpeg': '.mp3',
    'audio/aac': '.aac',
    'application/pdf': '.pdf',
  };

  const ext = extMap[mimeType.split(';')[0]] || path.extname(originalFileName || '') || '.bin';
  const fileId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(dir, fileId);
  const metaPath = path.join(dir, `${fileId}.json`);

  fs.writeFileSync(filePath, buffer);
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      mimeType,
      fileName: originalFileName || fileId,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    })
  );

  return {
    fileId,
    mediaUrl: `/api/media/${fileId}`,
  };
}

/**
 * Recupera um arquivo de mídia e seus metadados do disco
 */
export function getMediaFile(fileId: string): {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
} | null {
  const dir = ensureMediaDir();
  const filePath = path.join(dir, fileId);
  const metaPath = path.join(dir, `${fileId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  let mimeType = 'application/octet-stream';
  let fileName = fileId;

  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.mimeType) mimeType = meta.mimeType;
      if (meta.fileName) fileName = meta.fileName;
    } catch {
      // fallback
    }
  }

  return {
    buffer,
    mimeType,
    fileName,
  };
}
