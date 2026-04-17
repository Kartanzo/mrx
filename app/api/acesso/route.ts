import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const tipo = req.nextUrl.searchParams.get('tipo') ?? '';

    const conditions: string[] = [];
    const params: string[] = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(a.nome_cadastrado ILIKE $${params.length} OR a.nome_telegram ILIKE $${params.length} OR a.id ILIKE $${params.length} OR a.placa ILIKE $${params.length})`);
    }
    if (tipo) {
      params.push(tipo);
      conditions.push(`a.tipo = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT * FROM mrx.acesso a ${where} ORDER BY a.data_criacao DESC`,
      params
    );
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/acesso]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_cliente, nome_cadastrado, nome_telegram, id, tipo, administrador, placa } = body;

    if (!id_cliente || !nome_cadastrado || !id) {
      return NextResponse.json({ error: 'Campos obrigatórios: id_cliente, nome_cadastrado, id (Telegram)' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO mrx.acesso (id_cliente, nome_cadastrado, nome_telegram, id, tipo, administrador, placa, data_criacao, data_atualizacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id_cliente, nome_cadastrado, nome_telegram ?? null, id, tipo ?? 'CLIENTE', administrador ?? null, placa ?? null]
    );

    return NextResponse.json({ data: rows[0] });
  } catch (err: unknown) {
    console.error('[POST /api/acesso]', err);
    const msg = (err as { code?: string }).code === '23505' ? 'ID do cliente já existe' : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
