import { describe, it, expect } from 'vitest';
import { clientEnvSchema, serverEnvSchema, getSupabaseKey } from './env';

describe('Environment validation', () => {
  it('validates client environment with publishable key', () => {
    const validClient = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_123',
    };
    const parsed = clientEnvSchema.safeParse(validClient);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(getSupabaseKey(parsed.data)).toBe('sb_publishable_123');
    }
  });

  it('validates client environment with anon key', () => {
    const validClient = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key_123',
    };
    const parsed = clientEnvSchema.safeParse(validClient);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(getSupabaseKey(parsed.data)).toBe('anon_key_123');
    }
  });

  it('fails client validation when both keys are missing', () => {
    const invalidClient = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    };
    const parsed = clientEnvSchema.safeParse(invalidClient);
    expect(parsed.success).toBe(false);
  });

  it('validates server environment correctly', () => {
    const validServer = {
      DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/postgres',
    };
    const parsed = serverEnvSchema.safeParse(validServer);
    expect(parsed.success).toBe(true);
  });
});
