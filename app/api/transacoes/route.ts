import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '50'));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const tipo = searchParams.get('tipo') ?? '';
  const placa = searchParams.get('placa') ?? '';
  const dataInicio = searchParams.get('data_inicio') ?? '';
  const dataFim = searchParams.get('data_fim') ?? '';
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(t.descricao ILIKE $${params.length} OR t.envolvido ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`COALESCE(ts.status_pagamento, 'em_aberto') = $${params.length}`);
  }
  if (tipo) {
    params.push(tipo);
    conditions.push(`t.tipo_de_movimento = $${params.length}`);
  }
  if (placa) {
    params.push(`%${placa}%`);
    conditions.push(`t.chave_matching ILIKE $${params.length}`);
  }
  if (dataInicio) {
    params.push(dataInicio);
    conditions.push(`t.data >= $${params.length}::date`);
  }
  if (dataFim) {
    params.push(dataFim);
    conditions.push(`t.data <= ($${params.length}::date + INTERVAL '1 day')`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const dataParams = [...params, limit, offset];
  const countParams = [...params];

  const dataQuery = `
    SELECT
      t.id, t.data, t.descricao, t.valor, t.tipo_de_movimento,
      t.envolvido, t.data_processamento, t.descricao_extra, t.chave_matching,
      COALESCE(ts.status_pagamento, 'em_aberto') AS status_pagamento,
      ts.aprovado_por, ts.aprovado_em, ts.observacao,
      ts.id_cliente, ts.nome_cliente
    FROM mrx.transacoes t
    LEFT JOIN mrx.transacoes_status ts ON ts.id = t.id
    ${where}
    ORDER BY t.data DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const countQuery = `
    SELECT COUNT(*) FROM mrx.transacoes t
    LEFT JOIN mrx.transacoes_status ts ON ts.id = t.id
    ${where}
  `;

  const [data, count] = await Promise.all([
    pool.query(dataQuery, dataParams),
    pool.query(countQuery, countParams),
  ]);

  return NextResponse.json({
    rows: data.rows,
    total: parseInt(count.rows[0].count),
    page,
    limit,
  });
}
