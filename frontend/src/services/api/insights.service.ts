import type {
  ApiResponse,
  InsightsResponse,
  AccessibilityResponse,
} from '@nasa-experience/contracts';
import { apiClient } from './client';

export class InsightsService {
  /**
   * Retrieves statistical metrics, mean intensity, and regional slices.
   */
  public async getInsights(datasetId: string): Promise<ApiResponse<InsightsResponse>> {
    return apiClient.get<InsightsResponse>(`/api/insights/${encodeURIComponent(datasetId)}`);
  }

  /**
   * Retrieves screen-reader legends, audio guides, and tactile guidance.
   */
  public async getAccessibility(datasetId: string): Promise<ApiResponse<AccessibilityResponse>> {
    return apiClient.get<AccessibilityResponse>(`/api/descriptions/${encodeURIComponent(datasetId)}`);
  }
}

export const insightsService = new InsightsService();
