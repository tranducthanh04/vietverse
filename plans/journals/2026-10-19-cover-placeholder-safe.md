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

## Final local verification

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

## Remaining gates

Scoped PR CI and coordinator review. Real-device/production
acceptance is not implied by local fixture testing. No new owner policy choice
or credentials are needed for this fix; publishing/merging stays with coordinator.
