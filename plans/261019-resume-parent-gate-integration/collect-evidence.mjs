import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root=resolve('.');
assert(root.replaceAll('\\','/').endsWith('/resume-parent-gate-403/codeDuAN'));
const label=process.argv[2]||'evidence-manifest';
const base=process.argv[3]||'2a8cd86badacb5206202d2a5d41de82d74ffac53';
const testedIntegrationHead=process.argv[4]||'d730e58ebad159decef66243bb54cb460371149e';
assert(/^[a-z0-9-]+$/.test(label)&&/^[a-f0-9]{40}$/.test(base)&&/^[a-f0-9]{40}$/.test(testedIntegrationHead));
const output=resolve(`plans/261019-resume-parent-gate-integration/${label}.json`);
const paths=[];
async function walk(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const path=resolve(dir,item.name);
    if(item.isDirectory())await walk(path);else if(path!==output)paths.push(path);
  }
}
await walk(resolve('plans/261019-resume-parent-gate-403'));
await walk(resolve('plans/261019-resume-parent-gate-integration'));
paths.push(resolve('client/src/lib/api.ts'),resolve('client/src/test/parentGateStaleResponse.test.ts'),
  resolve('docs/parent-gate-stale-response.md'),resolve('plans/journals/2026-10-19-resume-parent-gate-403.md'));
for(const path of ['package.json','package-lock.json','client/package.json','server/package.json',
  'client/src/app/layouts/KidsLayout.tsx','client/src/app/layouts/ParentLayout.tsx',
  'client/src/components/ui/ProtectedRoute.tsx','client/src/components/ui/QueryErrorState.tsx',
  'client/src/features/parent/ParentDashboardPage.tsx','client/src/store/authStore.ts',
  'client/src/store/childStore.ts','client/src/index.css'])paths.push(resolve(path));
const entries=[];
for(const path of paths.sort()) {
  const bytes=await readFile(path);
  entries.push({path:relative(root,path).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(output,JSON.stringify({generatedAt:new Date().toISOString(),workspace:root,
  base,testedIntegrationHead,
  headAtCollection:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),entries},null,2)+'\n',{flag:'wx'});
console.log(`Recorded ${entries.length} artifacts; no historical receipt overwritten.`);
