import mongoose from 'mongoose';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { PaymentOrder } from '../models/PaymentOrder.js';

/**
 * Production connects with `autoIndex: false` (see config/db.ts), so this script is the only
 * place indexes are built. Every index declared on a Mongoose schema is applied with the
 * same names Mongoose auto-indexing used before, so existing production indexes are no-ops.
 * Indexes that exist only for operational queries (not declared on a schema) are listed here.
 */
// Models carry heterogeneous document types; only collection/index APIs are used here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extraIndexes: Array<{ model: mongoose.Model<any>; indexes: mongoose.mongo.IndexDescription[] }> = [
  // Admin revenue report: `$match: { status: 'completed' }` then paidAt ranges.
  { model: PaymentOrder, indexes: [{ key: { status: 1, paidAt: 1 }, name: 'status_1_paidAt_1' }] },
];

const modelsDir = fileURLToPath(new URL('../models/', import.meta.url));

/** Registers every model file so newly added models/indexes are never forgotten here. */
async function loadAllModels(): Promise<mongoose.Model<any>[]> {
  const files = (await readdir(modelsDir))
    .filter(file => /^[A-Z][A-Za-z]+\.(ts|js)$/.test(file) && !file.endsWith('.d.ts'));
  for (const file of files) await import(pathToFileURL(`${modelsDir}${file}`).href);
  return mongoose.modelNames().sort().map(name => mongoose.model(name));
}

function describeSchemaIndexes(model: mongoose.Model<any>) {
  return model.schema.indexes().map(([key, options]) => ({ key, ...options }));
}

// Dry-run is a pure plan: no DB connection or auto-index initialization.
export async function prepareDeploymentIndexes({ apply = false }: { apply?: boolean } = {}) {
  const models = await loadAllModels();
  const extras = new Map(extraIndexes.map(entry => [entry.model.modelName, entry.indexes]));
  const planned = models
    .map(model => ({
      collection: model.collection.collectionName,
      indexes: [...describeSchemaIndexes(model), ...(extras.get(model.modelName) ?? [])],
    }))
    .filter(entry => entry.indexes.length > 0);
  if (!apply) return { applied: false, planned };
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) {
    if (!process.env.MONGODB_URI) throw new Error('Cần cung cấp MONGODB_URI của môi trường đã xác minh trước khi apply.');
    await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false, maxPoolSize: 5, minPoolSize: 0, serverSelectionTimeoutMS: 5000 });
  }
  try {
    // createIndexes only adds: it never drops or modifies existing indexes. A name/option
    // conflict throws and stops the run for manual reconciliation.
    for (const model of models) await model.createIndexes();
    for (const entry of extraIndexes) await entry.model.collection.createIndexes(entry.indexes);
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
