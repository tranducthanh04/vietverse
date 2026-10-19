import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Builds a valid mono 8-bit PCM WAV of the given length so music-metadata reports a duration. */
export function makeWav(seconds = 0.5): Buffer {
  const sampleRate = 8000;
  const channels = 1;
  const bytesPerSample = 1;
  const dataLen = Math.max(1, Math.floor(sampleRate * seconds * channels * bytesPerSample));
  const buffer = Buffer.alloc(44 + dataLen);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLen, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLen, 40);
  // Fill with mid-level samples (0x80 = silence for unsigned 8-bit PCM).
  buffer.fill(0x80, 44);
  return buffer;
}

/** A buffer that is clearly not audio, for magic-byte rejection tests. */
export function notAudio(): Buffer {
  return Buffer.from('this is definitely not an audio file, just plain text content');
}

/** Creates an isolated temp storage directory and returns it with a cleanup function. */
export function makeTempStorageDir(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'vv-audio-test-'));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
