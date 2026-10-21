# Activity translation contract preflight

Date: 2026-10-19, Asia/Saigon (UTC+7). Task: F13-CONTRACT-PREFLIGHT.
Status: analysis/proposal only; not an approved contract or implementation.
Code/citation baseline: `53a447a369fed0d69b455749a053b694a159a753` (main after PR #20).
Source-format evidence: PR #22 at `7269402a55f79cb2a7680ee54905d223ba9c841f`,
read as pinned Git objects. That PR was open and unreviewed by the coordinator
when initially inspected. PR22 subsequently merged as
`bf8651572678ff0f37acc02bca4e57efd940759e`; its captured source/parser are unchanged
from the pinned evidence. This source acceptance is not runtime binding or
publication approval. The report retains explicit original citation baselines.

## Outcome

Optional, text-only activity translations can fit the existing versioned lesson
pipeline, but adding a field only to `Lesson.ts` would lose it at CMS parsing,
canonical read projection, preview projection and rendering. The safe unit is
**lesson ID + durable activity ID + contentVersion + field + exact Vietnamese**.
Source ordinals and text similarity are not runtime identity.

Prepare an additive, optional prompt/subPrompt contract for review; do not map
or publish customer data yet. The source capture has translated prompts and
some hints, but no identified translated subPrompt. Hint timing/retry conflicts
with the approved final-server-grading contract and stays a separate policy
gate. No hint may be renamed as a prompt/subPrompt to bypass that gate.

Contents: [evidence](#1-evidence-and-scope), [field trace](#2-end-to-end-field-trace),
[proposal](#3-proposed-additive-contract-not-approved),
[compatibility](#4-compatibility-and-editor-invalidation),
[display policy](#5-display-policy-and-renderer-boundaries),
[test cases](#6-minimum-test-first-cases-for-a-future-change),
[task split](#7-ready-versus-blocked-work), [decisions](#8-decisions-still-required).

## 1. Evidence and scope

- The historical audit F13 / sections 5.4-5.5 and completion-plan steps 3-4
  identify missing activity translations. They are task context, not proof that
  an old local checkout or all customer curriculum is now on main.
- `docs/02-business-rules.md:27` defines ordered companion preferences and the
  legacy singular field. `docs/02-business-rules.md:29` limits UI locales to
  VI/EN. Content translation must not use the UI-language switch as its selector.
- `docs/02-business-rules.md:103` and `docs/05-api-and-data-contracts.md:267`
  approve first-available companion translations for story/culture, not an
  explicit new lesson display policy. The earlier broad statement in
  `docs/02-business-rules.md:28` is superseded for story/culture by that later
  scoped decision; it is not authority to silently extend lesson policy.
- `docs/superpowers/specs/2026-10-09-customer-activity-types-design.md`, sections
  4-8 and 12, fixes stable activity IDs, capability 2, neutral feedback and
  final server grading for four newer types. `docs/06-review-findings.md:218`
  records session-write and answer-redaction boundaries; line 229 records why
  read whitelists must not retroactively impose new editorial limits.
- `docs/cms-operations.md` preserves CAS, immutable publication, import checksum
  skip semantics and content-owner approval. Its index-parallel story/culture
  translation handling is not a model for joining lesson activities by index.
- PR22 `docs/customer-source/2026-10-18/manifest.json` pins Explore tab
  `t.6aij8uhnuc6p`, 46,637 bytes, SHA256
  `173d0c2bf181ec9209b857267063c8454223ef176457339f8f9c8be5d8156d49`.
  This is a capture date, not a Google revision identifier or publication consent.
- At that pinned head, `customerTranslationsSource.ts:11` distinguishes
  `section: 'prompt' | 'hint'`; source keys encode lesson/activity headings,
  not database IDs or contentVersion. Its coverage reports 75 paired prompt
  groups plus 8 paired hint segments: 415 locale pairs, 83 per locale. These
  are source inventory counts, **not 415 runtime mappings or approved strings**.
  Five foreign-language prompt groups lack explicit VI and are excluded from
  eligible entries. No translated passage/subPrompt is identified.
- Concrete mismatch: source Explore line 83 (repeated at 87) asks "Con nghe thấy ai?";
  `server/src/seeds/customer/customerCatalog.ts:37` uses "Đây là mẹ." for the
  first listening prompt. They are not interchangeable. The latter is the
  source audio utterance, not the question. Do not attach "Who do you hear?"
  to it or change the VI/audio text under a translation-only task.
- Existing generated IDs `source-<lesson>-<ordinal>` and
  `bootstrap-<lesson>-<ordinal>` are persisted identifiers, not permission to
  regenerate them or infer source equivalence from their suffixes
  (`customerCatalog.ts:77`, `bootstrapCatalog.ts:100`). CMS can allocate UUIDs.

This report only reads code/docs/pinned source. No PR22 parser execution or
modification, new source capture, model/API/UI/importer change, grading endpoint,
new locale, translation authoring, publish, migration, production access, audio,
TTS or F04 work is included. No external generic web research is needed: the
decision concerns these pinned repository contracts and customer evidence.

## 2. End-to-end field trace

| Boundary | Current evidence | Future seam / hazard |
| --- | --- | --- |
| Live model | `server/src/models/Lesson.ts:24`, `:80`: activity has ID, prompt, optional subPrompt and hints; no translations | Add optional typed subdocument with absent default. A Mixed field alone is not validation. |
| Canonical TypeScript | `server/src/modules/content/content.types.ts:5` derives LessonContent from draft schema | Draft and canonical type changes propagate together; learner type must remain distinct. |
| CMS input | `server/src/modules/content/content.validation.ts:34`, `:103`: whitelist, 50 activities, text <=5000, entire JSON <=512 KiB | Unknown translation fields currently disappear; explicitly whitelist only proposed fields and reject unsafe nested keys. |
| Draft identity/CAS | `server/src/modules/admin/content/content.service.ts:80`: save checks version, parses, allocates missing IDs at line 92, rejects reused/retired IDs, saves whole payload; startDraft at line 37 clones canonical live content | Validate binding after durable ID assignment; no ordinal join. Preserve translated live -> start/restarted draft -> save, CAS, stage/order lock and retired-ID rules. |
| Draft storage | `server/src/models/ContentDraft.ts`: payload Mixed, draftVersion/baseContentVersion, editorial notes | Mixed storage does not prevent an old editor from silently dropping a new field. Guard old-editor writes. |
| Publish/revision | `server/src/modules/admin/content/content.publish.ts:61`, `:69`, `:72`, `:80` | Parse/validate again; snapshot legacy, create new version and update live in one transaction. Both live model and revision projection must preserve identical translated text. |
| Immutable history | `server/src/models/ContentRevision.ts:9`, `:18` | Unique kind/content/version and mutation hooks. Never backfill existing revisions to add translations. |
| Canonical read | `server/src/modules/content/content.reader.ts:21`, `content.read-schema.ts:10`, `content.dto.ts:4` | Both current live and historical revisions pass through readSchemas; missing this seam strips translations from either path. Keep legacy order/media compatibility. |
| Learner DTO | `server/src/modules/content/content.dto.ts:16` | Newer types redact correctAnswer/acceptedAnswers, then spread remaining fields. Add explicit safe translation projection; never spread authoring/provenance metadata into it. |
| Lesson endpoint / grading | `server/src/modules/lessons/lessons.service.ts:50`, `:81`; `lessons.validation.ts:10` | Ownership/unlock precede read. Capability 2 remains for activity types. Grader keeps canonical snapshot; translation text never becomes userAnswer or correctness input. |
| CMS editor | `client/src/features/admin/content/content.types.ts:15`, `ActivityEditor.tsx:28`, `:45`, `LessonEditor.tsx:18` | Add author types/fields, source comparison and invalidation. Reorder moves whole objects; type-change reconstructs fields and can drop new translations unless explicit. |
| Preview | `client/src/features/admin/content/LessonPreview.tsx:28`, `:100`; `ContentPreviewPage.tsx:72` | PureActivity explicitly rebuilds newer-type common fields; add safe text projection there. Preserve draft-version remount and isolated local state; no live registry/recording import. |
| Lesson fetch/session | `client/src/features/lesson-player/LessonPlayerPage.tsx:90`, `:115`, `:367`; `store/lessonSessionStore.ts:12` | Fetch pins cached contentVersion; query is not refetched on focus/reconnect. Render key uses version/activity ID. Session persists progress/answers, not lesson content. |
| Offline submit | `client/src/lib/offlineSync.ts:13`, `:78` | Queue contains user/child/lesson/version/answers, not translated content. Do not append locale/translation to grading payload or rewrite queued versions. |
| Text rendering | `activityRegistry.ts:24`, `activities/newActivity.types.ts:5`, individual activity prompt headings | Registry passes activity, but leaf types/renderers do not read translations. Map every supported renderer rather than assuming one shared frame covers all eleven. |
| Existing companion selection | `client/src/components/ui/SupportTranslation.tsx:28`, `:35`; `client/src/test/supportTranslation.test.tsx:32` | It chooses first nonempty translation for each selected field, not one locale for the entire content object. It uses active-child store; preview must not accidentally depend on a real child. |

Path key for shortened references: activityRegistry and activities are under
`client/src/features/lesson-player/`; `store/lessonSessionStore.ts` is under
`client/src/`. CMS editor/preview filenames are under
`client/src/features/admin/content/`. Server content.* filenames are under
`server/src/modules/content/`, lessons.validation under
`server/src/modules/lessons/`, and seed filenames in section 1 under
`server/src/seeds/customer/`. Model filenames are under `server/src/models/`;
supportTranslation.test is under `client/src/test/`. Line references are to
the pinned citation baseline unless explicitly labelled PR22. They are evidence
anchors, not claims about deployed DB.

## 3. Proposed additive contract (not approved)

### Identity and source binding

For a later reviewed mapping artifact, record the exact source manifest checksum,
entry key/lines, source section/locale and decoded VI together with target
lessonId, existing activityId, field, expected baseContentVersion and
expectedDraftVersion. A new activity must first be saved to obtain its server ID;
do not invent an ID to attach a translation before that step.

Before applying to a draft, require all identities/versions to match, require
the current target VI to equal the captured VI exactly, and require an explicit
one-to-one mapping reviewed for that target. Matching words alone is insufficient:
two activities can have the same prompt. No fuzzy/NFC/case/punctuation/whitespace
normalization, title join, source/runtime ordinal join or automatic fallback.
PR22 decodes Markdown; preserve its raw-line provenance as well as decoded text.
If a source question was split, expanded or reworded in runtime content, record
an unmapped row for content-owner review; do not adapt a translation yourself.

An illustrative canonical shape is:

```ts
// Proposal only. Contained by one activity in a versioned lesson payload.
type BoundText = { sourceVi: string; text: string };
type ActivityTranslations = Partial<Record<SupportLanguage, {
  prompt?: BoundText;
  subPrompt?: BoundText;
}>>;
// activity.translations?: ActivityTranslations
```

Version ownership remains the enclosing ContentRevision/PublishedView, not a
second independently incremented translation version. During editing the pair
baseContentVersion/draftVersion identifies the target; publication creates N+1.
An unchanged VI/ID may retain an approved binding through that explicit publish.
Consumers must never fetch the latest translation separately and overlay it on
a session pinned to N. Mapping provenance remains admin-only evidence; do not
add source documents, raw notes, expected answers or hints to learner payloads.

**Unresolved invalidation contract:** this illustrative `{sourceVi, text}` shape
is not a complete approval model. Exact equality and CAS cannot distinguish
saved VI edits A -> B -> A from an unchanged field, or a type change retaining
the same VI. Current `ContentDraft.ts:4` has no persisted translation approval
state. Implementation therefore stays blocked on a reviewed, server-owned
invalidation/reapproval mechanism that survives save/reload and cannot be
cleared by a caller-supplied approval flag. It must define how prior text is
retained for admin comparison, how explicit reapproval binds the current
identity/type/VI, and how publish excludes stale work. This report does not
choose a metadata field, endpoint or authorization policy for that mechanism.
Unsaved local edit history is not observable by the server; whether reverting
an unsaved UI edit requires review must also be defined, not claimed enforced.

### Bounds and whitelist proposal

- Optional map, absent when unused; no default `{}` and no mandatory migration.
  Only `en`, `ja`, `ko`, `zh`, `fr`; no `vi`, `other`, invented locale or dynamic key.
- At most five language entries and two named fields each. Each populated
  `sourceVi` and translated `text` is nonblank and <=5000 characters, matching
  the existing authoring text ceiling. Preserve exact stored VI/text; an empty
  editor field is an explicit removal, not an empty published translation.
- Reject unknown entry keys, `hints`, answer keys, inherited/prototype maps,
  arrays instead of objects and unsafe key names before any parser strips them.
  Retain the existing 512 KiB aggregate payload bound and 50-activity limit;
  duplicated VI for binding also consumes that budget. No blanket `.passthrough()`.
- A subPrompt translation requires a nonempty matching source subPrompt.
  Current PR22 capture supplies none: the optional contract may accommodate
  later approved sources, but this capture cannot populate the field.
- Apply editorial size/strictness to new writes. Canonical reads keep existing
  permissive handling of old known fields (including old order/media values);
  do not call parseDraft on every legacy read. New translation subobjects still
  need an explicit read whitelist, never unknown-field passthrough.
- At publish, reject stale sourceVi binding with field-specific errors. Missing
  translations do not block an otherwise valid Vietnamese lesson. At learner
  projection, omit a mismatched translation defensively rather than render it
  or invalidate unrelated legacy content; do not silently repair stored data.
- Project only safe locale/field translated strings after binding checks; retain
  Vietnamese prompt/subPrompt separately. No new answers, hints, provenance,
  activity correctness or renderer-specific hidden fields enter this projection.

Structural whitelists cannot prove a translator did not put an answer inside
free text. A source-section allowlist plus content-owner semantic review is
required. Existing hints and legacy answer exposure are unchanged baseline
limitations, not repaired by this proposal. Never claim the entire API has no
answer leakage merely because the new translation projection is narrow.

## 4. Compatibility and editor invalidation

| Situation | Required behavior proposed for review |
| --- | --- |
| Old document/snapshot without translations | Same VI payload/behavior; optional field absent. No source/version rewrite. |
| Old learner reads a new translated version | Additive optional metadata may be ignored; keep existing type-capability 2 behavior and answers. No new activity type or grading capability is needed solely for text. Test actual old shapes before rollout. |
| New learner resumes old N while live is N+1 | Read N exactly, with N's translations or none. No latest-translation overlay, version bump or answer remap. |
| Session missing contentVersion | Keep explicit restart path; never infer the version from a translation or current live document. |
| Offline reload without cached lesson response | Session only stores progress/answers, so full offline content availability is not guaranteed. Do not promise an offline content cache or add one in a translation task. |
| Offline outbox retry / account or child switch | Preserve original user/child/lesson/version/answer IDs, ownership checks and needs_attention handling. Locale switch changes display only, not submitted answers or rewards. |
| Reorder activities | Move whole activity including translations by durable ID; never rebuild binding from array position. |
| Edit VI prompt or subPrompt | Mark translations of that field stale in all locales, stop learner projection; require explicit removal or new reviewed source binding before publish. Preserve the editor's prior text for human comparison, not as valid translation. Changing back must not silently approve stale work. |
| Delete activity / re-add similar text | Remove draft translations with that activity; preserve historical snapshots and retired IDs. Re-added activity gets a new ID and no inherited translation. |
| Change type | Require explicit review/invalidation of translations even when VI is unchanged because instructional context may change. Preserve the current type-change confirmation; do not silently transfer semantic approval. |
| Save conflict / stale mapper | Reject through existing CAS; retain local editing input. Do not auto-merge translations by index or override another editor's changes. |
| Clear translation field | Translation-aware editor can explicitly remove it; remove empty locale/map. Missing field from an old editor must not be mistaken for an intentional clear. |

**Old CMS writers are a real rollout hazard.** They submit whole payloads and
can omit an unknown field; the current parser also strips unknown fields.
Recommendation for contract review: a narrow translation-aware write capability
or equivalent explicit field-presence protocol. Reject a non-aware save of an
already translated draft before mutation with a reload-required conflict; keep
old writers working for untranslated drafts. A new aware writer can explicitly
clear a field. Exact request/header and error code require contract approval;
this report does not introduce them. Server-side stale-binding validation is
required regardless of UI warnings. "Deploy CMS then ask everyone to reload"
alone is not a data-preservation guarantee.

Publish only after backend model/read/projection and aware CMS are compatible.
Keep publication feature gates and CAS; no automatic import or release is part
of a translation-code PR. After translated versions exist, do not roll backend
or editor back to a version that silently strips them. Stop publish and ship a
compatible forward fix; preserve historical versions/answers/ledger.

## 5. Display policy and renderer boundaries

Existing story/culture behavior is evidence, not a newly approved lesson rule:
`SupportTranslation` tries ordered companion languages **per field**, falls
back to legacy singular preference, skips `other`, and renders nothing without
a child or a matching nonempty value. It keeps VI primary and emits `lang`.
Thus a preferred locale missing a subPrompt could yield a different fallback
locale for that field; it does not lock an entire activity to one language.
`supportTranslation.test.tsx:46` explicitly tests per-field fallback.

Propose reusing those semantics for lesson text, subject to owner confirmation.
Explore line 63 says "Mỗi câu hỏi được hiển thị bằng tiếng Việt và ngôn ngữ hỗ trợ đã chọn."
Line 151 also says "Mỗi câu hiển thị bản dịch đủ năm ngôn ngữ theo cấu trúc trên."
These statements do not settle one vs multiple displayed languages or per-field
vs per-activity fallback. Changing the VI/EN UI
toggle must not select content language. CMS preview needs explicit synthetic
locale preferences (or a pure selector plus adapter), not the active real child
store. Do not refactor unrelated story/culture selection as part of this work.

Renderer inventory:

- Text-only prompt headings exist in `DragMatchActivity.tsx:64`,
  `FillBlankActivity.tsx:35`, `SortOrderActivity.tsx:50`, `ReviewActivity.tsx:32`.
  Each needs the reviewed optional text type/display seam; no heading replacement
  with a foreign string, translated answer options or altered completion logic.
- `WordCardActivity.tsx:41`, `ListenChooseActivity.tsx:42`,
  `RecordVoiceActivity.tsx:115` and shared `NewActivityFrame.tsx:27` mix text with
  audio/recording concerns. The shared frame serves four newer types. They are
  **read-only boundary evidence here**: no audio file/shared-frame modification
  is authorized, even if a future edit is described as text-only.
- A later full-renderer task must obtain an explicitly approved text seam around
  those boundaries, or remain blocked for those renderers. Do not move audio
  hooks, change speech text/voice, introduce translated narration, wrap hidden
  audio calls or claim all eleven types covered through a parent-only duplicate
  prompt. No audio workaround is proposed in this preflight.
- `LessonPreview.tsx:28` must preserve the future learner-safe translations when
  constructing newer-type visible props. Admin expected-answer details remain
  separate. Its recording placeholder must stay nonrecording. Preview locale,
  activity and draft-version changes must reset only local preview state.
- `LessonPlayerPage.tsx:343` currently exposes existing hint controls and line
  359 renders hints[0]. That baseline is not permission to import translated
  hints. Final-server grading for new types cannot determine local wrong-answer
  hint timing; retry/praise/heart policy is a separate owner gate. Never deliver
  hint/answer content through translations of prompt or subPrompt.

## 6. Minimum test-first cases for a future change

These are **planned RED cases, not executed tests or a claim of RED/GREEN**.
Use synthetic reviewed fixtures, temporary databases for integration, and no
production credentials. Existing tests are starting points, not sufficient
evidence that the proposed contract works.

| Case | Required assertion / existing suite anchor |
| --- | --- |
| T01 additive round trip | Optional translation survives draft -> live model -> revision -> canonical read -> learner DTO. Current lesson whitelists discard it. `contentModels`, `contentDrafts`, `contentPublish`, `contentLearning`. |
| T02 absent compatibility | Old payload has no translations key or empty map added; legacy order/media still readable. `contentValidation`, `contentLearning`. |
| T03 strict limits | Reject unsupported locale/other, unknown hints/answer keys, prototype/inherited maps, wrong shapes, blank/oversized text and aggregate >512 KiB before writes. |
| T04 exact VI | Punctuation/case/space/NFC difference fails source binding; identical text with a different lesson/activity/version also cannot attach. |
| T05 source identity | Source activity ordinal/title and runtime ordinal are deliberately different; no mapping until explicit stable-ID binding. Missing VI/ambiguous source and section=hint cannot map to prompt. |
| T06 missing subPrompt | No source subPrompt means no invented translation; orphan subPrompt translation rejects. |
| T07 read isolation | Published N+1 translated, cached learner N unchanged; old version 0 stays readable; unavailable N gives existing error, not live fallback. `lessonVersions`, `contentLearning`. |
| T08 grading neutrality | Newer-type correctAnswer/acceptedAnswers remain absent from learner DTO; canonical grader still receives them. Translations cannot affect answers/score/rewards; no new hint exposure. `newActivityGrading`, `lessonIntegrity`. |
| T09 CMS reorder/delete | Identical VI in two activities remains tied to its ID; reorder preserves, delete/re-add cannot inherit; retired IDs rejected. `contentIdentity`, `cmsLessonEditor`. |
| T10 VI/type edits | Edit source field invalidates all its locale entries, preserves human comparison text, blocks stale publish; unrelated field does not erase a valid binding. Saved A -> B -> reload -> A and type change with unchanged VI stay stale until explicit reviewed reapproval. Direct API saves cannot bypass it or forge approval; unsaved UI revert semantics need the same contract decision. |
| T11 stale/old writer | Translated published content survives startDraft and restart of a synced/discarded draft; non-aware save then fails without dropping translations. Aware explicit clear works; concurrent CAS conflict preserves winner and local form. `contentDrafts`, `cmsEditor`. |
| T12 atomic publish | Fail after revision creation before live update: no half-published translation. Retry returns same receipt, preserves revision N and points. `contentPublish`. |
| T13 display policy | After approval: ordered/per-field fallback, singular preference, no child/no match/other, VI primary, lang attribute and UI language independence. `supportTranslation` plus future activity-text tests. |
| T14 preview safety | Every eligible renderer gets the same safe text; controlled preview locales work without active child, no session/outbox/points/child/API/recording mutation. `cmsPreview`. |
| T15 session/offline | Locale changes preserve partial inputs, answers/hearts/version; reload/account/child switch do not leak another session; outbox remains answer-only. `lessonSessionVersions`, `offlineSync`. |
| T16 old client | Additive translated payload does not break old learner shapes, capability-2 type gate unchanged; old CMS cannot erase new fields. |
| T17 rendering | Long VI and five support scripts, 320/390/640/1366px, full text/wrapping, keyboard/focus; no untranslated-string-as-answer or hidden hint. Separate real-device acceptance. |
| T18 rollout/read regression | Read current and immutable legacy revisions without write validation; rollback plan cannot strip published data. Source checksums/default importer unchanged. |

Runtime tests, browser tests and build were not run for this analysis-only report;
no dependencies are needed to inspect it. Shipping verification should check
file/line references, source hash/scope, two-file diff and independent review.
CI may run project suites automatically; any reproduced held F04 failure must
be reported/HOLD, not retried to obtain green or repaired in this task.

## 7. READY versus BLOCKED work

READY means a bounded next proposal/analysis can be assigned, **not that this
report approves implementation or publication**. All code PRs need coordinator
assignment and an approved contract first.

| Task / separate PR scope | Status and dependencies | Exit evidence |
| --- | --- | --- |
| F13-PREFLIGHT: this report + journal | READY for review now; pinned source is evidence only | Two Markdown files, verified anchors, stated assumptions/limits; no runtime delta. |
| F13-CONTRACT-DECISION: owner review of shape, invalidation, old-writer protocol and locale policy | READY to decide from this report; does not require accepting PR22 implementation | Approved written contract and named boundaries, or explicit corrections. |
| F13-TEXT-CONTRACT: model, canonical/draft/read schema, DTO and backend identity/publish tests | BLOCKED on approved shape, persisted server-owned invalidation/reapproval, old-editor preservation protocol and coordinator assignment; technically separable from source import | T01-T12/T16/T18, no source importer/player/grading/audio changes; update owning docs02/05 if approved. |
| F13-CMS-TEXT: activity author types/editor, source invalidation, preview text-only support | BLOCKED on TEXT-CONTRACT and aware-write protocol; preview audio-bearing seams need explicit scope approval | T09-T14; no live data, no publish operation, no audio/shared-frame edits without new authorization. |
| F13-RENDER-TEXT: pure selector and eligible learner text renderers/session regression | BLOCKED on contract/display decision; full eleven-type coverage also blocked on approved audio-boundary text seam | T07/T13-T17; preserve answers, capability, UI locales and original audio behavior; do not label partial renderer coverage complete. |
| F13-ID-BINDING-AUDIT: exact source-to-persisted-ID mapping report | Source prerequisite PR22 accepted; read-only analysis can be assigned once target version/IDs are supplied through authorized evidence. Actual mapping currently BLOCKED on those target inputs | Every candidate has source checksum/entry, lesson/activity IDs, version/draft CAS and exact VI; unmatched entries retained. |
| F13-DRAFT-IMPORT: opt-in approved mapping application | PR22 source prerequisite accepted; still BLOCKED on verified ID bindings, text contract/CMS and separate write authority | Dry-run/no-write first, skip/conflict safety, no overwrite of 09/10 snapshots or existing edited drafts; no automatic publish/migration. |
| F13-SUBPROMPT-SOURCE | BLOCKED: captured source has no identified translated passages/subPrompt | Content-owner supplied exact VI/locale pairs with provenance; no machine-authored replacement. |
| F13-HINT-RETRY | BLOCKED: Docs feedback timing versus approved final-grading policy | Owner decides grading/retry/privacy/offline contract separately; no hints smuggled into prompt. |
| Full curriculum / production acceptance | BLOCKED on per-item source/semantic approval, remaining curriculum decisions and separate rollout authority | No inference from translation counts, CI or this report that B1-B20 is complete. |

Suggested order after review: settle contract decisions, then additive backend
and preservation tests; aware CMS; approved text renderers; explicit ID-binding
audit; only then separately authorized draft import. PR22 ownership remains with
its source-capture chat. Avatar/vocabulary/Cover tasks remain with their assigned
chats. This report neither duplicates them nor closes the overall customer plan.

## 8. Decisions still required

1. Owner: extend story/culture's first-available **per-field** companion rule to
   lesson prompt/subPrompt, or specify another rule for multiple selected languages?
2. Contract owner: approve/revise the sourceVi binding shape, persisted
   server-owned stale/type-change invalidation and reapproval, optional bounds
   and old-CMS write-awareness protocol before code.
3. Coordinator: approve a text-only seam for renderers sharing audio code, or
   explicitly accept partial renderer scope; current authorization forbids those edits.
4. Content owner: approve source semantics and exact runtime bindings; provide
   missing VI/subPrompt sources. PR22 acceptance alone does not approve publication.
5. Owner: resolve hint/retry/final-grading disagreement separately. Until then,
   no translated-hint delivery, per-question grading endpoint or points change.

No repeated user prompt is needed during this preflight: these are explicit
decision gates for the coordinator backlog, not assumptions silently made here.
