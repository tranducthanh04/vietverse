import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root=resolve('.');
assert(root.replaceAll('\\','/').endsWith('/resume-parent-gate-403/codeDuAN'));
for(const dir of [root,resolve('client'),resolve('server')]) {
  assert.deepEqual(readdirSync(dir).filter(n=>/^\.env($|\.)/.test(n)&&!/example|sample|template/.test(n)),[]);
}
const safe=new Set(['PATH','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMDATA','SYSTEMDRIVE','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS']);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>safe.has(key.toUpperCase())));
env.NODE_ENV='test';
env.NODE_OPTIONS='--import='+pathToFileURL(resolve('plans/261019-resume-parent-gate-403/test-safety.mjs')).href;
const label=process.argv[2]||'frontend';
const base=process.argv[3]||'2a8cd86badacb5206202d2a5d41de82d74ffac53';
const mode=process.argv[4]||'full';
assert(/^[a-z0-9-]+$/.test(label)&&/^[a-f0-9]{40}$/.test(base));
assert(['full','focused'].includes(mode));
execFileSync('git',['merge-base','--is-ancestor',base,'HEAD']);
const selected=mode==='focused'?['parentGateStaleResponse.test.ts','authGateLifecycle.test.ts','googleSignIn.test.tsx','parentSettingsSave.test.tsx','childJourneys.test.tsx','kidsPickerNameWrap.test.tsx','storyTypeLabels.test.tsx'].map(file=>'src/test/'+file):[];
const args=[resolve('node_modules/vitest/vitest.mjs'),'run',...selected,'--maxWorkers=1','--no-file-parallelism','--reporter=default','--reporter=json','--outputFile='+resolve(`plans/261019-resume-parent-gate-integration/${label}.json`)];
const log=createWriteStream(resolve(`plans/261019-resume-parent-gate-integration/${label}.log`),{flags:'wx'});
log.write(JSON.stringify({startedAt:new Date().toISOString(),integrationHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,command:[process.execPath,...args],cwd:resolve('client')})+'\n');
const child=spawn(process.execPath,args,{cwd:resolve('client'),env,windowsHide:true});
for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log.write(data);process.stdout.write(data);});
const {code,signal}=await new Promise((res,rej)=>{child.on('error',rej);child.on('close',(code,signal)=>res({code,signal}));});
await new Promise(res=>log.end(`\nEXIT ${code} SIGNAL ${signal??'none'}\n`,res));
if(code!==0)process.exitCode=1;
