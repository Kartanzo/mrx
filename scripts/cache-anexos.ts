/**
 * Script para pré-baixar todos os anexos do Telegram e salvar no cache local.
 * Roda: npx tsx scripts/cache-anexos.ts
 *
 * Assim não precisa mais chamar a API do Telegram em tempo real.
 */
import pool from '../lib/db';
import { getCachedFile, saveToCache } from '../lib/storage';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env.local');
  process.exit(1);
}

async function main() {
  const { rows } = await pool.query('SELECT DISTINCT id_anexo FROM mrx.anexos');
  console.log(`📎 ${rows.length} anexos encontrados no banco`);

  let cached = 0;
  let downloaded = 0;
  let errors = 0;

  for (const row of rows) {
    const fileId: string = row.id_anexo;

    // Já está em cache?
    if (getCachedFile(fileId)) {
      cached++;
      continue;
    }

    try {
      // Baixar do Telegram
      const meta = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
      const metaJson = await meta.json();
      if (!metaJson.ok) {
        console.warn(`⚠️  File not found: ${fileId.slice(0, 30)}...`);
        errors++;
        continue;
      }

      const filePath: string = metaJson.result.file_path;
      const ext = filePath.split('.').pop()?.toLowerCase() ?? 'bin';

      const fileRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`);
      if (!fileRes.ok) {
        console.warn(`⚠️  Download failed: ${fileId.slice(0, 30)}...`);
        errors++;
        continue;
      }

      const buffer = Buffer.from(await fileRes.arrayBuffer());
      saveToCache(fileId, buffer, ext);
      downloaded++;
      console.log(`✅ ${downloaded}/${rows.length} baixado (${ext}, ${(buffer.length / 1024).toFixed(0)}KB)`);

      // Pausa de 100ms para não sobrecarregar a API do Telegram
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.warn(`❌ Erro: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Já em cache: ${cached}`);
  console.log(`   Baixados:    ${downloaded}`);
  console.log(`   Erros:       ${errors}`);
  console.log(`   Total:       ${rows.length}`);

  await pool.end();
}

main().catch(console.error);
