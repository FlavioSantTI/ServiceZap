import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

function getFfmpegBinaryPath(): string | null {
  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';
  const archPlatform = `${process.platform}-${process.arch}`;

  const candidates = [
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', archPlatform, binaryName),
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'win32-x64', binaryName),
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'node_modules', '@ffmpeg-installer', archPlatform, binaryName),
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'node_modules', '@ffmpeg-installer', 'win32-x64', binaryName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const ffmpegBinaryPath: string | null = getFfmpegBinaryPath();

/**
 * Converte qualquer buffer de áudio (WebM, WAV, MP3, M4A, etc.)
 * para OGG Opus Mono 48kHz (o formato padrão e oficial exigido pelo WhatsApp para notas de voz PTT)
 */
export async function convertToWhatsAppPttOgg(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; mimeType: string; isConverted: boolean }> {
  // Se não temos o binário do ffmpeg, retorna o buffer original como fallback seguro
  if (!ffmpegBinaryPath) {
    console.warn('[AudioConverter] FFmpeg não encontrado. Usando buffer de áudio original.');
    return {
      buffer: inputBuffer,
      mimeType: 'audio/ogg; codecs=opus',
      isConverted: false,
    };
  }

  const tempDir = os.tmpdir();
  const uniqueId = `wa_audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const inputFilePath = path.join(tempDir, `${uniqueId}_in.bin`);
  const outputFilePath = path.join(tempDir, `${uniqueId}_out.ogg`);

  try {
    // 1. Grava buffer de entrada temporário em disco
    await fs.promises.writeFile(inputFilePath, inputBuffer);

    // 2. Executa FFmpeg com flags otimizadas para WhatsApp Voice Notes (PTT):
    // -vn: sem vídeo
    // -c:a libopus: codec Opus
    // -b:a 32k: bitrate ideal para voz clara e arquivo leve
    // -ar 48000: sample rate padrão do Opus
    // -ac 1: mono (obrigatório para WhatsApp PTT)
    // -avoid_negative_ts make_zero: sincroniza timestamps evitando cortes no player
    // -f ogg: container Ogg
    await new Promise<void>((resolve, reject) => {
      const args = [
        '-y',
        '-i',
        inputFilePath,
        '-vn',
        '-c:a',
        'libopus',
        '-b:a',
        '32k',
        '-ar',
        '48000',
        '-ac',
        '1',
        '-avoid_negative_ts',
        'make_zero',
        '-f',
        'ogg',
        outputFilePath,
      ];

      const ffmpegProcess = spawn(ffmpegBinaryPath!, args);
      let stderrData = '';

      ffmpegProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputFilePath)) {
          resolve();
        } else {
          reject(new Error(`FFmpeg falhou com código ${code}: ${stderrData.slice(-300)}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        reject(err);
      });
    });

    // 3. Lê o arquivo OGG Opus gerado
    const convertedBuffer = await fs.promises.readFile(outputFilePath);

    console.log(
      `🎙️ [AudioConverter] Áudio convertido com sucesso para WhatsApp OGG Opus! Original: ${inputBuffer.length} bytes -> OGG: ${convertedBuffer.length} bytes`
    );

    return {
      buffer: convertedBuffer,
      mimeType: 'audio/ogg; codecs=opus',
      isConverted: true,
    };
  } catch (err: any) {
    console.warn('[AudioConverter] Aviso na conversão FFmpeg, mantendo buffer original:', err?.message || err);
    return {
      buffer: inputBuffer,
      mimeType: 'audio/ogg; codecs=opus',
      isConverted: false,
    };
  } finally {
    // 4. Limpeza imediata dos arquivos temporários
    try {
      if (fs.existsSync(inputFilePath)) await fs.promises.unlink(inputFilePath);
    } catch {}
    try {
      if (fs.existsSync(outputFilePath)) await fs.promises.unlink(outputFilePath);
    } catch {}
  }
}

/**
 * Extrai um thumbnail em formato JPEG de um buffer de vídeo usando FFmpeg
 */
export async function generateVideoThumbnail(
  videoBuffer: Buffer
): Promise<Buffer | undefined> {
  if (!ffmpegBinaryPath) return undefined;

  const tempDir = os.tmpdir();
  const uniqueId = `wa_thumb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const inputFilePath = path.join(tempDir, `${uniqueId}_vid.mp4`);
  const outputFilePath = path.join(tempDir, `${uniqueId}_thumb.jpg`);

  try {
    await fs.promises.writeFile(inputFilePath, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-y',
        '-ss', '00:00:01',
        '-i', inputFilePath,
        '-vframes', '1',
        '-f', 'image2',
        '-vf', 'scale=120:-1',
        '-q:v', '5',
        outputFilePath,
      ];

      const ffmpegProcess = spawn(ffmpegBinaryPath!, args);
      ffmpegProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputFilePath)) {
          resolve();
        } else {
          // Fallback tentando em 00:00:00 se o vídeo tiver menos de 1 segundo
          const fallbackArgs = [
            '-y',
            '-ss', '00:00:00',
            '-i', inputFilePath,
            '-vframes', '1',
            '-f', 'image2',
            '-vf', 'scale=120:-1',
            '-q:v', '5',
            outputFilePath,
          ];
          const fbProcess = spawn(ffmpegBinaryPath!, fallbackArgs);
          fbProcess.on('close', (fbCode) => {
            if (fbCode === 0 && fs.existsSync(outputFilePath)) {
              resolve();
            } else {
              reject(new Error(`FFmpeg thumbnail falhou com código ${fbCode}`));
            }
          });
          fbProcess.on('error', reject);
        }
      });
      ffmpegProcess.on('error', reject);
    });

    const thumbBuffer = await fs.promises.readFile(outputFilePath);
    console.log(`🎬 [VideoThumb] Thumbnail gerado com sucesso: ${thumbBuffer.length} bytes`);
    return thumbBuffer;
  } catch (err: any) {
    console.warn('[VideoThumb] Não foi possível gerar thumbnail do vídeo:', err?.message || err);
    return undefined;
  } finally {
    try {
      if (fs.existsSync(inputFilePath)) await fs.promises.unlink(inputFilePath);
    } catch {}
    try {
      if (fs.existsSync(outputFilePath)) await fs.promises.unlink(outputFilePath);
    } catch {}
  }
}
