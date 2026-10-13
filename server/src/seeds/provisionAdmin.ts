import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { assertOperatorTarget, targetLabel, type OperatorTarget } from './operatorTarget.js';

const seedLockId = 'vietverse-catalog-seed';
const maxPasswordBytes = 72;

export type ProvisionAdminInput = {
  email: string;
  displayName: string;
  password: string;
  exclusiveWindowConfirmed?: boolean;
};

export type ProvisionAdminResult =
  | { status: 'created'; email: string }
  | { status: 'already_admin'; email: string };

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!z.string().email().max(254).safeParse(normalized).success) {
    throw new Error('ADMIN_INPUT_INVALID');
  }
  return normalized;
}

function validateInput(input: ProvisionAdminInput): { email: string; displayName: string; password: string } {
  if (input.exclusiveWindowConfirmed !== true) throw new Error('ADMIN_EXCLUSIVE_WINDOW_REQUIRED');
  if (typeof input.email !== 'string' || typeof input.displayName !== 'string' || typeof input.password !== 'string') {
    throw new Error('ADMIN_INPUT_INVALID');
  }
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 50) throw new Error('ADMIN_INPUT_INVALID');
  if (input.password.length < 12 || Buffer.byteLength(input.password, 'utf8') > maxPasswordBytes) {
    throw new Error('ADMIN_PASSWORD_INVALID');
  }
  return { email, displayName, password: input.password };
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: unknown }).code === 11000);
}

export async function provisionAdmin(input: ProvisionAdminInput): Promise<ProvisionAdminResult> {
  const { email, displayName, password } = validateInput(input);
  const db = mongoose.connection.db;
  if (!db) throw new Error('ADMIN_NOT_CONNECTED');

  const locks = db.collection<{ _id: string; token: string; createdAt: Date }>('seed_locks');
  const token = randomUUID();
  try {
    try {
      await locks.insertOne({ _id: seedLockId, token, createdAt: new Date() }, { writeConcern: { w: 'majority' } });
    } catch (error) {
      if (isDuplicateKey(error)) throw new Error('ADMIN_WRITER_LOCKED');
      throw new Error('ADMIN_PROVISION_FAILED');
    }

    const existing = await User.findOne({ email }).select({ role: 1 }).lean();
    if (existing) {
      if (existing.role === ROLES.ADMIN) return { status: 'already_admin', email };
      throw new Error('ADMIN_EMAIL_OWNED_BY_PARENT');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Admin provisioning must not inherit the legacy demo parent-gate PIN.
    const parentGatePin = await bcrypt.hash(randomUUID(), 10);
    await User.collection.createIndex({ email: 1 }, { unique: true });
    try {
      await new User({ email, passwordHash, displayName, role: ROLES.ADMIN, parentGatePin }).save({ w: 'majority' });
    } catch (error) {
      if (isDuplicateKey(error)) {
        const raced = await User.findOne({ email }).select({ role: 1 }).lean();
        if (raced?.role === ROLES.ADMIN) return { status: 'already_admin', email };
        if (raced) throw new Error('ADMIN_EMAIL_OWNED_BY_PARENT');
      }
      throw new Error('ADMIN_PROVISION_FAILED');
    }
    return { status: 'created', email };
  } finally {
    await locks.deleteOne({ _id: seedLockId, token }, { writeConcern: { w: 'majority' } });
  }
}

// Host, DB user and DB name come from the operator (launcher env), not from this public repo.
export function validateAdminTarget(uri: string, target: unknown): OperatorTarget {
  return assertOperatorTarget(uri, target, 'ADMIN_TARGET_INVALID');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 0) throw new Error('ADMIN_ARGUMENTS_INVALID');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
    if (input.length > 8192) throw new Error('ADMIN_INPUT_INVALID');
  }
  const payload = JSON.parse(input) as ProvisionAdminInput & { uri: string; target: unknown };
  const target = validateAdminTarget(payload.uri, payload.target);
  await mongoose.connect(payload.uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000, maxPoolSize: 2 });
  input = '';
  try {
    const result = await provisionAdmin(payload);
    const user = await User.findOne({ email: result.email }).select('role passwordHash');
    const passwordVerified = user?.role === ROLES.ADMIN && await bcrypt.compare(payload.password, user.passwordHash);
    payload.password = '';
    payload.uri = '';
    console.log(JSON.stringify({ target: targetLabel(target), ...result, passwordVerified }));
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(async (error: unknown) => {
    const code = error instanceof Error && /^ADMIN_[A-Z_]+$/.test(error.message) ? error.message : 'ADMIN_PROVISION_FAILED';
    console.error(JSON.stringify({ error: code }));
    await mongoose.disconnect().catch(() => undefined);
    process.exitCode = 1;
  });
}
