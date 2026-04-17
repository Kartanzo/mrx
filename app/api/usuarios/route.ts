import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, normalizeEmail } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const perfil = request.headers.get('x-user-perfil');
  if (perfil !== 'superuser' && perfil !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }
  const result = await pool.query(
    'SELECT id, nome, email, perfil, ativo, criado_em FROM mrx.users ORDER BY criado_em DESC'
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  try {
    const userPerfil = request.headers.get('x-user-perfil');
    if (userPerfil !== 'superuser' && userPerfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    const body = await request.json();
    const email = normalizeEmail(body.email ?? '');
    const nome = (body.nome ?? '').trim();
    const senha = body.senha ?? '';
    const perfil = body.perfil ?? 'operador';

    if (!email || !nome || !senha) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    const exists = await pool.query('SELECT id FROM mrx.users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const senhaHash = await hashPassword(senha);
    const id = uuidv4();

    await pool.query(
      'INSERT INTO mrx.users (id, nome, email, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4, $5, true)',
      [id, nome, email, senhaHash, perfil]
    );

    return NextResponse.json({ id, nome, email, perfil }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
