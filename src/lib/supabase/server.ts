import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getClientEnv, getSupabaseKey } from '@/lib/validation/env';

/**
 * Creates a server-side Supabase client for Server Components,
 * Server Actions, and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();
  const apiKey = getSupabaseKey(env);

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, apiKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  });
}
