import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PointsService } from '../modules/points/points.service.js';
import { Child } from '../models/Child.js';
import { PointTransaction } from '../models/PointTransaction.js';

describe('GET /points/children/:childId totalEarned paging', () => {
  it('computes totalEarned on the first page only and omits it on "Xem thêm" pages', async () => {
    const auth = await AuthService.register({ email: 'points-paging@example.test', password: 'Password123!', displayName: 'Parent' });
    const child = await Child.create({ parentId: auth.user.id, name: 'An', ageGroup: '5-6', companionLanguage: 'en' });
    const base = Date.parse('2026-10-01T00:00:00Z');
    await PointTransaction.collection.insertMany(Array.from({ length: 3 }, (_, i) => ({
      childId: child._id, delta: 5, reason: 'lesson', refId: `l-${i}`, createdAt: new Date(base + i * 1000),
    })));
    const total = vi.spyOn(PointsService, 'getTotalEarned');
    const get = (query: Record<string, string | number>) => request(app)
      .get(`/api/v1/points/children/${child._id}`).query(query).set('Authorization', `Bearer ${auth.accessToken}`);

    const first = await get({ limit: 2 });
    expect(first.status).toBe(200);
    expect(first.body.data.totalEarned).toBe(15);
    expect(total).toHaveBeenCalledTimes(1);

    const next = await get({ limit: 2, before: first.body.data.nextCursor });
    expect(next.status).toBe(200);
    expect(next.body.data).not.toHaveProperty('totalEarned');
    expect(next.body.data.history).toHaveLength(1);
    expect(total).toHaveBeenCalledTimes(1);
  });
});
