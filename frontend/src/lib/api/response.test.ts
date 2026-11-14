import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError } from './response';

describe('API response helpers', () => {
  it('apiSuccess constructs a valid success structure', async () => {
    const data = { user: 'test' };
    const res = apiSuccess(data);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta).toBeDefined();
    expect(json.meta.timestamp).toBeDefined();
  });

  it('apiError constructs a valid error structure', async () => {
    const res = apiError('Unauthorized access', 'UNAUTHORIZED', 401);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized access',
    });
    expect(json.meta.timestamp).toBeDefined();
  });
});
