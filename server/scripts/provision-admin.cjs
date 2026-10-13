// Windows launcher; credentials stay in private pipes and never enter argv/.env.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { readOperatorTarget, buildTargetUri } = require('./operator-target.cjs');
const api = 'https://vietverse-nine.vercel.app/api/v1';

async function verifyLogin(email, password) {
  let cookie;
  let verified = false;
  let loggedOut = false;
  try {
    const response = await fetch(`${api}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }), redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    cookie = response.headers.get('set-cookie')?.match(/(?:^|,\s*)refreshToken=([^;]+)/)?.[1];
    const result = await response.json();
    if (response.status !== 200 || !result.success || result.data?.user?.role !== 'admin' ||
      result.data.user.email !== email || typeof result.data.accessToken !== 'string') return 'login_failed';
    const admin = await fetch(`${api}/admin/kpi`, {
      headers: { Authorization: `Bearer ${result.data.accessToken}` },
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    verified = admin.status === 200 && (await admin.json()).success === true;
    result.data.accessToken = '';
  } catch { /* Never print network errors, tokens, or response bodies. */ }
  finally {
    if (cookie) {
      try {
        const logout = await fetch(`${api}/auth/logout`, {
          method: 'POST', headers: { Cookie: `refreshToken=${cookie}` },
          redirect: 'error', signal: AbortSignal.timeout(30000),
        });
        loggedOut = logout.status === 200 && (await logout.json()).success === true;
      } catch { /* Report the bounded verification failure below. */ }
      cookie = undefined;
    }
  }
  return verified && loggedOut ? 'passed' : verified ? 'session_cleanup_failed' : 'admin_access_failed';
}

async function main() {
  if (process.platform !== 'win32' || process.argv.length !== 2) throw new Error('ADMIN_ARGUMENTS_INVALID');
  // Operator declares the target in the shell session (VIETVERSE_DB_HOST/USER/NAME); nothing is hard-coded.
  const target = readOperatorTarget(process.env, 'ADMIN_TARGET_INVALID');
  const dialog = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'input-admin-password.ps1'), '-TargetHost', target.host, '-TargetDb', target.dbName, '-DbUser', target.user], {
    encoding: 'utf8', windowsHide: false, timeout: 610000, maxBuffer: 8192,
  });
  if (dialog.status !== 0) throw new Error('ADMIN_INPUT_CANCELLED_OR_FAILED');
  const credential = JSON.parse(dialog.stdout);
  dialog.stdout = '';
  if (!credential.dbPassword || !credential.password || credential.exclusiveWindowConfirmed !== true) throw new Error('ADMIN_INPUT_INVALID');
  const uri = buildTargetUri(target, credential.dbPassword, 'VietverseAdminProvision');
  credential.dbPassword = '';
  const child = spawnSync(process.execPath, ['--import', 'tsx', 'src/seeds/provisionAdmin.ts'], {
    cwd: path.resolve(__dirname, '..'),
    input: JSON.stringify({ uri, target: { host: target.host, user: target.user, dbName: target.dbName }, ...credential }), encoding: 'utf8', windowsHide: true,
    timeout: 120000, maxBuffer: 8192,
  });
  let report;
  try { report = JSON.parse(child.stdout.trim()); } catch { /* No raw output. */ }
  if (child.status !== 0 || !report || !['created', 'already_admin'].includes(report.status) ||
    report.target !== target.label || typeof report.email !== 'string') {
    let code;
    try { code = JSON.parse(child.stderr.trim()).error; } catch { /* No raw output. */ }
    throw new Error(typeof code === 'string' && /^ADMIN_[A-Z_]+$/.test(code) ? code : 'ADMIN_PROVISION_FAILED');
  }
  console.log(JSON.stringify({ target: target.label, status: report.status, email: report.email, passwordVerified: report.passwordVerified === true }));
  const verification = report.passwordVerified === true
    ? await verifyLogin(report.email, credential.password) : 'existing_password_unchanged';
  credential.password = '';
  console.log(JSON.stringify({ phase: 'production_auth', verification }));
  if (verification !== 'passed') process.exitCode = 2;
}

main().catch(error => {
  console.error(error instanceof Error && /^ADMIN_[A-Z_]+$/.test(error.message) ? error.message : 'ADMIN_PROVISION_FAILED');
  process.exitCode = 1;
});
