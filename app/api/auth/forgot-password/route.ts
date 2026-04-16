import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizeEmail, signToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email ?? '');

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, nome, email FROM mrx.users WHERE email = $1 AND ativo = true',
      [email]
    );

    // Sempre retorna sucesso para não revelar se o email existe
    if (!result.rows[0]) {
      return NextResponse.json({ ok: true });
    }

    const user = result.rows[0];
    const resetToken = signToken({ userId: user.id, email: user.email, perfil: 'reset', nome: user.nome });
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-senha?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, user.nome, resetUrl);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
