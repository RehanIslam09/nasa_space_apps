import { describe, it, expect } from 'vitest';
import {
  ApiErrorResponseSchema,
  ErrorCodes,
  HealthResponseSchema,
  HealthStatusSchema,
} from '../src';

describe('Shared API Contracts', () => {
  it('validates a valid HealthStatus payload', () => {
    const validHealth = {
      status: 'healthy' as const,
      phase: '02-application-shell',
      services: {
        supabaseAuth: 'configured' as const,
        database: 'configured' as const,
      },
    };

    const parsed = HealthStatusSchema.safeParse(validHealth);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid HealthStatus payload', () => {
    const invalidHealth = {
      status: 'broken', // invalid enum
      services: {
        supabaseAuth: 'unknown',
      },
    };

    const parsed = HealthStatusSchema.safeParse(invalidHealth);
    expect(parsed.success).toBe(false);
  });

  it('validates a complete HealthResponse structure', () => {
    const fullResponse = {
      success: true as const,
      data: {
        status: 'healthy' as const,
        phase: '02-application-shell',
        services: {
          supabaseAuth: 'configured' as const,
          database: 'pending_configuration' as const,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    const parsed = HealthResponseSchema.safeParse(fullResponse);
    expect(parsed.success).toBe(true);
  });

  it('validates a standardized ApiErrorResponse', () => {
    const errorPayload = {
      success: false as const,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authentication token is expired',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    const parsed = ApiErrorResponseSchema.safeParse(errorPayload);
    expect(parsed.success).toBe(true);
  });
});
