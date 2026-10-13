import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type UploadIntentDto = { intentId: string; expiresAt: string; upload: { url: string; fields: Record<string, string> } };
export type VerifiedAudio = { publicId: string; url: string; bytes: number; durationSec: number; format: string; hasAudio: boolean; hasVideo: boolean };
export type StorageFailure = { statusCode: number; code: string; message: string; retryAfterSec?: number };

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 180;
const AUDIO_FORMATS = ['webm', 'mp4', 'm4a', 'ogg', 'mp3', 'wav'];
// Cloudinary rejects a signed upload whose timestamp is older than one hour
// ("Stale request"). Back-dating the signed timestamp shortens the effective
// provider permission to ~15 minutes: the 10-minute intent plus upload slack.
// Assumption to verify on staging: provider stale window is exactly 1 hour.
const PROVIDER_SIGNATURE_WINDOW_SEC = 60 * 60;
export const SIGNED_UPLOAD_VALIDITY_SEC = 15 * 60;

const unavailable = (): StorageFailure => ({ statusCode: 503, code: 'UPLOAD_STORAGE_UNAVAILABLE', message: 'Lưu trữ thu âm chưa sẵn sàng. Vui lòng thử lại.' });
const invalid = (): StorageFailure => ({ statusCode: 422, code: 'UPLOAD_AUDIO_INVALID', message: 'Tập tin không phải âm thanh hợp lệ hoặc vượt quá 180 giây.' });
// Admin API quota resets hourly; tell the client when a retry can succeed.
const rateLimited = (now = Date.now()): StorageFailure => ({
  statusCode: 503, code: 'UPLOAD_STORAGE_RATE_LIMITED',
  message: 'Hệ thống lưu trữ đang quá tải. Bản thu vẫn được giữ, vui lòng gửi lại sau ít phút.',
  retryAfterSec: Math.max(30, Math.ceil((3600000 - (now % 3600000)) / 1000)),
});

function credentials() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_RECORDING_UPLOAD_PRESET) throw unavailable();
  return { cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET };
}

// Cloudinary JSON errors nest the status; transport errors may expose it directly.
export function providerHttpCode(error: unknown): number | undefined {
  const providerError = error as { http_code?: number; error?: { http_code?: number } } | null;
  return providerError?.error?.http_code ?? providerError?.http_code;
}

const positive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;

type ProviderResource = Record<string, unknown> & {
  video?: unknown; audio?: { codec?: unknown }; width?: unknown; height?: unknown; is_audio?: unknown;
};
// Empty video metadata is how audio-only containers are represented. iOS audio/mp4
// may additionally carry a placeholder video stream; accept it only when Cloudinary
// itself flags the asset as audio and the stream has no dimensions or frames.
function hasRealVideo(resource: ProviderResource): boolean {
  const video = resource.video;
  if (video == null) return false;
  if (typeof video !== 'object') return true;
  const stream = video as Record<string, unknown>;
  if (Object.keys(stream).length === 0) return false;
  const dimensions = [resource.width, resource.height, stream.width, stream.height].some(positive);
  const frames = positive(Number(stream.nb_frames));
  return !(resource.is_audio === true && !dimensions && !frames);
}

export const directAudioStorage = {
  signatureTimestamp(nowMs = Date.now()): number {
    return Math.floor(nowMs / 1000) - (PROVIDER_SIGNATURE_WINDOW_SEC - SIGNED_UPLOAD_VALIDITY_SEC);
  },
  sign(publicId: string, timestamp: number): UploadIntentDto['upload'] {
    const config = credentials();
    const fields = { public_id: publicId, timestamp: String(timestamp), overwrite: 'false', upload_preset: env.CLOUDINARY_RECORDING_UPLOAD_PRESET };
    return {
      url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud_name)}/video/upload`,
      fields: { ...fields, api_key: config.api_key, signature: cloudinary.utils.api_sign_request(fields, config.api_secret) },
    };
  },
  async inspect(publicId: string): Promise<VerifiedAudio> {
    const config = credentials();
    let resource: ProviderResource;
    try {
      // Untrusted provider JSON: every field is validated below.
      resource = await cloudinary.api.resource(publicId, { ...config, resource_type: 'video', media_metadata: true }) as unknown as ProviderResource;
    } catch (error) {
      const httpCode = providerHttpCode(error);
      if (httpCode === 404) {
        throw { statusCode: 404, code: 'UPLOAD_ASSET_NOT_FOUND', message: 'Chưa tìm thấy tập tin đã gửi.' };
      }
      if (httpCode === 420 || httpCode === 429) {
        logger.warn({ httpCode, op: 'recording_inspect' }, 'Cloudinary Admin API rate limited recording finalize');
        throw rateLimited();
      }
      logger.error({ httpCode, op: 'recording_inspect' }, 'Cloudinary recording inspection failed');
      throw unavailable();
    }
    let url: URL;
    try { url = new URL(String(resource.secure_url)); } catch { throw invalid(); }
    const hasAudio = typeof resource.audio?.codec === 'string' && resource.audio.codec.length > 0;
    const hasVideo = hasRealVideo(resource);
    const format = String(resource.format);
    const bytes = resource.bytes as number;
    const duration = resource.duration;
    // Chrome MediaRecorder WebM commonly has no duration header. Byte size still
    // bounds the take; a reported duration must be within limits.
    const durationMissing = duration == null || (typeof duration === 'number' && (Number.isNaN(duration) || duration <= 0));
    if (resource.public_id !== publicId || resource.resource_type !== 'video' || resource.type !== 'upload'
      || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.username || url.password
      || !url.pathname.startsWith(`/${config.cloud_name}/video/upload/`)
      || !AUDIO_FORMATS.includes(format)
      || !hasAudio || hasVideo || !Number.isFinite(bytes) || !Number.isInteger(bytes) || bytes <= 0
      || (!durationMissing && (typeof duration !== 'number' || !Number.isFinite(duration) || duration > MAX_AUDIO_SECONDS))) throw invalid();
    if (bytes > MAX_AUDIO_BYTES) throw { statusCode: 413, code: 'UPLOAD_TOO_LARGE', message: 'Bản thu âm vượt quá 5 MiB.' };
    if (durationMissing) logger.warn({ format, bytes, op: 'recording_inspect' }, 'Accepted audio without provider duration');
    return { publicId, url: url.href, bytes, durationSec: durationMissing ? 0 : duration as number, format, hasAudio, hasVideo };
  },
};
