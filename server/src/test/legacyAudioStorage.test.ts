import { afterEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageService } from '../services/storage.service.js';

afterEach(() => vi.restoreAllMocks());
describe('legacy audio asset ownership', () => {
  it('isolates simultaneous same-name uploads and disables provider overwrite', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567890000);
    const assets = new Map<string, Buffer>();
    const options: Array<Record<string, unknown>> = [];
    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((config: Record<string, unknown>, callback: Function) => {
      options.push(config);
      return { end(buffer: Buffer) {
        const id = `${config.folder}/${config.public_id}`;
        if (assets.has(id) && config.overwrite === false) return callback(new Error('already exists'));
        assets.set(id, buffer);
        callback(null, { public_id: id, secure_url: `https://res.cloudinary.com/test/video/upload/${id}` });
      } };
    }) as never);
    const storage = new CloudinaryStorageService();
    const [one, two] = await Promise.all([
      storage.uploadAudio(Buffer.from('child-one'), 'audio/webm', 'recording.webm'),
      storage.uploadAudio(Buffer.from('child-two'), 'audio/webm', 'recording.webm'),
    ]);
    expect(one.publicId).not.toBe(two.publicId);
    expect(options.map(value => value.overwrite)).toEqual([false, false]);
    vi.spyOn(cloudinary.uploader, 'destroy').mockImplementation(async id => { assets.delete(id); return { result: 'ok' }; });
    await storage.deleteAudio(one.publicId);
    expect(assets.get(two.publicId)?.toString()).toBe('child-two');
  });
});
