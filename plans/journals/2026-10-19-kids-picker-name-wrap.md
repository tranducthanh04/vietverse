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

- Current refinement still changes only three KidsLayout class lines: option
  `flex-wrap gap-x-2 gap-y-1`, name
  `min-w-0 flex-[1_1_6rem] whitespace-normal break-words` and points
  `shrink-0 ml-auto`. Points can move below/right-aligned rather than force a
  very narrow name column. The initial column-only fix and its follow-up RED
  are preserved as historical evidence below.
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

## Three-profile occlusion RED and refined layout

- Historical checks at `4c7f4d9`, before the latest CSS refinement: focused
  61 tests in 7 files; full frontend 421 in 44 files; typecheck/build pass;
  lint zero errors and 100 warnings. The initial column fix passed 32 browser
  cases, but these results do not establish the refined layout is correct.
- Additional three-profile RED in VI/EN at width 320: menu y=142..783;
  fixed nav top=706 at height 844 and 762 at height 900. The third option was
  partly covered and Add Child hidden; actual hit testing still failed after
  scrollIntoView. Main agent viewed the RED evidence in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-ejQrPD`.
- That original three-profile run raised a Node assertion failure, but its
  PowerShell cleanup wrapper masked the process failure with exit 0. The
  assertion/geometry establish RED; the wrapper exit is not a passing test.
  The documented command now captures LASTEXITCODE immediately after Node,
  cleans up in finally, then throws on a nonzero captured exit code.
- Root refined the same three class lines to permit flex wrapping and use a
  6rem name basis with right-aligned nonshrinking points. Full names remain
  intact; points may use the next row. No trigger, handler, API/name-limit,
  selection, points, Parent Gate, audio/F04 or production behavior changes.
- Fresh tests and browser coverage for this refinement are in progress. No
  final GREEN claim is made yet, and historical pass counts are not reused as
  proof that the third option and Add Child are now visible/hittable.

## Refined three-profile browser GREEN (remaining gates pending)

- Final CSS hash for this handoff:
  `54f0da74a5d30e845e55986a68676911fd6f55772972633b7a6edbf15332f041`.
  The four VI/EN 320x844/900 cases pass: menu height=341/bottom=483 against
  fixed-nav top=706/762; third option y=336..416 and Add Child y=429..473 are
  exposed and actual hit tests return true.
- Real mouse and Tab/Enter validate the third-profile PATCH for child c and
  Add Child's `/bat-dau` destination. This is a destination fixture, not actual
  onboarding-form acceptance. Main agent inspected the GREEN screenshot.
  Evidence: `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-j77YED`.
- Two separate harness modes are required from repository root:
  `node plans/261019-kids-picker-name-wrap/browser-smoke.mjs` for the normal
  32-case matrix with SMOKE_THREE_PROFILES unset; set SMOKE_THREE_PROFILES=1
  for the four-case three-profile mode, then unset it. Exact PowerShell commands
  are recorded in `docs/kids-picker-name-wrap.md`.
- This records tester evidence, not additional runs by this writer.
  Remaining fresh normal-matrix/full/regression gates are still in progress;
  do not combine historical pass counts into a claim that all checks are done.
