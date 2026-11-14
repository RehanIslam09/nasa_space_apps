import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (Next.js internals, static files, chunks, HMR)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .glb, .mp3, .mp4, etc.)
     */
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf|bin|mp3|mp4)$).*)',
  ],
};
