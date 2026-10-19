import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=resolve('.'),out=join(root,'plans/261019-resume-parent-gate-403');
assert(root.replaceAll('\\','/').endsWith('/resume-parent-gate-403/codeDuAN'));
for(const p of [root,join(root,'client'),join(root,'server')])assert.deepEqual(readdirSync(p).filter(n=>/^\.env($|\.)/.test(n)&&!/example|sample|template/.test(n)),[]);
const safe=new Set(['PATH','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMDATA','SYSTEMDRIVE','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS']);
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>safe.has(k.toUpperCase())));
Object.assign(env,{NODE_ENV:'test',MONGOMS_VERSION:'8.2.6',MONGOMS_SYSTEM_BINARY:'C:/Users/Asus/.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe',MONGOMS_RUNTIME_DOWNLOAD:'false',MONGODB_URI:'mongodb://127.0.0.1:1/never_use_real_database',JWT_SECRET:'synthetic_resume_gate_access_secret',JWT_REFRESH_SECRET:'synthetic_resume_gate_refresh_secret',CMS_PUBLISH_ENABLED:'false'});
env.NODE_OPTIONS='--import='+pathToFileURL(join(out,'test-safety.mjs')).href;
const mode=process.argv[2]||'focused',label=process.argv[3]||mode;assert(/^[a-z0-9-]+$/.test(label));
const vitest=join(root,'node_modules/vitest/vitest.mjs');
const checks=mode==='full'?[['server',[vitest,'run','--maxWorkers=1','--no-file-parallelism','--reporter=default','--reporter=json','--outputFile='+join(out,label+'-server.json')]],['client',[vitest,'run','--maxWorkers=1','--no-file-parallelism','--reporter=default','--reporter=json','--outputFile='+join(out,label+'-client.json')]]]:mode==='quality'?[['server',[join(root,'node_modules/typescript/bin/tsc'),'--noEmit']],['client',[join(root,'node_modules/typescript/bin/tsc'),'--noEmit']],['server',[join(root,'node_modules/typescript/bin/tsc')]],['client',[join(root,'node_modules/vite/bin/vite.js'),'build']],['client',[join(root,'node_modules/eslint/bin/eslint.js'),'src','--ext','.ts,.tsx','--report-unused-disable-directives','--max-warnings','200']]]:[['client',[vitest,'run','src/test/parentGateStaleResponse.test.ts',...(mode==='focused'?['src/test/authGateLifecycle.test.ts','src/test/googleSignIn.test.tsx','src/test/parentSettingsSave.test.tsx','src/test/childJourneys.test.tsx']:[]),'--maxWorkers=1','--no-file-parallelism','--reporter=default','--reporter=json','--outputFile='+join(out,label+'.json')]]];
const lintCheck=['client',[join(root,'client/node_modules/eslint/bin/eslint.js'),'src','--ext','.ts,.tsx','--report-unused-disable-directives','--max-warnings','200']];
if(mode==='quality') checks[4]=lintCheck;
if(mode==='lint') checks.splice(0,checks.length,lintCheck);
for(const [index,[side,args]] of checks.entries()) {
  const log=createWriteStream(join(out,`${label}-${index}-${side}.log`),{flags:'wx'});
  log.write(JSON.stringify({startedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),command:[process.execPath,...args],cwd:join(root,side)})+'\n');
  const child=spawn(process.execPath,args,{cwd:join(root,side),env,windowsHide:true});
  for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log.write(b);process.stdout.write(b);});
  const {code,signal}=await new Promise((res,rej)=>{child.on('error',rej);child.on('close',(code,signal)=>res({code,signal}));});
  await new Promise(res=>log.end(`\nEXIT ${code} SIGNAL ${signal ?? 'none'}\n`,res));
  if(code!==0){process.exitCode=1;break;}
}
