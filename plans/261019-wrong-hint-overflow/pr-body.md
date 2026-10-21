## End-to-end work summary

Fix long wrong-answer hint overflow with three CSS-line changes in
WrongAnswerFeedback and ReviewActivity. Keep complete text and existing short
layout; do not change SupportTranslation, handlers, scoring, retry or audio.
Includes 20 characterization tests, actual-player browser harness, quality
runner, owning document and local evidence manifest/report.

Delivery head: `{{DELIVERY_HEAD}}`. Local tested base:
`9b809bd3b27ea69cad2da2413825ffb8912d3f98` plus the source hashes in the manifest.
Main advanced to `89a2d850fd3ec13b6334cd4e1b70fd54da11eca0` (PR31) before delivery;
its API/test/docs delta was inspected, not merged or relabeled as locally tested.
New PR, separate from completed PR29 and other owners' PR18/PR31.

## Subagent delegation

Zero. Implementation, local validation and author review were done in this chat.
Coordinator independent review/merge remains pending; author review is not a
substitute. Shared checkout and other worktrees were not edited.

## Technical decisions

- Use inherited `overflow-wrap:anywhere` only inside the feedback card and
  `min-w-0` for its source flex item; preserve font sizes and normal word wrapping.
- Use `max-w-full sm:max-w-xl` for Review's container; no global translation CSS.
- Preserve source and first available companion translation up to5000 characters,
  `other`/missing/blank fallthrough, singular legacy preference, no child/generic
  fallback, lang/status/live semantics, correction and next-step clearing.
- No new business/API/policy decision. Synthetic wording is QA-only, not content
  approval. Dedicated docs only; shared docs02/03/05/06 links deferred to coordinator.

## Deviations from plan

- Historical QA said 216 characters; exact repeat12 fixture is228. Test both.
  First startup assertion failed before browser and is retained, not counted RED.
- Initial GREEN had93 passes and5 target failures, all text geometries contained.
  Nearest-scroll could leave answers behind sticky footer. Only harness scrolling
  changed; targeted5/5 passed with unchanged hit/size/keyboard assertions. No
  blanket rerun, product workaround, hidden footer or discarded failure.
- Added12 checks for actual last-character visibility/hit testing on boundary text.
- Main moved during work; kept explicit pinned-base evidence. No silent merge.
- Native Git/gh fallback because ak CLI is absent; no plan-index closure claim.

## Completion evidence

- RED:24 short controls PASS,4 long cases FAIL real card/main/text overflow.
- GREEN:98 distinct VI/EN x320/390/640/1366 cases across Review/Fill Blank/Sort
  Order, composed of initial93 PASS plus corrected-scroll5 PASS;12 extra boundary
  text-end checks PASS. All24 short card rectangles/fonts unchanged.
- Focused118/118 (8files,20new tests); full frontend509/509 (50files), no pending.
- Root types/build/lint PASS; lint0errors/99warnings. No local full backend run;
  new-head configured CI required. Existing audio tests run unchanged only.
- Browser uses actual player/CSS/loaded font/router/session, synthetic HTTP/auth,
  loopback and public Google Fonts GETs. Zero forbidden requests/page/console
  errors/audio calls; all runs cleaned. Not production/backend/audio acceptance.
- Known full-sort reset absence recorded in32 cases, not fixed. No footer overflow
  for these short labels; separate PR18 long-label issue is not closed here.
- [Report](plans/261019-wrong-hint-overflow/report.md),
  [manifest](plans/261019-wrong-hint-overflow/evidence-manifest.json),
  [journal](plans/journals/2026-10-19-wrong-hint-overflow.md),
  [owning doc](docs/wrong-hint-responsive.md).
  Manifest verifies158 local source/evidence hashes. Raw logs/screenshots stay in
  local Temp paths listed in report/manifest; they are not uploaded GitHub assets.
  Native representative screenshots inspected; full matrix checked geometrically.
- Exact-head CI/previews and actual synthetic-merge checkout provenance must be
  verified after PR creation. Local results are not final merge acceptance.

## Checklist

- [x] Read AGENTS and docsREADME/relevant business/docs06 before change.
- [x] Reproduce actual browser RED before three-line repair; preserve failed runs.
- [x] Complete full-text, language, state, layout, keyboard and scroll checks.
- [x] Run focused/full frontend and root types/build/lint; verify source hashes.
- [x] Review product/security/scope; no credentials or dependency changes.
- [x] Leave footer/reset/audio/API/server/shared indexes to their owners.
- [ ] Independent coordinator review and current-base integration acceptance.
- [ ] New-head required CI and previews verified; gated merge and postchecks.

## Human actions required

No new product choice is required for this presentation repair. Coordinator must
review exact head/base and CI inputs, serialize shared-doc links, decide whether
fresh current-base local validation is needed, then own merge/postchecks. Do not
infer physical-device, screen-reader, production, F04/R01 or whole-Docs acceptance.

## Linked Issues

No matching issue found by `gh issue list --state all --search 'wrong hint overflow'`.
Source is consolidated QA P2 and Delta-A evidence, described in the report.
No unrelated issue is auto-closed. PR18 owns footer/full-sort findings.

## Ship Mode

New Draft PR to main, ordinary push on codex/wrong-hint-overflow. No author merge,
auto-merge, force push, direct-main push or manual deploy. Coordinator owns final
review, gated merge and postchecks; no recurring monitor is created here.
