import { afterEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

afterEach(() => vi.restoreAllMocks());

describe('database connection cache', () => {
  it('shares one in-flight network connection between concurrent callers', async () => {
    const originalState = mongoose.connection.readyState;
    Reflect.set(mongoose.connection, '_readyState', 0);
    const finish: Array<(value: typeof mongoose) => void> = [];
    const network = vi.spyOn(mongoose, 'connect').mockImplementation(() =>
      new Promise<typeof mongoose>(resolve => { finish.push(resolve); }));
    try {
      const left = connectDB('mongodb://test-only/cache');
      const right = connectDB('mongodb://test-only/cache');
      finish.forEach(resolve => resolve(mongoose));
      expect(await left).toBe(mongoose);
      expect(await right).toBe(mongoose);
      expect(network).toHaveBeenCalledTimes(1);
    } finally { Reflect.set(mongoose.connection, '_readyState', originalState); }
  });

  it('does not connect again when the existing pool is ready', async () => {
    const network = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    expect(await connectDB('mongodb://test-only/warm')).toBe(mongoose);
    expect(network).not.toHaveBeenCalled();
  });

  it('can retry after a failed cold connection', async () => {
    const originalState = mongoose.connection.readyState;
    Reflect.set(mongoose.connection, '_readyState', 0);
    const network = vi.spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('failed test connection'))
      .mockResolvedValueOnce(mongoose);
    try {
      await expect(connectDB('mongodb://test-only/retry')).rejects.toThrow('failed test connection');
      expect(await connectDB('mongodb://test-only/retry')).toBe(mongoose);
      expect(network).toHaveBeenCalledTimes(2);
    } finally { Reflect.set(mongoose.connection, '_readyState', originalState); }
  });
});
