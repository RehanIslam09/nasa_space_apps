import { describe, it, expect } from 'vitest';
import { HealthService } from '@nasa-experience/backend';
import { FrontendHealthService } from '../../src/services/api/health.service';
import { HealthStatusSchema } from '@nasa-experience/contracts';

describe('Integration: Health Contract Synchronization', () => {
  it('verifies backend and frontend mock produce matching contract shapes', async () => {
    // 1. Backend service execution
    const backendService = new HealthService();
    const backendData = await backendService.getHealthStatus();

    const backendParsed = HealthStatusSchema.safeParse(backendData);
    expect(backendParsed.success).toBe(true);

    // 2. Frontend service mock execution
    const frontendService = new FrontendHealthService();
    const frontendResponse = await frontendService.getHealth({ forceMock: true });

    expect(frontendResponse.success).toBe(true);
    if (frontendResponse.success) {
      const frontendParsed = HealthStatusSchema.safeParse(frontendResponse.data);
      expect(frontendParsed.success).toBe(true);

      // 3. Schema consistency assertion
      expect(Object.keys(backendData).sort()).toEqual(Object.keys(frontendResponse.data).sort());
      expect(Object.keys(backendData.services).sort()).toEqual(
        Object.keys(frontendResponse.data.services).sort()
      );
    }
  });
});
