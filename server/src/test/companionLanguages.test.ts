import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { createChildSchema, updateChildSchema } from '../modules/children/children.validation.js';

describe('companion languages compatibility', () => {
  it('persists multiple languages and exposes the first to legacy clients', async () => {
    const parent = await AuthService.register({ email: 'languages@example.test', password: 'Password123!', displayName: 'Owner' });
    const response = await request(app).post('/api/v1/children')
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({ name: 'An', ageGroup: '5-6', companionLanguages: ['ja', 'en'] });
    expect(response.status).toBe(201);
    expect(response.body.data.companionLanguages).toEqual(['ja', 'en']);
    expect(response.body.data.companionLanguage).toBe('ja');
    const updated = await request(app).put(`/api/v1/children/${response.body.data._id}`)
      .set('Authorization', `Bearer ${parent.accessToken}`).send({ companionLanguage: 'fr' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.companionLanguages).toEqual(['fr']);
    expect((await Child.findById(response.body.data._id))!.companionLanguage).toBe('fr');
  });

  it('accepts Vietnamese as a companion language and keeps it first', async () => {
    const parent = await AuthService.register({ email: 'vi-language@example.test', password: 'Password123!', displayName: 'Owner' });
    const response = await request(app).post('/api/v1/children')
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({ name: 'Bi', ageGroup: '5-6', companionLanguages: ['vi', 'en'] });
    expect(response.status).toBe(201);
    expect(response.body.data.companionLanguages).toEqual(['vi', 'en']);
    expect(response.body.data.companionLanguage).toBe('vi');
    expect((await Child.findById(response.body.data._id))!.companionLanguage).toBe('vi');
  });

  it('rejects an unknown companion language with 400', async () => {
    const parent = await AuthService.register({ email: 'bad-language@example.test', password: 'Password123!', displayName: 'Owner' });
    const response = await request(app).post('/api/v1/children')
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({ name: 'Bi', ageGroup: '5-6', companionLanguages: ['xx'] });
    expect(response.status).toBe(400);
  });

  it('reads legacy documents without writing or changing their other fields', async () => {
    const id = new Types.ObjectId();
    const parentId = new Types.ObjectId();
    await mongoose.connection.db!.collection('children').insertOne({ _id: id, parentId, name: 'An', companionLanguage: 'ko', viviPoints: 37 });
    const child = await Child.findById(id);
    expect(child!.toJSON()).toMatchObject({ companionLanguage: 'ko', companionLanguages: ['ko'], viviPoints: 37 });
    expect(await mongoose.connection.db!.collection('children').findOne({ _id: id })).not.toHaveProperty('companionLanguages');
  });

  it('rejects empty, repeated, unknown and contradictory language values', async () => {
    for (const fields of [
      { companionLanguages: [] }, { companionLanguages: ['en', 'en'] },
      { companionLanguages: ['xx'] }, { companionLanguages: ['ja'], companionLanguage: 'en' },
    ]) {
      expect(createChildSchema.safeParse({ name: 'An', ageGroup: '5-6', ...fields }).success).toBe(false);
      expect(updateChildSchema.safeParse(fields).success).toBe(false);
    }
    expect(createChildSchema.safeParse({ name: 'An', ageGroup: '5-6', companionLanguage: 'en' }).success).toBe(true);
    expect(createChildSchema.safeParse({ name: 'An', ageGroup: '5-6', companionLanguages: ['en', 'ja'] }).success).toBe(true);
    expect(createChildSchema.safeParse({ name: 'An', ageGroup: '5-6', companionLanguages: ['vi', 'en'] }).success).toBe(true);
    for (const companionLanguages of [[], ['en', 'en'], ['xx']]) {
      const invalid = new Child({ parentId: new Types.ObjectId(), name: 'An', companionLanguages });
      await expect(invalid.validate()).rejects.toThrow();
    }
  });
});
