import { createBrowserClient } from '@supabase/ssr';
import { getClientEnv, getSupabaseKey } from '@/lib/validation/env';

/**
 * Creates a browser-side Supabase client.
 * Uses lazy environment variable validation.
 */
export function createClient() {
  const env = getClientEnv();
  const apiKey = getSupabaseKey(env);

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, apiKey);
}
