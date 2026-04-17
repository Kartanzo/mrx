import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const periodo = req.nextUrl.searchParams.get('periodo') ?? 'semana'; // semana | hoje | atrasados | todos
    const status = req.nextUrl.searchParams.get('status') ?? '';
    const q = req.nextUrl.searchParams.get('q') ?? '';

    const conditions: string[] = [];
    const params: string[] = [];

    if (periodo === 'hoje') {
      conditions.push("DATE(m.data_vencimento) = CURRENT_DATE");
    } else if (periodo === 'semana') {
      conditions.push("m.data_vencimento >= CURRENT_DATE AND m.data_vencimento < CURRENT_DATE + INTERVAL '7 days'");
    } else if (periodo === 'atrasados') {
      conditions.push("m.data_vencimento < CURRENT_DATE AND m.status = 'pendente'");
    }

    if (status) {
      params.push(status);
      conditions.push(`m.status = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(m.cliente ILIKE $${params.length} OR m.placa ILIKE $${params.length})`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT m.*,
              CASE
                WHEN m.data_vencimento < CURRENT_DATE AND m.status = 'pendente' THEN 'atrasado'
                WHEN DATE(m.data_vencimento) = CURRENT_DATE THEN 'hoje'
                ELSE 'futuro'
              END AS urgencia
       FROM mrx.mensalidades m
       ${where}
       ORDER BY m.data_vencimento ASC`,
      params
    );

    // Stats
    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE data_vencimento >= CURRENT_DATE AND data_vencimento < CURRENT_DATE + INTERVAL '7 days')::int AS semana,
        COUNT(*) FILTER (WHERE DATE(data_vencimento) = CURRENT_DATE)::int AS hoje,
        COUNT(*) FILTER (WHERE data_vencimento < CURRENT_DATE AND status = 'pendente')::int AS atrasados,
        COUNT(*) FILTER (WHERE status = 'pendente')::int AS pendentes,
        COUNT(*) FILTER (WHERE status = 'pago')::int AS pagos,
        COALESCE(SUM(valor) FILTER (WHERE data_vencimento >= CURRENT_DATE AND data_vencimento < CURRENT_DATE + INTERVAL '7 days' AND status = 'pendente'), 0)::numeric AS valor_semana,
        COALESCE(SUM(valor) FILTER (WHERE data_vencimento < CURRENT_DATE AND status = 'pendente'), 0)::numeric AS valor_atrasado
      FROM mrx.mensalidades
    `);

    return NextResponse.json({ data: rows, stats: stats[0] });
  } catch (err) {
    console.error('[GET /api/vencimentos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
