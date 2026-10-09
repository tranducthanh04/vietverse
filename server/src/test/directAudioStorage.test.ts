import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { directAudioStorage } from '../services/directAudioStorage.js';

const original = { ...env };
beforeEach(() => Object.assign(env, { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret', CLOUDINARY_RECORDING_UPLOAD_PRESET: 'test-signed' }));
afterEach(() => { Object.assign(env, original); vi.restoreAllMocks(); });
const metadata = () => ({ public_id: 'random-asset', resource_type: 'video', type: 'upload', secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v1/random-asset.webm', bytes: 123, duration: 1.25, format: 'webm', audio: { codec: 'opus', frequency: 48000, channels: 1 }, video: {} });
describe('server provider verification', () => {
  it.each(['webm','mp4','ogg','mp3','wav'])('normalizes audio-only %s from the SDK resource response', async format => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({ ...metadata(), format } as never);
    const result = await directAudioStorage.inspect('random-asset');
    expect(result).toMatchObject({ publicId: 'random-asset', bytes: 123, durationSec: 1.25, hasAudio: true, hasVideo: false, format });
  });
  it.each([
    { video: { codec: 'h264' } }, { audio: undefined }, { audio: {} },
    { duration: undefined }, { duration: NaN }, { duration: 180.1 },
    { bytes: 0 }, { bytes: 5242881 }, { format: 'jpg' },
    { resource_type: 'image' }, { public_id: 'other' },
    { secure_url: 'https://attacker.test/audio' },
    { secure_url: 'https://res.cloudinary.com.attacker.test/audio' },
    { secure_url: 'http://res.cloudinary.com/test-cloud/audio' },
  ])('rejects unsafe or incomplete provider metadata %j', async change => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({ ...metadata(), ...change } as never);
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: expect.any(Number) });
  });
  it('accepts the exact size and duration limits', async () => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({ ...metadata(), bytes: 5242880, duration: 180 } as never);
    expect(await directAudioStorage.inspect('random-asset')).toMatchObject({ bytes: 5242880, durationSec: 180 });
  });
  it('distinguishes missing assets from a safe provider failure', async () => {
    vi.spyOn(cloudinary.api, 'resource').mockRejectedValueOnce({ http_code: 404 }).mockRejectedValueOnce(new Error('private credential details'));
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: 404, code: 'UPLOAD_ASSET_NOT_FOUND' });
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: 503, code: 'UPLOAD_STORAGE_UNAVAILABLE' });
  });
});
