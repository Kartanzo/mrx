import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'SET' : 'MISSING';
  checks.JWT_SECRET = process.env.JWT_SECRET ? 'SET' : 'MISSING';
  checks.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING';

  // 2. DB connection
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    const r = await pool.query('SELECT 1 AS ok');
    checks.db = r.rows[0]?.ok === 1 ? 'OK' : 'FAIL';
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
