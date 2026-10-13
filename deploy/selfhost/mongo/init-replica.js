// vietverse-mongo-init (mongosh --nodb): idempotent replica set + user setup.
// Safe to run on every `docker compose up`: initiates rs0 only once, then creates or
// updates (password/roles) the app and backup users from the environment.
// Credentials are read from the environment, never from argv (visible in `ps`).

// Replica set member address as seen inside vietverse_net (override only for local tests).
const HOST = process.env.MONGO_INIT_HOST || 'vietverse-mongo:27017';
const APP_DB = 'vietverse';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

const rootUser = required('MONGO_ROOT_USERNAME');
const rootPassword = required('MONGO_ROOT_PASSWORD');
const appUser = required('MONGO_APP_USERNAME');
const appPassword = required('MONGO_APP_PASSWORD');
const backupUser = required('MONGO_BACKUP_USERNAME');
const backupPassword = required('MONGO_BACKUP_PASSWORD');

// First boot: the image runs a temporary localhost-only mongod to create the root user, then
// restarts with --replSet/--keyFile. Retry until the real server accepts the root login.
let admin;
for (let attempt = 1; ; attempt++) {
  try {
    const conn = new Mongo(`mongodb://${HOST}/?directConnection=true&serverSelectionTimeoutMS=3000`);
    admin = conn.getDB('admin');
    admin.auth(rootUser, rootPassword);
    break;
  } catch (error) {
    if (attempt >= 90) throw new Error(`Không kết nối/đăng nhập được ${HOST}: ${error.message}`);
    sleep(2000);
  }
}

function replicaSetInitialized() {
  try {
    admin.adminCommand({ replSetGetStatus: 1 });
    return true;
  } catch (error) {
    if (error.code === 94 || error.codeName === 'NotYetInitialized') return false;
    throw error;
  }
}

if (!replicaSetInitialized()) {
  print('Khởi tạo replica set rs0');
  admin.adminCommand({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: HOST }] } });
}

for (let attempt = 1; !admin.adminCommand({ hello: 1 }).isWritablePrimary; attempt++) {
  if (attempt >= 60) throw new Error('rs0 chưa có PRIMARY sau 120 giây');
  sleep(2000);
}

function upsertUser(dbName, user, pwd, roles) {
  const target = admin.getSiblingDB(dbName);
  if (target.getUser(user)) {
    target.updateUser(user, { pwd, roles });
    print(`Đã cập nhật user ${user}@${dbName}`);
  } else {
    target.createUser({ user, pwd, roles });
    print(`Đã tạo user ${user}@${dbName}`);
  }
}

// App: read/write (incl. createIndex for deploy:indexes) on the vietverse DB only.
upsertUser(APP_DB, appUser, appPassword, [{ role: 'readWrite', db: APP_DB }]);
// Backup: read-only on the vietverse DB (mongodump --db vietverse).
upsertUser('admin', backupUser, backupPassword, [{ role: 'read', db: APP_DB }]);

print('vietverse-mongo-init: OK');
