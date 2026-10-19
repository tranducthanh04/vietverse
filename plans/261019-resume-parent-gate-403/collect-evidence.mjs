import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root=resolve('.');
assert(root.replaceAll('\\','/').endsWith('/resume-parent-gate-403/codeDuAN'));
const folder=resolve('plans/261019-resume-parent-gate-403');
const manifestPath=resolve(folder,'evidence-manifest.json');
const files=[];
async function walk(path) {
  for(const entry of await readdir(path,{withFileTypes:true})) {
    const child=resolve(path,entry.name);
    if(entry.isDirectory()) await walk(child);
    else if(child!==manifestPath) files.push(child);
  }
}
await walk(folder);
files.push(resolve('client/src/lib/api.ts'),resolve('client/src/test/parentGateStaleResponse.test.ts'),
  resolve('docs/parent-gate-stale-response.md'),resolve('plans/journals/2026-10-19-resume-parent-gate-403.md'));
const entries=[];
for(const path of files.sort()) {
  const bytes=await readFile(path);
  entries.push({path:relative(root,path).replaceAll('\\','/'),bytes:bytes.length,
    sha256:createHash('sha256').update(bytes).digest('hex')});
}
const manifest={generatedAt:new Date().toISOString(),workspace:root,
  base:'4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66',
  headAtCollection:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  note:'Tests ran on the recorded base plus uncommitted scoped API/test changes. Raw artifacts stay local.',entries};
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(`Recorded ${entries.length} artifacts without overwriting old receipts.`);
