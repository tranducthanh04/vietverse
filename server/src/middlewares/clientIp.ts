import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';
import { env } from '../config/env.js';

function normalize(ip: string | undefined): string | undefined {
  if (!ip || !isIP(ip)) return undefined;
  if (isIP(ip) === 4) return ip;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([\da-f]+):([\da-f]+)$/i.exec(canonical);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  return canonical;
}

export interface TrustProxyConfig {
  SELF_HOSTED: boolean;
  TRUST_PROXY_HOPS: number;
}

/**
 * Express `trust proxy` hop count. Self-hosted: host nginx + web nginx (default 2), so
 * `req.ip` is the address the host nginx saw; extra client-supplied XFF entries further
 * left are ignored. Elsewhere keep the single platform proxy (Render; Vercel uses its header).
 */
export function trustProxySetting(config: TrustProxyConfig = env): number {
  return config.SELF_HOSTED ? config.TRUST_PROXY_HOPS : 1;
}

export function getClientRateLimitKey(req: Request): string {
  let ip: string | undefined;
  // Vercel overwrites this header at its edge. Do not trust it on other hosts.
  // End-user identity THROUGH the FE rewrite still requires staging verification.
  if (process.env.VERCEL === '1') ip = normalize(req.get('x-vercel-forwarded-for'));
  else if (process.env.RENDER === 'true') ip = normalize(req.ip); // trust proxy=1
  else if (process.env.SELF_HOSTED === '1') ip = normalize(req.ip); // trust proxy=TRUST_PROXY_HOPS
  ip ??= normalize(req.socket.remoteAddress) ?? 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}
