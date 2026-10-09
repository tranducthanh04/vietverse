# Vercel Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution or superpowers:subagent-driven-development if the user chooses delegated execution. Steps use checkbox syntax for tracking. This plan is awaiting review and execution-method approval; its existence does not authorize production cutover.

**Goal:** Chuyển Express backend sang Vercel, giữ DB/nghiệp vụ và giới hạn thu âm 5 MiB bằng signed direct upload có xác minh server.

**Architecture:** Một project Vercel riêng dùng Express native, kết nối MongoDB cache theo instance và rate limit MongoDB chung. FE upload file trực tiếp Cloudinary bằng intent đã ký; server đọc metadata và finalize idempotent trong transaction. Giữ Render tương thích làm rollback.

**Tech Stack:** TypeScript ESM, Express 4, Mongoose 8, MongoDB replica set, Cloudinary SDK hiện hữu, Zod, Axios, React, Vitest, Supertest, MongoMemoryReplSet.

**Spec:** `docs/superpowers/specs/2026-10-09-vercel-backend-design.md`.

## Global Constraints

- Giữ MongoDB và dữ liệu hiện hữu, đường dẫn `/api/v1`, quyền truy cập, cách chấm bài, điểm, subscription và CMS contentVersion.
- Giới hạn file `5 * 1024 * 1024` byte; duration mới xác minh từ provider và không vượt 180 giây.
- Intent cho phép finalize trong 10 phút; TTL sau 7 ngày; completed receipt đọc được sau hết hạn và sau intent TTL qua Recording.
- Auth 30 request/15 phút; API 120 request/phút; store chung, reset atomic theo cửa sổ từ request đầu, fail-closed khi store lỗi.
- Cache pool `maxPoolSize: 5`, `minPoolSize: 0`, `serverSelectionTimeoutMS: 5000`; không disconnect mỗi request hoặc exit process trong serverless handler.
- Không seed/import, bật CMS publish, thay gói/điểm, tự chuyển tiền, drop/restore DB, dùng `syncIndexes`, xóa Render hoặc commit secret.
- Không đổi proxy production sang URL chưa xác minh. Preview không tự dùng DB/credentials production.
- Mỗi task: test RED có lý do đúng → implementation → test GREEN → kiểm tra diff → commit cục bộ có scope. Không push/merge/deploy production ngầm.

## Review Focus

1. Parent đổi tài khoản hoặc đổi bé giữa upload và finalize: không complete phiên mới hoặc gửi context cũ dưới user mới; Task 5 test chuyển context khi response đang chờ.
2. File `audio/mp4` có video stream hoặc thiếu metadata: không tạo Recording/điểm; Task 3/4 dùng fixtures tách audio-only/video/missing.
3. Intent TTL đã xóa nhưng finalize response cũ bị mất: trả lại đúng receipt khi còn ownership; Task 4 test xóa intent rồi retry.
4. Xóa child cạnh tranh với finalize: không có Recording mồ côi; Task 4 test transaction cạnh tranh và rollback.
5. Hai tầng FE rewrite/BE proxy làm mọi user chung IP hoặc header giả vượt limiter: Task 2 tests middleware và Task 7 staging gate; test local không được thay bằng chứng Vercel thật.

## Setup trước Task 1 — chỉ sau khi người dùng duyệt kế hoạch

Repo hiện là checkout thường, nhánh `main`; chỉ `.superpowers/` untracked là ngoài phạm vi. Không stash/xóa thư mục này. Chưa có worktree gắn vào chat. Đề xuất thực hiện native trong chat trên nhánh `codex/vercel-backend`; hỏi quyền tạo managed worktree nếu người dùng chưa chọn. Nếu họ chọn làm tại chỗ, tạo nhánh riêng tại checkout hiện tại, không code trên main.

Repo có `develop`, không có `dev`; `origin/develop` ở lần kiểm tra chỉ đọc là ancestor của HEAD. Đề xuất dùng `origin/develop` làm nguồn sync theo pull-before-code, chỉ sau khi người dùng duyệt lựa chọn này. Fetch lại trước code, kiểm tra divergence rồi merge trên nhánh riêng; nếu có conflict/khác biệt ngoài phạm vi, dừng và báo chứ không reset/stash công việc của user.

```powershell
git fetch origin
git log -1 --oneline origin/develop
git merge-base --is-ancestor origin/develop HEAD
# Nếu exit 0, nhánh đã chứa develop; không cần merge rỗng.
# Nếu exit 1, kiểm tra git diff HEAD...origin/develop trước khi merge trên feature branch.
```

Expected: fetch thành công, working tree ngoài tài liệu kế hoạch không đổi, không thiếu commit develop. Không invent ref `dev`.

Kiểm tra Node/npm và dependency sẵn có; chỉ dùng `npm ci` nếu cần, không cài CLI global. Chạy baseline `npm test` ở root trước implementation. Expected: toàn bộ test hiện hữu pass; lỗi baseline phải được báo và phân biệt với regression, không tự tuyên bố sạch. Test DB dùng MongoMemoryReplSet từ `server/src/test/setup.ts`, không URI production.

## File structure và interfaces dùng chung

- `server/src/index.ts`: Vercel entrypoint, không listener; `src/server.ts` giữ listener local/Render.
- `server/src/config/db.ts`: cache connect promise, retry sau lỗi.
- `server/src/models/RateLimitBucket.ts`, `middlewares/mongoRateLimitStore.ts`, `middlewares/clientIp.ts`: bucket chia sẻ và khóa client tin cậy.
- `server/src/models/RecordingUploadIntent.ts`: intent/context/receipt; `Recording.ts` thêm unique sparse uploadIntentId không xuất ra DTO.
- `server/src/services/directAudioStorage.ts`: SDK signing/metadata inspection, không policy học tập.
- `server/src/modules/recordings/recordings.validation.ts`, `recordings.policy.ts`, `recordings.directUpload.ts`: schema, policy dùng chung legacy/direct, điều phối intent/finalize.
- `client/src/lib/directRecordingUpload.ts`: workflow/retry độc lập UI; hook hiện hữu quản lý Blob và lifecycle.
- `server/src/seeds/prepareDeploymentIndexes.ts`: công cụ indexes additive, dry-run mặc định; không seed hoặc drop indexes.
- `docs/vercel-deployment.md`: env/preset/proxy/indexes/webhook/rollback và gate thật.

Contract giữa tasks:

```ts
type RecordingContext = {
  childId: string; lessonId?: string; activityId?: string;
  contentVersion?: number; wordOrPrompt?: string;
};
type UploadIntentInput = RecordingContext & {
  requestId: string; byteLength: number; mimeType: string; durationSec: number;
};
type UploadIntentDto = {
  intentId: string; expiresAt: string;
  upload: { url: string; fields: Record<string, string> };
};
type VerifiedAudio = {
  publicId: string; url: string; bytes: number; durationSec: number;
  format: string; hasAudio: boolean; hasVideo: boolean;
};
type RecordingReceipt = {
  id: string; _id: string; childId: string; lessonId?: string;
  activityId?: string; contentVersion?: number; url: string;
  publicId?: string; durationSec: number; wordOrPrompt?: string; createdAt: string;
};
// JSON DTO giữ field lịch sử, tuyệt đối không gồm context hash/state của intent.
```

### Task 1: MongoDB cache và entrypoint serverless có readiness

**Files:** Modify `server/src/config/db.ts`, `server/src/config/env.ts`, `server/src/app.ts`; Create `server/src/index.ts`, `server/src/test/dbConnection.test.ts`, `server/src/test/serverless.test.ts`; Modify `server/src/test/health.test.ts`.

**Interfaces:** consumes `app`, `env`, `sendError`; produces `connectDB(uri?): Promise<typeof mongoose>` giữ signature cũ và default Express app entrypoint; `/health` liveness, `/ready` readiness.

- [ ] **Step 1 — test RED:** bổ sung readiness qua Supertest và connect concurrent/error retry. Spy chỉ tại mongoose network boundary, không mock Express/response.

```ts
it('reports database readiness separately from process liveness', async () => {
  const live = await request(app).get('/health');
  const ready = await request(app).get('/ready');
  expect(live.status).toBe(200);
  expect(ready.status).toBe(200); // setup.ts đã connect replica set test.
  expect(ready.body.data.status).toBe('ready');
});
```

- [ ] **Step 2 — chạy RED:** `npm run test -w server -- src/test/health.test.ts src/test/dbConnection.test.ts src/test/serverless.test.ts`. Expected: `/ready` hiện 404; concurrency cho thấy connect lặp; failure phải do thiếu behavior, không import typo.
- [ ] **Step 3 — implementation:** cache promise trong db.ts, trả kết nối đang ready, xóa promise khi reject và khi disconnect. Logger không log error object chứa URI. Entrypoint wrap app bằng Express middleware readiness trước `/api`, bỏ qua `/health`; catch connect gửi 503 `DATABASE_UNAVAILABLE`. `/ready` dùng connect + ping DB, không gọi Cloudinary/PayOS. Handler không listener/exit/disconnect. Env giữ validation production hiện hữu nhưng throw lỗi startup an toàn thay cho process.exit để không kết thúc worker dùng chung. Điểm điều khiển connect:

```ts
let pending: Promise<typeof mongoose> | undefined;
// Trong connectDB, sau kiểm tra readyState:
pending ??= mongoose.connect(uri, {
  maxPoolSize: 5, minPoolSize: 0, serverSelectionTimeoutMS: 5000,
}).catch(error => { pending = undefined; throw error; });
return pending;
```

- [ ] **Step 4 — GREEN:** chạy lại targeted command và `npm run typecheck -w server`; Expected: pass, bao gồm connect reject rồi retry, connection reuse warm start, readiness 503 và liveness còn 200, API wrapper 503 khi cold DB lỗi. Không ngắt DB global của setup để test readiness; dùng network spy có restore hoặc test suite isolated.
- [ ] **Step 5 — commit:** `git add -- server/src/config/db.ts server/src/config/env.ts server/src/app.ts server/src/index.ts server/src/test/dbConnection.test.ts server/src/test/serverless.test.ts server/src/test/health.test.ts`; `git diff --cached --check`; `git commit -m "feat(server): support Vercel runtime with cached database readiness"`. Expected: chỉ files Task 1.

### Task 2: Rate limit atomic dùng chung MongoDB và client IP

**Files:** Create `server/src/models/RateLimitBucket.ts`, `server/src/middlewares/mongoRateLimitStore.ts`, `server/src/middlewares/clientIp.ts`, `server/src/test/mongoRateLimit.test.ts`, `server/src/test/clientIp.test.ts`; Modify `server/src/middlewares/rateLimiter.middleware.ts`, `server/src/app.ts`.

**Interfaces:** `MongoRateLimitStore(scope: 'api' | 'auth')` implements `express-rate-limit` Store v7, `init(options)`, `increment(key) -> {totalHits,resetTime}`, `decrement(key)`, `resetKey(key)`; `getClientRateLimitKey(req)` trả digest IP đã chuẩn hóa. Test store init xác định windowMs như middleware thật; không production test cleanup method.

- [ ] **Step 1 — test RED:** integration hai instance store, cùng key đủ 31 auth/121 API gọi bị 429; resetAt quá hạn nhưng document còn tồn tại phải bắt đầu lại 1; 50 increment cạnh tranh phải đếm đúng; key auth/api tách biệt; store lỗi trả 503. Test middleware từ phía socket/header, không chỉ test crypto digest.

```ts
it('shares the quota between instances rather than process memory', async () => {
  const left = new MongoRateLimitStore('auth');
  const right = new MongoRateLimitStore('auth');
  left.init({ windowMs: 900000 } as Options);
  right.init({ windowMs: 900000 } as Options);
  const results = await Promise.all(Array.from({ length: 31 }, (_, i) =>
    (i % 2 ? left : right).increment('same-client')));
  expect(Math.max(...results.map(x => x.totalHits))).toBe(31);
});
```

- [ ] **Step 2 — chạy RED:** `npm run test -w server -- src/test/mongoRateLimit.test.ts src/test/clientIp.test.ts`. Expected: absence/shared-store contract thất bại; điều chỉnh setup trước khi nhận failure về behavior.
- [ ] **Step 3 — implementation:** bucket `_id` duy nhất theo scope:key, `hits`, `resetAt` Date TTL; update pipeline MongoDB dùng `$$NOW` để reset/tăng trong cùng operation. Unique first-upsert race retry có giới hạn, không increment hai lần nếu operation đã trả success. Chọn production Mongo store, local/test memory trừ targeted integration. Ánh xạ store lỗi thành 503 ở middleware error path.

```ts
const update = [{ $set: {
  hits: { $cond: [{ $gt: ['$resetAt', '$$NOW'] },
    { $add: [{ $ifNull: ['$hits', 0] }, 1] }, 1] },
  resetAt: { $cond: [{ $gt: ['$resetAt', '$$NOW'] },
    '$resetAt', { $add: ['$$NOW', windowMs] }] },
} }];
```

IP helper phải ghi rõ trust contract: Render trust immediate proxy như baseline; Vercel dùng provider-normalized header chỉ khi Vercel runtime xác nhận, validate một địa chỉ IP và không đọc arbitrary leftmost XFF. IPv4-mapped IPv6 chuẩn hóa cùng key; raw header sai từ chối/key socket an toàn, không tạo key giả. Chưa chứng minh end-user IP qua FE rewrite thì chưa cutover; không đoán header secret forwarding mới.

- [ ] **Step 4 — GREEN:** targeted command + server typecheck; Expected: DB counts/concurrency/reset đúng, auth/api vượt quota 429 như baseline, DB lỗi 503; header giả khi không có trusted platform không bypass; live staging ở Task 7 còn bắt buộc.
- [ ] **Step 5 — commit:** stage đúng 7 files trên; `git diff --cached --check`; `git commit -m "feat(server): share API rate limits across instances"`. Expected: không đổi mức auth/API hoặc CORS allowlist.

### Task 3: Signed intent và adapter Cloudinary kiểm chứng audio

**Files:** Create `server/src/models/RecordingUploadIntent.ts`, `server/src/services/directAudioStorage.ts`, `server/src/modules/recordings/recordings.validation.ts`, `server/src/modules/recordings/recordings.policy.ts`, `server/src/modules/recordings/recordings.directUpload.ts`, `server/src/test/recordingIntent.test.ts`, `server/src/test/directAudioStorage.test.ts`; Modify recordings controller/routes/service, config/env.ts, models/index.ts, server/.env.example.

**Interfaces:** `assertRecordingContext(parentId, context): Promise<RecordingContext>` tái sử dụng ownership/unlock/readPublished/resolveSubmissionVersion hiện hữu; `directAudioStorage.sign(publicId,timestamp): UploadIntentDto['upload']`, `inspect(publicId): Promise<VerifiedAudio>`; `DirectRecordingsService.createIntent(parentId,input): Promise<UploadIntentDto>`.

- [ ] **Step 1 — test RED:** POST upload-intent auth/ownership/type/version, max byte literal, UUID requestId, context mismatch 409, same requestId concurrency cùng intent, hết hạn không hồi sinh, thiếu storage 503. Fixture auth/child/stage/lesson tạo thật bằng pattern trong recordingOwnership.test.ts; chỉ stub outbound SDK.

```ts
it('rejects another parent before issuing upload permission', async () => {
  const owner = await AuthService.register({ email: 'intent-owner@example.test', password: 'Password123!', displayName: 'Owner' });
  const stranger = await AuthService.register({ email: 'intent-other@example.test', password: 'Password123!', displayName: 'Other' });
  const child = await Child.create({ parentId: owner.user.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' });
  const res = await request(app).post('/api/v1/recordings/upload-intent')
    .set('Authorization', `Bearer ${stranger.accessToken}`)
    .send({ requestId: 'df1a4398-a090-451c-86aa-f6aa3c9b1087', childId: child.id,
      byteLength: 100, mimeType: 'audio/webm', durationSec: 1 });
  expect(res.status).toBe(404);
  expect(await RecordingUploadIntent.countDocuments()).toBe(0);
});
```

- [ ] **Step 2 — chạy RED:** `npm run test -w server -- src/test/recordingIntent.test.ts src/test/directAudioStorage.test.ts src/test/recordingOwnership.test.ts`. Expected: luồng intent hợp lệ hiện 404 thay vì 201; ownership không có mutation. Giữ nguyên tests legacy.
- [ ] **Step 3 — implementation:** strict schema nhận đúng UploadIntentInput; MIME bỏ tham số codec trước allowlist audio/webm/mp4/ogg/mpeg/wav/x-wav, application/ogg. Context optional pair và version dùng policy hiện hữu. Intent chứa parentId/requestId, context immutable, request fingerprint canonical, random publicId, signed timestamp, expiresAt, deleteAt, status pending/completed, optional recordingId; unique parentId/requestId và TTL deleteAt. Query theo owner, duplicate key resolve existing và so fingerprint, không dùng raw client URL.

```ts
recordingUploadIntentSchema.index({ parentId: 1, requestId: 1 }, { unique: true });
recordingUploadIntentSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
const signedFields = {
  public_id: publicId, timestamp: String(timestamp), overwrite: 'false',
  upload_preset: env.CLOUDINARY_RECORDING_UPLOAD_PRESET,
};
// Sign bằng cloudinary.utils.api_sign_request; API secret chỉ tồn tại ở server.
```

Env preset là string optional; thiếu preset không làm sập auth/API nhưng direct intent trả 503. Giữ signed preset/SDK scope cố định. Adapter inspect dùng `cloudinary.api.resource(publicId,{resource_type:'video',media_metadata:true})`, validate secure_url host Cloudinary HTTPS và public_id chính xác, finite bytes/duration, audio metadata có codec và video metadata không có video codec/stream. Adapter chỉ normalize; service reject metadata thiếu/video, >5 MiB, >180s. Provider không tìm thấy asset trả 404 `UPLOAD_ASSET_NOT_FOUND` để client phân biệt lỗi quyền và upload chưa tới provider; không trả URL nội bộ. Test raw SDK fixtures gồm audio webm/mp4/ogg, video và incomplete; đối chiếu docs/metadata provider thật trước production.

- [ ] **Step 4 — GREEN:** targeted command + server typecheck. Expected: intent đúng context/idempotent, ký field fixed không secret; inspect không nhận URL arbitrary; thiếu credentials 503 không sập health/auth. Legacy multipart vẫn pass.
- [ ] **Step 5 — commit:** stage đúng files Task 3; diff check; `git commit -m "feat(recordings): authorize signed direct audio uploads"`. Expected: không thay model payload học/điểm.

### Task 4: Finalize transaction, receipt và race xóa child

**Files:** Modify `server/src/modules/recordings/recordings.directUpload.ts`, recordings controller/routes/service, `server/src/models/Recording.ts`, `server/src/modules/children/children.service.ts`; Create `server/src/modules/recordings/recordings.persistence.ts`, `server/src/test/recordingFinalize.test.ts`; Modify `server/src/test/children.test.ts`, `server/src/test/recordingOwnership.test.ts`.

**Interfaces:** `DirectRecordingsService.finalize(parentId,intentId): Promise<RecordingReceipt>`; `persistOwnedRecording(parentId,context,verifiedAudio,intentId?): Promise<RecordingReceipt>` dùng transaction shared child boundary. Adapter/task3 interfaces không đổi.

- [ ] **Step 1 — test RED:** chỉ intentId được nhận, owner khác 404, expired pending 409, completed hết hạn trả receipt, retry/concurrency 1 Recording, receipt sau intent xóa, provider URL spoof/video/oversize/duration/metadata thiếu từ chối trước persist. Inject failure ở DB operation thật qua narrow spy để chứng minh transaction rollback, không mock toàn bộ service.

```ts
// Trong fixture auth/child/lesson đã tạo ở recordingFinalize.test.ts:
const [one, two] = await Promise.all([
  request(app).post('/api/v1/recordings/finalize').set('Authorization', `Bearer ${token}`).send({ intentId }),
  request(app).post('/api/v1/recordings/finalize').set('Authorization', `Bearer ${token}`).send({ intentId }),
]);
expect(one.status).toBe(201);
expect(two.status).toBe(201);
expect(one.body.data.id).toBe(two.body.data.id);
expect(await Recording.countDocuments({ childId })).toBe(1);
// Test khác: xóa intent rồi retry cùng ID, ownership đúng vẫn đọc receipt.
```

- [ ] **Step 2 — chạy RED:** `npm run test -w server -- src/test/recordingFinalize.test.ts src/test/children.test.ts src/test/recordingOwnership.test.ts`. Expected: finalize hợp lệ hiện 404, test cho thấy chưa có receipt transaction/race protection.
- [ ] **Step 3 — implementation:** lấy intent/receipt theo owner, không kiểm expiry trước completed receipt. Kiểm tra context bằng policy, inspect asset ngoài transaction để không giữ transaction chờ mạng, sau đó recheck quyền trước persist. Trong transaction, touch Child bằng `$inc: {__v:1}` với `{timestamps:false}` để tạo write conflict với delete cùng child, tránh thêm field quyền/điểm; match parentId hoặc 404. Ghi Recording có uploadIntentId và cập nhật intent completed/recordingId trong session. Query receipt sau duplicate/transient race, retry bounded; serialize DTO bỏ internal fields.

```ts
recordingSchema.add({ uploadIntentId: { type: Schema.Types.ObjectId, select: false } });
recordingSchema.index({ uploadIntentId: 1 }, { unique: true, sparse: true });
// Transaction luôn có write trên child; không chỉ read rồi create.
await Child.updateOne({ _id: childId, parentId }, { $inc: { __v: 1 } },
  { session, timestamps: false });
```

ChildrenService.deleteChild chuyển cascade DB sang transaction: delete Child và từng collection hiện hữu, thêm intent child. Không Promise.all các operation trong một Mongo session. Finalize đã hoàn tất trước delete phải bị cascade; delete thắng thì finalize retry không thấy child và không persist. Legacy upload gửi storage ngoài transaction rồi dùng cùng persistOwnedRecording boundary; failure cleanup chỉ asset thuộc operation này, không xóa asset của completed receipt.

Không gọi xóa Cloudinary bên trong transaction. Runbook ghi hiện trạng deletion storage và orphan reconciliation, không tuyên bố đã xóa vật lý mọi audio legacy. Test race dùng deferred SDK inspect để xóa child giữa inspect và persist; thêm case transaction conflict và toàn bộ child-dependent collections không còn record sau delete success. Receipt lookup sau TTL đi Recording.uploadIntentId, xác minh owner qua child trước DTO.

- [ ] **Step 4 — GREEN:** targeted command + `npm run test -w server` + `npm run typecheck -w server`. Expected: retry/cạnh tranh/policy/cascade pass; no Recording khi failed; points/grader/revisions cũ không đổi. Test legacy không cần transaction production URI, setup đã replica set.
- [ ] **Step 5 — commit:** stage đúng files Task 4; diff check; `git commit -m "feat(recordings): finalize uploads atomically with ownership-safe receipts"`. Expected: child lifecycle thay đổi được ghi docs cùng Task 6, không mutation schema điểm.

### Task 5: FE direct upload, retry finalize và lifecycle guard

**Files:** Create `client/src/lib/directRecordingUpload.ts`, `client/src/test/directRecordingUpload.test.ts`, `client/src/test/audioRecorder.test.tsx`; Modify `client/src/lib/audioRecorder.ts`, `client/src/features/lesson-player/activities/RecordVoiceActivity.tsx`, `client/src/test/recordingSubmission.test.tsx`, `client/.env.example`; Read `client/src/store/authStore.ts`, childStore.ts, `client/src/lib/api.ts`.

**Interfaces:** `createDirectRecordingUpload(blob,context,isCurrent): { submit(): Promise<RecordingReceipt> }` giữ requestId/intentId/provider-upload state cho cùng Blob/context. `isCurrent(): boolean` do hook cấp, so auth user ID, active child và generation; workflow không import store. Hook giữ signature uploadRecording hiện hữu.

- [ ] **Step 1 — test RED:** dùng HTTP boundary double, workflow thật. Test finalize503 rồi retry trả cùng id và provider chỉ nhận 1 file; provider đã lưu nhưng browser mất response thì retry thử finalize trước khi gửi lại file; no token/cookie tới provider; switching account/child khi provider đang pending không gọi finalize dưới context mới hoặc complete; refresh token trong cùng user không tự invalidation; oversize/180s UX, requestId khác khi blob/context khác.

```ts
// Test workflow với provider fake chỉ ghi request tại network boundary.
const blob = new Blob(['voice'], { type: 'audio/webm' });
let current = true;
const task = createDirectRecordingUpload(blob, { childId: 'child', contentVersion: undefined }, () => current);
// Network fixture: create-intent201, provider200, finalize503, finalize201{id}.
await expect(task.submit()).rejects.toBeDefined();
const saved = await task.submit();
expect(saved.id).toBe('123456789012345678901234');
expect(providerRequests).toHaveLength(1);
expect(providerRequests[0].headers.has('Authorization')).toBe(false);
expect(providerRequests[0].credentials).toBe('omit');
```

- [ ] **Step 2 — chạy RED:** `npm run test -w client -- src/test/directRecordingUpload.test.ts src/test/audioRecorder.test.tsx src/test/recordingSubmission.test.tsx`. Expected: thiếu direct workflow hoặc multipart-only hook không đáp ứng retry/security/lifecycle. Không sửa expectation để chấp nhận complete giả.
- [ ] **Step 3 — implementation:** workflow gọi app api JSON cho intent/finalize, provider qua fetch riêng với multipart fields và `credentials:'omit'`; không Axios api instance tới provider. Validate upload URL HTTPS đúng host api.cloudinary.com và đường dẫn account/video/upload đã trả; không chấp nhận arbitrary signed destination. Workflow bắt provider network error bằng thông báo nhưng giữ intent để người dùng retry; sau provider success giữ flag để chỉ finalize lại. Body finalize không gửi URL/size/duration.

```ts
const form = new FormData();
for (const [key, value] of Object.entries(intent.upload.fields)) form.append(key, value);
form.append('file', blob, 'recording.webm');
const response = await fetch(intent.upload.url, {
  method: 'POST', body: form, credentials: 'omit',
});
if (!response.ok) throw new Error('Không gửi được bản thu âm. Vui lòng thử lại.');
// Chỉ đánh dấu uploaded sau success, rồi api.post('/recordings/finalize',{intentId}).
```

Khi provider có lỗi transport không rõ file đã lưu hay chưa, retry submit thử finalize cùng intent trước. Chỉ mã `UPLOAD_ASSET_NOT_FOUND` mới cho phép gửi lại file vào public ID đó; lỗi quyền/context/503 không được làm mới intent hay tự bypass. Không overwrite asset đã có.

Hook capture user ID/child/context/generation, giữ task ref cùng Blob, không reset Blob sau lỗi. Check isCurrent trước mỗi app request và sau response; đổi phiên invalidate UI/pending callbacks không clear asset của user khác. RecordVoiceActivity callback cũng guard session/unmount để không call onComplete stale. Timer dừng recorder tại 180 giây, dọn tracks/timer; byte max kiểm tra trước intent. Production luôn direct; local/test có thể multipart khi `VITE_DIRECT_RECORDING_UPLOAD` không true, opt-in local direct cần Cloudinary riêng. Không failover multipart production sau lỗi intent.

- [ ] **Step 4 — GREEN:** targeted command + `npm run test -w client` + client typecheck/build. Expected: no false completion, cùng version và recording ID; workflow no credential leak, retry không duplicate; local legacy vẫn dùng fallback đúng giới hạn dev2MiB.
- [ ] **Step 5 — commit:** stage đúng files Task 5; diff check; `git commit -m "feat(client): upload audio directly with safe finalize retries"`. Expected: base API auth cookie/session/outbox không đổi.

### Task 6: Cấu hình deploy, indexes additive và tài liệu thật

**Files:** Create `server/vercel.json`, `server/src/seeds/prepareDeploymentIndexes.ts`, `server/src/test/deploymentIndexes.test.ts`, `docs/vercel-deployment.md`; Modify `server/package.json`, server/.env.example, `render.yaml`, `docs/README.md`, docs/03-feature-inventory.md, docs/04-system-architecture.md, docs/05-api-and-data-contracts.md, docs/06-review-findings.md. Chưa đổi `client/vercel.json` destination khi chưa có domain verified.

**Interfaces:** `prepareDeploymentIndexes({apply:boolean})` dry-run chỉ list required indexes, apply chỉ createIndexes cho RateLimitBucket/RecordingUploadIntent/Recording.uploadIntentId; script yêu cầu connection/đích do deploy owner cung cấp, không xuất credentials. Task 7 dùng native Vercel Root Directory server.

- [ ] **Step 1 — test RED:** chạy index preparation trên memory replica set, dry-run không thêm index/mutation, apply idempotent và giữ index/document legacy, duplicate uploadIntentId ngăn ghi lặp, sparse legacy Recording không field vẫn tạo được. Test runtime env thiếu PayOS/preset không làm sập auth/API nhưng intent503.

```ts
const before = await Recording.collection.indexes();
await prepareDeploymentIndexes({ apply: false });
expect(await Recording.collection.indexes()).toEqual(before);
await prepareDeploymentIndexes({ apply: true });
await prepareDeploymentIndexes({ apply: true });
expect(await Recording.countDocuments()).toBe(legacyCount);
```

- [ ] **Step 2 — chạy RED:** `npm run test -w server -- src/test/deploymentIndexes.test.ts`. Expected: chưa có công cụ/indexes đáp ứng dry-run/idempotency. AutoIndex ở test phải kiểm soát trước snapshot để không nhầm startup init với mutation của dry-run.
- [ ] **Step 3 — implementation/config/docs:** script `npm run deploy:indexes -w server` dry-run; `-- --apply` mới create, không `syncIndexes`. Thêm env preset vào Render sync:false để rollback BE tương thích; sửa env ví dụ Cloudinary/PayOS trống thay vì strings giả kích hoạt provider, thêm CMS flag false. Vercel config native tối thiểu, không legacy builds hoặc catch-all tới dist/server listener:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "express"
}
```

Vercel build xác minh schema/framework trước chốt; nếu schema account/CLI không chấp nhận framework literal thì dùng detection native và ghi ruling, không nhét legacy adapter song song. Node major chọn từ Vercel supported runtimes kiểm tra tại thời điểm build; phải test native bcrypt/imports. Không region/hard maxDuration vượt account được giả định.

Docs ghi API intent/finalize request/response/lỗi, verified duration vs legacy clamp, new collections/indexes/TTL và cascade transaction; trạng thái local/chưa production, signed preset restrictions và Cloudinary signature TTL khác intent TTL. Runbook có orphan cleanup đối soát manual, không xóa hàng loạt; Mongo selection timeout không phải readiness transaction proof. Không ghi đã migrate chỉ vì file cấu hình tồn tại.

- [ ] **Step 4 — GREEN:** targeted command, `npm test`, `npm run typecheck`, `npm run build`, `npm run lint -w client`, `git diff --check`. Expected: suite root pass, build both apps, client lint theo ngưỡng repo; ghi warnings thật. Root lint hiện gọi server lint không tồn tại nên không claim đã chạy root lint; không sửa unrelated lint setup.
- [ ] **Step 5 — commit:** stage đúng Task 6 files; diff check; `git commit -m "docs(deploy): configure and document Vercel backend rollout"`. Expected: không có secrets hoặc production proxy giả.

### Task 7: Review toàn nhánh và gate deployment/cutover thật

**Files:** Update `docs/vercel-deployment.md` với bằng chứng và giới hạn; chỉ modify `client/vercel.json` khi có URL backend verified và quyền cutover. Không cần thêm UI/model.

**Interfaces:** consumes toàn bộ test/entrypoint/intent/finalize/config; produces bằng chứng build/runtime/staging và quyết định ready-or-blocked, không kết luận production bằng unit tests.

- [ ] **Step 1 — independent whole-branch review:** native method chỉ một reviewer subagent ở cuối, review diff + plan/spec + Review Focus; không delegate implementation. Fix Critical/Important bằng failing regression rồi chạy GREEN/root suite; minor ghi rõ deferred. Không merge/push vào main tự động.
- [ ] **Step 2 — xác minh build Vercel:** kiểm tra CLI/project hiện hữu qua read-only trước khi link/pull/create. Nếu không có CLI/account permission, bàn giao lệnh cho deploy owner và ghi chưa chạy. Không dùng npx tải dependency ngoài sandbox không approval. Build bundle phải nhận default Express entrypoint, không listener/process exit, có bcrypt đúng runtime.
- [ ] **Step 3 — staging tương thích:** deploy BE mới trên Render trước FE direct, FE mới còn proxy Render; deploy BE Vercel preview/staging với DB/env tách biệt được xác nhận. Kiểm preset signed, max bytes/format/overwrite, audio metadata thật; upload sát 5MiB không đi qua function. Xác nhận logger không leak secret/request field của upload.
- [ ] **Step 4 — smoke môi trường:** read-only liveness/readiness/404. Auth/refresh/logout/gate, upload/finalize và rate limit là mutation staging cần account fixtures riêng; không thử với trẻ/DB thật ngoài quyền đã duyệt.

```powershell
# deploy owner cung cấp $verifiedBackendUrl là URL đã xác minh; không URI chứa secret.
Invoke-RestMethod -Uri "$verifiedBackendUrl/health"
Invoke-RestMethod -Uri "$verifiedBackendUrl/ready"
```

Expected: health200 và readiness200 khi DB ready; readiness503 khi test network có kiểm soát. Qua FE rewrite cookie giữ Secure/httpOnly/path, refresh rotation không mất phiên. Từ hai mạng khác nhau chứng minh IP riêng, gửi header XFF giả không đổi bucket. Preview protections không cần tắt công khai để chạy test.

- [ ] **Step 5 — production gate và rollback:** chỉ cutover khi deployment URL, env, preset/indexes, staging smoke và chủ dự án xác nhận production đích. Đổi destination `/api/:path*` sang verified BE `/api/:path*`, giữ SPA rewrite cuối. PayOS Merchant Portal phải cập nhật webhook tại thời điểm cutover và đối soát pending orders; không tự chuyển khoản 10.000đ. Render giữ same compatible code/JWT secrets để rollback proxy/webhook mà không restore DB.
- [ ] **Step 6 — bàn giao:** ghi commit/tests/build/deployment URL/bằng chứng đã có và mọi phần chưa xác minh, không xuất account data/secrets. Nếu thiếu credentials/permission/domain, giữ code ready và báo cụ thể đầu vào còn thiếu; không gọi là deploy xong. Chỉ commit proxy/docs sau khi từng thay đổi là sự thật.

## Plan self-review và trạng thái

Coverage: spec §3→Task1; §5→Task2; §4.1→Task3; §4.3–4.4→Task4; §4.2→Task5; §6–7→Task6–7; §8 test matrix→từng task và full-suite gates. Receipt sau TTL, child delete race, provider metadata/format và IP chain có task riêng.

Interfaces nhất quán: UploadIntentDto tại Task3/5, VerifiedAudio Task3/4, RecordingReceipt Task4/5; API paths là `/recordings/upload-intent` và `/recordings/finalize` dưới base hiện hữu. Storage signing không import policy; FE workflow không import auth store. Additive indexes không reset collection.

Đã lập kế hoạch, chưa viết test/product code hoặc sync/merge/deploy. Đề xuất native execution trong chat này, nhánh riêng, một review độc lập cuối nhánh; người dùng cần duyệt kế hoạch/method và lựa chọn worktree hoặc checkout trước Task1.
