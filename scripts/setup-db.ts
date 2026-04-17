import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('❌ DATABASE_URL não definida'); process.exit(1); }

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Conectado ao banco de dados');

  // 1. Criar schema mrx se não existir
  await client.query('CREATE SCHEMA IF NOT EXISTS mrx');
  console.log('✅ Schema mrx verificado');

  // 2. Criar tabela users
  await client.query(`
    CREATE TABLE IF NOT EXISTS mrx.users (
      id          VARCHAR(36) PRIMARY KEY,
      nome        VARCHAR(255) NOT NULL,
      email       VARCHAR(255) NOT NULL UNIQUE,
      senha_hash  VARCHAR(255) NOT NULL,
      perfil      VARCHAR(50)  NOT NULL DEFAULT 'operador',
      ativo       BOOLEAN      NOT NULL DEFAULT true,
      criado_em   TIMESTAMP    NOT NULL DEFAULT NOW(),
      CONSTRAINT perfil_check CHECK (perfil IN ('superuser', 'admin', 'operador'))
    )
  `);
  console.log('✅ Tabela mrx.users criada');

  // 3. Criar tabela transacoes_status
  await client.query(`
    CREATE TABLE IF NOT EXISTS mrx.transacoes_status (
      id               VARCHAR(255) PRIMARY KEY REFERENCES mrx.transacoes(id),
      status_pagamento VARCHAR(50)  NOT NULL DEFAULT 'em_aberto',
      aprovado_por     VARCHAR(255),
      aprovado_em      TIMESTAMP,
      observacao       TEXT,
      updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT status_check CHECK (status_pagamento IN ('em_aberto', 'aprovacao_automatica', 'aprovado_usuario'))
    )
  `);
  console.log('✅ Tabela mrx.transacoes_status criada');

  // 4. Criar superusuário
  const email = process.env.SUPER_EMAIL ?? '3lackd@3lackd.com';
  const senhaPlana = process.env.SUPER_SENHA ?? 'changeme123';
  const senhaHash = await bcrypt.hash(senhaPlana, 12);

  const existente = await client.query('SELECT id FROM mrx.users WHERE email = $1', [email]);
  if (existente.rows.length === 0) {
    await client.query(
      `INSERT INTO mrx.users (id, nome, email, senha_hash, perfil, ativo)
       VALUES ($1, $2, $3, $4, 'superuser', true)`,
      [uuidv4(), 'Super Admin', email, senhaHash]
    );
    console.log(`✅ Superusuário criado: ${email}`);
  } else {
    // Atualiza senha caso já exista
    await client.query('UPDATE mrx.users SET senha_hash = $1, perfil = $2 WHERE email = $3', [
      senhaHash, 'superuser', email,
    ]);
    console.log(`ℹ️  Superusuário já existia — senha atualizada: ${email}`);
  }

  await client.end();
  console.log('\n🎉 Setup concluído com sucesso!');
}

run().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
