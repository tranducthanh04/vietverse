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

## Remaining gates

Integrate latest main safely, rerun affected checks, independent review and
scoped PR handoff to coordinator. No self-merge/deploy/data migration.
CLI ak unavailable: local journal fallback; plan index/status not claimed
updated. AgentWiki publish skipped.
