import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

const unavailable = () => ({ statusCode: 503, code: 'IMAGE_STORAGE_UNAVAILABLE', message: 'Lưu trữ ảnh chưa sẵn sàng. Vui lòng thử lại.' });
const invalid = () => ({ statusCode: 422, code: 'IMAGE_INVALID', message: 'Ảnh không hợp lệ. Chỉ nhận JPG, PNG hoặc WebP tĩnh.' });
function credentials() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_IMAGE_UPLOAD_PRESET) throw unavailable();
  return { cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET };
}
export const contentImageStorage = {
  sign(publicId: string, timestamp: number) {
    const config = credentials();
    const fields = { public_id: publicId, timestamp: String(timestamp), overwrite: 'false', allowed_formats: 'jpg,png,webp', upload_preset: env.CLOUDINARY_IMAGE_UPLOAD_PRESET };
    return { url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud_name)}/image/upload`, fields: { ...fields, api_key: config.api_key, signature: cloudinary.utils.api_sign_request(fields, config.api_secret) } };
  },
  async inspect(publicId: string) {
    const config = credentials();
    let asset;
    try {
      asset = await cloudinary.api.resource(publicId, { ...config, resource_type: 'image', media_metadata: true, pages: true, timeout: 15000 });
    } catch (error) {
      const failure = error as { http_code?: number; error?: { http_code?: number } } | null;
      if ((failure?.error?.http_code ?? failure?.http_code) === 404) throw { statusCode: 404, code: 'IMAGE_ASSET_NOT_FOUND', message: 'Chưa tìm thấy ảnh đã gửi. Hãy thử lại.' };
      throw unavailable();
    }
    let url: URL;
    try { url = new URL(asset.secure_url); } catch { throw invalid(); }
    if (asset.public_id !== publicId || asset.resource_type !== 'image' || asset.type !== 'upload'
      || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.username || url.password
      || !url.pathname.startsWith(`/${config.cloud_name}/image/upload/`) || !['jpg', 'png', 'webp'].includes(asset.format)
      || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || !Number.isSafeInteger(asset.version) || asset.version <= 0
      || !Number.isSafeInteger(asset.width) || asset.width <= 0 || !Number.isSafeInteger(asset.height) || asset.height <= 0
      || asset.width * asset.height > 40000000 || (asset.pages != null && asset.pages !== 1)) throw invalid();
    if (asset.bytes > 5242880) throw { statusCode: 413, code: 'IMAGE_TOO_LARGE', message: 'Ảnh vượt quá 5 MiB.' };
    // Delivery-only resizing preserves original bytes for server-side size verification.
    return { publicId, url: `https://res.cloudinary.com/${encodeURIComponent(config.cloud_name)}/image/upload/c_limit,w_1920,h_1920/f_auto,q_auto/v${asset.version}/${publicId}.${asset.format}`, bytes: asset.bytes, width: asset.width, height: asset.height };
  },
};
