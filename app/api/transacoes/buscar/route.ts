import { NextRequest, NextResponse } from 'next/server';
import { buscarEnvolvidos, transacoesPorEnvolvido, buscarExata } from '@/lib/db/transacoes';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? '';
    if (!q || q.length < 2) return NextResponse.json({ data: [] });
    const data = await buscarEnvolvidos(q);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/transacoes/buscar]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Modo 1 — busca exata: envolvido + data + valor
    if (body.envolvido && body.data && body.valor) {
      const row = await buscarExata(body.envolvido, body.data, body.valor);
      return NextResponse.json({ data: row });
    }

    // Modo 2 — todas as transações do envolvido
    if (body.envolvido) {
      const rows = await transacoesPorEnvolvido(body.envolvido);
      return NextResponse.json({ data: rows });
    }

    return NextResponse.json({ error: 'Parâmetros insuficientes' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/transacoes/buscar]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
