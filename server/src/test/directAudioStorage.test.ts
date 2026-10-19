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
    { duration: 180.1 }, { duration: Infinity }, { duration: '12' },
    { video: { codec: 'h264', width: 640, height: 480 }, is_audio: true },
    { video: { codec: 'h264' }, width: 640, height: 480, is_audio: true },
    { video: { codec: 'h264', nb_frames: '250' }, is_audio: true },
    { duration: undefined, bytes: 5242881 }, { duration: undefined, audio: {} }, { duration: undefined, format: 'mkv' },
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
  it('recognizes the Admin SDK nested 404 so a missing upload can be retried', async () => {
    vi.spyOn(cloudinary.api, 'resource').mockRejectedValue({
      error: { http_code: 404, message: 'Resource not found' },
      request_options: { auth: 'private-provider-credentials' },
    });
    await expect(directAudioStorage.inspect('random-asset')).rejects.toEqual({
      statusCode: 404, code: 'UPLOAD_ASSET_NOT_FOUND', message: 'Chưa tìm thấy tập tin đã gửi.',
    });
  });
  it.each([401, 403, 500])('does not permit reupload or expose SDK credentials on nested %s', async http_code => {
    vi.spyOn(cloudinary.api, 'resource').mockRejectedValue({
      error: { http_code, message: 'private-provider-details' },
      request_options: { auth: 'private-provider-credentials' },
    });
    await expect(directAudioStorage.inspect('random-asset')).rejects.toEqual({
      statusCode: 503, code: 'UPLOAD_STORAGE_UNAVAILABLE', message: 'Lưu trữ thu âm chưa sẵn sàng. Vui lòng thử lại.',
    });
  });
it.each([{ duration: undefined }, { duration: null }, { duration: 0 }, { duration: NaN }])('accepts audio whose provider metadata lacks a duration %j', async change => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({ ...metadata(), ...change } as never);
    expect(await directAudioStorage.inspect('random-asset')).toMatchObject({ durationSec: 0, hasAudio: true, hasVideo: false });
  });
  it('treats an iOS mp4 placeholder video stream as audio only when Cloudinary flags it as audio', async () => {
    const ios = { ...metadata(), format: 'mp4', audio: { codec: 'aac' }, video: { codec: 'h264', pix_format: 'yuv420p' } };
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValueOnce({ ...ios, is_audio: true } as never).mockResolvedValueOnce(ios as never);
    expect(await directAudioStorage.inspect('random-asset')).toMatchObject({ format: 'mp4', hasVideo: false });
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: 422, code: 'UPLOAD_AUDIO_INVALID' });
  });
  // Shapes captured 2026-10-18 from the real Admin API (`api.resource(..., { media_metadata: true })`)
  // for Chrome MediaRecorder takes uploaded through the recording preset (non-media fields trimmed).
  const adminBase = { public_id: 'random-asset', resource_type: 'video', type: 'upload', secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v1/random-asset.webm', width: 0, height: 0, has_audio: true, audio_codec: 'opus', pages: 0 };
  const chromeAudioWebm = { ...adminBase, format: 'mka', bytes: 41932, duration: 2.94,
    video_metadata: { width: 0, height: 0, has_audio: true, format: 'mka', duration: 2.94, audio: { codec: 'opus', frequency: 48000, channels: 1 }, video: {}, is_audio: true } };
  const chromeAudioMp4 = { ...adminBase, format: 'mp4', bytes: 49091, duration: 2.961,
    video_metadata: { width: 0, height: 0, has_audio: true, format: 'mp4', duration: 2.961, audio: { codec: 'opus', frequency: 48000, channels: 1 }, video: { metadata: { encoded_date: 'UTC 2026-10-18 16:13:52' } }, is_audio: false } };
  const chromeVideoWebm = { ...adminBase, format: 'webm', bytes: 54717, duration: 2.947962, width: 64, height: 64, frame_rate: 1000,
    video_metadata: { width: 64, height: 64, has_video: true, has_audio: true, format: 'webm', duration: 2.947962, audio: { codec: 'opus' }, video: { pix_format: 'yuv420p', codec: 'vp8' }, is_audio: false } };
  it.each([['Chrome audio/webm (reported as mka)', chromeAudioWebm, 'mka'], ['Chrome audio/mp4', chromeAudioMp4, 'mp4']])('accepts the real Admin API shape for %s', async (_label, resource, format) => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource as never);
    expect(await directAudioStorage.inspect('random-asset')).toMatchObject({ format, hasAudio: true, hasVideo: false });
  });
  it('rejects a real Admin API shape that carries a video stream', async () => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(chromeVideoWebm as never);
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: 422, code: 'UPLOAD_AUDIO_INVALID' });
  });
  it('rejects a flattened Admin API shape that reports a video track without stream details', async () => {
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({ ...chromeAudioWebm, video_metadata: { ...chromeAudioWebm.video_metadata, video: undefined, has_video: true, is_audio: false } } as never);
    await expect(directAudioStorage.inspect('random-asset')).rejects.toMatchObject({ statusCode: 422 });
  });
  it.each([420, 429])('maps provider rate limiting %s to a distinct retryable code', async http_code => {
    vi.spyOn(cloudinary.api, 'resource').mockRejectedValue({ error: { http_code, message: 'private-provider-details' }, request_options: { auth: 'private-provider-credentials' } });
    const failure = await directAudioStorage.inspect('random-asset').catch(error => error);
    expect(failure).toMatchObject({ statusCode: 503, code: 'UPLOAD_STORAGE_RATE_LIMITED' });
    expect(failure.retryAfterSec).toBeGreaterThanOrEqual(30);
    expect(failure.retryAfterSec).toBeLessThanOrEqual(3600);
    expect(JSON.stringify(failure)).not.toContain('private');
  });
  it('back-dates the signed timestamp so provider permission lapses ~15 minutes after issuance', () => {
    const now = Date.UTC(2026, 9, 13, 2, 0, 0);
    expect(directAudioStorage.signatureTimestamp(now)).toBe(now / 1000 - 45 * 60);
  });
});
