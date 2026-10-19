import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

// A child recording is sensitive, so its audio URL is not public: each API response that
// returns a recording signs a short-lived HMAC token bound to that recording's id. The
// <audio> element cannot send an Authorization header, so the token travels in the query.
const AUDIENCE = 'recording-audio';
const TTL_SECONDS = 60 * 60; // 1 hour

export function signRecordingAudioToken(recordingId: string): string {
  return jwt.sign({ rid: recordingId }, env.JWT_SECRET, {
    algorithm: 'HS256',
    audience: AUDIENCE,
    expiresIn: TTL_SECONDS,
  });
}

export function buildRecordingAudioUrl(recordingId: string): string {
  return `/api/v1/recordings/${recordingId}/audio?t=${signRecordingAudioToken(recordingId)}`;
}

/** True only when the token is a valid, unexpired audio ticket for exactly this recording. */
export function verifyRecordingAudioToken(token: string, recordingId: string): boolean {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], audience: AUDIENCE });
    return typeof decoded === 'object' && decoded !== null && (decoded as { rid?: unknown }).rid === recordingId;
  } catch {
    return false;
  }
}
