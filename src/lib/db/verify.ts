/**
 * Database Connectivity Verification Script
 *
 * Verifies real PostgreSQL connection and Drizzle ORM execution against
 * the configured Supabase PostgreSQL instance.
 *
 * Usage:
 *   pnpm db:verify
 */

import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

// Load local environment files
dotenv.config({ path: '.env.local' });
dotenv.config();

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '********';
    }
    return parsed.toString();
  } catch {
    return '[Invalid Connection URL format]';
  }
}

async function verifyDatabase() {
  console.log('='.repeat(70));
  console.log(' NASA Space Apps - Database Connectivity Verification');
  console.log('='.repeat(70));

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('\n[STATUS: SKIPPED - MISSING CREDENTIALS]');
    console.warn('DATABASE_URL is not set in environment or .env.local.');
    console.warn('\nTo test Supabase PostgreSQL connectivity:');
    console.warn('  1. Copy .env.example to .env.local:');
    console.warn('     cp .env.example .env.local');
    console.warn('  2. Set DATABASE_URL to your Supabase Transaction Pooler URI:');
    console.warn(
      '     DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"'
    );
    console.warn('  3. Re-run: pnpm db:verify\n');
    console.log('='.repeat(70));
    process.exit(0);
  }

  const masked = maskConnectionString(connectionString);
  console.log(`\nTarget Database URI: ${masked}`);
  console.log('Connecting via postgres-js (Transaction Pooler mode: prepare: false)...');

  const startTime = Date.now();
  let client: ReturnType<typeof postgres> | null = null;

  try {
    client = postgres(connectionString, {
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 5,
      max: 1,
    });

    // Step 1: Raw SQL connectivity and version check
    console.log('1. Executing raw SQL probe (SELECT 1 AS connected, NOW(), version())...');
    const rawResult = await client`SELECT 1 AS connected, NOW() AS server_time, version()`;
    const latency = Date.now() - startTime;

    if (!rawResult || rawResult.length === 0) {
      throw new Error('Database returned empty query result.');
    }

    const row = rawResult[0] as { connected: number; server_time: Date; version: string };
    console.log('   ✓ PostgreSQL Host Reachable & Authenticated');
    console.log(`   ✓ Server Time: ${row.server_time}`);
    console.log(`   ✓ Engine: ${row.version.split(' on ')[0]}`);
    console.log(`   ✓ Round-trip Latency: ${latency}ms`);

    // Step 2: Drizzle ORM execution test
    console.log('\n2. Testing Drizzle ORM query execution...');
    const db = drizzle(client);
    const drizzleResult = await db.execute(sql`SELECT 'Drizzle query successful' AS message`);

    if (drizzleResult && drizzleResult.length > 0) {
      console.log('   ✓ Drizzle ORM communication verified successfully');
    }

    console.log('\n' + '='.repeat(70));
    console.log(' [VERIFICATION RESULT: SUCCESS] All database connectivity tests passed.');
    console.log('='.repeat(70));
  } catch (error: unknown) {
    console.error('\n' + '!'.repeat(70));
    console.error(' [VERIFICATION RESULT: FAILED] Database connection failed.');
    if (error instanceof Error) {
      console.error(` Error Message: ${error.message}`);
    } else {
      console.error(' Unknown error occurred:', error);
    }
    console.error('!'.repeat(70));
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

verifyDatabase();
