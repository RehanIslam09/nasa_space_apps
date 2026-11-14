import { z } from 'zod';

/**
 * Client-accessible environment variables.
 * Must be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
 */
export const clientEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url(
        'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL (e.g., https://your-project.supabase.co)'
      ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.NEXT_PUBLIC_SUPABASE_ANON_KEY || data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    {
      message:
        'Either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be provided',
      path: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    }
  );

/**
 * Server-only environment variables.
 * Kept confidential; never exposed to browser bundles.
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
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Helper to get the active Supabase public API key (publishable key or anon key).
 */
export function getSupabaseKey(env: ClientEnv): string {
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Supabase client key is missing.');
  }
  return key;
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
 * Checks whether PostgreSQL database credentials are configured.
 */
export function hasDatabaseCredentials(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Lazily retrieves and validates client environment variables.
 * Throws a descriptive configuration error only when accessed if variables are missing.
 */
export function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[Supabase Client Configuration Error]\nRequired public environment variables are missing or invalid:\n${errorDetails}\n\nPlease define these variables in .env.local by copying .env.example.`
    );
  }

  return result.data;
}

/**
 * Lazily retrieves and validates server environment variables.
 * Throws a descriptive configuration error only when database or server auth operations are executed.
 */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[Database / Server Configuration Error]\nRequired server environment variables are missing or invalid:\n${errorDetails}\n\nPlease define these variables in .env.local by copying .env.example.`
    );
  }

  return result.data;
}
