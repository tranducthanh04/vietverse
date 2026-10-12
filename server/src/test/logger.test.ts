import { describe, expect, it, vi } from 'vitest';
import { Writable } from 'node:stream';
import express from 'express';
import request from 'supertest';
import { pinoHttp } from 'pino-http';

const captured = vi.hoisted(() => ({ lines: [] as string[] }));
vi.mock('pino', async importOriginal => {
  const actual = await importOriginal<typeof import('pino')>();
  const create = Object.assign((options: Parameters<typeof actual.default>[0]) => actual.default(options, new Writable({
    write(chunk, _encoding, callback) { captured.lines.push(String(chunk)); callback(); },
  })), actual.default);
  return { ...actual, default: create };
});
import { logger } from '../utils/logger.js';

describe('HTTP token redaction', () => {
  it('omits all authentication headers while retaining request and response diagnostics', async () => {
    captured.lines.length = 0;
    const previousLevel = logger.level;
    logger.level = 'info';
    try {
      const app = express();
      app.use(pinoHttp({ logger }));
      app.get('/log-test', (_req, res) => {
        res.cookie('refreshToken', 'FAKE_REFRESH_TOKEN', { httpOnly: true });
        res.sendStatus(200);
      });
      await request(app).get('/log-test')
        .set('Authorization', 'Bearer FAKE_ACCESS_TOKEN')
        .set('Cookie', 'refreshToken=FAKE_REQUEST_COOKIE')
        .set('X-Parent-Gate-Token', 'FAKE_GATE_TOKEN').expect(200);
      const output = captured.lines.join('');
      expect(output).toContain('/log-test');
      expect(output).toContain('"statusCode":200');
      for (const secret of ['FAKE_ACCESS_TOKEN', 'FAKE_REQUEST_COOKIE', 'FAKE_REFRESH_TOKEN', 'FAKE_GATE_TOKEN']) {
        expect(output).not.toContain(secret);
      }
    } finally { logger.level = previousLevel; }
  });
});
