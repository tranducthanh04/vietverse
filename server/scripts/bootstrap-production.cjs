// Run from the repo: node server/scripts/bootstrap-production.cjs [--apply]
// Never reads .env, retrieves Vercel sensitive values, or writes credentials.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const serverRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.some(a => a !== '--apply') || args.length > 1 || process.platform !== 'win32') {
  console.error('BOOTSTRAP_LAUNCH_ARGUMENTS_INVALID');
  process.exit(1);
}
const apply = args.includes('--apply');
function invoke(input, argv) {
  const child = spawnSync(process.execPath, ['--import', 'tsx', 'src/seeds/customer/bootstrapCustomer.ts', ...argv], {
    cwd: serverRoot, input, encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 32768,
  });
  // Output comes from the redacting CLI, but whitelist the receipt again here.
  let report;
  try { report = JSON.parse(child.stdout.trim()); } catch { /* never dump raw child output */ }
  if (child.status !== 0 || !report || !['ready', 'conflict', 'applied', 'already_applied'].includes(report.status) ||
    !/^[a-f\d]{64}$/.test(report.hash)) throw new Error('BOOTSTRAP_CONNECTION_OR_LOAD_FAILED');
  return report;
}
try {
  const dialog = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'input-bootstrap-password.ps1'), ...(apply ? ['-Apply'] : [])], {
    encoding: 'utf8', windowsHide: false, timeout: 310000, maxBuffer: 8192,
  });
  if (dialog.status !== 0) throw new Error('BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED');
  const credential = JSON.parse(dialog.stdout);
  dialog.stdout = '';
  if (typeof credential.password !== 'string' || !credential.password) throw new Error('BOOTSTRAP_PASSWORD_INVALID');
  if (apply && credential.exclusiveWindowConfirmed !== true) throw new Error('BOOTSTRAP_EXCLUSIVE_WINDOW_REQUIRED');
  let input = JSON.stringify({ uri: `mongodb+srv://binhlqhe181123_db_user:${encodeURIComponent(credential.password)}@thanh.841ysjn.mongodb.net/test?retryWrites=true&w=majority&appName=VietverseBootstrap`, exclusiveWindowConfirmed: credential.exclusiveWindowConfirmed === true });
  credential.password = '';
  const plan = invoke(input, ['--dry-run']);
  console.log(JSON.stringify({ phase: 'preflight', target: 'thanh/test', status: plan.status, hash: plan.hash, preimage: plan.preimage, schemaMigration: plan.schemaMigration }));
  if (plan.status === 'conflict') throw new Error('BOOTSTRAP_NOT_EMPTY');
  if (apply) {
    const loaded = invoke(input, ['--apply', `--expect-hash=${plan.hash}`]);
    console.log(JSON.stringify({ phase: 'verified', target: 'thanh/test', status: loaded.status, hash: loaded.hash, preimage: loaded.preimage, counts: loaded.counts, schemaMigration: loaded.schemaMigration }));
  }
  input = '';
} catch (error) {
  console.error(error instanceof Error && /^BOOTSTRAP_[A-Z_]+$/.test(error.message) ? error.message : 'BOOTSTRAP_LAUNCH_FAILED');
  process.exitCode = 1;
}
