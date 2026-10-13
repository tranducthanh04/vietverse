// The production target comes from operator input (launcher env), never from committed constants.
export type OperatorTarget = { host: string; user: string; dbName: string };

const hostPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.mongodb\.net$/;
const userPattern = /^[A-Za-z0-9._-]{1,64}$/;
const dbPattern = /^[A-Za-z0-9_-]{1,64}$/;
const reservedDbs = new Set(['admin', 'local', 'config']);
const allowedParams = new Set(['retryWrites', 'w', 'appName']);

export function targetLabel(target: OperatorTarget): string {
  return `${target.host.split('.')[0]}/${target.dbName}`;
}

/**
 * The URI must point exactly at the operator-declared Atlas SRV host, user and database,
 * carry a password and no extra connection options. Errors never echo the URI.
 */
export function assertOperatorTarget(uri: unknown, target: unknown, errorCode: string): OperatorTarget {
  try {
    if (typeof uri !== 'string' || typeof target !== 'object' || target === null) throw new Error();
    const { host, user, dbName } = target as Partial<OperatorTarget>;
    if (typeof host !== 'string' || !hostPattern.test(host) || typeof user !== 'string' || !userPattern.test(user) ||
      typeof dbName !== 'string' || !dbPattern.test(dbName) || reservedDbs.has(dbName)) throw new Error();
    const url = new URL(uri);
    if (url.protocol !== 'mongodb+srv:' || url.hostname !== host || url.port || url.hash ||
      url.pathname !== `/${dbName}` || decodeURIComponent(url.username) !== user || !url.password ||
      [...url.searchParams.keys()].some(key => !allowedParams.has(key))) throw new Error();
    return { host, user, dbName };
  } catch {
    throw new Error(errorCode);
  }
}
