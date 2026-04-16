import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // 1. Obter o file_path no Telegram
    const meta = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
    const metaJson = await meta.json();
    if (!metaJson.ok) {
      return NextResponse.json({ error: 'Arquivo não encontrado no Telegram' }, { status: 404 });
    }

    const filePath: string = metaJson.result.file_path;

    // 2. Baixar o arquivo
    const fileRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 502 });
    }

    const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await fileRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('[GET /api/telegram/file]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
