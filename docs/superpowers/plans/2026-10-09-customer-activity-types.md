# Customer Activity Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native được đề xuất cho kế hoạch này) hoặc superpowers:subagent-driven-development nếu người dùng chọn delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm bốn hoạt động theo yêu cầu khách hàng, xuyên suốt model, chấm server, màn bé, CMS và catalog nhập nháp, không thao tác DB thật.

**Architecture:** Bốn type cộng thêm vào contract hiện hữu; grader dùng canonical snapshot, learner DTO loại đáp án mới. Renderer mới thuần nhận input và callback trung tính; player/session chịu trách nhiệm lưu và nộp, CMS preview không có side effect. Triển khai tuần tự trên main theo yêu cầu người dùng vì các phần dùng chung contract.

**Tech Stack:** TypeScript, Express, Mongoose, Zod, React 18, Zustand, IndexedDB/idb-keyval, Vitest, Testing Library, MongoMemoryReplSet.

**Spec:** [Thiết kế đã duyệt](../specs/2026-10-09-customer-activity-types-design.md).

**Trạng thái:** Plan chờ review; các đoạn code bên dưới là test/implementation targets, không phải API đã tồn tại. Chưa triển khai, chưa import/publish DB. Lệnh chạy từ repo root; `npm --prefix server`/`client` chọn package tương ứng.

## Global Constraints

- Đọc `docs/README.md`, các docs nghiệp vụ liên quan và `docs/06-review-findings.md` trước thay đổi. Đọc lại spec đầy đủ trước execution.
- Giữ nguyên bảy type legacy, snapshot cũ/order >20/media HTTP đọc được, không reinterpret `__` của `fill_blank`.
- Type mới: `multi_select`, `group_sort`, `fill_blanks`, `follow_steps`; ID con 1–64 ASCII `[A-Za-z0-9_-]`, cấm `__proto__`, `prototype`, `constructor`; không áp ID rule mới ngược legacy.
- Multi: 2–12 options, 1–12 ID đáp án duy nhất; text được lặp. Group: 2–6 groups với label NFC/trim/lowercase duy nhất, 2–12 items, exact map item→group.
- Fill: template ≤5000 ký tự, 2–6 slots, mỗi marker đúng một lần, 1–4 acceptedAnswers/slot, mỗi answer 1–200 ký tự; normalize NFC/trim/lowercase vi, không bỏ dấu/khoảng trắng nội bộ/punctuation.
- Steps: 1–3 bước, text ≤500 ký tự; xác nhận đúng đủ thứ tự ID; chỉ bé tự báo cáo, không camera/micro, không xác thực hành động vật lý.
- Grader mới không tin `isCorrect`/`scorePercent`; duplicate activity submission bị từ chối trước ghi dữ liệu; không partial credit.
- GET thêm `activityContract=2`; thiếu flag chỉ đọc snapshot legacy, snapshot mới trả 409 `ACTIVITY_CLIENT_UPDATE_REQUIRED`; flag khác 2 bị validation từ chối. Không tự nâng version.
- Learner DTO loại multi/group `correctAnswer` và fill `acceptedAnswers`; canonical/admin giữ đủ. Không thêm endpoint chấm từng câu.
- Ba câu hỏi mới ghi “Đã ghi câu trả lời”; steps ghi “Đã ghi xác nhận của bé”; không trừ tim/khẳng định đúng dựa trên local data. Mốc 50%/70%/90%, quyền, unlock, ledger/idempotency giữ nguyên.
- Lưu input chưa gửi và answer đã gửi theo activity/child/version; session legacy thiếu field mới vẫn đọc được. Outbox giữ owner/version và không cấp điểm giả offline.
- UI touch target ≥44px; QA 390px/1366px và bàn phím. Không fallback type lạ sang Review; preview không gọi API/session/outbox/recording.
- Chỉ ánh xạ nguồn đầy đủ bài 4/5/6 cho lần import mới; bài 11/15/20 giữ cảnh báo thiếu. Không đổi snapshot, manifest, checksum, requestId để ép nhập lại; cùng checksum vẫn skip, sửa nháp cũ qua CMS/CAS.
- Không import DB thật, không bật publish production, không tạo asset/ngữ liệu ngoài nguồn. Scratch `.superpowers/` không stage. Fetch trước execution; không checkout/reset mất thay đổi người dùng.

## Review Focus

1. Ba chữ M cùng text vẫn có identity riêng, chọn đúng ba ID bất kể thứ tự — Task 1/3.
2. Map có inherited/prototype keys hoặc extra entry không được đạt, dù client gửi `isCorrect:true` — Task 1/2.
3. Client cũ hoặc phiên bản cũ không bị nhận nội dung mới/đáp án mới ngoài khả năng đọc — Task 2/4.
4. Ghi partial input nhanh rồi chuyển child/account hoặc reload không mất input, không hồi sinh phiên cũ — Task 4.
5. Catalog mới không ép re-import checksum cũ, không suy diễn hai slot `c_ _` — Task 6.

---

## File boundaries và interfaces chung

Không refactor toàn bộ legacy renderer/editor. Tách bốn renderer mới, helper grader mới và form CMS mới vì trách nhiệm độc lập. Những interface dưới là **targets sẽ được tạo**:

```ts
// client/src/features/lesson-player/activities/newActivity.types.ts
export type NewActivityType = 'multi_select' | 'group_sort' | 'fill_blanks' | 'follow_steps';
export type NewActivityInput = string[] | Record<string, string>;
export interface NewActivitySubmission {
  status: 'submitted' | 'self_reported';
  userAnswer: NewActivityInput;
}
export interface NewActivityProps {
  activity: NewLearnerActivity;
  value: NewActivityInput;
  disabled?: boolean;
  onChange: (value: NewActivityInput) => void;
  onSubmit: (result: NewActivitySubmission) => void;
}
export type NewLearnerActivity =
  | { id: string; type: 'multi_select'; prompt: string; options: ActivityOption[] }
  | { id: string; type: 'group_sort'; prompt: string; options: ActivityOption[]; groups: { id: string; label: string }[] }
  | { id: string; type: 'fill_blanks'; prompt: string; template: string; blankSlots: { id: string; label: string }[] }
  | { id: string; type: 'follow_steps'; prompt: string; audioUrl?: string; steps: { id: string; text: string }[] };
export interface ActivityOption { id: string; text?: string; imageUrl?: string; audioUrl?: string }
```

Author shape dùng `IActivity` backend và `Activity` CMS hiện hữu, mở rộng `groups`, `template`, `blankSlots` (có acceptedAnswers), `steps`. Không dùng learner shape để validate/publish/chấm. Common media/hints vẫn có trong author/player envelope; component nhận phần cần thiết qua adapter.

## Task 1: Canonical contract, draft/publish validator và strict grading

**Files:** Modify `server/src/models/Lesson.ts`, `server/src/modules/content/content.validation.ts`, `content.read-schema.ts`, `server/src/modules/admin/admin.validation.ts`, `server/src/modules/lessons/lessons.grading.ts`. Create `server/src/modules/lessons/newActivity.grading.ts`, `server/src/test/newActivityGrading.test.ts`. Extend `server/src/test/contentValidation.test.ts`.

**Interfaces:** Consumes `IActivity`, `ActivitySubmission`, `parseDraft(kind,input)`, `validatePublish(kind,payload)`. Produces `gradeNewActivity(activity:IActivity,userAnswer:unknown):boolean`; legacy `gradeActivity` dispatches four new cases to it, no boolean fallback. Canonical reader preserves new fields. Draft allows empty type-specific fields but rejects unsafe/duplicate IDs and wrong structural types; publish applies completeness rules.

- [ ] Write grader tests with complete local fixtures:

```ts
import { describe, expect, it } from 'vitest';
import type { IActivity } from '../models/Lesson.js';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';
const grade = (activity: unknown, userAnswer: unknown) => gradeActivity(
  activity as IActivity, { activityId: 'a', userAnswer, isCorrect: true });
const multi = { id: 'a', type: 'multi_select', prompt: 'Chọn M',
  options: ['A','M','B','M','C','M'].map((text,i)=>({id:`letter-${i+1}`,text})),
  correctAnswer: ['letter-2','letter-4','letter-6'] };
const group = { id:'a',type:'group_sort',prompt:'Phân nhóm',
  options:[{id:'me',text:'mẹ'},{id:'meo',text:'mèo'},{id:'ba',text:'bà'}],
  groups:[{id:'m',label:'M'},{id:'b',label:'B'}],
  correctAnswer:{me:'m',meo:'m',ba:'b'} };
const fill = { id:'a',type:'fill_blanks',prompt:'Điền',template:'Bé {{verb}} {{object}}.',
  blankSlots:[{id:'verb',label:'Hành động',acceptedAnswers:['đọc']},
    {id:'object',label:'Đồ vật',acceptedAnswers:['sách']}] };
const steps = { id:'a',type:'follow_steps',prompt:'Thực hiện',
  steps:[{id:'stand',text:'Đứng lên'},{id:'sit',text:'Ngồi xuống'}] };
describe('new canonical grading',()=>{
  it('matches repeated display text by ID as an unordered exact set',()=>{
    expect(grade(multi,['letter-6','letter-2','letter-4'])).toBe(true);
  });
  it.each([[],['letter-2'],['letter-2','letter-4','letter-6','letter-1'],
    ['letter-2','letter-4','letter-4'],['letter-2','letter-4','unknown'],true,undefined])
    ('rejects malformed multi %j',answer=>expect(grade(multi,answer)).toBe(false));
  it('accepts many-to-one but rejects inherited and extra entries',()=>{
    expect(grade(group,{me:'m',meo:'m',ba:'b'})).toBe(true);
    expect(grade(group,Object.create({me:'m',meo:'m',ba:'b'}))).toBe(false);
    expect(grade(group,{me:'m',meo:'m',ba:'b',extra:'b'})).toBe(false);
    expect(grade(group,{me:'m',meo:'x',ba:'b'})).toBe(false);
    expect(grade(group,['m','m','b'])).toBe(false);
    expect(grade(group,JSON.parse('{"__proto__":"m","me":"m","meo":"m","ba":"b"}'))).toBe(false);
  });
  it('normalizes NFC/case only, retains accents and punctuation',()=>{
    expect(grade(fill,{verb:' ĐỌC ',object:'sa\u0301ch'})).toBe(true);
    for(const object of ['sach','sá ch','sách.'])
      expect(grade(fill,{verb:'đọc',object})).toBe(false);
    expect(grade(fill,{verb:'sách',object:'đọc'})).toBe(false);
    expect(grade(fill,{verb:'đọc'})).toBe(false);
  });
  it('requires ordered self-report IDs, never a boolean',()=>{
    expect(grade(steps,['stand','sit'])).toBe(true);
    for(const answer of [true,[],['sit','stand'],['stand','stand'],['stand'],['stand','sit','x']])
      expect(grade(steps,answer)).toBe(false);
  });
});
```

- [ ] Extend existing content validation fixtures with all four publishable types. Pin lower/upper bounds; legacy options max8 remains; multi accepts 12 repeated texts. For fill use templates `Bé {{verb}} {{object}}.`, `{{verb}} {{verb}}`, `{{verb}} {{unknown}}`, `{{verb} {{object}}`; only first publishes with slots verb/object. Assert unsafe IDs/duplicate IDs throw draft parse; missing answer/empty lists save draft but produce publish fields `activities.0...`. Assert group normalized labels `M`/` m ` fail publish, unknown/missing/extra answer key fail publish. Steps empty draft saves but >3 steps fails parsing. Test canonical reader retains expected fields and old HTTP/order >20.
- [ ] RED: `npm --prefix server test -- src/test/newActivityGrading.test.ts src/test/contentValidation.test.ts`; expect unsupported type/schema or new grader assertions fail, not setup failures.
- [ ] Implement schema fields with legacy defaults unchanged. Reuse one strict ID helper only for new fields. For map grading use a plain-record guard before comparing own keys; never cast malformed input to a map:

```ts
const plainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) &&
    Object.keys(value).every(key => !['__proto__','prototype','constructor'].includes(key));
};
const normalize = (text: string) => text.normalize('NFC').trim().toLocaleLowerCase('vi');
```

Exact set/map/sequence checks verify canonical arrays nonempty, IDs unique and bound to definitions before comparison; unknown answer types return false. Fill marker scanner rejects leftover braces after removing valid markers and checks slot/marker bijection. Draft parser does not silently strip invalid references into a publishable payload. Keep old grader branches unchanged.
- [ ] GREEN: rerun targeted command and `npm --prefix server run typecheck`; all pass, inspect legacy validation regression assertions.
- [ ] Commit only Task 1 files: `git commit -m "feat: validate and grade four additive activity types"` after exact-path `git add` of this Files list.

## Task 2: Learner projection, client capability and completion integrity

**Files:** Modify `server/src/modules/content/content.dto.ts`, `server/src/modules/lessons/lessons.validation.ts`, `lessons.controller.ts`, `lessons.service.ts`, `server/src/test/contentLearning.test.ts`; create `server/src/test/learnerActivityProjection.test.ts`.

**Interfaces:** Produces `toLearnerLessonPayload(payload:Record<string,unknown>):Record<string,unknown>` as a nonmutating projection, `lessonQuerySchema.activityContract?:2`, and optional fifth argument `LessonsService.getLessonById(id,parentId,childId,contentVersion?,activityContract?:2)`. `readPublished`/`toContentPayload` stay canonical. Complete envelope unchanged.

- [ ] Add projection tests:

```ts
import { expect,it } from 'vitest';
import { toLearnerLessonPayload } from '../modules/content/content.dto.js';
it('redacts new expected answers without touching canonical or legacy',()=>{
  const canonical={activities:[
    {id:'m',type:'multi_select',correctAnswer:['a'],options:[{id:'a',text:'M'}]},
    {id:'g',type:'group_sort',correctAnswer:{a:'m'}},
    {id:'f',type:'fill_blanks',blankSlots:[{id:'s',label:'Ô',acceptedAnswers:['mẹ']}]},
    {id:'r',type:'review',correctAnswer:'a'}]};
  const before=JSON.stringify(canonical);
  const learner=toLearnerLessonPayload(canonical);
  expect(learner).toEqual({activities:[
    {id:'m',type:'multi_select',options:[{id:'a',text:'M'}]},
    {id:'g',type:'group_sort'},
    {id:'f',type:'fill_blanks',blankSlots:[{id:'s',label:'Ô'}]},
    {id:'r',type:'review',correctAnswer:'a'}]});
  expect(JSON.stringify(canonical)).toBe(before);
});
```

- [ ] Extend the existing `contentLearning.test.ts` describe using its actual `authGet`, `submit`, `publishLesson` and setup parent/child fixtures (not cross-file imports). Insert a new-type lesson through temporary test DB, publish through existing CMS helpers with `env.CMS_PUBLISH_ENABLED` scoped to test. Assert GET no flag →409/error code, flag2 →200/redacted, flag1 →400, legacy without flag →200. Query explicit prior legacy version without flag →200 after new version publishes. Submit duplicate answer IDs →400 and unchanged `PointTransaction` count; valid new answer plus forged isCorrect does not overcome wrong userAnswer; correct canonical answer succeeds although GET lacks answer. Repeat completion/new version →no second reward. Wrong parent/child and foreign activity/version still fail existing policy tests. Do not change reward thresholds to satisfy tests.
- [ ] RED: `npm --prefix server test -- src/test/learnerActivityProjection.test.ts src/test/contentLearning.test.ts`; expect missing projection/capability/duplicate protection failures.
- [ ] Implement query literal with `z.coerce.number().pipe(z.literal(2)).optional()`, propagate controller→service; check snapshot types after authorized canonical read, before response projection. Add duplicate guard before any progress/ledger write:

```ts
const ids = answers.map(answer => answer.activityId);
if (new Set(ids).size !== ids.length) {
  throw { statusCode: 400, code: 'DUPLICATE_ACTIVITY_ANSWER',
    message: 'Mỗi hoạt động chỉ được gửi một câu trả lời' };
}
```

Use existing service error-object convention and verify middleware exposes `code`; preserve existing ownership, unlock, subscription, recording and transaction paths. Projection clones activities/blankSlots and deletes only expected fields for new types. Never pass projection into grading.
- [ ] GREEN: targeted tests plus `npm --prefix server run typecheck`.
- [ ] Stage exact Task 2 paths; `git commit -m "feat: protect learner activity payloads and completion contracts"`.

## Task 3: Four pure learner renderers and fail-closed registry

**Files:** Create `client/src/features/lesson-player/activities/newActivity.types.ts`, `MultiSelectActivity.tsx`, `GroupSortActivity.tsx`, `FillBlanksActivity.tsx`, `FollowStepsActivity.tsx`, `client/src/test/newActivities.test.tsx`; modify `activityRegistry.ts`, `client/src/test/activityRegistry.test.ts`.

**Interfaces:** All four components consume `NewActivityProps` defined above. Controlled value: array for multi/steps, map for group/fill; emit copies through onChange, submit `{status,userAnswer}`, never isCorrect. Registry keeps legacy callback adapter separate, exposes an unknown-type error component without completion callback. Player wiring is Task 4; preview Task 5.

- [ ] Add controlled test harness and repeated-text fixture:

```tsx
import { useState } from 'react';
import { fireEvent,render,screen } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import { MultiSelectActivity } from '../features/lesson-player/activities/MultiSelectActivity';
import type { NewActivityInput } from '../features/lesson-player/activities/newActivity.types';
it('submits IDs with neutral status and distinguishable repeated labels',()=>{
  const onSubmit=vi.fn();
  function Harness(){
    const [value,setValue]=useState<NewActivityInput>([]);
    return <MultiSelectActivity activity={{id:'m',type:'multi_select',prompt:'Chọn M',
      options:['A','M','B','M','C','M'].map((text,i)=>({id:`letter-${i+1}`,text}))}}
      value={value} onChange={setValue} onSubmit={onSubmit}/>;
  }
  render(<Harness/>);
  for(const position of [2,4,6]) fireEvent.click(screen.getByRole('checkbox',{name:`Chữ M, vị trí ${position}`}));
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
  expect(onSubmit).toHaveBeenCalledWith({status:'submitted',userAnswer:['letter-2','letter-4','letter-6']});
});
```

- [ ] Add harness tests for group native selects (labels `Nhóm của mẹ`, `Nhóm của mèo` with position suffix where repeated), two items same group, reassignment before submit; fill accessible slot labels and preserved full sentence punctuation; steps ordered checkbox list, button disabled until all checked, uncheck works, status self_reported. Media test no audio →visible missing label; rejected play →error and text retained; no autoplay, getUserMedia/session/outbox/API calls. Assert no expected answers in fill DOM. Registry unknown type shows error and cannot invoke onComplete.
- [ ] RED: `npm --prefix client test -- src/test/newActivities.test.tsx src/test/activityRegistry.test.ts`; expect component import/new registration failures.
- [ ] Implement each component in its own file with native input/select/button, visible focus and min44px controls; missing data returns error/no submit. Fill splits only explicit `{{id}}` markers preserving surrounding text; IDs remain stable through rendering. Steps constructs ordered IDs from definition, not click order. Reuse existing audio behavior where safe, never request microphone or auto TTS. Submit disabled when incomplete/already submitted; neutral acknowledgement belongs to player/preview, not inferred correctness. Unknown registry does not import Review fallback.
- [ ] GREEN: targeted tests and `npm --prefix client run typecheck`; include legacy registry tests.
- [ ] Stage Task 3 paths; `git commit -m "feat: add accessible neutral activity renderers"`.

## Task 4: Player integration, durable partial inputs and offline envelope

**Files:** Modify `client/src/store/lessonSessionStore.ts`, `client/src/features/lesson-player/LessonPlayerPage.tsx`, `client/src/lib/offlineSync.ts` only if envelope typing requires it; extend `client/src/test/lessonSessionVersions.test.ts`, `lessonVersions.test.tsx`, `offlineSync.test.ts`.

**Interfaces:** `ActivityAnswer.isCorrect?:boolean`; `CachedLessonSession.partialInputs?:Record<string,NewActivityInput>`. Produce `savePartialInput(identity:{lessonId:string;childId:string;contentVersion:number},activityId:string,value:NewActivityInput):Promise<void>`. Existing init/save/clear signatures stay compatible. Registry adapter supplies controlled input and converts new submission to ActivityAnswer without isCorrect.

- [ ] Add session regression in existing idb-keyval mock suite:

```ts
it('restores unsent input without creating a graded answer',async()=>{
  const store=useLessonSessionStore.getState();
  await store.initSession('lesson','child',2);
  await store.savePartialInput({lessonId:'lesson',childId:'child',contentVersion:2},'multi',['letter-2']);
  const cached=await readCachedSession('lesson','child');
  expect(cached?.partialInputs?.multi).toEqual(['letter-2']);
  expect(cached?.answers).toEqual([]);
  await store.initSession('lesson','child',2);
  expect(useLessonSessionStore.getState().currentSession?.partialInputs?.multi).toEqual(['letter-2']);
});
```

- [ ] Add delayed storage tests: two rapid partial writes resolve in reverse request order, latest edit persists; partial write overlapping submit does not overwrite answers/current step/hearts; clear/account switch while set pending does not recreate cache/session. Different child/version writes reject identity mismatch, old cached version remains pinned until explicit reset (never silently replace). Legacy cache with no partialInputs renders default empty. Storage rejection displays retry and retains visible edited value, never says saved. Use deferred promises in existing mock, not sleeps.
- [ ] Add player tests: GET params includes activityContract2 plus pinned contentVersion, submission produces typed answer with no boolean and hearts remain3; false legacy answer still loses heart as before. New neutral message, Next only after successful save, reload restores partial inputs, server result governs stars/points. 409 update required yields clear update/retry UI, no silent fallback/version reset. Outbox test serialize arrays/maps/Unicode nested answers exactly, owner/version retained; retry success one reward,409 needs_attention, offline UI never official success.
- [ ] RED: `npm --prefix client test -- src/test/lessonSessionVersions.test.ts src/test/lessonVersions.test.tsx src/test/offlineSync.test.ts`; expect missing method/neutral behavior/capability failure.
- [ ] Implement a per-session serialized write chain with generation/identity checks before read/merge/write; merge latest state, do not write captured stale session snapshots. clear queues behind pending writes then deletes; stale updates never create state for a different generation. Partial input onChange updates immediate controlled state and requests guarded persistence, surface rejected writes. Submitted answer save removes that activity partial input atomically. Key player component by child/lesson/version/activity; auth reset clears in-memory input and invalidates queued work. New adapter calls existing saveStepProgress without isCorrect, not loseHeart. Keep outbox API version and official-result behavior.
- [ ] GREEN: targeted tests, typecheck; full legacy player/session tests unchanged in assertions.
- [ ] Stage Task 4 paths; `git commit -m "feat: persist version-bound activity input and neutral submissions"`.

## Task 5: CMS authoring forms, reference integrity and safe preview

**Files:** Modify `client/src/features/admin/content/content.types.ts`, `LessonEditor.tsx`, `ActivityEditor.tsx`, `LessonPreview.tsx`; create `MultiSelectEditor.tsx`, `GroupSortEditor.tsx`, `FillBlanksEditor.tsx`, `FollowStepsEditor.tsx` in same directory. Extend `client/src/test/cmsLessonEditor.test.tsx`, `cmsPreview.test.tsx`, `cmsEditor.test.tsx`.

**Interfaces:** Each author form takes `{activity:Activity;onChange:(activity:Activity)=>void}` (Activity from existing CMS types, extended canonical fields). Add type choices Vietnamese, preserve common fields. Preview imports four pure components directly and strips expected fields before rendering; admin answer panel is separate. No live registry recording imports.

- [ ] Add editor tests using existing stateful wrapper: add each type by label `Chọn nhiều đáp án`, `Phân nhóm`, `Điền nhiều ô trống`, `Nghe và thực hiện`; save incomplete draft permitted, publish errors shown next to relevant fields/source notes. Multi repeated M IDs stable on reorder; remove correct option removes its reference with visible warning, never chooses alternative. Group removal leaves affected items unassigned with warning. Fill slot removal updates reference diagnostics, never silently rewrites template into another answer. Confirm type switch discards type-specific fields but preserves prompt/media/hints; cancel preserves all fields. CAS stale save leaves author edits available; dirty dialog still traps focus.
- [ ] Add pure preview smoke test by extending existing render setup:

```tsx
it('new preview never posts completion or persists a child session',()=>{
  const sessionSave=vi.spyOn(useLessonSessionStore.getState(),'saveStepProgress');
  const activity={...lesson.activities[0],id:'m',type:'multi_select' as const,prompt:'Chọn M',
    options:[{id:'m1',text:'M'},{id:'m2',text:'M'}],correctAnswer:['m1','m2']};
  render(<LessonPreview payload={{...lesson,activities:[activity]}} issues={[]}/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Chữ M, vị trí 1'}));
  fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
  expect(screen.getByText('Đã ghi câu trả lời')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(sessionSave).not.toHaveBeenCalled();
  expect(useLessonSessionStore.getState().currentSession).toEqual(session);
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(localStorage.getItem('vietverse_offline_completions')).toBe('[{"id":"keep"}]');
});
```

This test extends the existing suite's `lesson`, `session`, imported stores and API mocks. Extend to each new type, assert no outbox/mic calls and preview resets when selected activity changes.
- [ ] RED: `npm --prefix client test -- src/test/cmsLessonEditor.test.tsx src/test/cmsPreview.test.tsx src/test/cmsEditor.test.tsx`; expect absent controls/preview type failures.
- [ ] Implement four focused forms; generate stable new IDs once at insertion with existing CMS/server ID authority pattern, never on render/reorder. Use explicit item/group selectors for answers, one accepted answer input per approved variant, ordered step text inputs and template/slot validation hints. Type change uses existing native confirmation dialog before removing private fields. Preserve source-note adjacency and backend field paths. Preview passes local controlled input callbacks only; no session store hook or child API. Add separate admin answer summary from canonical fields.
- [ ] GREEN: targeted suites and typecheck, inspect old7type author tests/CAS/dialog tests still pass.
- [ ] Stage Task 5 paths; `git commit -m "feat: author and preview new activity types in CMS"`.

## Task 6: Source-complete catalog mappings and unchanged import identity

**Files:** Modify `server/src/seeds/customer/customerCatalog.ts`, `server/src/test/customerCatalog.test.ts`, `customerImport.test.ts`, `docs/customer-source/2026-10-09/coverage.md`, `docs/superpowers/plans/2026-10-09-customer-data-deployment.md`.

**Interfaces:** Catalog shape and existing import key/checksum functions unchanged. New activities use Task 1 canonical contract; import remains draft-only. Existing snapshots/manifest are read-only targets, not stage targets.

- [ ] Extend existing catalog suite assertions selecting lessons by existing order field (not new helper):

```ts
const sourceLesson = (order:number) => {
  const entry=customerCatalog.find(entry=>entry.kind==='lesson' && entry.order===order);
  if(entry?.kind!=='lesson') throw new Error(`Missing lesson ${order}`);
  return entry.payload;
};
const lesson4=sourceLesson(4), lesson5=sourceLesson(5), lesson6=sourceLesson(6), lesson11=sourceLesson(11);
const multi = lesson5.activities.find(activity=>activity.type==='multi_select');
if(!multi?.options) throw new Error('Missing multi options');
expect(multi.options.map(option=>option.text)).toEqual(['A','M','B','M','C','M']);
expect(multi.correctAnswer).toEqual(['letter-2','letter-4','letter-6']);
const steps = lesson4.activities.find(activity=>activity.type==='follow_steps');
if(!steps?.steps) throw new Error('Missing follow steps');
expect(steps.steps.map(step=>step.text)).toEqual(['Bé đứng lên.','Bé đi đến bàn.','Bé ngồi xuống.']);
const groups = lesson6.activities.find(activity=>activity.type==='group_sort');
if(!groups?.options || typeof groups.correctAnswer!=='object' || !groups.correctAnswer)
  throw new Error('Missing group mapping');
expect(groups.options.map(option=>option.text)).toEqual(['mẹ','mèo','mũ','bà','bé','bóng']);
expect(new Set(Object.values(groups.correctAnswer)).size).toBe(2);
expect(lesson11.activities.some(activity=>activity.type==='fill_blanks')).toBe(false);
```

The snippet uses `customerCatalog` already imported by the suite; reuse existing count/source checksum assertions. Verify 49 drafts count unchanged, only new activities/precise notes differ. Preserve remaining unsupported requirements in notes; do not replace generic caution with claim of complete support.
- [ ] In existing importer test, import fixture, manually change draft payload, rerun same source/checksum with catalog adding activity: skipped result, payload unchanged, no revision/publish/ledger. Source identity/requestId unchanged. New empty test DB import includes new types as draft only, then repeat still skip. Source checksum verification remains passed.
- [ ] RED: `npm --prefix server test -- src/test/customerCatalog.test.ts src/test/customerImport.test.ts`; expect absent mappings, not checksum failures.
- [ ] Add precise catalog helpers/data: lesson4 three self-report steps, lesson5 six stable letter IDs, lesson6 two groups/six items exact mapping. Do not map ambiguous lesson11 `c_ _`; no technical fill fixture in customer data. Update coverage and deployment runbook: catalog SHA can differ while source checksum fixed; already-imported drafts skip and require reviewed manual CMS edits; no batch upgrade authorized.
- [ ] GREEN: targeted tests plus existing source verification and import identity suites, typecheck. No CLI import invocation against any configured URI.
- [ ] Stage only Task 6 paths; `git commit -m "feat: map supported customer activities without reimporting drafts"`.

## Task 7: Integrated QA, business documentation and authorized main handoff

**Files:** Modify `docs/02-business-rules.md`, `03-feature-inventory.md`, `05-api-and-data-contracts.md`, `06-review-findings.md`, `cms-operations.md`, `08-customer-alignment.md`, `README.md` only if overview misleading, and this plan checkboxes. Add verified links in `docs/README.md`.

**Interfaces:** Documents actual contracts from Tasks 1–6; no new code interfaces. Native final reviewer checks entire change/spec and applicable AGENTS rules; do not use old reviewer status as evidence for new feature.

- [ ] Run fresh full verification:

```powershell
npm --prefix server test
npm --prefix client test
npm --prefix server run typecheck
npm --prefix client run typecheck
npm --prefix server run build
npm --prefix client run build
npm --prefix client run lint
git diff --check
```

Expected all exit0; record exact test totals/warnings/bundle size from current output, no inherited counts. If a test fails, use systematic-debugging then RED/GREEN regression, rerun affected/full suites before release claims.
- [ ] Browser QA against local/staging only: child multi repeated-M keyboard/touch; group many-to-one/reassign; fill reload before submit/Unicode punctuation; steps self-report/missing/failing audio; complete wrong/correct official result; offline reconnect; child/account/version switch. Admin add/edit/remove/reorder/type confirmation/source-note errors/CAS/preview. At390/1366 widths check page overflow, ≥44px controls, focus, console/pageerror. Do not click real payment/publish/import, request mic or use production DB. Record limitation if browser unavailable; unit tests alone not Safari/mobile/axe certification.
- [ ] Update docs with actor/preconditions/main/error flows, capability/error code, neutral feedback, canonical redaction, partial inputs/outbox, self-report limitations, source/manual upgrade and rollout/rollback. Label business decisions as approved and unresolved audio/ngữ liệu/production deploy as assumptions/pending. Review findings marks only new verified risks resolved; do not relabel unrelated backlog complete.
- [ ] Request final code review per skill; use one reviewer if authorized by that skill, exact spec and baseline before Task1. Review changes independently; fix concrete defects and rerun relevant checks. Then `git diff --check`, stage exact docs/code task files (never scratch/secrets), commit docs `docs: record activity contracts and verified release scope`.
- [ ] Before push: `git fetch origin`, `git status --short --branch`, `git log --oneline origin/main..main`. If origin advanced, integrate non-destructively and rerun verification; conflicts require explicit resolution, no force push. Use authorized `git push origin main` only after verified final review. Report actual pushed SHA, tested scope and outstanding production DB/audio/content-owner approval. Do not report push success before remote command succeeds.

## Self-review completed before handoff

- Spec sections1–4 →Task1/3/6; grading/DTO/capability →Task1/2; UX/persistence →Task3/4; CMS →Task5; importer →Task6; rollout/docs/verification →Task7.
- Five Review Focus cases each linked to concrete assertions in owning tasks; compatibility/security not deferred to browser alone.
- New methods/shapes named in Interfaces are implementation targets. Existing suite helpers must be checked against source before extending tests; no new production helper invented to fit plan snippets.
- Plan does not authorize production DB, publish, source rewrite or invented acceptedAnswers. Independent systems not split into separate plans because all seven tasks ship one versioned activity contract.
- Execution recommendation: **native, directly in this chat**, since model→DTO→renderer→session→CMS interfaces are sequential and shared. Implementation starts after plan review/execution choice.
