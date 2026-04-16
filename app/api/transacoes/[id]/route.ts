import { NextRequest, NextResponse } from 'next/server';
import { transacaoPorId, atualizarTransacao } from '@/lib/db/transacoes';
import { anexosPorChave, anexosPorClienteValor } from '@/lib/db/anexos';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = await transacaoPorId(id);
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // Busca anexo vinculado
    let anexos = row.chave_matching
      ? await anexosPorChave(row.chave_matching)
      : [];

    // Fallback: busca por envolvido + valor
    if (!anexos.length && row.envolvido) {
      anexos = await anexosPorClienteValor(row.envolvido, row.valor);
    }

    return NextResponse.json({ data: row, anexos });
  } catch (err) {
    console.error('[GET /api/transacoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await atualizarTransacao(id, {
      descricao_extra: body.descricao_extra,
      placa: body.placa,
      aprovado: body.aprovado,
      comprovante: body.comprovante,
    });

    if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PUT /api/transacoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
