# Kế hoạch triển khai dữ liệu khách hàng vào staging và production

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to execute this operational plan task-by-task. Không tự chạy các bước ghi DB trước khi các gate của môi trường tương ứng được ký duyệt. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người phụ trách deploy nhập bộ nguồn khách hàng thành 49 bản nháp CMS trên staging, nghiệm thu, sau đó lặp lại trên production mà không ghi đè nội dung live, tiến độ hoặc điểm của bé.

**Architecture:** Dùng importer/migration sẵn có, không copy dữ liệu trực tiếp vào collection live và không chạy seed để cập nhật lời khách hàng. Staging và production có cấu hình, admin, backup và báo cáo riêng; import nháp và xuất bản là hai đợt thay đổi độc lập.

**Tech Stack:** Node.js, npm workspaces, TypeScript/tsx, Mongoose, MongoDB Atlas replica set, MongoDB Database Tools; các lệnh dưới đây dùng Bash trên máy vận hành/CI runner được phép kết nối Atlas.

**Spec:** [CMS operations](../../cms-operations.md), [API/data contracts](../../05-api-and-data-contracts.md), [đối soát 49 mục](../../customer-source/2026-10-09/coverage.md), [kết quả nghiệm thu local](../../08-customer-alignment.md).

Ngày bàn giao: 2026-10-09 (Asia/Saigon). Đây là **kế hoạch chưa thực thi trên DB thật**, không phải biên bản import thành công. Code CMS được kiểm chứng tới commit `1e26ae980b1f41bf3c30c95f2ca09a2a1c9134a0`; người deploy ghi lại SHA checkout thực tế chứa kế hoạch này.

## Global Constraints

- Cập nhật catalog bốn loại activity: ghi SHA checkout/catalog thực tế trong báo cáo deploy. Lần nhập mới thêm steps bài 4, multi bài 5 và groups bài 6; source checksum/requestId không đổi nên nháp đã nhập vẫn skip, không bị nâng cấp tự động. Admin bổ sung qua CMS sau duyệt và save CAS; không đổi checksum/requestId, ép re-import hay tạo migration để vượt skip.
- Chỉ publish loại mới sau khi backend reader/grader và frontend CMS/player đã deploy tương thích `activityContract=2` và được nghiệm thu. Đợt code này không cấp quyền import DB thật hoặc bật publish.

- `CMS_PUBLISH_ENABLED=false` trên backend thật trong toàn bộ đợt nhập nháp; đặt false ở runner thôi không tắt publish của backend đang chạy.
- Không sửa policy điểm, unlock, subscription, stage/order hoặc ID nội dung đã có.
- Không dùng `npm run seed` để cập nhật lời; không dùng MongoDB insert/update trực tiếp vào `lessons`, `stories`, `culturearticles` để nhập nguồn.
- Không xóa drafts/revisions, progress, recordings, ledger hoặc collection để làm hết conflict. Không `dropDatabase`, `syncIndexes` hoặc restore đè production.
- Hai DB đích phải được xác nhận riêng. Không tự suy ra DB từ tên cluster hoặc dùng URI thiếu tên DB (có thể vào DB mặc định).
- Không lưu URI có mật khẩu, backup, dữ liệu trẻ em hoặc log chứa secret vào Git/chat. Mật khẩu đã chia sẻ phải được rotate, cập nhật mọi dịch vụ dùng nó và kiểm tra lại kết nối.
- 49 bản nháp không đồng nghĩa 49 nội dung đủ điều kiện publish; dữ liệu thiếu phải giữ ghi chú và được content owner xử lý.

## Review Focus

1. Nhầm cluster/project/DB: preflight phải so sánh tên DB cụ thể với cấu hình backend của chính môi trường đó trước mọi ghi.
2. DB mới/trùng `order`/sai chặng: importer phải báo conflict, không tự tạo hoặc remap 20 bài học.
3. Retry sau sửa tay/discard/publish: cùng checksum phải skip và giữ nguyên trạng thái/nội dung.
4. Index lỗi sau migration: metadata có thể đã commit; kiểm tra keys/index trước retry, không giả định rollback toàn bộ.
5. Mất response/crash/concurrency: dry-run lại, đối soát các key và khóa writer; không xóa khóa theo thời gian và không import chồng.

## Phase 0 — Allowed APIs và nguồn đối chiếu cho executor

Đọc phần này và các spec trước khi thực thi; không phát minh flag hoặc tự viết migration mới trong đợt nhập.

- `server/package.json`: chỉ có `cms:metadata` và `cms:import-customer` cho các CLI này.
- `server/src/seeds/migrateContentMetadata.ts`: `migrateContentMetadata({dryRun=true})`; flags `--dry-run` hoặc `--apply`; update keys trong transaction, indexes sau transaction.
- `server/src/seeds/customer/importCustomerContent.ts`: `importCustomerContent({dryRun=true, adminId?, expectedPlan?})`; CLI nhận `--dry-run` hoặc `--apply --admin-id=<24 hex>`, **không có** `--force`, `--publish`, `--db`, `--expected-plan`, `--rollback`.
- `server/src/seeds/customer/customerSource.ts`: verify UTF-8 snapshot SHA-256 theo manifest; nguồn được đọc từ repo `docs/customer-source`, không fetch Google Docs lúc import.
- `server/src/models/ContentDraft.ts`: unique `{kind,contentId}`, unique partial `{createdBy,requestId}`; không thay bằng unique requestId toàn DB.
- `server/src/modules/admin/content/content.publish.ts`: `assertCmsTransactions()` kiểm `hello` replica/sharded; publish/visibility có flag riêng.
- `server/src/test/customerImport.test.ts`, `contentIdentity.test.ts`, `cmsFlow.test.ts`: bằng chứng import draft-only, retry/skip, conflict, preservation, seed lock và old-version learning; local tests không xác nhận DB thật.

## 0. Bàn giao đầu vào và trách nhiệm

**Deploy owner:** xác nhận cluster/project, DB, credentials, quyền network, backup/restore, phiên bản deploy, chạy lệnh và giữ báo cáo. **Content owner/admin ứng dụng:** duyệt nguồn, quyết định phần thiếu/dị bản/bản quyền và xuất bản sau này. **Người duyệt production:** duyệt đích, backup và report trước apply.

Các giá trị sau là **đầu vào bắt buộc do deploy owner lấy từ môi trường thật**, không phải tên đã được xác nhận trong repo:

| Đầu vào | Staging | Production |
| --- | --- | --- |
| Atlas project + cluster + hostname từ Connect → Drivers | Ghi vào ticket riêng | Ghi vào ticket riêng |
| Tên database đầy đủ, khớp backend đang deploy | `CMS_DB_NAME` | `CMS_DB_NAME` khác staging |
| URI đã rotate, có `/tên-db` trước `?` | Secret môi trường staging | Secret môi trường production |
| User MongoDB được cấp quyền cho DB đích | Tài khoản MongoDB | Tài khoản MongoDB |
| `_id` User ứng dụng có `role: admin` trong DB đích | `CMS_ADMIN_ID` | `CMS_ADMIN_ID`, không copy ID staging |
| Backend URL/FE URL và deployment SHA | Ghi trong biên bản | Ghi trong biên bản |
| Backup path/snapshot ID, checksum, restore rehearsal | Bằng chứng riêng | Bằng chứng riêng |
| Người chạy/người duyệt và thời gian | Ghi trong biên bản | Ghi trong biên bản |

Phân biệt **Database Users trên Atlas** (quyền kết nối MongoDB) và **`users.role=admin` của Vietverse** (actor import/CMS). Không lấy ID Atlas user làm `--admin-id`, không tạo admin demo trên production. Nếu chưa có admin ứng dụng, dừng để chủ ứng dụng provision bằng quy trình đã duyệt, không sửa `users.role` tùy tiện.

Quan sát trong lượt hỗ trợ trước: URI local chưa chỉ định DB; ảnh Atlas hiển thị cluster `thanh`, trong khi hostname cấu hình là `vietversedatabase…`; kết nối thất bại trước bước đọc DB. Đây là dữ kiện cần đối chiếu, **chưa chứng minh hai tên là cùng hoặc khác cluster**. Không coi quyền IP hoặc banner hết restore là bằng chứng đã dùng đúng đích.

## Phase 1 — Chuẩn bị checkout, nguồn và deployment (không ghi DB)

**Files:** đọc `server/package.json`, `server/src/config/env.ts`, `server/src/seeds/customer/customerSource.ts`, `docs/customer-source/2026-10-09/manifest.json`, `docs/cms-operations.md`; không sửa snapshot/schema trong đợt vận hành.

- [ ] Lấy checkout đầy đủ repo; chạy các lệnh ở **repo root**, không chỉ trong thư mục `server`. Kiểm tra `git status --short` rồi `git pull --ff-only origin main`; nếu có thay đổi của người khác hoặc không fast-forward, dừng, không reset/stash tự động.
- [ ] Ghi `git rev-parse HEAD`; kiểm tra SHA deploy backend/frontend có CMS version reader/session/outbox tương ứng. Không chỉ dựa vào việc code đã push.
- [ ] Cài theo lockfile bằng `npm ci` ở runner được phép cài package; package `tsx` thuộc devDependencies nên runner chỉ có production dependencies không chạy được CLI TypeScript. Không tự upgrade dependency trong đợt import.
- [ ] Kiểm tra nguồn và test trên DB QA tạm **trước khi nạp credentials thật**:

```bash
npm run test -w server -- src/test/customerCatalog.test.ts src/test/customerImport.test.ts src/test/contentIdentity.test.ts src/test/cmsFlow.test.ts
npm run typecheck
npm run build
```

Test backend dùng `server/src/test/setup.ts` để tạo MongoDB tạm. Kiểm tra lại file này tại SHA đang chạy; không chạy test/seed với URI production nếu harness đã bị thay đổi. Không yêu cầu RED/GREEN trên DB thật: đây là vận hành tính năng đã có, không triển khai code mới.

- [ ] Kiểm SHA-256 chính xác từng snapshot, không đổi LF/CRLF, encoding hoặc whitespace để làm hết lỗi checksum:

```bash
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = 'docs/customer-source/2026-10-09/';
const manifest = JSON.parse(readFileSync(root + 'manifest.json', 'utf8'));
for (const [name, source] of Object.entries(manifest.sources)) {
  const hash = createHash('sha256').update(readFileSync(root + name + '.md')).digest('hex');
  if (hash !== source.sha256) throw new Error('Source checksum mismatch: ' + name);
  console.log(name + ': SHA-256 OK');
}
NODE
```

Nguồn gồm `explore.md` (20 giáo án), `stories.md` (21 bài đọc), `culture.md` (8 nhóm) và `coverage.md`. Có checksum đúng chỉ chứng minh byte nguồn, không chứng minh toàn bộ nội dung/audio/bản quyền sẵn sàng phát hành.

**Gate 1:** dependency/test/build/source đạt, deployment SHA được kiểm tra; nếu không, dừng trước kết nối DB thật.

## Phase 2 — Xác định đích và preflight cho từng môi trường

- [ ] Thực hiện staging trước. Inject secret `MONGODB_URI` và các biến env cần thiết từ secret manager/CI, không gõ URI có mật khẩu vào shell history hoặc commit `.env`. Runner không được rơi về URI localhost mặc định.
- [ ] Inject `CMS_DB_NAME`, `CMS_ADMIN_ID`, `CMS_RUN_DIR` (thư mục bằng chứng bảo mật ngoài checkout) và `CMS_PUBLISH_ENABLED=false`. Dùng thư mục báo cáo riêng cho từng môi trường/lần chạy; không bật shell tracing `set -x`.
- [ ] Env qua `server/src/config/env.ts`: trên production giữ `NODE_ENV=production`, `CLIENT_ORIGIN` HTTPS và JWT secrets thật, không dùng giá trị mặc định. PayOS nếu khai báo phải đủ bộ hợp lệ; thiếu cấu hình thanh toán không phải lý do tự tạo credentials giả. Không chuyển sang development để vượt validation; env của runner và backend phải được kiểm riêng.
- [ ] Trên Atlas, kiểm đúng project/cluster, restore/resume đã hoàn tất, network entry của **runner** đang dùng được. IP trình duyệt có thể khác runner qua VPN/WARP; không dùng IP cũ trong chat làm IP vĩnh viễn. Không mở `0.0.0.0/0`, không tắt TLS/chứng chỉ.
- [ ] Lấy `_id` admin từ DB ứng dụng chính xác, chỉ đọc trường cần thiết. Chạy preflight dưới đây; không xuất credential hoặc dữ liệu hồ sơ bé:

```bash
set -euo pipefail
umask 077
: "${MONGODB_URI:?Inject DB URI from secret manager}"
: "${CMS_DB_NAME:?Set the reviewed database name}"
: "${CMS_ADMIN_ID:?Set the application admin ObjectId}"
: "${CMS_RUN_DIR:?Set a protected evidence directory outside checkout}"
mkdir -p "$CMS_RUN_DIR"

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
const uri = new URL(process.env.MONGODB_URI);
assert(['mongodb:', 'mongodb+srv:'].includes(uri.protocol));
assert.equal(decodeURIComponent(uri.pathname.slice(1)), process.env.CMS_DB_NAME,
  'URI must explicitly select the reviewed DB; do not use the default DB');
assert.match(process.env.CMS_ADMIN_ID, /^[a-f\d]{24}$/i);
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000,
  });
  const db = mongoose.connection.db;
  assert.equal(db.databaseName, process.env.CMS_DB_NAME);
  await db.command({ ping: 1 });
  const hello = await db.admin().command({ hello: 1 });
  assert(hello.setName || hello.msg === 'isdbgrid', 'Transactions require replica set/sharded cluster');
  const admin = await db.collection('users').findOne({
    _id: new mongoose.Types.ObjectId(process.env.CMS_ADMIN_ID), role: 'admin',
  }, { projection: { _id: 1, role: 1 } });
  assert(admin, 'Admin actor must exist in this exact application DB');
  const lock = await db.collection('seed_locks').findOne({ _id: 'vietverse-catalog-seed' });
  assert(!lock, 'Writer lock exists: investigate active/stale writer before apply');
  console.log(JSON.stringify({ db: db.databaseName, ping: 'OK', transactions: 'available', admin: 'verified', writerLock: 'absent' }));
} finally { await mongoose.disconnect(); }
NODE
```

- [ ] Owner đối chiếu DB name với cấu hình backend thật và ký duyệt đích. Cùng hostname không chứng minh staging/production là hai DB khác nhau.
- [ ] Với DB mới/trống hoặc catalog không có 20 lesson đúng chặng/order, dừng: importer **không bootstrap lesson/admin**. Cần kế hoạch bootstrap/catalog riêng được duyệt; không tự seed trên production hoặc ép ID/order cho vừa importer.

**Gate 2:** preflight pass, DB/admin đúng, không writer đang chạy. Khi TLS/timeout/auth lỗi, xử lý Atlas/mạng/user/URI trước; retry không thay TLS policy.

## Phase 3 — Backup và restore rehearsal trước mọi ghi

- [ ] Deploy owner chọn Atlas snapshot/PITR khả dụng hoặc logical dump đầy đủ. Nhãn `Backups Inactive`/gói Free không được coi là đã có backup.
- [ ] Nếu dùng logical dump theo DB dưới đây, phải có cửa sổ ngừng các writer ứng dụng/job/CMS được điều phối ở hạ tầng để dump và baseline nhất quán. Repo **không cung cấp maintenance flag**; không tự đặt một biến env rồi cho rằng writer đã dừng. Nếu không thể quiesce writer, dùng chiến lược backup nhất quán do DBA duyệt, không tuyên bố dump đang có writer là snapshot nhất quán.
- [ ] Cài MongoDB Database Tools trên máy vận hành. Tạo file YAML `uri:` bằng editor/secret manager ở vị trí bảo mật ngoài repo; URI chỉ DB nguồn đúng môi trường, không chia sẻ file. Quyền file chỉ người vận hành, backup chứa dữ liệu cá nhân cần mã hóa/storage hạn chế truy cập và retention theo owner.
- [ ] Inject `CMS_DUMP_CONFIG` (path YAML riêng môi trường), `CMS_BACKUP_ARCHIVE` (path archive ngoài repo). Không có lệnh tự ghi file chứa URI trong kế hoạch:

```bash
: "${CMS_DUMP_CONFIG:?Set protected mongodump config path}"
: "${CMS_BACKUP_ARCHIVE:?Set protected backup archive path}"
mongodump --version
mongodump --config="$CMS_DUMP_CONFIG" --db="$CMS_DB_NAME" --archive="$CMS_BACKUP_ARCHIVE" --gzip
test -s "$CMS_BACKUP_ARCHIVE"
sha256sum "$CMS_BACKUP_ARCHIVE"
```

Không dùng `--oplog` cùng dump `--db`; đây không phải backup PITR. Cần xác nhận đủ collection/index và backup thành công, không chỉ file tồn tại. Lưu exit code, hash, thời điểm, DB nguồn trong biên bản riêng; không commit archive.

- [ ] Thử restore vào **cluster kiểm thử biệt lập**, không dùng staging/production đang phục vụ. Inject config `CMS_RESTORE_CONFIG` của cluster kiểm thử và tên DB mới `CMS_RESTORE_DB`; owner kiểm tra hai đích không trùng DB nguồn trước lệnh ghi:

```bash
: "${CMS_RESTORE_CONFIG:?Set config for the isolated restore cluster}"
: "${CMS_RESTORE_DB:?Set a new isolated restore database name}"
mongorestore --config="$CMS_RESTORE_CONFIG" --archive="$CMS_BACKUP_ARCHIVE" --gzip \
  --nsInclude="${CMS_DB_NAME}.*" --nsFrom="${CMS_DB_NAME}.*" --nsTo="${CMS_RESTORE_DB}.*"
```

Không dùng `--drop`. Chạy trên DB kiểm thử chưa có dữ liệu; nếu trùng collection/ID, dừng và chọn đích kiểm thử khác. DBA kiểm counts/index và mẫu content trên bản restore, ghi bằng chứng restore exit 0. Không mở DB có dữ liệu bé cho nhóm QA không được phép.

- [ ] Chụp baseline kiểm soát truy cập trước migration/import: số lượng, ID và hash BSON/canonical payload của live lessons/stories/culture; `updatedAt`, `contentVersion`, lesson stage/order; drafts hiện hữu; các collection nghiệp vụ bé/điểm/thu âm/đổi quà/subscription. Giữ dữ liệu chi tiết trong bằng chứng bảo mật, báo cáo bàn giao chỉ chứa số tổng hợp/hash. Nếu app tiếp tục ghi trong một bước đối chiếu, phải tách thay đổi có actor/thời gian hợp lệ khỏi tác động import, không lấy chênh count toàn DB làm bằng chứng importer sửa điểm.

**Gate 3:** backup khôi phục được và baseline đã lưu; chưa có bằng chứng này thì không chạy migration/index/apply production.

## Phase 4 — Metadata và index prerequisites

**Implementation references:** `server/src/seeds/migrateContentMetadata.ts`, `server/src/seeds/contentIdentity.ts`, `server/src/models/ContentDraft.ts`.

- [ ] Đóng băng biên tập CMS, seed/import writer khác trong cửa sổ thao tác; metadata CLI không dùng khóa seed/import chung. Giữ publish false.
- [ ] Dry-run metadata, lưu báo cáo:

```bash
npm run --silent cms:metadata -w server -- --dry-run > "$CMS_RUN_DIR/metadata-dry-run.json"
```

Report có `updates`, `conflicts`, `dryRun: true`; chỉ duyệt các ID/key được ánh xạ duy nhất bằng seedKey hoặc tiêu đề chuẩn hóa NFC/case. `conflicts` khác rỗng thì dừng, không tự đổi tên/xóa bản trùng.

- [ ] Sau backup và duyệt report, apply metadata:

```bash
npm run --silent cms:metadata -w server -- --apply > "$CMS_RUN_DIR/metadata-apply.json"
npm run --silent cms:metadata -w server -- --dry-run > "$CMS_RUN_DIR/metadata-after.json"
```

Kết quả kỳ vọng: chỉ thêm `seedKey` ở story/culture cần ánh xạ và index unique sparse `{seedKey:1}`; không sửa payload/timestamps. Report sau có `updates: []`, `conflicts: []`. **Transaction metadata commit trước khi tạo indexes**: nếu createIndex lỗi thì keys có thể đã được ghi. Kiểm tra DB và duplicate/index options rồi mới retry; không nói mọi lỗi migration đều rollback keys.

- [ ] Xác minh/provision các unique indexes của `contentdrafts` trước import. Import connect với `autoIndex:false, autoCreate:false`; `ContentDraft.init()` **không được coi là bằng chứng đã tạo indexes**. Đây là bước DDL có ghi, chỉ chạy sau backup trên đích đã duyệt:

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
assert.equal(decodeURIComponent(new URL(process.env.MONGODB_URI).pathname.slice(1)), process.env.CMS_DB_NAME);
try {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db;
  const exists = await db.listCollections({ name: 'contentdrafts' }, { nameOnly: true }).hasNext();
  if (!exists) await db.createCollection('contentdrafts');
  const drafts = db.collection('contentdrafts');
  await drafts.createIndex({ kind: 1, contentId: 1 }, { unique: true });
  await drafts.createIndex({ createdBy: 1, requestId: 1 }, {
    unique: true, partialFilterExpression: { requestId: { $type: 'string' } },
  });
  console.log(JSON.stringify(await drafts.indexes()));
} finally { await mongoose.disconnect(); }
NODE
```

So sánh với schema tại SHA checkout. Index cùng key nhưng options khác, duplicate hoặc thiếu quyền → dừng cho DBA xử lý; không drop/sync/rebuild mù. Xác minh thêm story/culture unique sparse indexes từ metadata bằng Atlas Data Explorer/index view hoặc DB tool. Chưa cần tạo revisions/audit của publish để nhập nháp; khi mở đợt publish phải xác minh riêng các indexes theo model.

**Gate 4:** metadata không conflict, key/index đúng, payload/version/updatedAt live không đổi ngoài metadata được duyệt.

## Phase 5 — Dry-run 49 mục, duyệt và apply nháp

- [ ] Chạy dry-run trên đúng DB, lưu JSON và exit code:

```bash
npm run --silent cms:import-customer -w server -- --dry-run > "$CMS_RUN_DIR/customer-dry-run.json"
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const report = JSON.parse(readFileSync(process.env.CMS_RUN_DIR + '/customer-dry-run.json', 'utf8'));
assert.equal(report.dryRun, true);
assert.equal(report.entries.length, 49);
for (const [kind, count] of [['lesson', 20], ['story', 21], ['culture', 8]]) {
  assert.equal(report.entries.filter(entry => entry.kind === kind).length, count);
}
assert(report.entries.every(entry => ['create', 'skip'].includes(entry.action)), 'Conflict: do not apply');
console.log(JSON.stringify(Object.fromEntries(['create', 'skip', 'conflict'].map(
  action => [action, report.entries.filter(entry => entry.action === action).length]))));
NODE
```

Kỳ vọng lần đầu trên catalog phù hợp: 49 `create`, 0 `skip`, 0 `conflict`; lần chạy lại hoặc nhập một phần trước đó: `create + skip = 49`. Duyệt từng `key/kind/contentId/checksum/baseContentVersion/reason`, không chỉ tổng số. Lesson giữ ID, stage/order/free-plan policy từ live; story/culture chưa có live được cấp ID draft-only, chưa xuất hiện public.

- [ ] Người duyệt ký report. Khi checksum thay đổi, draft thủ công đã tồn tại, lesson mapping không duy nhất hoặc seedKey/title mơ hồ, dừng. Không tự đổi source/draft/ID để ép apply.
- [ ] **Cách apply khuyến nghị, gắn với report đã duyệt:** dùng exported API có `expectedPlan` (không có flag CLI `--expected-plan`). Chạy cùng SHA/catalog và cùng cấu hình, vẫn đóng băng các writer liên quan:

```bash
node --import tsx --input-type=module > "$CMS_RUN_DIR/customer-apply.json" <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importCustomerContent } from './server/src/seeds/customer/importCustomerContent.ts';
assert.equal(decodeURIComponent(new URL(process.env.MONGODB_URI).pathname.slice(1)), process.env.CMS_DB_NAME);
const expectedPlan = JSON.parse(readFileSync(process.env.CMS_RUN_DIR + '/customer-dry-run.json', 'utf8'));
assert.equal(expectedPlan.dryRun, true);
assert.equal(expectedPlan.entries.length, 49);
assert(expectedPlan.entries.every(entry => ['create', 'skip'].includes(entry.action)));
const report = await importCustomerContent({ dryRun: false, adminId: process.env.CMS_ADMIN_ID, expectedPlan });
console.log(JSON.stringify(report, null, 2));
NODE
```

API so sánh `expectedPlan.entries` với plan mới trước transaction. Live `updatedAt`/version đổi hoặc nháp mới xuất hiện có thể làm lệnh từ chối; phải dry-run và duyệt lại, không bỏ guard để vượt lỗi.

**CLI có sẵn để tham khảo, không chạy thêm sau API ở trên:**

```bash
npm run --silent cms:import-customer -w server -- --apply --admin-id="$CMS_ADMIN_ID"
```

CLI tự lập lại plan tại thời điểm chạy và không bind report đã duyệt; nếu dùng CLI thay API, owner phải ghi rõ lựa chọn, kiểm soát cửa sổ writer và đối chiếu report apply ngay sau chạy. Chỉ chọn **một cách apply** cho mỗi lần chạy.

Mutation được phép: tạo các `ContentDraft` mới (`state=editing`, `draftVersion=1`, source/checksum/notes/actor/requestId), cấp activity ID mới trong nháp lesson, khóa writer tạm. Live có no-op write để khóa phiên bản, không sửa nội dung/timestamps. Toàn bộ **draft inserts** cùng transaction; indexes/metadata và writer lock không phải một phần của transaction draft.

**Gate 5:** apply exit 0, `dryRun:false`, số tạo mới đúng số `create` được duyệt, mọi `skip` giữ nguyên. Không có publish/reward/learning mutation từ import.

### Truy vấn đối soát chỉ đọc trong Atlas Data Explorer/mongosh

Chạy trong session đã chọn đúng DB. Các tên collection dưới đây là tên theo model Mongoose hiện tại, không phải danh sách production đã được quan sát; nếu schema ở SHA deploy có override thì đối chiếu lại trước query. Chỉ lưu kết quả trong thư mục bằng chứng bảo mật.

```javascript
db.getName()
db.stories.getIndexes()
db.culturearticles.getIndexes()
db.contentdrafts.getIndexes()
db.seed_locks.find({ _id: "vietverse-catalog-seed" })

db.lessons.aggregate([
  { $match: { order: { $gte: 1, $lte: 20 } } },
  { $lookup: { from: "stages", localField: "stageId", foreignField: "_id", as: "stage" } },
  { $project: { _id: 1, order: 1, stageId: 1, stageOrder: { $arrayElemAt: ["$stage.order", 0] }, contentVersion: 1 } },
  { $sort: { order: 1 } }
])
db.lessons.aggregate([
  { $group: { _id: "$order", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
db.contentdrafts.aggregate([
  { $match: { requestId: /^customer:/ } },
  { $group: { _id: { kind: "$kind", state: "$state" }, count: { $sum: 1 } } }
])
db.contentdrafts.find(
  { requestId: /^customer:/ },
  { _id: 1, kind: 1, contentId: 1, requestId: 1, draftVersion: 1, baseContentVersion: 1,
    state: 1, source: 1, editorialNotes: 1, createdBy: 1, updatedBy: 1 }
).sort({ kind: 1, requestId: 1 })
```

Lesson order 1–20 phải có stage order `Math.ceil(order / 4)` theo catalog nguồn; yêu cầu đúng một lesson toàn DB cho mỗi order trong phạm vi nhập. Query group drafts là kiểm tổng hợp, **không thay việc đối chiếu đủ 49 key/checksum trong report**; DB có nguồn customer khác phải lọc đúng bộ nguồn này trước nghiệm thu.

## Phase 6 — Kiểm chứng, staging sign-off, rồi production

- [ ] Chạy lại dry-run, kỳ vọng toàn bộ 49 mục `skip` và 0 `create/conflict`; không cần apply lần thứ hai để chứng minh retry:

```bash
npm run --silent cms:import-customer -w server -- --dry-run > "$CMS_RUN_DIR/customer-after.json"
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const report = JSON.parse(readFileSync(process.env.CMS_RUN_DIR + '/customer-after.json', 'utf8'));
assert.equal(report.entries.length, 49);
assert(report.entries.every(entry => entry.action === 'skip'));
console.log('49 sources already imported; no further creates/conflicts');
NODE
```

- [ ] Trong DB, lọc `contentdrafts` theo `requestId` bắt đầu `customer:` và checksum trong manifest; không lấy tổng mọi drafts làm số nhập. Kiểm 20 lesson/21 story/8 culture, actor đúng, source heading/tab/checksum và ID liên kết đúng. Draft có từ trước có thể là `synced/discarded` hoặc version >1; giữ nguyên, không bắt chúng về `editing/1`.
- [ ] So sánh baseline bảo mật: live payload/IDs/stage/order/contentVersion/updatedAt giữ nguyên; metadata chỉ thêm seedKey đã duyệt; các draft cũ không bị sửa; điểm/progress/recording/quà/subscription không đổi do importer. Khóa `seed_locks/vietverse-catalog-seed` không còn sau thành công. Không xóa khóa nếu đối soát thấy writer khác đang chạy.
- [ ] Smoke test admin `/admin/bai-hoc`, `/admin/truyen`, `/admin/van-hoa`: thấy nháp nguồn khách hàng, ghi chú cạnh field/nhóm, preview đúng bản đã lưu. Đối chiếu lời “Rồng rắn lên mây” với snapshot; xem ghi chú dị bản Lộn cầu vồng/Kéo cưa và bài 15/20 chưa đủ hoạt động. Không bấm publish.
- [ ] Smoke test public/bé/phụ huynh chỉ đọc: live chưa đổi; nháp story/culture mới chưa public; progress/điểm dashboard còn nguyên, Parent Gate/reload hoạt động. Mọi test mutation học/đổi quà/thu âm làm trên tài khoản QA staging riêng, không dùng hồ sơ bé thật làm test.
- [ ] Lưu staging sign-off rồi mới làm production. Đổi toàn bộ secret/DB/admin/run directory/backup config sang **production đã duyệt**, chạy lại **Phase 2–6** với backup và report production mới. Không copy IDs/report staging sang production, không restore staging đè production.
- [ ] Sau đối soát xong, mở lại writer/traffic theo quy trình hạ tầng; giữ publish false. Thu hồi quyền/IP tạm của runner và xử lý file secret/backup theo retention, không xóa bằng chứng cần đối soát.

## Phase 7 — Đợt publish riêng, ngoài phạm vi nhập DB này

Content owner xử lý phần thiếu theo `coverage.md`: audio thật/bản quyền; từ thiếu nghĩa/lựa chọn; bài 15/20; các renderer chưa hỗ trợ (chọn nhiều chữ, phân nhóm nhiều-về-một, nhiều ô trống, thao tác ba bước); culture intro/facts/quiz. Không bịa nội dung hoặc lấy demo thay nguồn khách hàng.

Khi có yêu cầu publish được duyệt riêng: kiểm deployment reader/session/outbox/version, backup mới và indexes revisions/audit, chạy validate từng bản, admin lưu/preview và publish có xác nhận. Sau publish phải nghiệm thu bé đang học phiên bản cũ vẫn hoàn thành đúng và replay không nhân điểm. Không rollback về backend grader chỉ đọc live khi đã có revisions.

## Xử lý lỗi và rollback

| Tình huống | Hành động và điều cấm |
| --- | --- |
| TLS/timeout/restore đang chạy | Kiểm đúng project/hostname, trạng thái cluster, IP runner, TLS/network; không tắt certificate hoặc mở toàn Internet |
| Auth/permission error | Kiểm database user/password đã rotate/authSource và quyền DDL/transaction trên DB đích; không nhầm với admin ứng dụng |
| Non-admin/mapping/checksum/draft conflict | Dừng, giữ report, owner xử lý chính xác mục lỗi; không sửa role/source/ID hoặc xóa draft tùy tiện |
| Metadata createIndex lỗi | Keys có thể đã commit; inspect keys/duplicate/index options và duyệt lại; không restore toàn DB hoặc drop index mù |
| Import transaction lỗi | Draft inserts rollback; metadata/index trước đó không rollback theo; dry-run lại và kiểm trạng thái thực tế |
| Mất response hoặc runner crash | Kết quả chưa biết; không kết luận thất bại là chưa ghi. Dùng dry-run/DB evidence đối chiếu 49 key/checksum và actor, kiểm khóa |
| Khóa writer còn | Xác minh PID/job/owner không còn writer, đối soát commit rồi DBA mới gỡ đúng khóa theo thao tác được duyệt; không tự timeout/delete khóa |
| Muốn hủy đợt nhập chưa publish | Giữ publish false, giữ drafts/source/bằng chứng; nếu cần bỏ nháp dùng CMS discard đúng version từng mục đã duyệt, không xóa lịch sử |
| Muốn rollback nội dung đã publish | Mở change riêng: xuất bản lại nội dung đã duyệt từ snapshot thành version mới, giữ revisions/progress/ledger; không có nút restore một chạm |

Không có script rollback hàng loạt importer trong repo. Backup dùng cho khôi phục thảm họa do DBA phê duyệt, không phải lệnh restore đè production mỗi khi import lỗi. Nếu cần khôi phục thật, phải tính mọi ghi mới sau backup, auth/session/payments và đối soát riêng trước cutover.

## Biên bản bắt buộc để người deploy gửi lại

- [ ] Môi trường, project/cluster/host/DB, người chạy/người duyệt, thời gian Asia/Saigon, SHA checkout và SHA backend/FE đã deploy; không kèm URI có mật khẩu.
- [ ] Preflight ping/replica-set/admin/lock; xác nhận publish false trên backend.
- [ ] Backup reference/hash, cách bảo vệ dữ liệu, restore rehearsal, cửa sổ writer và baseline.
- [ ] Metadata report trước/apply/sau, DDL/index evidence; danh sách changes/conflict đã giải quyết.
- [ ] Import report trước/apply/sau; số create/skip/conflict từng nhóm, bằng chứng 49 checksum/source đúng.
- [ ] So sánh live/draft/learning baseline; CMS/public/parent smoke; xác nhận không publish.
- [ ] Lỗi còn lại/ghi chú content/khả năng thu hồi quyền runner; người ký staging trước khi duyệt production.

Mẫu tóm tắt gửi lại (không gửi backup hoặc hồ sơ bé): `Môi trường …; SHA …; DB đã đối chiếu …; backup/restore proof …; metadata updates …; import lesson create/skip/conflict …, story …, culture …; post-check 49 skip; live/learning unchanged …; publish=false; smoke …; người duyệt …; phần còn chờ …`.

**Giới hạn bàn giao:** kết nối Atlas ở lượt hỗ trợ còn lỗi, chưa xác nhận tên DB/admin/backup thật và chưa import môi trường nào. Người deploy phải cung cấp bằng chứng các gate trên; kế hoạch không được đánh dấu thực thi chỉ vì đã push `main`.

### Kiểm chứng khi soạn kế hoạch (2026-10-09)

- Đã đối chiếu source importer/migration/model với các lệnh, gate và rollback; có fact gathering đọc code độc lập, không truy cập `.env` hoặc DB thật trong lượt soạn plan.
- Chạy bốn suite `customerCatalog`, `customerImport`, `contentIdentity`, `cmsFlow`: **22/22 test đạt** trên MongoDB QA tạm. Đây không phải import staging/production.
- Kiểm cú pháp sáu đoạn Node bằng `node --check` (không execute các đoạn kết nối/DDL/import), xác nhận link spec tồn tại và SHA-256 cả ba snapshot đúng manifest.
- Lượt này chỉ thêm tài liệu và liên kết, không thay code/API/dữ liệu; không chạy build hoặc toàn bộ test ứng dụng lại. Bash/Database Tools và lệnh DB phải được người deploy kiểm trên runner thực tế; cú pháp Node đạt không chứng minh quyền/backup hay môi trường đã sẵn sàng.
