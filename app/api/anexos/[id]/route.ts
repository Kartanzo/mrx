import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT id_anexo, id_cliente, data_hora, valor FROM mrx.anexos WHERE id_anexo = $1`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[GET /api/anexos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
