import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const manifestPath = resolve('plans/261019-wrong-hint-overflow/evidence-manifest.json');
if (process.argv[2] === '--verify') {
  const manifest = JSON.parse(await readFile(manifestPath));
  for (const entry of manifest.entries) assert.equal(await digest(entry.path), entry.sha256, entry.path);
  console.log(`Verified ${manifest.entries.length} immutable evidence/source hashes`);
} else {
  const dirs = process.argv.slice(2).map(p => resolve(p));
  assert.equal(dirs.length, 6, 'Pass startup failure, RED, initial GREEN, targeted GREEN, text-end GREEN, quality directories');
  const [, redDir, firstDir, targetedDir, endsDir, qualityDir] = dirs;
  const receipt = async dir => JSON.parse(await readFile(join(dir, 'receipt.json')));
  const [red, first, targeted, ends, quality] = await Promise.all([redDir, firstDir, targetedDir, endsDir, qualityDir].map(receipt));
  const failed = r => r.results.filter(item => item.status === 'FAIL');
  assert.equal(red.results.length, 28); assert.equal(failed(red).length, 4);
  assert.equal(first.results.length, 98); assert.equal(failed(first).length, 5);
  assert.deepEqual(failed(first).map(r => r.id).sort(), targeted.results.map(r => r.id).sort());
  assert.equal(failed(targeted).length, 0); assert.equal(failed(ends).length, 0);
  for (const run of [red, first, targeted, ends]) {
    assert.equal(run.cleanedUp, true);
    for (const field of ['forbidden', 'pageErrors', 'consoleErrors']) assert.equal(run[field].length, 0);
  }
  for (const run of [first, targeted, ends]) for (const result of run.results) {
    assert.deepEqual(result.geometry.violations, []);
    assert.equal(result.geometry.fontLoaded, true, result.id);
  }
  const short = red.results.filter(r => r.variant === 'short');
  assert.equal(short.length, 24);
  for (const item of short) {
    const after = first.results.find(r => r.id === item.id);
    assert.deepEqual(after.geometry.card, item.geometry.card, item.id);
    assert.deepEqual(after.geometry.texts.map(t => t.fontSize), item.geometry.texts.map(t => t.fontSize));
  }
  for (const run of [first, targeted, ends, quality]) for (const [path, hash] of Object.entries(run.sourceHashes)) assert.equal(await digest(path), hash, path);
  assert.equal(quality.results.length, 5);
  for (const result of quality.results) assert.equal(result.code, 0, result.name);
  const tests = {};
  for (const name of ['focused', 'full']) {
    const report = JSON.parse(await readFile(join(qualityDir, name + '.json')));
    assert.equal(report.success, true); assert.equal(report.numFailedTests, 0); assert.equal(report.numPendingTests, 0);
    tests[name] = { passed: report.numPassedTests, files: report.testResults.length };
  }
  const entries = [];
  async function add(path) {
    const info = await stat(path);
    if (info.isDirectory()) for (const name of (await readdir(path)).sort()) await add(join(path, name));
    else entries.push({ path: resolve(path), bytes: info.size, sha256: await digest(path) });
  }
  for (const dir of dirs) await add(dir);
  const sourcePaths = [...new Set([...Object.keys(first.sourceHashes), ...Object.keys(quality.sourceHashes),
    'scripts/verify-wrong-hint-browser.mjs', 'scripts/verify-wrong-hint-quality.mjs',
    'plans/261019-wrong-hint-overflow/collect-evidence.mjs'])];
  for (const path of sourcePaths) await add(path);
  const manifest = {
    createdAt: new Date().toISOString(), headDuringLocalChecks: first.head, base: first.basePin,
    headAtCollection: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    directories: { startup: dirs[0], red: redDir, initialGreen: firstDir, targetedGreen: targetedDir, textEnds: endsDir, quality: qualityDir },
    summary: { red: { passed: 24, failed: 4 }, initialGreen: { passed: 93, failed: 5 }, targetedGreen: { passed: targeted.results.length },
      distinctMatrixCasesCovered: first.results.length, textEndCases: ends.results.length, unchangedShortCardRectangles: short.length,
      baselineFullSortResetAbsent: first.results.filter(r => r.fullSortResetVisible === false).length,
      baselineFooterOverflows: first.results.filter(r => r.footerBaselineOverflow).map(r => r.id), tests }, entries,
  };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest.summary, null, 2));
  console.log(`Collected ${entries.length} hashes into ${manifestPath}`);
}
