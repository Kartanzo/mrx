import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const status = req.nextUrl.searchParams.get('status') ?? '';
    const tipo = req.nextUrl.searchParams.get('tipo') ?? '';

    const conditions: string[] = [];
    const params: string[] = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`t.envolvido ILIKE $${params.length}`);
    }
    if (tipo) {
      params.push(tipo);
      conditions.push(`t.tipo_de_movimento = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT
         t.envolvido,
         COUNT(*)::int AS total_transacoes,
         SUM(CASE WHEN t.tipo_de_movimento = 'Receita' THEN t.valor ELSE 0 END)::numeric AS total_receita,
         SUM(CASE WHEN t.tipo_de_movimento = 'Despesa' THEN t.valor ELSE 0 END)::numeric AS total_despesa,
         SUM(CASE WHEN t.aprovado_em IS NOT NULL OR t.descricao_extra = 'Comprovante via Telegram' THEN 1 ELSE 0 END)::int AS aprovadas,
         SUM(CASE WHEN t.aprovado_em IS NULL AND (t.descricao_extra IS NULL OR t.descricao_extra != 'Comprovante via Telegram') THEN 1 ELSE 0 END)::int AS pendentes,
         MAX(t.data) AS ultima_data,
         SUM(CASE WHEN t.comprovante IS NOT NULL THEN 1 ELSE 0 END)::int AS total_anexos
       FROM mrx.transacoes t
       ${where}
       GROUP BY t.envolvido
       ${status === 'pendente' ? "HAVING SUM(CASE WHEN t.aprovado_em IS NULL AND (t.descricao_extra IS NULL OR t.descricao_extra != 'Comprovante via Telegram') THEN 1 ELSE 0 END) > 0" : ''}
       ${status === 'aprovado' ? "HAVING SUM(CASE WHEN t.aprovado_em IS NULL AND (t.descricao_extra IS NULL OR t.descricao_extra != 'Comprovante via Telegram') THEN 1 ELSE 0 END) = 0" : ''}
       ORDER BY MAX(t.data) DESC
       LIMIT 100`,
      params
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/transacoes/envolvidos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
