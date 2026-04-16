import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file_id');

  if (!fileId) {
    return NextResponse.json({ error: 'file_id obrigatório' }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN não configurado' }, { status: 503 });
  }

  // 1. Obtém o file_path do Telegram
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  if (!infoRes.ok) {
    return NextResponse.json({ error: 'Erro ao buscar arquivo no Telegram' }, { status: 502 });
  }
  const info = await infoRes.json();
  if (!info.ok || !info.result?.file_path) {
    return NextResponse.json({ error: 'Arquivo não encontrado no Telegram' }, { status: 404 });
  }

  const filePath: string = info.result.file_path;
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';

  // 2. Baixa o arquivo
  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!fileRes.ok) {
    return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 502 });
  }

  // 3. Determina content-type
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const contentType = mimeMap[ext] ?? 'application/octet-stream';

  const buffer = await fileRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="comprovante.${ext}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
