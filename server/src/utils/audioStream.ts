import type { Request, Response } from 'express';
import { audioStorageRoot, localAudioStorage } from '../services/localAudioStorage.js';
import { sendError } from './apiResponse.js';

type ServeOptions = { contentType: string; cacheControl?: string };

/** Parses a single-range `bytes=` header against a known size. Returns null on an unsatisfiable range. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return null;
  let start: number;
  let end: number;
  if (rawStart === '') {
    // Suffix range: the last N bytes.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

/**
 * Streams an audio file from disk with HTTP Range support. The file is read by its internal
 * storageKey only — callers resolve and authorize that key before calling here.
 */
export async function serveAudioFile(req: Request, res: Response, storageKey: string, opts: ServeOptions): Promise<void> {
  // Surface 503 when storage is not configured (production without a mounted volume) instead of
  // letting statKey's error-swallowing turn it into a misleading 404.
  audioStorageRoot();
  const info = await localAudioStorage.statKey(storageKey);
  if (!info) {
    sendError(res, 'Không tìm thấy tập tin âm thanh.', 404, 'AUDIO_NOT_FOUND');
    return;
  }
  const { size } = info;
  res.setHeader('Content-Type', opts.contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  if (opts.cacheControl) res.setHeader('Cache-Control', opts.cacheControl);

  const rangeHeader = req.headers.range;
  const onError = () => {
    if (!res.headersSent) res.status(500);
    res.end();
  };

  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      res.status(416).setHeader('Content-Range', `bytes */${size}`);
      res.end();
      return;
    }
    res.status(206);
    res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    res.setHeader('Content-Length', range.end - range.start + 1);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = localAudioStorage.createReadStream(storageKey, range);
    stream.on('error', onError);
    stream.pipe(res);
    return;
  }

  res.status(200);
  res.setHeader('Content-Length', size);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = localAudioStorage.createReadStream(storageKey);
  stream.on('error', onError);
  stream.pipe(res);
}
