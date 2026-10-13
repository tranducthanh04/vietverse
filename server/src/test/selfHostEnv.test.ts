import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
  vi.resetModules();
  return (await import('../config/env.js')).env;
}

describe('self-host env schema', () => {
  it('defaults to the platform behaviour (not self-hosted, 2 hops if enabled)', async () => {
    const env = await loadEnv({ SELF_HOSTED: undefined, TRUST_PROXY_HOPS: undefined });
    expect(env.SELF_HOSTED).toBe(false);
    expect(env.TRUST_PROXY_HOPS).toBe(2);
  });

  it('enables self-host mode only for "1" and treats an empty value as unset', async () => {
    expect((await loadEnv({ SELF_HOSTED: '1', TRUST_PROXY_HOPS: '' })).SELF_HOSTED).toBe(true);
    expect((await loadEnv({ SELF_HOSTED: '1', TRUST_PROXY_HOPS: '' })).TRUST_PROXY_HOPS).toBe(2);
    expect((await loadEnv({ SELF_HOSTED: '0' })).SELF_HOSTED).toBe(false);
    expect((await loadEnv({ SELF_HOSTED: '' })).SELF_HOSTED).toBe(false);
  });

  it('accepts an explicit hop count', async () => {
    expect((await loadEnv({ SELF_HOSTED: '1', TRUST_PROXY_HOPS: '3' })).TRUST_PROXY_HOPS).toBe(3);
  });

  it('rejects ambiguous flags and out-of-range hop counts at startup', async () => {
    await expect(loadEnv({ SELF_HOSTED: 'true' })).rejects.toThrow(/SELF_HOSTED/);
    await expect(loadEnv({ TRUST_PROXY_HOPS: '0' })).rejects.toThrow(/TRUST_PROXY_HOPS/);
    await expect(loadEnv({ TRUST_PROXY_HOPS: 'two' })).rejects.toThrow(/TRUST_PROXY_HOPS/);
  });
});
