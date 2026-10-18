## Summary

```text
Story/Culture list or detail without coverImage
  -> own variant key: existing icon and palette
  -> unknown/inherited/missing key: existing kind fallback
Supplied coverImage path stays unchanged
```

COVER-FALLBACK-SAFE prevents constructor/toString/__proto__/hasOwnProperty
strings from selecting Object.prototype values and crashing React. Production
fix and30 regression tests are unchanged from prior head852349f.

Normal merge `9aeb349145e77bc8524f89bce7c172a542536212` integrates main
`05872f40b2f8c4c6b90ad18263dd8c8ee11d1d33` (source22/header23/footer24).
Conflicts only in docs03/06; preserved both sides. No auth/source/header/footer
implementation delta against pinned main, no greeting28 mixed in.

## Evidence

- Before:10 of30 tests failed (eight inherited-key cases, two real culture-route
  render errors); after:30 pass. Twelve known variants/styles stay intact.
- [x] Fresh integrated focused tests:98/98 (cover, presentation, translation,
  header and footer). Full frontend:446/446 across44 files, exit0.
- [x] Root typecheck/build pass; lint0 errors/100 existing warnings.
- [x] Backend/package/lock inputs match bf865 exactly. Main agent's same-session
  full root run there passed525 backend tests across53 files; reused unchanged
  inputs, not represented as a new cover-worktree backend execution.
- Historical full runs and RED/GREEN evidence remain in the task journal.
  Existing audioPlayback act warning is retained; no F04 closure claim.
- Fresh guest/public-footer and authenticated KidsLayout/header browser evidence
  is recorded in `plans/261019-cover-placeholder-safe/browser-evidence.md`.
  Old tracked screenshots remain historical, not new-header evidence.
- [x] Fresh expanded browser run:96 list-to-detail activations (48 each mode),
  24 legacy reloads, VI/EN320/640/1366. Known/fallback/supplied covers, keyboard,
  six kids nav items, new branding/footer, current header/bottom clearance pass.
  Zero overflow, console/page errors or unexpected requests.30 synthetic
  exploration POSTs fulfilled in-memory, zero forwarded backend writes.
- [x] Independent source review and conditional simplifier found no actionable
  issue or worthwhile refactor; reviewer independently ran30 cover tests.
- Browser harness first failed before any activation because a CSS home-link
  selector matched two header links. Unique accessible brand targeting fixed
  the proven selector defect; the next complete run passed. Failure retained,
  no product change, timeout increase, skipped test or arbitrary sleep.

## Merge Danger

**Door:** two-way. Revert scoped lookup change; no migration/dependency/asset.

**Blast Radius:** covers. Four story/culture list/detail consumers; known styles,
className, decorative aria-hidden and supplied images remain unchanged.

## Scope, Delegation And Limits

- No taxonomy/API/model/store/guard/rights/points/grading/audio changes,
  production writes, provider changes, force-push or self-merge.
- Main integrates and runs unit/full/type/build/lint checks. Browser delegate
  owns runner/report only; independent reviewer checks scope and regression
  risk; git-manager packages/pushes the scoped update.
- Browser uses synthetic profiles and intercepted local HTTP. Existing automatic
  story-explored requests are fulfilled locally, never sent to a backend. Not
  production authentication, real DB, physical-device or audio acceptance.
- F04 recording-finalize, F13 runtime mappings and story taxonomy remain outside
  scope even if tests pass. No tests skipped/weakened or retried just for green.
- ak CLI unavailable: local journal/plan fallback, no plan-index closure claim.
- No new human policy/credential action is required for the lookup fix.
  Coordinator reviews exact-head CI and merges. No manual deploy by this chat.

## Review Gates

- [x] Regression tests and owning docs/findings/inventory updated.
- [x] Local independent review and scoped verification completed.
- [ ] Exact-final-head remote CI.
- [ ] Coordinator review and merge to main.
- [ ] Post-merge main CI and verification (not yet applicable).
- [ ] Production/real-device acceptance (outside this local task; not claimed).

## Deviations From Plan

- Normal pinned-main integrations were required as auth20/source22/header23/
  footer24 landed. Documentation conflicts preserve both sides; no history rewrite.
- Expanded the browser fixture from guest-only to guest plus authenticated kids
  because the integrated header/footer changed browser inputs.
- Reused525 backend results only after byte-level server/package/lock equivalence
  to bf865; did not rerun the unchanged backend or claim a fresh backend run.
- Corrected the proven duplicate-home-link harness selector; retained its first
  zero-activation failure. No production or acceptance-assertion change.
- ak CLI unavailable: local plan/journal fallback, no plan-index closure claim.
  No other scope change.

## Technical Decisions And Assumptions

- Own-property lookup is a technical correction, not a category/business-policy
  decision. Existing kind-specific fallback, decorative semantics and images stay.
- Synthetic auth/child/content and intercepted local HTTP establish presentation
  coverage only. They do not establish server authorization, persistence, real
  authentication, physical-device or production acceptance.

## Delegation Status

Two distinct existing helpers completed their assigned work: review_admin_fix
owns expanded browser runner/report; review_source_capture owns independent
review and git packaging. The main agent owns implementation, integration,
unit/full/typecheck/build/lint and documentation coordination. No new helper
or parallel feature scope was introduced; publishing does not authorize merge.

## Linked Issues

No linked issue found in the scoped GitHub issue search (`cover placeholder`).
Task contract: `docs/cover-placeholder-safe.md`; no automatic issue closure.

## Ship Mode

Target main through this existing PR25 only. Ordinary feature-branch push;
coordinator owns review/merge and post-merge verification. No self-merge,
force-push, direct main push or manual deployment.

Full history: `plans/journals/2026-10-19-cover-placeholder-safe.md`.
