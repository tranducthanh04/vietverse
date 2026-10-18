# COVER-FALLBACK-SAFE

## Scope and root cause

Coordinator assigned this baseline UI finding under completion plan6/audit5.6-5.7.
Separate branch codex/cover-placeholder-safe; base main
5baf9172029c9f1276697e918e2a345c4723ea07. CI39147316014 success was verified
before worktree creation. No changes mixed into PR15/21/22 or the shared checkout.

CoverPlaceholder indexed ordinary variant objects using external strings. For
constructor, toString, __proto__ and hasOwnProperty, it selected inherited values
instead of fallback; destructuring produced undefined Icon and React threw:
"Element type is invalid: expected a string (for built-in components) or a
class/function (for composite components) but got: undefined."
The newly exercised condition is legacy category/type input without coverImage,
not a new enum requirement. CultureArticle.category is a plain string. Affected
callers are CulturePage, CultureDetailPage, StoriesPage and StoryDetailPage.

## Implementation and RED/GREEN

- Added 30 tests before changing production code. Initial run: ten failures,
  twenty passes and two uncaught render errors from the real culture routes.
  Eight failures cover inherited keys across both kinds; two cover API-backed
  culture list/detail with category=constructor and no cover. Error is the same
  React exception, not test setup or a type error. No console/error suppression.
- Minimal fix: choose the kind's variant table, then require an own property with
  Object.prototype.hasOwnProperty.call before indexing; otherwise use fallback.
  ES2020-compatible; no new dependency, coercion, category or image replacement.
- Post-fix focused suite: 71/71 (30 new cover tests +10 presentation +31 support
  translation tests). All twelve known icon/palette choices, both kind fallbacks,
  className/aria-hidden and supplied cover-image rendering are covered.
- Root typecheck/build passed; lint passed with 0 errors/100 existing warnings.
- Full root test and browser verification are recorded in the final section.

## Decisions, deviations and delegation

Technical bug fix only, no policy or business assumptions changed. Unknown and
missing values retain existing kind-specific fallback. No taxonomy/API/model,
store/rights/points/grading, audio/TTS/assets or production-data changes.
F04 recording-finalize and F13 model/runtime translation work remain separate.

Main agent owns diagnosis, tests, fix, docs and full verification. Existing
review_admin_fix subagent owns only the browser runner/screenshots and independent
review. Existing review_source_capture subagent handles priority PR22 integration
in its own worktree; it does not change this implementation. Git packaging is
delegated separately after verification. No self-merge.

pull-before-code uses the explicitly assigned verified main base; repository has
no dev branch. ak CLI is unavailable; local journal/plan fallback, no plan-index
completion claimed. AgentWiki publish skipped. Dependencies use existing root
and nested client node_modules through local junctions, no package/lock changes.

## Initial local verification on 5baf917

- Full root npm test, started 00:02:28 Asia/Saigon on 19 October: 497/497 backend
  tests in 51 files, 419/419 frontend tests in 42 files, exit0. Local temporary
  MongoDB only. Existing audioPlayback React act warning remains unchanged.
- recordingFinalize23 tests passed this run, but that does not fix/close F04 or
  override failures on other PRs. No tests skipped, weakened or rerun for green.
- Server/package/dependency files are unchanged from the verified main base.
- Final browser runner passed 48 list-to-detail activations plus 12 legacy reloads
  across VI/EN at 320/640/1366px. Uses real guest AdaptiveContentLayout/PublicLayout,
  components, CSS and fonts. Verifies constructor fallbacks for both kinds, known
  dong_dao/tet variants, supplied image decoding, click/Tab/Enter/Back/reload,
  no page errors, page overflow or unexpected/non-GET requests.
- First browser run passed; repeated after removing unused runner metadata, also
  passed. Six representative screenshots retained. All 24 final originals remain
  in C:/Users/Asus/AppData/Local/Temp/vietverse-cover-fallback-KGuKgt; 18 redundant
  copied screenshots were removed from the task folder, not their originals.
- Main agent inspected VI320 culture detail and EN1366 story list images and read
  the final runner. Independent review found no actionable issue in code/tests.
  Existing unknown-story Poem badge is unchanged; separate PR15 remains HOLD.
- Browser limits: synthetic guest/API data, Chrome desktop viewport emulation;
  no authenticated kids flow, production/physical devices, audio playback/provider,
  mutations or taxonomy acceptance. No runtime behavior beyond cover lookup changed.
- node --check and git diff --check passed; pre-package fetch still main5baf917.

## Integration of auth PR #20

- The pre-publish fetch detected main moving to
  `53a447a369fed0d69b455749a053b694a159a753`. Packaging stopped before staging;
  the coordinator explicitly authorized a normal merge of that pinned commit.
- Checkpoint `1cfe243f722570b299c3e388652f313a2a988329` contains the scoped
  cover change. Merge `09777417db46c7fd87d7916d9230321c799062d0` incorporates
  pinned main without rewriting history. Conflicts only at the top of docs/03
  and docs/06 were resolved by retaining both cover and auth sections. Comparison
  against pinned main retains exactly the 14 owned cover files, no auth delta.
- Read the incoming auth contract, architecture/API notes and review findings:
  transactions, strict no-grace reuse and unknown-commit limitations remain
  unchanged by this cover task. No auth code was modified during integration.
- Fresh focused suite: 71/71. Root typecheck/build pass; lint 0 errors and 100
  existing warnings. One fresh full root npm test after the merge passed with
  exit0: backend 511/511 in 52 files (started 00:10:30 Asia/Saigon on 19 October,
  182.52s), frontend 419/419 in 42 files (started 00:13:35, 26.76s). No failures.
  Existing audioPlayback React act warning remains. recordingFinalize23 passed,
  but F04 remains unresolved; no rerun-for-green, skipped or weakened tests.
- Main CI39148207625 completed successfully on exact pinned base
  53a447a369fed0d69b455749a053b694a159a753 before publication.
- Browser evidence is reused, not claimed rerun after the merge:
  `git diff --exit-code 1cfe243 HEAD -- client package.json package-lock.json`
  returns 0 with no diff. The incoming 5baf917-to-53a447a range also has no client
  or package/lock changes. All browser inputs, including the cover fix, match
  the final 48-activation/12-reload run. The fixture is guest/local HTTP data,
  so it does not establish auth-rotation browser acceptance.
- Server and package/lock files match pinned main exactly. No skipped tests,
  retries-for-green, force push, amend, stash, self-merge or deploy.

## Remaining gates

Scoped PR CI and coordinator review. Real-device/production
acceptance is not implied by local fixture testing. No new owner policy choice
or credentials are needed for this fix; publishing/merging stays with coordinator.

## Integration of source22, header23 and footer24 - 2026-10-19

Coordinator requested a separate PR25 gate after footer24 merged. Normal merge
9aeb349145e77bc8524f89bce7c172a542536212 incorporates pinned main
05872f40b2f8c4c6b90ad18263dd8c8ee11d1d33 into the cover branch. Conflicts were
only at the top of docs/03 and docs/06; all cover/header/footer/source/auth notes
are preserved. Shared checkout untouched; no greeting28 or audio work mixed in.
Main CI39151137720 on05872 completed SUCCESS.

Production CoverPlaceholder and all30 regression tests are byte-identical to
prior head852349f2dadc5e80f65f9dc2ee3bc2a6c0090be6. Against new main, production
delta remains only the own-key lookup. Source22 is inherited unchanged and is
capture/parser/report only, not runtime translation/importer/publication work.
Header23 and footer24 change browser inputs, so old screenshots cannot establish
new layout coverage. They remain historical artifacts, not overwritten evidence.

Fresh local verification on9aeb349:

- Focused cover/presentation/translations/header/footer:98/98 tests passed.
- Full frontend:446/446 tests across44 files passed, exit0. Existing act warning
  from audioPlayback remains; no skipped/weakened tests or reruns for green.
- Root typecheck and build passed; lint passed with0 errors/100 existing warnings.
  Fresh browser results are recorded separately after execution.
- Backend/package/lock inputs match bf8651572678ff0f37acc02bca4e57efd940759e
  exactly (empty git diff). Main agent's same-session full root run in the
  greeting worktree at that baseline passed525 backend tests across53 files.
  That unchanged-input evidence is reused; this is not a new backend execution
  in the cover worktree. No F04 fix/closure is inferred.

Browser delegate owns only the expanded local runner and browser evidence.
It checks both guest public/footer and authenticated KidsLayout/header via real
AdaptiveContentLayout/ChildSessionGuard, using synthetic state and intercepted
HTTP only. Existing auto-explored story POSTs in the authenticated view must be
fulfilled locally with exact synthetic IDs, never forwarded to a backend. No
production account/data/point mutation is performed or accepted by this test.

### Final integration evidence

- Expanded browser runner completed exit0:96 activations (48 guest,48 kids),
  24 reloads, VI/EN320/640/1366; known/legacy/image paths, click/Tab/Enter/back,
  actual branding/footer and header/fixed-nav clearance all pass. No overflow,
  console/page errors or unexpected requests.30 synthetic story-explored POSTs
  fulfilled in memory, zero forwarded writes. Actual kids header heights206/134/90px.
- New66 screenshots in local temp vietverse-cover-fallback-yq12Hg; historical
  tracked images retained unchanged. Main read full final runner/report and
  inspected kids-VI320 culture detail. Details in the browser evidence report.
- Initial expanded browser run failed before any activation: CSS home-link
  selector matched wordmark and hidden Home nav. DOM strict-mode evidence
  identified both; using unique accessible brand name fixed the harness, not
  the product. Corrected complete run passed without assertion weakening.
- Independent reviewer verified scoped production/tests and incoming base
  preservation, ran30 cover tests and script syntax check successfully.
  Conditional simplifier reviewed the >200-line runner: no worthwhile changes.
- No further production edits since9aeb349; integration evidence/runner/docs
  additions only. Scope remains separate from greeting28 and picker wrapping.
  Await exact-head remote CI and coordinator review/merge; no self-merge.
