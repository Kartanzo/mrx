import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, signToken, normalizeEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email ?? '');
    const senha = body.senha ?? '';

    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, nome, email, senha_hash, perfil, ativo FROM mrx.users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.ativo) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = await verifyPassword(senha, user.senha_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      perfil: user.perfil,
      nome: user.nome,
    });

    const response = NextResponse.json({
      user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
    });

    response.cookies.set('mrx_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
