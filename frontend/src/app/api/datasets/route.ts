import { apiSuccess } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import { mockDatasets } from '@/services/api/mocks/fixtures/datasets.mock';
import type { DatasetMetadata } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

/**
 * BFF Endpoint: GET /api/datasets
 * Retrieves all registered NASA datasets from Python FastAPI or falls back to mock catalog.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const targetUrl = new URL(`${fastApiUrl}/api/datasets`);
    if (category) {
      targetUrl.searchParams.set('category', category);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as DatasetMetadata[];
      return apiSuccess(data);
    }
  } catch {
    // Upstream unavailable or timed out; fall back to verified mock catalog
  }

  // Graceful fallback to rich mock data
  const filtered = category
    ? mockDatasets.filter((d) => d.category.toLowerCase().includes(category.toLowerCase()))
    : mockDatasets;

  return apiSuccess(filtered, 200, { source: 'mock_fallback' });
}
