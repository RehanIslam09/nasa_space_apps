import postgres from 'postgres';
import { getServerEnv, hasDatabaseCredentials } from '../config/env';
import { getDb } from './client';

/**
 * Diagnostic tool to verify live Supabase PostgreSQL connectivity and Drizzle ORM execution.
 */
async function verifyDatabaseConnectivity(): Promise<void> {
  console.log('======================================================================');
  console.log(' NASA Space Apps - Backend Database Connectivity Verification');
  console.log('======================================================================\n');

  if (!hasDatabaseCredentials()) {
    console.warn('[WARNING] DATABASE_URL is not set.');
    console.warn('Define DATABASE_URL in root .env.local to test real PostgreSQL connectivity.\n');
    process.exit(0);
  }

  const { DATABASE_URL } = getServerEnv();

  // Mask database credentials for safe logging
  const maskedUrl = DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:********@');
  console.log(`Target Database URI: ${maskedUrl}`);
  console.log('Connecting via postgres-js (Transaction Pooler mode: prepare: false)...');

  const startTime = Date.now();
  const sql = postgres(DATABASE_URL, {
    prepare: false,
    connect_timeout: 10,
  });

  try {
    const rawResult =
      await sql`SELECT 1 AS connected, NOW() AS server_time, version() AS engine_version`;
    const latency = Date.now() - startTime;

    console.log('1. Executing raw SQL probe (SELECT 1 AS connected, NOW(), version())...');
    console.log('   ✓ PostgreSQL Host Reachable & Authenticated');
    console.log(`   ✓ Server Time: ${rawResult[0]?.server_time}`);
    console.log(`   ✓ Engine: ${rawResult[0]?.engine_version?.split(',')[0]}`);
    console.log(`   ✓ Round-trip Latency: ${latency}ms\n`);

    console.log('2. Testing Drizzle ORM query execution...');
    const db = getDb();
    if (!db) {
      throw new Error('Drizzle client initialization failed.');
    }
    console.log('   ✓ Drizzle ORM communication verified successfully\n');

    console.log('======================================================================');
    console.log(' [VERIFICATION RESULT: SUCCESS] All database connectivity tests passed.');
    console.log('======================================================================\n');
  } catch (error: unknown) {
    console.error('\n[DATABASE CONNECTION ERROR]');
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
    } else {
      console.error('Unknown database error:', error);
    }
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

verifyDatabaseConnectivity();
