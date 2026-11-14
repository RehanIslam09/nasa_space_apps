import { describe, it, expect } from 'vitest';
import { FrontendHealthService } from './health.service';
import { HealthStatusSchema, ErrorCodes } from '@nasa-experience/contracts';

describe('Frontend Health Service (Dual-Mode)', () => {
  it('returns valid mock data when forced to mock mode', async () => {
    const service = new FrontendHealthService();
    const response = await service.getHealth({ forceMock: true });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.status).toBe('healthy');
      expect(response.data.phase).toContain('Mock Mode');
      expect(response.data.services.supabaseAuth).toBe('mocked');
      expect(response.data.services.database).toBe('mocked');

      // Verify that the mock data conforms strictly to the shared API contract
      const contractCheck = HealthStatusSchema.safeParse(response.data);
      expect(contractCheck.success).toBe(true);
    }
  });

  it('returns contract-compliant error when mock failure is simulated', async () => {
    const service = new FrontendHealthService();
    const response = await service.getHealth({
      forceMock: true,
      mockOptions: {
        shouldFail: true,
        errorCode: ErrorCodes.SERVICE_UNAVAILABLE,
        errorMessage: 'Simulated service downtime',
      },
    });

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
      expect(response.error.message).toBe('Simulated service downtime');
      expect(response.meta.timestamp).toBeDefined();
    }
  });
});
