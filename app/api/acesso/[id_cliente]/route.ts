import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id_cliente: string }> }) {
  try {
    const { id_cliente } = await params;
    const body = await req.json();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    for (const key of ['nome_cadastrado', 'nome_telegram', 'id', 'tipo', 'administrador', 'placa'] as const) {
      if (body[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        vals.push(body[key] || null);
      }
    }

    if (!sets.length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });

    sets.push(`data_atualizacao = NOW()`);
    vals.push(id_cliente);

    const { rows } = await pool.query(
      `UPDATE mrx.acesso SET ${sets.join(', ')} WHERE id_cliente = $${i} RETURNING *`,
      vals
    );

    if (!rows.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[PUT /api/acesso]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id_cliente: string }> }) {
  try {
    const { id_cliente } = await params;
    const { rowCount } = await pool.query('DELETE FROM mrx.acesso WHERE id_cliente = $1', [id_cliente]);
    if (!rowCount) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/acesso]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
