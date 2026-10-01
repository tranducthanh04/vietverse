import { describe, it, expect } from 'vitest';
import { formatPoints, cn } from '../lib/utils.js';

describe('Client Utilities', () => {
  it('should format points with Vietnamese number grouping', () => {
    expect(formatPoints(10)).toBe('10');
    expect(formatPoints(1500)).toMatch(/1[.,\s]?500/);
    expect(formatPoints(0)).toBe('0');
  });

  it('should merge tailwind class names properly', () => {
    const result = cn('bg-red-500 text-white', 'p-4', false && 'hidden', 'bg-blue-500');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });
});
