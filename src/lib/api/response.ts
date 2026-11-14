import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * Construct a standardized success JSON response.
 */
export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const body: ApiResponse<T> = {
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
 * Construct a standardized error JSON response.
 */
export function apiError(
  message: string,
  code = 'INTERNAL_ERROR',
  status = 500,
  details?: unknown
) {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(body, { status });
}

