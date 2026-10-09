import { Story } from '../models/Story.js';
import { CultureArticle } from '../models/CultureArticle.js';
import { stories, culture } from './catalog.js';

export const normalizeIdentity = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
type Identity = { title: string; seedKey?: string };
export function matchContentIdentity<T extends Identity>(existing: T[], item: Identity & { seedKey: string }): { match?: T; conflict?: string } {
  const byKey = existing.filter(record => record.seedKey === item.seedKey);
  const byTitle = existing.filter(record => normalizeIdentity(record.title) === normalizeIdentity(item.title));
  if (byKey.length > 1 || byTitle.length > 1 || byTitle.some(record => record.seedKey && record.seedKey !== item.seedKey)
    || (byKey.length && byTitle.some(record => record !== byKey[0]))) return { conflict: `${item.seedKey}: ambiguous or mismatched content identity` };
  return { match: byKey[0] ?? byTitle[0] };
}

export async function planContentIdentity() {
  const updates: Array<{ kind: 'story' | 'culture'; id: string; seedKey: string; observedTitle: string }> = [];
  const conflicts: string[] = [];
  for (const kind of ['story', 'culture'] as const) {
    const documents = kind === 'story' ? await Story.find().lean() : await CultureArticle.find().lean();
    const existing = documents.map(record => ({ _id: String(record._id), title: record.title, seedKey: record.seedKey }));
    const catalog = kind === 'story' ? stories : culture;
    const keys = new Set<string>();
    for (const record of existing) {
      if (!record.seedKey) continue;
      if (keys.has(record.seedKey)) conflicts.push(`${kind}: duplicate seedKey ${record.seedKey}`);
      keys.add(record.seedKey);
    }
    for (const item of catalog) {
      const result = matchContentIdentity(existing, item);
      if (result.conflict) conflicts.push(result.conflict);
      else if (result.match && !result.match.seedKey) updates.push({ kind, id: String(result.match._id), seedKey: item.seedKey, observedTitle: result.match.title });
    }
  }
  return { updates, conflicts };
}
