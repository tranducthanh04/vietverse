# Activity translation contract: analysis-only preflight

Date: 2026-10-19, Asia/Saigon (UTC+7).
Task: F13-CONTRACT-PREFLIGHT.
Baseline: `53a447a369fed0d69b455749a053b694a159a753`.
Worktree: `C:/Users/Asus/.codex/worktrees/activity-translation-contract/codeDuAN`.
Report: [preflight analysis](../reports/2026-10-19-activity-translation-contract-preflight.md).

## Scope and evidence

- Deliverable is two Markdown files: the report and this journal. This is not
  implementation, an approved contract, source acceptance or publication consent.
- Read repository instructions and the relevant business, API, CMS workflow and
  review findings. Current decisions remain in owning docs; this journal does
  not replace them or turn report recommendations into policy.
- Report source-format evidence is PR #22 pinned at
  `7269402a55f79cb2a7680ee54905d223ba9c841f`, inspected as read-only Git objects.
  Its parser was not executed or edited. PR22 was open at initial inspection;
  that inspection was evidence, not acceptance of a runtime dependency or
  permission to import its content. Subsequent merge status is recorded below.
- No source capture, translation authoring, seed/importer/model/API/UI change,
  data migration, publication or production operation is included.

## Findings recorded by the preflight

- Activity translations currently have no end-to-end contract. A model-only
  addition would be lost at CMS input, canonical read/DTO and preview/rendering
  boundaries. Trace also covers draft identity/CAS, immutable revisions,
  learner-safe projection, editor invalidation and session/offline behavior.
- Stable lesson/activity identity and the actual content version matter. Source
  heading ordinals, generated-ID suffixes, similar text or array positions do not
  establish a runtime mapping. The report identifies a source question versus
  runtime audio-utterance mismatch, not an interchangeable translation target.
- PR22 source inventory includes prompt and hint sections, not approved runtime
  bindings. No translated subPrompt/passage source is identified in that capture;
  absence must not be filled by renaming hints or inventing translations.
- Existing ordered companion-language selection is per field for story/culture.
  That scoped approval does not establish the same policy for lessons. The VI/EN
  UI switch is distinct from companion content selection.
- CMS full-payload saves can drop fields an old editor does not know. Mixed
  storage and a UI reload recommendation alone do not preserve future translations.
- Session/outbox preserves progress/answers/version, not a complete offline
  content cache. The analysis does not promise translated content offline.

## Proposals requiring approval, not implemented

- Consider optional, text-only prompt/subPrompt translations bound by lesson ID,
  durable activity ID, contentVersion, field and exact Vietnamese source text.
  Proposed exact binding does not normalize, fuzzy-match or join by ordinal.
- Consider explicit optional schemas/read whitelists and learner-safe text
  projection, with source/provenance/answers/hints kept out of new learner fields.
  Bounds, sourceVi shape, old-writer capability and error protocol still require
  contract review. No request header or API error has been introduced here.
- Consider preserving old snapshots and CAS, invalidating field/type edits,
  requiring explicit reviewed remapping and guarding unaware CMS writes before
  mutation. No immutable revision or queued answer is rewritten.
- Proposed reuse of story/culture per-field fallback for lesson text requires an
  owner decision. Preview would need controlled synthetic locale preferences,
  not accidental dependence on the active real child's store.

## Explicit gates and non-goals

- Hint timing/mandatory retry conflicts with approved final-server grading and
  remains a separate owner decision. No translated hints disguised as prompt,
  per-question grading endpoint, score/reward/heart or privacy-policy change.
- Audio-bearing renderers/shared frames are read-only evidence. Full-renderer
  work remains blocked on an authorized text seam; no audio/TTS/F04 edit,
  workaround or claim that a parent-only duplicate prompt covers all types.
- Exact runtime IDs/versions, source semantics, missing subPrompt source and
  separately authorized import/publication remain prerequisites. Source counts,
  report review or CI cannot establish full curriculum readiness.
- PR22 and avatar/vocabulary/Cover tasks keep their existing ownership. This
  report neither duplicates those tasks nor closes the overall customer plan.

## Verification and coordination status

- The report's T01-T18 are planned test-first cases only. No runtime tests,
  build, browser run or dependency installation was performed for this analysis.
- Three existing agents were reused for the review/documentation/verification
  split. Independent report review and the documentation-only verifier are still
  running/pending at this entry; no clean-review or passed-verification claim is
  made until their results and any corrections are recorded.
- Verification scope is references/source hash, analysis-versus-proposal labels,
  the two-file Markdown diff and independent review. Automatic CI is separate;
  a reproduced held F04 failure must be reported as HOLD, not retried for green
  or repaired as part of this task.
- AgentKit CLI/resolver is unavailable; use local Markdown/manual body fallback.
  No plan status/index is hand-edited or whole-plan closure claimed. AgentWiki
  publish skipped.
- This journal handoff changes only this new file and performs no report edit,
  stage, commit, push, merge, external publication or production write. Final
  review/verifier evidence may be appended after findings are resolved.

## Final documentation review and updated main

- The worktree fast-forwarded to main
  `bf8651572678ff0f37acc02bca4e57efd940759e`, which includes merged PR #22.
  Report citations deliberately retain original code baseline
  `53a447a369fed0d69b455749a053b694a159a753`. The pinned source/parser diff from
  `7269402a55f79cb2a7680ee54905d223ba9c841f` to the updated main is empty.
  Source acceptance does not approve runtime bindings, translation semantics,
  the proposed contract, data import or publication.
- Initial independent review raised P2: the illustrative BoundText equality
  alone cannot preserve invalidation through saved A -> B -> reload -> A or a
  type change with unchanged Vietnamese. The report now explicitly blocks
  implementation on approved server-owned persisted invalidation and reapproval.
  T10 adds saved/reloaded changes, direct-API/forged-approval boundaries and the
  unresolved unsaved-UI-revert semantics; T11 adds start/restart draft retention.
  Source anchors were corrected/expanded. These are proposal corrections, not
  an implemented approval mechanism or executed regression tests.
- Final independent reread reports no actionable findings and closes that P2
  documentation finding; the underlying implementation/contract gate stays open.
- Documentation-only verifier validated reference anchors and source evidence:
  Explore capture 46,637 bytes, SHA256
  `173d0c2bf181ec9209b857267063c8454223ef176457339f8f9c8be5d8156d49`;
  reported inventory of 75 prompt groups plus 8 hint segments, 415 locale pairs
  (83 per locale), new source quotations and two-Markdown-file hygiene.
  Counts remain source inventory, not approved or applied runtime mappings.
- This entry records coordinator/reviewer/verifier handoff, not an additional
  parser execution or runtime verification by the journal writer. No parser,
  runtime tests, build or browser checks were run for this analysis-only task.
  CI for the new PR remains pending; no pass/merge/deploy claim is made here.
- Only this journal is changed by this update. No report edit, commit, push,
  production action or whole-plan closure is performed.
