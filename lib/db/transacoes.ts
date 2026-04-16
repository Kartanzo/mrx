import pool from '../db';

const S = 'mrx';

/** Busca envolvidos distintos que contenham o termo (autocomplete) */
export async function buscarEnvolvidos(q: string) {
  const { rows } = await pool.query(
    `SELECT DISTINCT envolvido
     FROM ${S}.transacoes
     WHERE envolvido ILIKE $1
     ORDER BY envolvido
     LIMIT 20`,
    [`%${q}%`]
  );
  return rows.map((r) => r.envolvido as string);
}

/** Todas as transações de um envolvido, ordenadas por data */
export async function transacoesPorEnvolvido(envolvido: string) {
  const { rows } = await pool.query(
    `SELECT id, data, descricao, valor, tipo_de_movimento,
            envolvido, descricao_extra, chave_matching,
            placa, aprovado, aprovado_em, comprovante
     FROM ${S}.transacoes
     WHERE envolvido = $1
     ORDER BY data DESC`,
    [envolvido]
  );
  return rows;
}

/** Busca exata por envolvido + data (dia) + valor */
export async function buscarExata(envolvido: string, data: string, valor: string) {
  const { rows } = await pool.query(
    `SELECT id, data, descricao, valor, tipo_de_movimento,
            envolvido, descricao_extra, chave_matching,
            placa, aprovado, aprovado_em, comprovante
     FROM ${S}.transacoes
     WHERE envolvido = $1
       AND DATE(data) = $2::date
       AND valor = $3::numeric
     LIMIT 1`,
    [envolvido, data, valor]
  );
  return rows[0] ?? null;
}

/** Busca por ID */
export async function transacaoPorId(id: string) {
  const { rows } = await pool.query(
    `SELECT id, data, descricao, valor, tipo_de_movimento,
            envolvido, descricao_extra, chave_matching,
            placa, aprovado, aprovado_em, comprovante
     FROM ${S}.transacoes WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Atualiza campos editáveis */
export async function atualizarTransacao(
  id: string,
  dados: { descricao_extra?: string; placa?: string; aprovado?: boolean; comprovante?: string | null }
) {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (dados.descricao_extra !== undefined) { sets.push(`descricao_extra = $${i++}`); vals.push(dados.descricao_extra); }
  if (dados.placa !== undefined)           { sets.push(`placa = $${i++}`);           vals.push(dados.placa); }
  if (dados.aprovado !== undefined) {
    sets.push(`aprovado = $${i++}`);           vals.push(dados.aprovado);
    sets.push(`aprovado_em = $${i++}`);        vals.push(dados.aprovado ? new Date() : null);
  }
  if (dados.comprovante !== undefined) { sets.push(`comprovante = $${i++}`); vals.push(dados.comprovante); }

  if (!sets.length) return null;
  vals.push(id);

  const { rows } = await pool.query(
    `UPDATE ${S}.transacoes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return rows[0] ?? null;
}
