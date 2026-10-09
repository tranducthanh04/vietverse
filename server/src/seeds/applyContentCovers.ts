/**
 * Gán ảnh bìa demo (contentCovers.ts) cho story/culture legacy chưa có coverImage.
 *
 *   npx tsx src/seeds/applyContentCovers.ts           # dry-run (mặc định), chỉ đọc
 *   npx tsx src/seeds/applyContentCovers.ts --apply   # ghi
 *
 * Quyết định (theo docs/cms-operations.md — không ghi đè nội dung đã phát hành qua CMS):
 * - Chỉ điền khi coverImage đang trống; không ghi đè ảnh đã có.
 * - Chỉ ghi trực tiếp bản live khi nội dung còn legacy: contentVersion trống/0, chưa có
 *   ContentRevision và không có ContentDraft chưa discarded. Khi đã có draft/revision, bỏ qua
 *   và báo cáo để admin gán ảnh qua CMS (lưu nháp → xem trước → xuất bản), tránh lệch phiên bản.
 * - Khớp định danh bằng matchContentIdentity (seedKey, rồi title chuẩn hóa) như contentIdentity.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Story } from '../models/Story.js';
import { CultureArticle } from '../models/CultureArticle.js';
import { ContentDraft } from '../models/ContentDraft.js';
import { ContentRevision } from '../models/ContentRevision.js';
import { matchContentIdentity } from './contentIdentity.js';
import { contentCovers } from './contentCovers.js';

type Outcome = 'apply' | 'applied' | 'skip_has_cover' | 'skip_versioned' | 'skip_has_draft' | 'not_found' | 'conflict' | 'changed';
type Row = { kind: 'story' | 'culture'; seedKey: string; title: string; id?: string; coverImage: string; outcome: Outcome; note?: string };

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../client/public');
const isEmpty = (value: unknown) => value === undefined || value === null || value === '';

export async function applyContentCovers({ dryRun = true }: { dryRun?: boolean } = {}) {
  const missingFiles = contentCovers.filter(cover => !fs.existsSync(path.join(publicDir, cover.coverImage)));
  if (missingFiles.length) throw new Error(`Missing cover files: ${missingFiles.map(cover => cover.coverImage).join(', ')}`);

  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoCreate: false, autoIndex: false });
  try {
    const rows: Row[] = [];
    for (const kind of ['story', 'culture'] as const) {
      const model = kind === 'story' ? Story : CultureArticle;
      const documents = (await (model as typeof Story).find().select('title seedKey coverImage contentVersion').lean())
        .map(doc => ({ ...doc, _id: String(doc._id), seedKey: doc.seedKey ?? undefined }));
      for (const cover of contentCovers.filter(item => item.kind === kind)) {
        const base = { kind, seedKey: cover.seedKey, title: cover.title, coverImage: cover.coverImage };
        const { match, conflict } = matchContentIdentity(documents, cover);
        if (conflict) { rows.push({ ...base, outcome: 'conflict', note: conflict }); continue; }
        if (!match) { rows.push({ ...base, outcome: 'not_found' }); continue; }
        const row: Row = { ...base, id: match._id, outcome: 'apply' };
        rows.push(row);
        if (!isEmpty(match.coverImage)) { row.outcome = 'skip_has_cover'; row.note = String(match.coverImage); continue; }
        const [revisions, drafts] = await Promise.all([
          ContentRevision.countDocuments({ kind, contentId: match._id }),
          ContentDraft.countDocuments({ kind, contentId: match._id, state: { $ne: 'discarded' } }),
        ]);
        if ((match.contentVersion ?? 0) > 0 || revisions > 0) { row.outcome = 'skip_versioned'; row.note = 'Gán qua CMS: lưu nháp rồi xuất bản'; continue; }
        if (drafts > 0) { row.outcome = 'skip_has_draft'; row.note = 'Đã có nháp CMS; gán coverImage trong nháp rồi xuất bản'; continue; }
        if (dryRun) continue;
        const result = await (model as typeof Story).updateOne(
          { _id: match._id, contentVersion: { $in: [null, 0] }, $or: [{ coverImage: { $exists: false } }, { coverImage: null }, { coverImage: '' }] },
          { $set: { coverImage: cover.coverImage } },
          { timestamps: false },
        );
        row.outcome = result.modifiedCount === 1 ? 'applied' : 'changed';
      }
    }
    const summary = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.outcome]: (acc[row.outcome] ?? 0) + 1 }), {});
    return { dryRun, total: rows.length, summary, rows };
  } finally { if (ownsConnection) await mongoose.disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--apply'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) {
    console.error('Usage: npx tsx src/seeds/applyContentCovers.ts [--dry-run | --apply]'); process.exitCode = 1;
  } else {
    applyContentCovers({ dryRun: !args.includes('--apply') })
      .then(report => {
        for (const row of report.rows) console.log(`${row.outcome.padEnd(15)} ${row.kind.padEnd(8)} ${row.seedKey.padEnd(26)} ${row.title} -> ${row.coverImage}${row.note ? ` (${row.note})` : ''}`);
        console.log(JSON.stringify({ dryRun: report.dryRun, total: report.total, summary: report.summary }));
      })
      .catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
