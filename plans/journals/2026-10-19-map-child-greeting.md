# MAP-CHILD-GREETING

## Context and ownership

Customer audit 5.2/5.4 and completion step 6 ask for a greeting by child name.
Coordinator assigned a separate branch/worktree, using existing approved
onboarding.readyTitle strings and leaving other chats' header/footer work alone.
Baseline bf8651572678ff0f37acc02bca4e57efd940759e (PR22), main CI39149362873 SUCCESS
before creation. Shared checkout untouched; no audio/F04, model, API, auth/store,
permissions or grading changes. Production diff is seven lines in QuestMapPage.

## Implementation and checks

- Nine new regression tests: first run included an async test-harness mistake
  (resolving profile data before Axios reached the adapter); awaited request start.
  Corrected RED run: seven failures solely from absent greeting, two existing
  no-child/mismatch checks passed. GREEN after implementation: all nine passed.
- Focused map/i18n/child journeys: 61 passed; parent dashboard/next lesson: 9
  passed (70 total). Two mistyped test paths in the first command matched no
  files; the separate command explicitly ran the correct two files.
- Strengthened heading/subtitle assertions, then reran all nine greeting tests.
- `npm test`: 525 backend tests across 53 files and 398 frontend tests across
  42 files passed, exit 0. Local disposable MongoDB used the existing7.0.24 binary.
  Existing audioPlayback.test.tsx emitted an act warning; no test was skipped,
  weakened or rerun to conceal a failure. This does not resolve F04.
- `npm run typecheck`, `npm run build`, `npm run lint` completed successfully;
  lint has zero errors and 100 pre-existing warnings. No dependency/lock changes.
- Independent reviewer: 39 relevant tests passed (greeting9, stage20, auth
  lifecycle9, child store1); no actionable code/privacy/docs findings. Additional
  exact heading/subtitle test run9, script syntax and diff check passed.
- Conditional simplifier reviewed new files because browser runner exceeded
  200 lines: no worthwhile simplification, no edits; no abstraction added.

## Browser verification history

Delegate owns the standalone runner/report only. Main owns production/tests/docs.
Initial matrix: 24 cases, six switch-backs, 24 real picker PATCHs passed;
existing parent-stage runner passed 48 activations and six URL/history matrices.
Initial Vite port collision fixed by resolving a free loopback port with strictPort.

Expanded matrix includes a valid30-character name. Main's independent execution
failed waiting for that child's PATCH: old case-insensitive substring selector
matched both the30-character name and the120-character stress fixture, selecting
the latter. Live DOM diagnostic confirmed two old matches versus one exact match.
Runner correction uses exact full-name selection and count/text assertions; no
application change or timeout increase. Final expanded results in the browser
report. Main inspected mobile unbroken and desktop spaced-name screenshots.
Final expanded run passed30 greeting cases, six switch-backs and30 actual PATCH
selections. Main independently reran immutable corrected runner: same counts,
exit0, no console/page errors or unexpected requests; screenshots in local temp
folder vietverse-map-child-greeting-rV0jUh. The original failed run is retained
above rather than replaced by this result.

## Scope and limits

Existing ChildPicker dropdown lets long names extend outside the option button;
the browser report records measured evidence, distinct from greeting wrapping.
It is outside this assignment and must not be silently folded into header work.
No production or physical-device acceptance, no screen-reader/axe claim.

`ak` CLI unavailable: plan and journal files retained as fallback; no plan-index
closure/validation claimed. AgentWiki publish skipped. Implementation is reviewed
locally; PR review/CI/merge remains coordinator-owned. No self-merge/manual deploy.

## Integration gate

Coordinator requested normal merge of newly merged header PR23 at
6cf4ce52724867be75b733c741c5cb72a0b823b5 before handoff. Existing browser evidence
above is for the old header and is not integration proof for the new header.
Focused/full frontend/typecheck/build and both browser matrices must be rerun.

Integration commit ce72d9aa5cb9f4c47364abd71030202d0220a1a4 preserves feature commit
f260a11f50a069c8d93c731bef666f7ae24c592b and normal-merges pinned main6cf4ce5.
Only docs/03-feature-inventory.md conflicted; both sections preserved exactly.
Post-merge checks passed:75 focused tests, all403 frontend tests (43 files), root
typecheck/build, lint0 errors/100 warnings. Backend/package/lock inputs unchanged
from bf865 (verified empty diff), so525 passing backend evidence is reused rather
than represented as a new backend run. Main CI39150404209 for6cf4 is SUCCESS.

Fresh integrated browser runs passed30 greeting cases/six switch-backs/30 PATCHs
and48 parent-link activations/six URL-history matrices. Actual new wordmark/tagline
and taller sticky header inspected in screenshots; checks measure current header
geometry. Main also inspected VI320 unbroken screenshot. No runner/product fix
or retry needed in these integrated runs. Separate picker overflow persists.

Local implementation, verification, review and docs are complete. Await scoped
PR creation, remote CI and coordinator review/merge; no self-merge. Plan/index
status cannot be updated by unavailable ak CLI; no closed-index claim.

## PR28 footer-base integration - 2026-10-19

Documentation commit07265f60a0fdb00f168b8698417b8b14f308ab43 was pushed and draft
PR28 created. The pre-push fetch still showed pinned main6cf4, but the immediate
post-create live check showed main05872f40b2f8c4c6b90ad18263dd8c8ee11d1d33 and
CONFLICTING. Work stopped without chasing main. Coordinator then explicitly
authorized this pinned normal merge, keeping greeting separate from cover PR25.

One targeted fetch made05872 available; no additional fetch or shared-ref retry.
Merge3fcbe569954b77e913e5efdf0a6f0c0dfd253563 changed no greeting production code.
Only docs/03-feature-inventory.md conflicted. Resolution keeps greeting and
footer sections, with exact incoming inventory content otherwise unchanged.

Fresh checks on3fcbe56, all first-pass exit0:

- Focused command: `npm test -w client -- --maxWorkers=1` followed by the eight
  explicit files mapChildGreeting, parentStageLinks, kidsHeaderBranding, i18n,
  childStore, childJourneys, parentDashboard and nextLessonNavigation under
  client/src/test (their existing .test.ts/.test.tsx names). Result76/76:
  previous75 plus childStore1. The npm output did not forward maxWorkers to
  this focused invocation; no single-worker execution claim is made.
- Full command: `npm exec --workspace client -- vitest run --maxWorkers=1`:
  425 tests across44 files passed, including all22 inherited footer cases.
- `npm run typecheck`, `npm run build`, `npm run lint`: all passed. Lint0 errors,
  100 inherited warnings. Existing ParentRecordingsPage act warning remains;
  no failing test, retry, skipped test, timeout change or production fix here.
- Backend/server/package/lock inputs still match bf865, so525 backend results
  remain reused preintegration evidence, not a new backend run.

Browser evidence is deliberately reused from ce72d9a, not rerun: the complete
client diff contains only unmounted PublicLayout/LandingPage, footer tests and
two new unused footer keys per dictionary. Remaining client files, both runners,
package/lock and all pre-existing translations are unchanged. This includes
map/parent dashboard, KidsLayout/picker/guards/stores, index.css/index.html and
Tailwind/Vite config. New landing scroll-mt-24 is scoped to its absent heading;
no claim that compiled CSS bytes are identical. Detailed equivalence reasoning
and retained limitations are in browser-evidence.md. No new screenshot claim.

Only the browser evidence, PR body and this journal change after verification.
PR28 stays draft for exact-head CI/coordinator review. No self-merge, force-push,
main push, other-worktree edit, audio change or manual deployment.
