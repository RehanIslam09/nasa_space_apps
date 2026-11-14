import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getServerEnv, hasDatabaseCredentials } from '../config/env';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

/**
 * Creates or retrieves the singleton Drizzle ORM client.
 * Configured with `prepare: false` to ensure full compatibility with
 * Supabase Transaction Connection Pooling (Supavisor on Port 6543).
 */
export function getDb() {
  if (global.__dbClient) {
    return global.__dbClient;
  }

  const { DATABASE_URL } = getServerEnv();

  const pg = postgres(DATABASE_URL, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(pg, { schema });

  if (process.env.NODE_ENV !== 'production') {
    global.__pgClient = pg;
    global.__dbClient = db;
  }

  return db;
}

export { hasDatabaseCredentials };
