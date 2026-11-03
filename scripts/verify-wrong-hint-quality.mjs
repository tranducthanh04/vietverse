import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve('.');
const selected = process.argv[2] || 'all';
assert(['all', 'focused', 'full', 'typecheck', 'build', 'lint'].includes(selected));
const output = await mkdtemp(join(tmpdir(), 'vietverse-hint-quality-'));
const safe = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'SYSTEMDRIVE', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => safe.has(key.toUpperCase())));
Object.assign(env, { CI: 'true', NODE_ENV: 'test', VITE_API_URL: '/api/v1' });
for (const dir of [root, join(root, 'client'), join(root, 'server')]) assert.deepEqual((await readdir(dir)).filter(n => /^\.env($|\.)/.test(n) && !/example|sample|template/.test(n)), []);
const npm = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const vitest = join(root, 'node_modules/vitest/vitest.mjs');
const focused = ['wrongHintResponsive.test.tsx', 'supportTranslation.test.tsx', 'fillBlankActivity.test.tsx', 'sortOrderActivity.test.tsx', 'lessonSessionVersions.test.ts', 'lessonVersions.test.tsx', 'i18n.test.tsx', 'childJourneys.test.tsx'];
const tests = name => [vitest, 'run', '--maxWorkers=1', '--no-file-parallelism', '--reporter=default', '--reporter=json', `--outputFile.json=${join(output, name + '.json')}`];
const tasks = [
  { name: 'focused', cwd: join(root, 'client'), args: [...tests('focused'), ...focused.map(n => 'src/test/' + n)] },
  { name: 'full', cwd: join(root, 'client'), args: tests('full') },
  ...['typecheck', 'build', 'lint'].map(name => ({ name, cwd: root, args: [npm, 'run', name] })),
];
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const receipt = { head: git('rev-parse', 'HEAD'), startedAt: new Date().toISOString(), node: process.version, results: [], sourceHashes: {} };
for (const path of ['client/src/features/lesson-player/activities/WrongAnswerFeedback.tsx', 'client/src/features/lesson-player/activities/ReviewActivity.tsx', 'client/src/test/wrongHintResponsive.test.tsx', 'package-lock.json']) receipt.sourceHashes[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
await writeFile(join(output, 'runner.mjs'), await readFile(new URL(import.meta.url)));
console.log('OUTPUT', output);
for (const task of tasks.filter(t => selected === 'all' || t.name === selected)) {
  const started = Date.now(); let log = '';
  const code = await new Promise((done, fail) => {
    const child = spawn(process.execPath, task.args, { cwd: task.cwd, env, windowsHide: true });
    child.on('error', fail); child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; }); child.on('close', done);
  });
  await writeFile(join(output, task.name + '.log'), log);
  receipt.results.push({ name: task.name, code, durationMs: Date.now() - started, command: [process.execPath, ...task.args], cwd: task.cwd });
  await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(task.name, code, log.slice(-1600));
  if (code !== 0) { process.exitCode = 1; break; }
}
receipt.endedAt = new Date().toISOString(); receipt.headAfter = git('rev-parse', 'HEAD');
await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
