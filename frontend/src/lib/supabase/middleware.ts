import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseCredentials, getClientEnv, getSupabaseKey } from '@/lib/validation/env';

/**
 * Updates user session via Supabase cookie synchronization.
 * Runs in Next.js middleware before request routes are reached.
 */
export async function updateSession(request: NextRequest) {
  // If Supabase credentials are not configured, pass through gracefully
  if (!hasSupabaseCredentials()) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const env = getClientEnv();
  const apiKey = getSupabaseKey(env);

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, apiKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth token if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
