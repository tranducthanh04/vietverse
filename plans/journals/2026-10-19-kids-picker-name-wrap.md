# Kids picker: wrap valid long names

Date: 2026-10-19, Asia/Saigon (UTC+7).
Task: KIDS-PICKER-NAME-WRAP.
Base: `6cf4ce52724867be75b733c741c5cb72a0b823b5`.
Worktree: `C:/Users/Asus/.codex/worktrees/kids-picker-name-wrap/codeDuAN`.

## Context and finding

- Read AGENTS, docs README, child business/API rules, review findings, shared
  customer audit section 5.2, completion plan step 6 and PR23 branding journal.
  Shared files were read-only and remain untouched by this task.
- MAP-CHILD-GREETING screenshots led to a distinct picker-name overflow finding.
  This task's tester reproduced it with real Chrome/CSS/font on the baseline at
  320px/VI using exactly 30 unbroken characters, within the current API limit.
- Geometry: button x=22..210; text range x=34..263.53125, exceeding the right
  boundary by 53.53125px; points right=283.140625, exceeding it by 73.140625px.
  Page overflow was false. Checking the document width alone misses this bug.
- Browser RED exited 1. Evidence directory:
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-aM3ecc`, including
  `vi-320-0-unbroken.png` and `geometry.json`. The journal writer inspected the
  geometry record; the browser execution result is the tester handoff. The
  main agent also inspected the before/after screenshots.

## Scoped repair and unchanged behavior

- Only three KidsLayout class lines change: option gap-2, a shrinking/wrapping
  name span (`min-w-0 flex-1 whitespace-normal break-words`) and nonshrinking
  points (`shrink-0`). Full names wrap rather than being hidden or rewritten.
- Wrapping and spacing are presentation assumptions. API maximum 30 is
  unchanged; spaced and unbroken acceptance names are both exactly 30.
  Existing 31-character branding data is a legacy/stress fixture above API max,
  not the basis for claiming a valid-name defect.
- No handler/trigger change. Opening/closing does not mutate child or points;
  selection stays on the existing API. Escape restores trigger focus, whereas
  clicking outside preserves focus at the clicked control.
- Branding/nav/points, VI/EN/admin, Parent Gate and existing avatar behavior are
  preserved. No API/model/store/auth/audio/F04/grading or production changes.

## Verification status

- Five component tests passed before the product fix and are characterization
  coverage, not unit RED. The initial invocation from the wrong root failed
  setup with no tests executed; client-directory invocation then passed 5/5.
- The real-browser pre-fix geometry assertion is the RED reproducer. Post-fix
  32-case browser matrix, branding/map regressions and full checks are currently
  running/pending; no post-fix pass result is asserted here.
- No existing warning, historical PR23 count or unrelated test result substitutes
  for verification of this branch. Browser fixtures/geometry do not establish
  production or physical-device acceptance.
- Owning docs are docs/03-feature-inventory.md, docs/06-review-findings.md and
  docs/kids-picker-name-wrap.md plus this journal. No shared plan/status edits,
  commit, push, merge, deploy or production action by this documentation task.
- AgentKit CLI remains unavailable; evidence is local Markdown. Whole-plan
  completion is not claimed. AgentWiki publish skipped.

## Verification setup and browser progression

- First post-fix geometry passed, but an outside-click fixture check timed out:
  its spacing utility lived only in a virtual module outside Tailwind scanning,
  so the fixture's outside control sat behind the menu. Replaced only synthetic
  content spacing with an inline style; no product styles or assertions changed.
  Failure artifacts remain in temp `vietverse-picker-name-VTJT7K`.
- The corrected harness passed all 32 cases; screenshots and geometry are in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-rABQXg`. At VI/320/large
  points, unbroken name text right=74.06 and points left=85.19, within option
  right=210. Fixed-width menu makes large-balance names wrap to six/eight lines;
  full text remains visible. This is a presentation tradeoff, not truncation.
- Initial `npm ci` was downloading the optional approximately 600 MB Windows
  MongoDB binary in postinstall. The main agent stopped only its verified owned
  postinstall process to avoid requiring that download for local UI checks.
  Buffered output showed download progress, so this was not a proven deadlock.
  Install exited nonzero and npm cleanup removed dependencies; an intervening
  focused-test launch failed MODULE_NOT_FOUND before running tests.
- A standalone MongoDB rebuild was insufficient to restore removed packages.
  Reinstalled the full locked dependency tree with process-local
  `MONGOMS_DISABLE_POSTINSTALL=1 npm ci --no-audit --no-fund`: exit 0, 742 packages.
  The variable was removed afterward; no package/lockfile/config/CI change.
  This skips optional install-time binary download, not a test or assertion.
- All remaining checks and a new picker browser run use the repaired complete
  environment. Full CI still uses its ordinary project checks; F04 failures
  must remain HOLD without retry-for-green or audio repair.
