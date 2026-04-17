import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

const STORAGE_DIR = process.env.STORAGE_PATH || path.join(/* turbopackIgnore: true */ process.cwd(), 'storage', 'anexos');

// Garante que o diretório existe
if (!existsSync(STORAGE_DIR)) {
  mkdirSync(STORAGE_DIR, { recursive: true });
}

/** Gera nome seguro para o filesystem a partir do file_id do Telegram */
function safeFileName(fileId: string): string {
  return createHash('sha256').update(fileId).digest('hex').slice(0, 32);
}

/** Verifica se o arquivo já está em cache local */
export function getCachedFile(fileId: string): { buffer: Buffer; contentType: string } | null {
  const hash = safeFileName(fileId);
  // Busca qualquer arquivo que comece com o hash
  const files = readdirSync(STORAGE_DIR).filter(f => f.startsWith(hash));
  if (files.length === 0) return null;

  const filePath = path.join(STORAGE_DIR, files[0]);
  const ext = path.extname(files[0]).slice(1);
  const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

  return { buffer: readFileSync(filePath), contentType };
}

/** Salva arquivo no cache local */
export function saveToCache(fileId: string, buffer: Buffer, ext: string): string {
  const hash = safeFileName(fileId);
  const fileName = `${hash}.${ext}`;
  const filePath = path.join(STORAGE_DIR, fileName);
  writeFileSync(filePath, buffer);
  return filePath;
}

/** Salva um base64 data URL como arquivo no cache */
export function saveBase64ToCache(fileId: string, dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const ext = Object.entries(MIME_MAP).find(([, v]) => v === mimeType)?.[0] ?? 'bin';
  const buffer = Buffer.from(match[2], 'base64');
  return saveToCache(fileId, buffer, ext);
}

/** Retorna a URL local para servir o arquivo */
export function getCacheUrl(fileId: string): string {
  return `/api/telegram/file/${encodeURIComponent(fileId)}`;
}

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  bin: 'application/octet-stream',
};
