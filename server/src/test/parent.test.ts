import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Parent Gate & Parent Portal API', () => {
  let parentToken: string;
  let parentId: string;
  let childId: string;

  beforeEach(async () => {
    const reg = await AuthService.register({
      email: `parent_${Date.now()}@example.com`,
      password: 'Password123!',
      displayName: 'Phụ Huynh Test',
    });
    parentToken = reg.accessToken;
    parentId = reg.user.id;

    const child = await Child.create({
      parentId,
      name: 'Bé Bắp',
      ageGroup: '5-6',
      companionLanguage: 'en',
      screenTimeLimit: 20,
    });
    childId = child._id.toString();
  });

  it('GET /parent/gate/challenge generates a multiplication challenge', async () => {
    const res = await request(app)
      .get('/api/v1/parent/gate/challenge')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challengeToken).toBeDefined();
    expect(res.body.data.question).toContain('×');
    expect(res.body.data.num1).toBeGreaterThanOrEqual(4);
    expect(res.body.data.num2).toBeGreaterThanOrEqual(4);
  });

  it('POST /parent/gate/verify rejects wrong answer and accepts correct answer', async () => {
    // 1. Get challenge
    const chalRes = await request(app)
      .get('/api/v1/parent/gate/challenge')
      .set('Authorization', `Bearer ${parentToken}`);
    const { challengeToken, num1, num2 } = chalRes.body.data;

    // 2. Submit wrong answer
    const wrongRes = await request(app)
      .post('/api/v1/parent/gate/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ challengeToken, answer: 999 });

    expect(wrongRes.status).toBe(400);
    expect(wrongRes.body.success).toBe(false);

    // 3. Submit correct answer
    const correctRes = await request(app)
      .post('/api/v1/parent/gate/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ challengeToken, answer: num1 * num2 });

    expect(correctRes.status).toBe(200);
    expect(correctRes.body.success).toBe(true);
    expect(correctRes.body.data.gateToken).toBeDefined();
    expect(correctRes.body.data.expiresIn).toBe(900);
  });

  it('POST /parent/gate/verify accepts default PIN 1234', async () => {
    const res = await request(app)
      .post('/api/v1/parent/gate/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gateToken).toBeDefined();
  });

  it('Protected parent routes reject requests missing X-Parent-Gate-Token', async () => {
    // Attempt GET /parent/progress/:childId without gate token
    const res = await request(app)
      .get(`/api/v1/parent/progress/${childId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PARENT_GATE_REQUIRED');

    // Attempt PATCH /parent/screen-time without gate token
    const patchRes = await request(app)
      .patch('/api/v1/parent/screen-time')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ childId, limitMinutes: 30 });

    expect(patchRes.status).toBe(403);
    expect(patchRes.body.error.code).toBe('PARENT_GATE_REQUIRED');
  });

  it('Protected parent routes succeed with valid X-Parent-Gate-Token', async () => {
    // 1. Authenticate gate with PIN
    const gateRes = await request(app)
      .post('/api/v1/parent/gate/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ pin: '1234' });

    const gateToken = gateRes.body.data.gateToken;

    // 2. Access progress
    const progressRes = await request(app)
      .get(`/api/v1/parent/progress/${childId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .set('X-Parent-Gate-Token', gateToken);

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.success).toBe(true);
    expect(progressRes.body.data.child.name).toBe('Bé Bắp');

    // 3. Update screen time
    const patchRes = await request(app)
      .patch('/api/v1/parent/screen-time')
      .set('Authorization', `Bearer ${parentToken}`)
      .set('X-Parent-Gate-Token', gateToken)
      .send({ childId, limitMinutes: 30 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.screenTimeLimit).toBe(30);

    // 4. Reject limit not in [0, 15, 20, 30] (e.g. 45 or 60)
    const invalidPatchRes = await request(app)
      .patch('/api/v1/parent/screen-time')
      .set('Authorization', `Bearer ${parentToken}`)
      .set('X-Parent-Gate-Token', gateToken)
      .send({ childId, limitMinutes: 45 });

    expect(invalidPatchRes.status).toBe(400);
  });

  it('GET /auth/me never exposes parentGatePin', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.parentGatePin).toBeUndefined();
  });
});
