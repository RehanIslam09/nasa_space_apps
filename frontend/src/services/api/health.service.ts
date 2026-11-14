import type { ApiResponse, HealthStatus } from '@nasa-experience/contracts';
import { apiClient, isMockMode } from './client';
import { createMockResponse, type MockOptions } from './mocks/mock-client';
import { mockHealthStatus } from './mocks/fixtures/health.mock';

export interface HealthServiceOptions {
  forceMock?: boolean;
  mockOptions?: MockOptions;
}

/**
 * Frontend Health Service
 *
 * Provides a type-safe abstraction over system health diagnostics.
 * Supports transparent switching between real Route Handlers and Mock implementations.
 */
export class FrontendHealthService {
  /**
   * Retrieves the current system health status.
   */
  public async getHealth(options: HealthServiceOptions = {}): Promise<ApiResponse<HealthStatus>> {
    const useMock = options.forceMock ?? isMockMode();

    if (useMock) {
      return createMockResponse<HealthStatus>(mockHealthStatus, options.mockOptions);
    }

    return apiClient.get<HealthStatus>('/api/health');
  }
}

export const frontendHealthService = new FrontendHealthService();
