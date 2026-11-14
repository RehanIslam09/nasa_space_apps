import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes properly', () => {
    expect(cn('base', false && 'hidden', true && 'block')).toBe('base block');
  });

  it('resolves conflicting tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
