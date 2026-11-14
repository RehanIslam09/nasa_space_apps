import type { ApiSuccessResponse, ApiErrorResponse } from '@nasa-experience/contracts';
import { ErrorCodes } from '@nasa-experience/contracts';

export interface MockOptions {
  delayMs?: number;
  shouldFail?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Simulates network delay for mock requests.
 */
export async function simulateDelay(ms = 100): Promise<void> {
  if (ms <= 0) return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps mock data in a standardized ApiSuccessResponse or simulates an error.
 */
export async function createMockResponse<T>(
  data: T,
  options: MockOptions = {}
): Promise<ApiSuccessResponse<T> | ApiErrorResponse> {
  const {
    delayMs = 80,
    shouldFail = false,
    errorCode = ErrorCodes.INTERNAL_ERROR,
    errorMessage = 'Simulated mock failure',
  } = options;

  await simulateDelay(delayMs);

  if (shouldFail) {
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        mock: true,
      },
    };
  }

  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      mock: true,
    },
  };
}
