import { hasDatabaseCredentials, hasSupabaseCredentials } from '@/lib/validation/env';
import { apiSuccess } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  return apiSuccess({
    status: 'healthy',
    phase: '02-application-shell',
    services: {
      supabaseAuth: hasSupabaseCredentials() ? 'configured' : 'pending_configuration',
      database: hasDatabaseCredentials() ? 'configured' : 'pending_configuration',
    },
  });
}
