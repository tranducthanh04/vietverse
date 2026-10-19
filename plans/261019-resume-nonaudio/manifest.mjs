import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=dirname(fileURLToPath(import.meta.url));
const root=resolve(directory,'../..');
const base=process.argv[2] || '4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66';
const filename=process.argv[3] || 'manifest.json';
if(!/^manifest(?:-[a-z]+)?\.json$/.test(filename))throw new Error('Invalid manifest name');
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{cwd:root,encoding:'utf8'}).trim();
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const entries=[];
const visit=folder=>{
  for(const entry of readdirSync(folder,{withFileTypes:true})) {
    const file=join(folder,entry.name);
    if(entry.isDirectory())visit(file);
    else if(!/^manifest(?:-[a-z]+)?\.json$/.test(entry.name))entries.push({path:relative(root,file).replaceAll('\\','/'),sha256:hash(file)});
  }
};
visit(directory);
const sourcePaths=git('diff','--name-only',base,'--','client','server').split('\n').filter(Boolean);
writeFileSync(join(directory,filename),JSON.stringify({
  generatedAt:new Date().toISOString(),main:base,
  note:'Hashes identify the tested integrated working-tree contents, not the old HEAD alone. Raw attempts are retained, including failures.',
  sources:sourcePaths.map(path=>({path,sha256:hash(join(root,path))})),artifacts:entries,
},null,2));
console.log(`Manifest: ${sourcePaths.length} source/test files and ${entries.length} local artifacts`);
