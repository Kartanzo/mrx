import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { placa, id_cliente, nome_cliente, observacao, reabrir } = body;

    const aprovadoPor = request.headers.get('x-user-nome') ?? 'Sistema';

    if (reabrir) {
      // Reabrir transação — volta para em_aberto, limpa campos de aprovação
      await pool.query(
        `INSERT INTO mrx.transacoes_status
           (id, status_pagamento, aprovado_por, aprovado_em, observacao, placa, id_cliente, nome_cliente, updated_at)
         VALUES ($1, 'em_aberto', $2, NULL, $3, NULL, NULL, NULL, NOW())
         ON CONFLICT (id) DO UPDATE SET
           status_pagamento = 'em_aberto',
           aprovado_por     = EXCLUDED.aprovado_por,
           aprovado_em      = NULL,
           observacao       = EXCLUDED.observacao,
           placa            = NULL,
           id_cliente       = NULL,
           nome_cliente     = NULL,
           updated_at       = NOW()`,
        [id, aprovadoPor, observacao ?? null]
      );
      return NextResponse.json({ ok: true });
    }

    // Aprovação manual — sempre "aprovado_usuario"
    if (!placa || placa.trim() === '') {
      return NextResponse.json({ error: 'Placa obrigatória' }, { status: 400 });
    }
    if (!id_cliente) {
      return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });
    }

    // Data/hora de Brasília como string formatada
    await pool.query(
      `INSERT INTO mrx.transacoes_status
         (id, status_pagamento, aprovado_por, aprovado_em, observacao, placa, id_cliente, nome_cliente, updated_at)
       VALUES ($1, 'aprovado_usuario', $2,
               NOW() AT TIME ZONE 'America/Sao_Paulo',
               $3, $4, $5, $6,
               NOW())
       ON CONFLICT (id) DO UPDATE SET
         status_pagamento = 'aprovado_usuario',
         aprovado_por     = EXCLUDED.aprovado_por,
         aprovado_em      = NOW() AT TIME ZONE 'America/Sao_Paulo',
         observacao       = EXCLUDED.observacao,
         placa            = EXCLUDED.placa,
         id_cliente       = EXCLUDED.id_cliente,
         nome_cliente     = EXCLUDED.nome_cliente,
         updated_at       = NOW()`,
      [id, aprovadoPor, observacao ?? null, placa.trim().toUpperCase(), id_cliente, nome_cliente ?? null]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
