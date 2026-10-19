import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, unlink, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBuffer } from 'music-metadata';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type StorageFailure = { statusCode: number; code: string; message: string };
export type AudioKind = { ext: string; mime: string };

// Recordings cap at 5 MiB (child voice takes); content audio at 10 MiB (narration).
export const MAX_RECORDING_BYTES = 5 * 1024 * 1024;
export const MAX_CONTENT_AUDIO_BYTES = 10 * 1024 * 1024;

const unavailable = (): StorageFailure => ({
  statusCode: 503,
  code: 'AUDIO_STORAGE_UNAVAILABLE',
  message: 'Lưu trữ âm thanh chưa sẵn sàng.',
});
export const invalidAudio = (): StorageFailure => ({
  statusCode: 422,
  code: 'AUDIO_INVALID',
  message: 'Tập tin không phải âm thanh hợp lệ (webm, ogg, mp4/m4a, mp3, wav).',
});

// server/dist/services/localAudioStorage.js and server/src/services/localAudioStorage.ts both
// resolve `../..` to the server package root, so the dev default is stable across tsx and build.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV_DEFAULT_DIR = path.join(serverRoot, '.data', 'audio');

/**
 * Absolute storage root. Throws 503 only in production when the operator did not mount a
 * durable volume; development falls back to a repo-local directory so local runs just work.
 */
export function audioStorageRoot(): string {
  if (env.AUDIO_STORAGE_DIR) return path.resolve(env.AUDIO_STORAGE_DIR);
  if (env.NODE_ENV === 'production') throw unavailable();
  return DEV_DEFAULT_DIR;
}

// Magic-byte sniffing the server trusts instead of the client-declared MIME type.
// Each canonical kind maps to the extension stored on disk and the MIME returned on playback.
function sniff(buffer: Buffer): AudioKind | undefined {
  if (buffer.length < 12) return undefined;
  // WebM / Matroska: EBML header.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { ext: 'webm', mime: 'audio/webm' };
  }
  // Ogg container (Vorbis/Opus): "OggS".
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { ext: 'ogg', mime: 'audio/ogg' };
  }
  // WAV: "RIFF" .... "WAVE".
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') {
    return { ext: 'wav', mime: 'audio/wav' };
  }
  // ISO-BMFF (MP4 / M4A): box type "ftyp" at offset 4.
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    return { ext: 'm4a', mime: 'audio/mp4' };
  }
  // MP3: ID3 tag or an MPEG audio frame sync (0xFFEx/0xFFFx).
  if (buffer.toString('ascii', 0, 3) === 'ID3') return { ext: 'mp3', mime: 'audio/mpeg' };
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return { ext: 'mp3', mime: 'audio/mpeg' };
  return undefined;
}

/** Validates audio by content, never by the client-supplied MIME type. */
export function detectAudio(buffer: Buffer): AudioKind | undefined {
  return sniff(buffer);
}

export const CONTENT_AUDIO_EXTS = ['mp3', 'm4a', 'ogg', 'wav'] as const;
export const CONTENT_AUDIO_NAME = /^[a-f0-9]{16}\.(mp3|m4a|ogg|wav)$/;
const MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
};

export function contentTypeForExt(ext: string): string {
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

/** Server-side duration from the bytes themselves; returns 0 when the container omits it. */
export async function readDurationSec(buffer: Buffer, mime: string): Promise<number> {
  try {
    const metadata = await parseBuffer(new Uint8Array(buffer), { mimeType: mime, size: buffer.length });
    const duration = metadata.format.duration;
    if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
      return Math.round(duration * 1000) / 1000;
    }
  } catch (error) {
    logger.warn({ err: (error as Error)?.message, mime }, 'Audio duration probe failed; storing duration 0');
  }
  return 0;
}

// A storageKey is a repo-relative POSIX path (`recordings/<childId>/<uuid>.<ext>` or
// `content/<sha16>.<ext>`). Resolve it strictly under the storage root to defeat traversal.
function resolveKey(storageKey: string): string {
  const root = audioStorageRoot();
  const target = path.resolve(root, storageKey);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw invalidAudio();
  return target;
}

async function atomicWrite(target: string, buffer: Buffer): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp, buffer, { flag: 'wx' });
    await rename(tmp, target);
  } catch (error) {
    await unlink(tmp).catch(() => undefined);
    throw error;
  }
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export const localAudioStorage = {
  /** Writes a child recording to `recordings/<childId>/<uuid>.<ext>` and returns its storageKey. */
  async writeRecording(childId: string, kind: AudioKind, buffer: Buffer): Promise<{ storageKey: string }> {
    audioStorageRoot(); // surface 503 before any disk work in production
    const storageKey = `recordings/${childId}/${randomUUID()}.${kind.ext}`;
    await atomicWrite(resolveKey(storageKey), buffer);
    return { storageKey };
  },

  /**
   * Writes content audio under `content/<sha16>.<ext>` where the name is the SHA-256 of the
   * bytes (first 16 hex). Re-uploading the same file yields the same name — so the same URL.
   */
  async writeContentAudio(kind: AudioKind, buffer: Buffer): Promise<{ storageKey: string; name: string }> {
    audioStorageRoot();
    const sha16 = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const name = `${sha16}.${kind.ext}`;
    const storageKey = `content/${name}`;
    const target = resolveKey(storageKey);
    if (!(await exists(target))) {
      try {
        await atomicWrite(target, buffer);
      } catch (error) {
        // A concurrent identical upload won the `wx` race; the bytes are already correct.
        if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') throw error;
      }
    }
    return { storageKey, name };
  },

  /** Stat for Range/Content-Length; returns undefined when the file is gone. */
  async statKey(storageKey: string): Promise<{ size: number } | undefined> {
    try {
      const info = await stat(resolveKey(storageKey));
      if (!info.isFile()) return undefined;
      return { size: info.size };
    } catch {
      return undefined;
    }
  },

  createReadStream(storageKey: string, range?: { start: number; end: number }) {
    const target = resolveKey(storageKey);
    return range ? createReadStream(target, range) : createReadStream(target);
  },

  /** Best-effort deletion; a missing file is already the desired state. */
  async deleteKey(storageKey: string): Promise<void> {
    try {
      await unlink(resolveKey(storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        logger.warn({ err: (error as Error)?.message, storageKey }, 'Failed to delete audio file');
      }
    }
  },

  /** Resolves `content/<name>` after validating the name against the public regex. */
  contentKeyForName(name: string): string | undefined {
    return CONTENT_AUDIO_NAME.test(name) ? `content/${name}` : undefined;
  },
};
