import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                                        AS total,
        COUNT(DISTINCT envolvido)::int                                       AS total_envolvidos,
        SUM(CASE WHEN tipo_de_movimento = 'Receita' THEN valor::numeric ELSE 0 END) AS total_receita,
        ABS(SUM(CASE WHEN tipo_de_movimento = 'Despesa' THEN valor::numeric ELSE 0 END)) AS total_despesa,
        COUNT(CASE WHEN aprovado = 'true' THEN 1 END)::int                  AS aprovadas,
        COUNT(CASE WHEN aprovado != 'true' OR aprovado IS NULL THEN 1 END)::int AS pendentes
      FROM mrx.transacoes
    `);
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[GET /api/transacoes/stats]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
