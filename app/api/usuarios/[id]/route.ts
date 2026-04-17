import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const perfil = req.headers.get('x-user-perfil');
    if (perfil !== 'superuser' && perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    if (body.nome !== undefined) { sets.push(`nome = $${i++}`); vals.push(body.nome); }
    if (body.email !== undefined) { sets.push(`email = $${i++}`); vals.push(body.email.toLowerCase().trim()); }
    if (body.perfil !== undefined) { sets.push(`perfil = $${i++}`); vals.push(body.perfil); }
    if (body.ativo !== undefined) { sets.push(`ativo = $${i++}`); vals.push(body.ativo); }
    if (body.senha && body.senha.trim()) {
      const hash = await bcrypt.hash(body.senha, 12);
      sets.push(`senha_hash = $${i++}`);
      vals.push(hash);
    }

    if (!sets.length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    vals.push(id);

    const { rows } = await pool.query(
      `UPDATE mrx.users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, nome, email, perfil, ativo, criado_em`,
      vals
    );
    if (!rows.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[PUT /api/usuarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const perfil = req.headers.get('x-user-perfil');
    if (perfil !== 'superuser') {
      return NextResponse.json({ error: 'Apenas superuser pode excluir' }, { status: 403 });
    }
    const { id } = await params;
    const { rowCount } = await pool.query('DELETE FROM mrx.users WHERE id = $1', [id]);
    if (!rowCount) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/usuarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
