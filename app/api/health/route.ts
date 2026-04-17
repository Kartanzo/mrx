import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'SET' : 'MISSING';
  checks.JWT_SECRET = process.env.JWT_SECRET ? 'SET' : 'MISSING';
  checks.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING';

  // 2. DB connection + schema check
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    const dbName = await pool.query('SELECT current_database()');
    checks.db_name = dbName.rows[0].current_database;
    const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'mrx'");
    checks.schema_mrx = schemas.rows.length > 0 ? 'EXISTS' : 'MISSING';
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'mrx' ORDER BY table_name");
    checks.mrx_tables = tables.rows.map((r: { table_name: string }) => r.table_name).join(', ') || 'NONE';
    checks.db = 'OK';
    await pool.end();
  } catch (e: unknown) {
    checks.db = `ERROR: ${(e as Error).message}`;
  }

  // 3. Auth modules
  try {
    require('bcryptjs');
    checks.bcryptjs = 'OK';
  } catch { checks.bcryptjs = 'MISSING'; }

  try {
    require('jsonwebtoken');
    checks.jsonwebtoken = 'OK';
  } catch { checks.jsonwebtoken = 'MISSING'; }

  try {
    require('jose');
    checks.jose = 'OK';
  } catch { checks.jose = 'MISSING'; }

  const allOk = Object.values(checks).every(v => v === 'OK' || v === 'SET');

  return NextResponse.json({ status: allOk ? 'healthy' : 'unhealthy', checks });
}
