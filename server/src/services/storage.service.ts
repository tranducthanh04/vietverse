import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageService {
  uploadAudio(buffer: Buffer, mimetype: string, filename?: string): Promise<UploadResult>;
  deleteAudio(publicId: string): Promise<boolean>;
}

export class CloudinaryStorageService implements IStorageService {
  constructor() {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      logger.info('☁️ Cloudinary storage configured successfully');
    }
  }

  async uploadAudio(buffer: Buffer, mimetype: string, filename = 'recording'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'vietverse/recordings',
          public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
        },
        (error, result) => {
          if (error || !result) {
            logger.error({ err: error }, 'Cloudinary audio upload error');
            return reject(error || new Error('Upload failed'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async deleteAudio(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      return true;
    } catch (err) {
      logger.warn({ err, publicId }, 'Failed to delete audio from Cloudinary');
      return false;
    }
  }
}

/**
 * Fallback storage service that converts audio to Base64 Data URI
 * Allows 100% functionality in local dev, offline tests, or before Cloudinary setup.
 */
export class FallbackDataUriStorageService implements IStorageService {
  async uploadAudio(buffer: Buffer, mimetype: string, filename = 'recording'): Promise<UploadResult> {
    const base64Data = buffer.toString('base64');
    const safeMime = mimetype || 'audio/webm';
    const dataUri = `data:${safeMime};base64,${base64Data}`;
    const publicId = `mock_${Date.now()}_${filename}`;
    logger.info({ publicId, mime: safeMime }, 'Stored audio as Data URI (Local/Dev mode)');
    return {
      url: dataUri,
      publicId,
    };
  }

  async deleteAudio(_publicId: string): Promise<boolean> {
    return true;
  }
}

// Select active storage service based on environment configuration
export const storageService: IStorageService =
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ? new CloudinaryStorageService()
    : new FallbackDataUriStorageService();
