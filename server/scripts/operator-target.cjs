// Production DB target is supplied by the operator's shell, never committed to this public repo.
// Required: VIETVERSE_DB_HOST (Atlas SRV host), VIETVERSE_DB_USER, VIETVERSE_DB_NAME.
// Values are identifiers, not secrets, but launchers print only the short label.
const hostPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.mongodb\.net$/;
const userPattern = /^[A-Za-z0-9._-]{1,64}$/;
const dbPattern = /^[A-Za-z0-9_-]{1,64}$/;
const reservedDbs = new Set(['admin', 'local', 'config']);

function readOperatorTarget(env, errorCode) {
  const host = (env.VIETVERSE_DB_HOST || '').trim().toLowerCase();
  const user = (env.VIETVERSE_DB_USER || '').trim();
  const dbName = (env.VIETVERSE_DB_NAME || '').trim();
  if (!hostPattern.test(host) || !userPattern.test(user) || !dbPattern.test(dbName) || reservedDbs.has(dbName)) {
    throw new Error(errorCode);
  }
  return { host, user, dbName, label: `${host.split('.')[0]}/${dbName}` };
}

function buildTargetUri(target, password, appName) {
  return `mongodb+srv://${encodeURIComponent(target.user)}:${encodeURIComponent(password)}@${target.host}/${target.dbName}` +
    `?retryWrites=true&w=majority&appName=${appName}`;
}

module.exports = { readOperatorTarget, buildTargetUri };
