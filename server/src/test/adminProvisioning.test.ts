import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { describe, expect, it } from 'vitest';
import { User } from '../models/User.js';
import { provisionAdmin, validateAdminTarget } from '../seeds/provisionAdmin.js';

describe('production admin provisioning', () => {
  it('creates one admin without a subscription and is safe to retry', async () => {
    const first = await provisionAdmin({ email: 'admin@example.test', displayName: 'Vietverse Admin', password: 'StrongAdminPass!2026', exclusiveWindowConfirmed: true });
    expect(first.status).toBe('created');
    expect(await User.findOne({ email: 'admin@example.test' })).toMatchObject({ role: 'admin', displayName: 'Vietverse Admin' });
    expect(await mongoose.connection.db!.collection('subscriptions').countDocuments()).toBe(0);
    const retry = await provisionAdmin({ email: 'admin@example.test', displayName: 'Changed', password: 'AnotherStrongPass!2026', exclusiveWindowConfirmed: true });
    expect(retry.status).toBe('already_admin');
    expect((await User.findOne({ email: 'admin@example.test' }))!.displayName).toBe('Vietverse Admin');
    const stored = (await User.findOne({ email: 'admin@example.test' }))!;
    expect(await bcrypt.compare('StrongAdminPass!2026', stored.passwordHash)).toBe(true);
    expect(await bcrypt.compare('AnotherStrongPass!2026', stored.passwordHash)).toBe(false);
    expect(await User.countDocuments()).toBe(1);
  });

  it('never promotes an existing parent implicitly', async () => {
    await User.create({ email: 'parent@example.test', passwordHash: 'hash', displayName: 'Parent', role: 'parent' });
    await expect(provisionAdmin({ email: 'parent@example.test', displayName: 'Admin', password: 'StrongAdminPass!2026', exclusiveWindowConfirmed: true })).rejects.toThrow('ADMIN_EMAIL_OWNED_BY_PARENT');
    expect((await User.findOne({ email: 'parent@example.test' }))!.role).toBe('parent');
  });

  it('requires an explicit exclusive writer window', async () => {
    await expect(provisionAdmin({ email: 'new@example.test', displayName: 'Admin', password: 'StrongAdminPass!2026' })).rejects.toThrow('ADMIN_EXCLUSIVE_WINDOW_REQUIRED');
  });

  it('does not create an admin with the known default parent PIN', async () => {
    await provisionAdmin({ email: ' NEW@EXAMPLE.TEST ', displayName: 'Admin', password: 'StrongAdminPass!2026', exclusiveWindowConfirmed: true });
    const stored = (await User.findOne({ email: 'new@example.test' }))!;
    expect(await bcrypt.compare('1234', stored.parentGatePin!)).toBe(false);
  });

  it('preserves another catalog writer lock and creates no user', async () => {
    await mongoose.connection.db!.collection<{ _id: string; token: string }>('seed_locks').insertOne({ _id: 'vietverse-catalog-seed', token: 'other-writer' });
    await expect(provisionAdmin({ email: 'admin@example.test', displayName: 'Admin', password: 'StrongAdminPass!2026', exclusiveWindowConfirmed: true })).rejects.toThrow('ADMIN_WRITER_LOCKED');
    expect(await User.countDocuments()).toBe(0);
    expect(await mongoose.connection.db!.collection('seed_locks').countDocuments({ token: 'other-writer' })).toBe(1);
  });

  it.each(['short', 'x'.repeat(73), '\u00e9'.repeat(37)])('rejects weak or bcrypt-truncated passwords without writing', async password => {
    await expect(provisionAdmin({ email: 'admin@example.test', displayName: 'Admin', password, exclusiveWindowConfirmed: true })).rejects.toThrow('ADMIN_PASSWORD_INVALID');
    expect(await User.countDocuments()).toBe(0);
  });

  it('allows only the approved Atlas user, host and test database', () => {
    expect(() => validateAdminTarget('mongodb+srv://binhlqhe181123_db_user:fake@thanh.841ysjn.mongodb.net/test?retryWrites=true&w=majority')).not.toThrow();
    for (const uri of [
      'mongodb+srv://binhlqhe181123_db_user:fake@thanh.841ysjn.mongodb.net/production',
      'mongodb+srv://binhlqhe181123_db_user:fake@other.example.com/test',
      'mongodb+srv://other_user:fake@thanh.841ysjn.mongodb.net/test',
      'mongodb+srv://binhlqhe181123_db_user:fake@thanh.841ysjn.mongodb.net/test?tls=false',
    ]) expect(() => validateAdminTarget(uri)).toThrow('ADMIN_TARGET_INVALID');
  });

  it.each([
    { email: 'bad-email', displayName: 'Admin' },
    { email: 'admin@example.test', displayName: ' ' },
  ])('rejects invalid identity without writing', async identity => {
    await expect(provisionAdmin({ ...identity, password: 'StrongAdminPass!2026', exclusiveWindowConfirmed: true })).rejects.toThrow('ADMIN_INPUT_INVALID');
    expect(await User.countDocuments()).toBe(0);
    expect(await mongoose.connection.db!.collection('seed_locks').countDocuments()).toBe(0);
  });
});
