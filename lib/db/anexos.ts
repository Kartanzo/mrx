import pool from '../db';

const S = 'mrx';

/**
 * Busca anexos usando a tabela existente mrx.anexos.
 * Tenta cruzar: transacoes.chave_matching com anexos.id_anexo
 * Ou: transacoes.envolvido ≈ anexos.id_cliente + transacoes.valor = anexos.valor
 */
export async function anexosPorChave(chave_matching: string) {
  const { rows } = await pool.query(
    `SELECT id_anexo, id_cliente, data_hora, valor
     FROM ${S}.anexos
     WHERE id_anexo = $1
     ORDER BY data_hora DESC
     LIMIT 1`,
    [chave_matching]
  );
  return rows;
}

export async function anexosPorClienteValor(id_cliente: string, valor: string) {
  const { rows } = await pool.query(
    `SELECT id_anexo, id_cliente, data_hora, valor
     FROM ${S}.anexos
     WHERE id_cliente ILIKE $1
       AND valor = $2
     ORDER BY data_hora DESC
     LIMIT 1`,
    [`%${id_cliente}%`, valor]
  );
  return rows;
}

export async function todosAnexos(id_cliente: string) {
  const { rows } = await pool.query(
    `SELECT id_anexo, id_cliente, data_hora, valor
     FROM ${S}.anexos
     WHERE id_cliente ILIKE $1
     ORDER BY data_hora DESC`,
    [`%${id_cliente}%`]
  );
  return rows;
}
