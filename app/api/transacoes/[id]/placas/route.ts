import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Busca o envolvido da transação
    const txRes = await pool.query(
      `SELECT envolvido FROM mrx.transacoes WHERE id = $1`,
      [id]
    );
    if (!txRes.rows[0]) return NextResponse.json({ data: [] });

    const envolvido: string = txRes.rows[0].envolvido;

    // Extrai só o nome (remove CPF/números do início: "33.586.510 Daniel..." → "Daniel...")
    const nome = envolvido.replace(/^[\d.\s-]+/, '').trim();

    // Busca placas históricas no alugueis pelo nome do cliente
    const { rows } = await pool.query(
      `SELECT DISTINCT id_veiculo
       FROM mrx.alugueis
       WHERE cliente_escolhido ILIKE $1
         AND id_veiculo IS NOT NULL
         AND id_veiculo <> ''
       ORDER BY id_veiculo`,
      [`%${nome}%`]
    );

    return NextResponse.json({ data: rows.map(r => r.id_veiculo as string) });
  } catch (err) {
    console.error('[GET /api/transacoes/[id]/placas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
