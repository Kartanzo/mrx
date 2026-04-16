import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const meses = parseInt(searchParams.get('meses') ?? '6');

  const [mensal, status, tipos] = await Promise.all([
    // Receita vs Despesa por mês
    pool.query(`
      SELECT
        TO_CHAR(data, 'YYYY-MM') AS mes,
        TO_CHAR(data, 'Mon/YY') AS mes_label,
        SUM(CASE WHEN tipo_de_movimento = 'Receita' THEN valor ELSE 0 END) AS receita,
        SUM(CASE WHEN tipo_de_movimento = 'Despesa' THEN valor ELSE 0 END) AS despesa,
        COUNT(*) AS total
      FROM mrx.transacoes
      WHERE data >= NOW() - INTERVAL '${meses} months'
      GROUP BY TO_CHAR(data, 'YYYY-MM'), TO_CHAR(data, 'Mon/YY')
      ORDER BY mes ASC
    `),

    // Status de pagamento
    pool.query(`
      SELECT
        COALESCE(ts.status_pagamento, 'em_aberto') AS status,
        COUNT(*) AS total
      FROM mrx.transacoes t
      LEFT JOIN mrx.transacoes_status ts ON ts.id = t.id
      GROUP BY COALESCE(ts.status_pagamento, 'em_aberto')
    `),

    // Top 5 envolvidos por valor
    pool.query(`
      SELECT
        envolvido,
        SUM(valor) AS total,
        COUNT(*) AS qtd,
        tipo_de_movimento
      FROM mrx.transacoes
      WHERE tipo_de_movimento IS NOT NULL
      GROUP BY envolvido, tipo_de_movimento
      ORDER BY total DESC
      LIMIT 10
    `),
  ]);

  return NextResponse.json({
    mensal: mensal.rows,
    status: status.rows,
    topEnvolvidos: tipos.rows,
  });
}
