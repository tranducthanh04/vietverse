import { afterEach, describe, expect, it } from 'vitest';
import { api } from '../lib/api.js';
import { resolveMediaUrl } from '../lib/mediaUrl.js';

const original = api.defaults.baseURL;
afterEach(() => { api.defaults.baseURL = original; });

describe('resolveMediaUrl', () => {
  it('rebases a relative /api URL onto the API origin when the API is on another domain', () => {
    api.defaults.baseURL = 'https://api.example.com/api/v1';
    expect(resolveMediaUrl('/api/v1/media/audio/abcdef0123456789.mp3'))
      .toBe('https://api.example.com/api/v1/media/audio/abcdef0123456789.mp3');
    expect(resolveMediaUrl('/api/v1/recordings/abc/audio?t=tok'))
      .toBe('https://api.example.com/api/v1/recordings/abc/audio?t=tok');
  });
  it('keeps a relative /api URL unchanged for a same-origin (relative) API base', () => {
    api.defaults.baseURL = '/api/v1';
    expect(resolveMediaUrl('/api/v1/media/audio/abcdef0123456789.mp3'))
      .toBe('/api/v1/media/audio/abcdef0123456789.mp3');
  });
  it('leaves an absolute https URL unchanged even cross-domain', () => {
    api.defaults.baseURL = 'https://api.example.com/api/v1';
    expect(resolveMediaUrl('https://res.cloudinary.com/x/audio/upload/one.mp3'))
      .toBe('https://res.cloudinary.com/x/audio/upload/one.mp3');
  });
  it('leaves non-/api relative paths unchanged', () => {
    api.defaults.baseURL = 'https://api.example.com/api/v1';
    expect(resolveMediaUrl('/audio/word.mp3')).toBe('/audio/word.mp3');
    expect(resolveMediaUrl('blob:abc')).toBe('blob:abc');
  });
  it('returns an empty string for missing input', () => {
    expect(resolveMediaUrl(undefined)).toBe('');
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl('')).toBe('');
  });
});
