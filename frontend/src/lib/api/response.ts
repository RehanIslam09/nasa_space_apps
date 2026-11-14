import { NextResponse } from 'next/server';
import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@nasa-experience/contracts';

export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse };

/**
 * Construct a standardized success JSON response compliant with shared API contracts.
 */
export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Construct a standardized error JSON response compliant with shared API contracts.
 */
export function apiError(
  message: string,
  code = 'INTERNAL_ERROR',
  status = 500,
  details?: unknown
) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(body, { status });
}
