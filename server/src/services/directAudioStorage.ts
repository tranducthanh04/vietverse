import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export type UploadIntentDto = { intentId: string; expiresAt: string; upload: { url: string; fields: Record<string, string> } };
export type VerifiedAudio = { publicId: string; url: string; bytes: number; durationSec: number; format: string; hasAudio: boolean; hasVideo: boolean };
const unavailable = () => ({ statusCode: 503, code: 'UPLOAD_STORAGE_UNAVAILABLE', message: 'Lưu trữ thu âm chưa sẵn sàng. Vui lòng thử lại.' });
const invalid = () => ({ statusCode: 422, code: 'UPLOAD_AUDIO_INVALID', message: 'Tập tin không phải âm thanh hợp lệ hoặc vượt quá 180 giây.' });

function credentials() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_RECORDING_UPLOAD_PRESET) throw unavailable();
  return { cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET };
}

export const directAudioStorage = {
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
    let resource;
    try {
      resource = await cloudinary.api.resource(publicId, { ...config, resource_type: 'video', media_metadata: true });
    } catch (error) {
      if ((error as { http_code?: number })?.http_code === 404) throw { statusCode: 404, code: 'UPLOAD_ASSET_NOT_FOUND', message: 'Chưa tìm thấy tập tin đã gửi.' };
      throw unavailable();
    }
    let url: URL;
    try { url = new URL(resource.secure_url); } catch { throw invalid(); }
    const hasAudio = typeof resource.audio?.codec === 'string' && resource.audio.codec.length > 0;
    // Empty video metadata is how audio-only containers are represented by Cloudinary.
    // Any populated video metadata is rejected conservatively until real staging verification.
    const hasVideo = resource.video != null && (typeof resource.video !== 'object' || Object.keys(resource.video).length > 0);
    if (resource.public_id !== publicId || resource.resource_type !== 'video' || resource.type !== 'upload'
      || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.username || url.password
      || !url.pathname.startsWith(`/${config.cloud_name}/video/upload/`)
      || !['webm','mp4','m4a','ogg','mp3','wav'].includes(resource.format)
      || !hasAudio || hasVideo || !Number.isFinite(resource.bytes) || !Number.isInteger(resource.bytes) || resource.bytes <= 0
      || !Number.isFinite(resource.duration) || resource.duration <= 0 || resource.duration > 180) throw invalid();
    if (resource.bytes > 5 * 1024 * 1024) throw { statusCode: 413, code: 'UPLOAD_TOO_LARGE', message: 'Bản thu âm vượt quá 5 MiB.' };
    return { publicId, url: url.href, bytes: resource.bytes, durationSec: resource.duration, format: resource.format, hasAudio, hasVideo };
  },
};
