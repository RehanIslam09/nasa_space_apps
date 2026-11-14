import { apiSuccess, apiError } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import { mockDatasets } from '@/services/api/mocks/fixtures/datasets.mock';
import type { DatasetMetadata } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * BFF Endpoint: GET /api/datasets/:id
 * Retrieves dataset metadata by ID from Python FastAPI or mock catalog.
 */
export async function GET(_request: Request, props: RouteParams) {
  const { id } = await props.params;

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${fastApiUrl}/api/datasets/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as DatasetMetadata;
      return apiSuccess(data);
    }
  } catch {
    // Upstream error or offline
  }

  const match = mockDatasets.find((d) => d.id === id);
  if (match) {
    return apiSuccess(match, 200, { source: 'mock_fallback' });
  }

  return apiError(`Dataset with ID '${id}' not found.`, 'NOT_FOUND', 404);
}
