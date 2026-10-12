import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { afterEach, expect, it, vi } from 'vitest';
import { GoogleAuthService } from '../modules/auth/google.service.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

afterEach(() => { vi.restoreAllMocks(); env.GOOGLE_CLIENT_ID = ''; });

it('verifies the actual RSA signature before issuing a Vietverse session', async () => {
  env.GOOGLE_CLIENT_ID = 'signature-test-client';
  const trusted = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const untrusted = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  // Replace only certificate download; Google's real JWT verifier runs unchanged.
  vi.spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync').mockResolvedValue({
    certs: { 'test-key': trusted.publicKey.export({ type: 'spki', format: 'pem' }).toString() },
    format: 'PEM' as never,
  });
  const flow = await GoogleAuthService.start();
  const payload = { sub: 'real-signature-subject', email: 'signed@example.test', email_verified: true, nonce: flow.nonce };
  const options = { algorithm: 'RS256' as const, keyid: 'test-key', audience: 'signature-test-client', issuer: 'https://accounts.google.com', expiresIn: 3600 };
  const forged = jwt.sign(payload, untrusted.privateKey, options);
  await expect(GoogleAuthService.signIn(flow.token, flow.nonce, forged)).rejects.toMatchObject({ code: 'GOOGLE_TOKEN_INVALID' });
  expect(await User.countDocuments()).toBe(0);
  const signed = jwt.sign(payload, trusted.privateKey, options);
  const result = await GoogleAuthService.signIn(flow.token, flow.nonce, signed);
  expect(result).toMatchObject({ user: { email: 'signed@example.test', role: 'parent' } });
});
