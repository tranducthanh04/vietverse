import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Children & Ownership API', () => {
  it('GET /children/:id should return 404/403 when accessing a child belonging to another parent', async () => {
    // Parent A
    const parentA = await AuthService.register({
      email: 'parentA@example.com',
      password: 'Password123!',
      displayName: 'Mẹ A',
    });

    // Parent B
    const parentB = await AuthService.register({
      email: 'parentB@example.com',
      password: 'Password123!',
      displayName: 'Mẹ B',
    });

    // Child of Parent A
    const childA = await Child.create({
      parentId: parentA.user.id,
      name: 'Bé Con Của A',
      ageGroup: '5-6',
      companionLanguage: 'en',
    });

    // Parent B tries to access childA
    const res = await request(app)
      .get(`/api/v1/children/${childA._id}`)
      .set('Authorization', `Bearer ${parentB.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
