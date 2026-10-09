import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { Recording } from '../models/Recording.js';
import { RecordingUploadIntent } from '../models/RecordingUploadIntent.js';
import { RateLimitBucket } from '../models/RateLimitBucket.js';

const required: Array<{ collection: mongoose.mongo.Collection; indexes: mongoose.mongo.IndexDescription[] }> = [
  { collection: RateLimitBucket.collection, indexes: [{ key: { resetAt: 1 }, name: 'resetAt_1', expireAfterSeconds: 0 }] },
  { collection: RecordingUploadIntent.collection, indexes: [
    { key: { parentId: 1, requestId: 1 }, name: 'parentId_1_requestId_1', unique: true },
    { key: { deleteAt: 1 }, name: 'deleteAt_1', expireAfterSeconds: 0 },
    { key: { childId: 1 }, name: 'childId_1' },
  ] },
  { collection: Recording.collection, indexes: [{ key: { uploadIntentId: 1 }, name: 'uploadIntentId_1', unique: true, sparse: true }] },
];

// Dry-run is a pure plan: no DB connection or auto-index initialization.
export async function prepareDeploymentIndexes({ apply = false }: { apply?: boolean } = {}) {
  const planned = required.map(entry => ({ collection: entry.collection.collectionName, indexes: entry.indexes }));
  if (!apply) return { applied: false, planned };
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) {
    if (!process.env.MONGODB_URI) throw new Error('Cần cung cấp MONGODB_URI của môi trường đã xác minh trước khi apply.');
    await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false, maxPoolSize: 5, minPoolSize: 0, serverSelectionTimeoutMS: 5000 });
  }
  try {
    for (const entry of required) await entry.collection.createIndexes(entry.indexes);
    return { applied: true, planned };
  } finally { if (ownsConnection) await mongoose.disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply' && arg !== '--dry-run') || (args.includes('--apply') && args.includes('--dry-run'))) {
    console.error('Usage: deploy:indexes [--dry-run | --apply]'); process.exitCode = 1;
  } else {
    prepareDeploymentIndexes({ apply: args.includes('--apply') }).then(report => console.log(JSON.stringify(report, null, 2))).catch(() => {
      console.error('Chuẩn bị indexes thất bại. Kiểm tra đích DB/quyền/index conflict; không xóa index hoặc dữ liệu tự động.'); process.exitCode = 1;
    });
  }
}
