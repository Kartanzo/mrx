import pool from '../lib/db';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE mrx.transacoes
        ADD COLUMN IF NOT EXISTS placa       VARCHAR(10),
        ADD COLUMN IF NOT EXISTS aprovado    BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP;
    `);
    console.log('✅ Colunas placa, aprovado, aprovado_em adicionadas em mrx.transacoes');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => { console.error(e); process.exit(1); });
