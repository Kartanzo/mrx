import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id_cliente: string }> }) {
  try {
    const { id_cliente } = await params;
    const { rows } = await pool.query(
      `SELECT * FROM mrx.alugueis WHERE id_cliente = $1 ORDER BY data_inicio DESC LIMIT 1`,
      [id_cliente]
    );
    if (!rows.length) return NextResponse.json({ error: 'Nenhum aluguel encontrado' }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[GET /api/clientes/[id]/aluguel]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
