import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { SourceRef } from '../../modules/content/content.types.js';

const root = new URL('../../../../docs/customer-source/2026-10-09/', import.meta.url);
type SourceName = 'explore' | 'stories' | 'culture';
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8')) as {
  documentUrl: string; capturedAt: string; sources: Record<SourceName, { tabId: string; sha256: string }>;
};
export function verifyCustomerSources() {
  for (const name of Object.keys(manifest.sources) as SourceName[]) {
    const bytes = readFileSync(new URL(`${name}.md`, root));
    if (createHash('sha256').update(bytes).digest('hex') !== manifest.sources[name].sha256) throw new Error(`Source checksum mismatch: ${name}. Review the changed source before importing.`);
  }
  return true;
}
export const sourceText = (name: SourceName) => readFileSync(new URL(`${name}.md`, root), 'utf8');
export const sourceRef = (name: SourceName, heading: string): SourceRef => ({
  documentUrl: manifest.documentUrl, tabId: manifest.sources[name].tabId, heading,
  capturedAt: manifest.capturedAt, checksum: manifest.sources[name].sha256,
});
export function plainLine(line: string) {
  return line.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\\([.!+_=\[\]])/g, '$1')
    .replace(/\*\*/g, '').replace(/^#+\s*/, '').replace(/^>\s*/, '').trim();
}
export function sourceSections(name: 'explore' | 'stories') {
  const lines = sourceText(name).split(/\r?\n/);
  const sections: Array<{ number: number; heading: string; lines: string[] }> = [];
  let current: typeof sections[number] | undefined;
  for (const line of lines) {
    const plain = plainLine(line);
    const heading = name === 'stories' ? plain.match(/^(\d+)\.\s+(.*)/) : plain.match(/^Bài (\d+)\.\s+(.*)/);
    // Story content begins at the numbered bold headings, not the overview table.
    if (heading && (name !== 'stories' || /\*\*/.test(line))) {
      current = { number: Number(heading[1]), heading: plain.replace(/\s*:\s*$/, ''), lines: [] }; sections.push(current);
    } else if (name === 'explore' && /^CHẶNG\s+\d/.test(plain)) current = undefined;
    else if (current) current.lines.push(line);
  }
  return sections;
}
