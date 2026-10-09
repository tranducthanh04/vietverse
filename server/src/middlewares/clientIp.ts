import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';

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

export function getClientRateLimitKey(req: Request): string {
  let ip: string | undefined;
  // Vercel overwrites this header at its edge. Do not trust it on other hosts.
  // End-user identity THROUGH the FE rewrite still requires staging verification.
  if (process.env.VERCEL === '1') ip = normalize(req.get('x-vercel-forwarded-for'));
  else if (process.env.RENDER === 'true') ip = normalize(req.ip); // trust proxy=1
  ip ??= normalize(req.socket.remoteAddress) ?? 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}
