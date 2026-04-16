import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chave   = searchParams.get('chave')  ?? '';  // chave exata: id_cliente_placa_yyyyddmm_valor
  const sufixo  = searchParams.get('sufixo') ?? '';  // fallback: _%_yyyyddmm_valor (sem id_cliente)
  const placa   = searchParams.get('placa')  ?? '';  // fallback legado: busca por placa no id_cliente

  if (!chave && !sufixo && !placa) {
    return NextResponse.json({ rows: [] });
  }

  let result;
  if (chave) {
    result = await pool.query(
      'SELECT * FROM mrx.anexos WHERE id_cliente = $1 ORDER BY data_hora DESC',
      [chave]
    );
  } else if (sufixo) {
    // sufixo = "_yyyyddmm_valor", ex: "_20261504_1000_00"
    result = await pool.query(
      "SELECT * FROM mrx.anexos WHERE id_cliente LIKE $1 ORDER BY data_hora DESC LIMIT 10",
      [`%${sufixo}`]
    );
  } else {
    result = await pool.query(
      "SELECT * FROM mrx.anexos WHERE id_cliente ILIKE $1 ORDER BY data_hora DESC LIMIT 20",
      [`%_${placa}_%`]
    );
  }

  return NextResponse.json({ rows: result.rows });
}
