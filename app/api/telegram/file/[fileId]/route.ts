import { NextRequest, NextResponse } from 'next/server';
import { getCachedFile, saveToCache } from '@/lib/storage';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const force = _req.nextUrl.searchParams.get('force') === '1';

    // 1. Verifica cache local (pula se force=1)
    const cached = !force ? getCachedFile(fileId) : null;
    if (cached) {
      return new NextResponse(cached.buffer, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Cache': 'HIT',
        },
      });
    }

    // 2. Sem cache — baixa do Telegram
    if (!TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN não configurado' },
        { status: 503 }
      );
    }

    const meta = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
    const metaJson = await meta.json();
    if (!metaJson.ok) {
      return NextResponse.json({ error: 'Arquivo não encontrado no Telegram' }, { status: 404 });
    }

    const filePath: string = metaJson.result.file_path;
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'bin';

    const fileRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 502 });
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // 3. Salva no cache local (não bloqueia a resposta)
    saveToCache(fileId, buffer, ext);

    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const contentType = mimeMap[ext] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[GET /api/telegram/file]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
