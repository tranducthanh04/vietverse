# PARENT-STAGE-LINKS - 2026-10-18

## Scope and decisions

Coordinator assigned customer audit 5.8/F10 / completion plan step 5. Worktree
and branch are separate from PR #17 (which received its requested base sync).
Only stage navigation is addressed, not vocabulary/competency/learning points.
Audio/F04 remains excluded. Current behavior owner: docs/parent-stage-links.md.

Parent stage cards lacked navigation; QuestMap stored only a local selected
order, so direct links/history could not select a stage. Links now encode stage
ID and displayed child ID. Assumption: childId is a context check, never a profile
selector. Wrong/stale links cannot choose or fetch another child. Locked stages
can show details, but lesson actions still require server isUnlocked. Empty
stages show 0/0, not the old fabricated 0/4. Existing route guards stay intact.

## Evidence on a8014eec base

- TDD: 20 new tests failed before implementation at the missing link/URL/state
  behavior; all 20 passed afterwards. Test copy was corrected to existing
  labels before the repeated RED run. Three asynchronous refetch assertions
  initially ran before React Query notified React; changed them to wait for
  observable output, not timers or weakened expectations.
- Focused suite: 51 tests passed (new stage links, parent dashboard, child
  journeys and next-lesson navigation).
- Full npm test: 497 backend + 339 frontend passed. Existing audioPlayback
  act warning remains. No audio edits or claim that intermittent F04 is fixed.
- Root typecheck/build passed. Lint passed with 100 existing warnings/0 errors;
  three old QuestMap any annotations were replaced by its response type.
- Chrome: 48 parent-link activations and six URL/history matrices passed:
  VI/EN at 320/640/1366px, click/Tab/Enter, complete/open/locked/empty, direct
  load/reload/Back/Forward, invalid stage and mismatched child. Real component,
  CSS/font and map guards; synthetic session/data, no production requests.
  Six screenshots retained. No page overflow in the checked cases.

## Integration and independent review

- Integrated main 8ac98f9c2c7fe288630f6f688042599d8fdaa589 without conflicts:
  363 client tests, client typecheck/build, lint (0 errors/100 warnings),
  48 browser link activations and six URL/history matrices passed.
- Integrated main 142209912c4711f1d50eeb44ae2dbfb316217eba after Landing PR #17
  merged. One docs/06-review-findings.md conflict: retained both independent
  follow-up entries. No stage implementation changes during integration.
- Final integration run: all 386 client tests (40 files), root typecheck/build,
  lint (0 errors/100 existing warnings) and the same 48 browser activations +
  six matrices passed. Refreshed the six screenshots from that browser run.
- Server and root package-lock.json are byte-identical to the earlier 497-test
  backend run; backend tests were not repeated for this frontend-only merge.
  Existing audioPlayback act warning remains; F04 is still not fixed.
- Independent reviewer inspected implementation, tests, runner/docs and three
  representative screenshots; independently ran 51 focused tests, all passed.
  No actionable findings or worthwhile simplifier changes. Reviewer did not
  independently rerun the full suite/browser matrix.
- Landing PR #17 updated head affc1f34a4590bd2ced819026185b15153a0b989 was
  independently verified with green CI/previews and merged by the coordinator
  as 142209912c4711f1d50eeb44ae2dbfb316217eba. Not self-merged here.

## PR #19 integration verification

- Normally merged main `01cfa0591feb9bf0015821f19e9f256259544732` into
  `codex/parent-stage-links`, producing merge commit
  `f232a2489766477093cce7f724c19cba747fe9f4`, without conflicts or history rewrite.
  Six-link kids navigation, responsive bottom clearance and both documentation
  entries remain present. No stage-selection/authorization semantics changed.
- Previous browser fixture mounted QuestMap without KidsLayout, so its passing
  evidence did not cover the fixed navigation integration. The owned runner now
  mounts real KidsLayout inside the existing auth/child guards. ParentDashboard
  still has a plain main wrapper, not ParentLayout; authentication/API data are
  synthetic local fixtures, not production acceptance.
- Initial browser launch failed because port 5197 was occupied; no assertions
  ran. The runner now requests an ephemeral loopback port and preserves its
  request-origin allowlist. No unrelated process was stopped.
- Expanded browser assertions then failed twice on the long VI stage-4 tab at
  320px: x=15.825, width=311.194, right=327.019, with header bottom=130 and bottom
  navigation top=762. This was a real oversized selector, not a fixed-nav
  overlap. Presentation-only fix caps tab width, wraps labels, preserves icon
  size and removes active scaling. No label shortening or hidden-overflow fix.
- Fresh post-fix focused tests: 51/51. Full client: 389/389 in 41 files. Root
  typecheck and build pass. Root lint: 0 errors, 100 existing warnings. Existing
  audioPlayback act warning remains. No unit-test failures were suppressed.
- Browser GREEN: 48 parent-link click/keyboard activations plus six URL/history
  matrices, VI/EN at 320/640/1366px. Each run asserts all six navigation links,
  non-overlapping 44px-minimum targets, every visible map control's bounds and
  center hit target after scrolling, and last-control clearance at maximum
  scroll. Locked/empty/invalid/child-mismatch states remain covered.
- Twelve screenshots retained in the owned task directory, including six new
  `*-map-layout.png` images. Inspected VI320 and EN1366 map images: lesson action
  clears navigation. Full-page screenshots preserve the sticky header at its
  captured scrolled position; they are not top-of-page layout captures.
- `git diff a8014eec01182ea85dd999253b9ced3b91165bd3 HEAD -- server package-lock.json package.json`
  is empty; no working changes touch these inputs. Reuse the earlier 497 backend
  evidence only, without claiming a fresh backend run or closing F04. No CI rerun
  was requested to mask recording-finalize flakiness.

## Remaining gates after integration

Scoped PR CI and coordinator review/merge. Production authentication, Parent
Gate expiry and real-device acceptance remain outside local fixture evidence.
No self-merge/deploy/data migration.
CLI ak unavailable: local journal fallback; plan index/status not claimed
updated. AgentWiki publish skipped.
