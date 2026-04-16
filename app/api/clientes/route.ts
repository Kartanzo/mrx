import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (q.length < 2) return NextResponse.json({ rows: [] });

  const result = await pool.query(
    `SELECT id_cliente, nome, cpf, telefone, whatsapp
     FROM mrx.clientes
     WHERE nome ILIKE $1 OR id_cliente ILIKE $1 OR cpf ILIKE $1
     ORDER BY nome ASC
     LIMIT 15`,
    [`%${q}%`]
  );

  return NextResponse.json({ rows: result.rows });
}
