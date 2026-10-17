import { describe, it, expect } from 'vitest';
import { formatPoints, cn } from '../lib/utils.js';

describe('Client Utilities', () => {
  it('should format points with Vietnamese number grouping', () => {
    expect(formatPoints(10)).toBe('10');
    expect(formatPoints(1500)).toMatch(/1[.,\s]?500/);
    expect(formatPoints(0)).toBe('0');
  });

  it('should group thousands per the interface language', () => {
    // Vietnamese uses a dot as the thousands separator, English a comma.
    expect(formatPoints(1500, 'vi')).toBe('1.500');
    expect(formatPoints(1500, 'en')).toBe('1,500');
    // Defaulting (no language) keeps the Vietnamese grouping callers relied on.
    expect(formatPoints(1500)).toBe(formatPoints(1500, 'vi'));
  });

  it('should merge tailwind class names properly', () => {
    const result = cn('bg-red-500 text-white', 'p-4', undefined, 'bg-blue-500');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });
});
