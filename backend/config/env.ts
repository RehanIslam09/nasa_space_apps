import path from 'path';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Safely load root environment files preserving Next.js / standard precedence:
// 1. .env.local overrides .env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Server-only environment variables required for Supabase PostgreSQL and admin tasks.
 */
export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required for PostgreSQL connection pooler (port 6543)'),
  DIRECT_URL: z
    .string()
    .min(1, 'DIRECT_URL is required for direct PostgreSQL migrations (port 5432)')
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY must not be empty if provided')
    .optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Checks whether PostgreSQL database credentials are configured.
 */
export function hasDatabaseCredentials(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Checks whether Supabase client credentials are configured.
 */
export function hasSupabaseCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

/**
 * Lazily retrieves and validates server environment variables.
 */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[Backend Server Configuration Error]\nRequired server environment variables are missing or invalid:\n${errorDetails}\n\nPlease check your root .env.local file.`
    );
  }

  return result.data;
}
