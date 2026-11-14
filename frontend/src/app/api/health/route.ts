import { healthService } from '@nasa-experience/backend';
import { apiSuccess } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await healthService.getHealthStatus();

  // Non-blocking diagnostic probe to Python FastAPI backend
  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${fastApiUrl}/api/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const fastApiData = (await res.json()) as Record<string, unknown>;
      return apiSuccess({
        ...health,
        fastApi: {
          status: 'connected',
          url: fastApiUrl,
          details: fastApiData,
        },
      });
    }
  } catch {
    // FastAPI is offline or unreachable; return base health status without crashing
  }

  return apiSuccess({
    ...health,
    fastApi: {
      status: 'offline',
      fallback: 'active (mock fixtures enabled)',
    },
  });
}
