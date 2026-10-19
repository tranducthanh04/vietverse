import { describe, expect, it } from 'vitest';
import { isAllowedMediaUrl, parseDraft } from '../modules/content/content.validation.js';

const MEDIA_URL = '/api/v1/media/audio/abcdef1234567890.mp3';

describe('content audioUrl accepts BE media paths', () => {
  it('accepts the relative media path and still accepts HTTPS, while rejecting insecure URLs', () => {
    expect(isAllowedMediaUrl(MEDIA_URL)).toBe(true);
    expect(isAllowedMediaUrl('https://res.cloudinary.com/x/audio.mp3')).toBe(true);
    expect(isAllowedMediaUrl('http://insecure.test/audio.mp3')).toBe(false);
    // Protocol-relative URLs must not slip through as same-origin paths.
    expect(isAllowedMediaUrl('//evil.test/audio.mp3')).toBe(false);
  });

  it('keeps a BE media audioUrl through story, culture and lesson draft parsing', () => {
    expect(parseDraft('story', { title: 'S', audioUrl: MEDIA_URL }).audioUrl).toBe(MEDIA_URL);
    expect(parseDraft('culture', { title: 'C', audioUrl: MEDIA_URL }).audioUrl).toBe(MEDIA_URL);
    const lesson = parseDraft('lesson', {
      title: 'L',
      vocabulary: [{ word: 'a', meaning: 'b', audioUrl: MEDIA_URL }],
      activities: [{ id: 'q1', type: 'listen_choose', prompt: 'p', audioUrl: MEDIA_URL, options: [{ id: 'o1', text: 'x', audioUrl: MEDIA_URL }] }],
    });
    expect(lesson.vocabulary[0].audioUrl).toBe(MEDIA_URL);
    expect(lesson.activities[0].audioUrl).toBe(MEDIA_URL);
    expect(lesson.activities[0].options?.[0].audioUrl).toBe(MEDIA_URL);
  });

  it('rejects an insecure audioUrl at draft parsing', () => {
    expect(() => parseDraft('story', { title: 'S', audioUrl: 'http://insecure.test/a.mp3' })).toThrow();
  });
});
