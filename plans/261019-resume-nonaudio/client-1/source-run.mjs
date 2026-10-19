import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, '../..');
const phase = process.argv[2];
const attempt = process.argv[3] || '1';
if (!/^[a-z-]+$/.test(phase || '') || !/^\d+$/.test(attempt)) throw new Error('Explicit phase required');
const runDir = path.join(output, `${phase}-${attempt}`);
mkdirSync(runDir);
for (const file of ['run.mjs','safety.cjs','browser.mjs','footer.mjs','footer-matrix.mjs']) {
  if (existsSync(path.join(output,file))) copyFileSync(path.join(output,file),path.join(runDir,`source-${file}`));
}
const git = (...args) => execFileSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8' }).trim();
const pin = () => ({ head: git('rev-parse','HEAD'), main:git('rev-parse','origin/main'), diffHash:createHash('sha256').update(git('diff','4a6b0a1','--','client','server','package-lock.json')).digest('hex') });
const before = pin();
for (const dir of ['', 'client', 'server']) {
  if (readdirSync(path.join(root,dir)).some(name => /^\.env($|\.)/.test(name) && !/example|sample|template/.test(name))) throw new Error('Runtime env file present');
}
const essentials = new Set(['path','systemroot','windir','comspec','pathext','temp','tmp','userprofile','localappdata','appdata','programfiles','programfiles(x86)','programdata','systemdrive','number_of_processors','processor_architecture']);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => essentials.has(k.toLowerCase())));
Object.assign(env,{NODE_ENV:'test',MONGOMS_VERSION:'8.2.6',MONGOMS_SYSTEM_BINARY:'C:/Users/Asus/.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe',MONGOMS_RUNTIME_DOWNLOAD:'false',MONGOMS_DISABLE_POSTINSTALL:'1',MONGODB_URI:'mongodb://127.0.0.1:1/nonaudio_unused',JWT_SECRET:randomBytes(32).toString('hex'),JWT_REFRESH_SECRET:randomBytes(32).toString('hex'),CLIENT_ORIGIN:'http://localhost:5173',CMS_PUBLISH_ENABLED:'false',GOOGLE_CLIENT_ID:'',CLOUDINARY_CLOUD_NAME:'',CLOUDINARY_API_KEY:'',CLOUDINARY_API_SECRET:'',PAYOS_CLIENT_ID:'',PAYOS_API_KEY:'',PAYOS_CHECKSUM_KEY:'',NO_COLOR:'1'});
const npm = path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
if (!existsSync(npm)) throw new Error('npm runtime missing');
const test = (workspace, files, label) => ['run','test','-w',workspace,'--',...files,'--maxWorkers=1','--no-file-parallelism','--reporter=default','--reporter=json',`--outputFile=${path.join(runDir,`${label}.json`)}`];
const choices = {
  install:[['install',['ci','--no-audit','--no-fund']]],
  focused:[['server',test('server',['virtualRedemptionConcurrency.test.ts','legacyGradingPolicy.test.ts','points.test.ts','pointsHistoryAndEquip.test.ts','lessonIntegrity.test.ts'],'server')],['client',test('client',['adminLearnerDetail.test.tsx','sortOrderActivity.test.tsx','wrongAnswerFeedbackActivities.test.tsx'],'client')]],
  full:[['server',test('server',[],'server')],['client',test('client',[],'client')]],
  checks:[['typecheck',['run','typecheck']],['build',['run','build']],['lint',['run','lint']]],
  client:[['client',test('client',[],'client')]],
  'client-focused':[['client',test('client',['adminLearnerDetail.test.tsx','sortOrderActivity.test.tsx','nextLessonNavigation.test.tsx','wrongAnswerFeedbackActivities.test.tsx'],'client')]],
  footer:[['footer',null]],
  browser:[['browser',null]],
};
if (!choices[phase]) throw new Error('Unknown phase');
const result = {before,phase,node:process.version,startedAt:new Date().toISOString(),tasks:[]};
for (const [name,args] of choices[phase]) {
  if (pin().diffHash !== before.diffHash) throw new Error('Source changed');
  const childEnv = {...env};
  if (phase !== 'install') childEnv.NODE_OPTIONS = `--require=${path.join(output,'safety.cjs')}`;
  const argv = ['browser','footer'].includes(name) ? ['--import','tsx',path.join(output,`${name}.mjs`),runDir] : [npm,...args];
  const log = createWriteStream(path.join(runDir,`${name}.log`),{flags:'wx'});
  const startedAt = new Date().toISOString();
  console.log(`${name}: started`);
  const status = await new Promise((resolve,reject)=>{
    const p=spawn(process.execPath,argv,{cwd:root,env:childEnv,windowsHide:true,stdio:['ignore','pipe','pipe']});
    p.stdout.pipe(log,{end:false});p.stderr.pipe(log,{end:false});p.once('error',reject);p.once('close',(code,signal)=>log.end(()=>resolve({code,signal})));
  });
  result.tasks.push({name,command:[process.execPath,...argv],startedAt,finishedAt:new Date().toISOString(),...status});
  result.after=pin();writeFileSync(path.join(runDir,'results.json'),JSON.stringify(result,null,2));
  console.log(`${name}: exit=${status.code}`);
}
result.finishedAt=new Date().toISOString();
writeFileSync(path.join(runDir,'results.json'),JSON.stringify(result,null,2));
process.exitCode=result.tasks.some(t=>t.code!==0)?1:0;
