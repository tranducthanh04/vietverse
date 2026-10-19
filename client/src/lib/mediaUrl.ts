import { api } from './api.js';

/**
 * Audio (and other media) URLs are stored in the database as app-relative paths such as
 * `/api/v1/media/audio/<sha>.<ext>` or `/api/v1/recordings/<id>/audio?t=<token>`. When the SPA and
 * the API live on different origins (e.g. a Vercel/front-end host talking to the self-hosted API),
 * a bare `/api/...` path would resolve against the front-end origin and 404. Rebase any `/api/...`
 * URL onto the origin of the configured API base; leave everything else (absolute http(s), `data:`,
 * `blob:`, other relative paths) untouched. When the API base is itself relative (same-origin dev
 * default `/api/v1`), the relative URL already resolves correctly, so it is returned unchanged.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (!url.startsWith('/api/')) return url;
  const base = api.defaults.baseURL || '/api/v1';
  if (base.startsWith('/')) return url; // same-origin API: the relative path already works
  try {
    return new URL(url, new URL(base).origin).toString();
  } catch {
    return url;
  }
}
