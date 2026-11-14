import { healthService } from '@nasa-experience/backend';
import { apiSuccess } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await healthService.getHealthStatus();
  return apiSuccess(health);
}
