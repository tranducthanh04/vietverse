import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { Story } from '../models/Story.js';
import { CultureArticle } from '../models/CultureArticle.js';
import { planContentIdentity } from './contentIdentity.js';
import { assertCmsTransactions } from '../modules/admin/content/content.publish.js';
import { contentModel } from '../modules/content/content.store.js';

export async function migrateContentMetadata({ dryRun = true }: { dryRun?: boolean } = {}) {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoCreate: false, autoIndex: false });
  try {
    const report = { ...await planContentIdentity(), dryRun };
    if (dryRun) return report;
    if (report.conflicts.length) throw new Error(`Content identity conflict: ${report.conflicts.join('; ')}`);
    await assertCmsTransactions();
    await mongoose.connection.transaction(async session => {
      for (const planned of report.updates) {
        const model = contentModel(planned.kind);
        const result = await model.updateOne({ _id: planned.id, title: planned.observedTitle, seedKey: { $exists: false } },
          { $set: { seedKey: planned.seedKey } }, { session, timestamps: false });
        if (result.modifiedCount !== 1) throw new Error('Content identity changed; rerun dry-run');
      }
    });
    // Add indexes only; never syncIndexes/drop existing indexes in a migration.
    await Story.collection.createIndex({ seedKey: 1 }, { unique: true, sparse: true });
    await CultureArticle.collection.createIndex({ seedKey: 1 }, { unique: true, sparse: true });
    return report;
  } finally { if (ownsConnection) await mongoose.disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--apply'].includes(arg)) || args.includes('--apply') && args.includes('--dry-run')) {
    console.error('Usage: cms:metadata [--dry-run | --apply]'); process.exitCode = 1;
  } else {
    migrateContentMetadata({ dryRun: !args.includes('--apply') }).then(report => console.log(JSON.stringify(report, null, 2)))
      .catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
