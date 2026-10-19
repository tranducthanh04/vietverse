# Kids picker: wrap valid long names

Date: 2026-10-19, Asia/Saigon (UTC+7).
Task: KIDS-PICKER-NAME-WRAP.
Base: `6cf4ce52724867be75b733c741c5cb72a0b823b5`.
Worktree: `C:/Users/Asus/.codex/worktrees/kids-picker-name-wrap/codeDuAN`.

Current status: RESUME-PICKER-PR29 local integration is verified at `4b0071d`,
base `4a6b0a1`. Fresh94 focused/482 full frontend and32+4 browser cases pass;
root types/build and lint pass. The final section supersedes the historical
local-only/quota restriction. PR29 remains Draft for exact-head CI/previews and
coordinator review. No author merge or manual deployment is authorized.

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

## Refined CSS checkpoint before main integration

- Tester completed the refined-CSS checks on `4c7f4d9` plus its working CSS
  diff, hash `54f0da74a5d30e845e55986a68676911fd6f55772972633b7a6edbf15332f041`.
  That checkpoint was subsequently committed as `a8f258a`.
- Fresh checkpoint checks pass: focused 61 tests/7 files, full frontend
  421 tests/44 files, root typecheck/build for server and client, and lint
  zero errors/100 warnings. These are refined-CSS results, distinct from the
  earlier column-only checks with the same suite counts.
- Browser checkpoint results pass: picker normal matrix 32; three-profile mode
  four; branding 32; branding breakpoint eight; parent-stage map 48 link cases
  plus six URL/history matrices. Evidence directories under
  `C:/Users/Asus/AppData/Local/Temp/`:
  `vietverse-picker-name-Bnqezc`, `vietverse-picker-name-j77YED`,
  `vietverse-kids-brand-B1lBHC`, `vietverse-kids-brand-Ft7O3R`,
  `vietverse-parent-stage-links-WwY7wb`.
- Coordinator then normally merged pinned main (including PR #28), base
  `2c055f28da748ad18dccd0e5256ebd8bcc397a4b`, producing integration HEAD
  `44d6d7ef634b9bf60dc842d92ef4d05bace65fda`. The additive docs/03 conflict
  retains both picker and map-child-greeting entries. Picker CSS hash is
  unchanged; this is not a claim that all integration checks are finished.
- Fresh final integration tests, including the new greeting, are underway.
  Current pending sections remain pending until that tester handoff arrives;
  no final integrated pass, CI, merge-to-main or deployment claim is made here.

## Final integration verification (2026-10-19)

- Tested HEAD: `44d6d7ef634b9bf60dc842d92ef4d05bace65fda`;
  base: `2c055f28da748ad18dccd0e5256ebd8bcc397a4b`. This identifies the tested
  integration, not the final documentation-only commit that may follow.
- Tester reports all fresh commands exit 0: focused 70 tests/8 files, full
  frontend 430/45 files, root npm typecheck/build for server and client, lint
  zero errors/100 warnings. Existing nonfatal audioPlayback.test.tsx act warning
  remains unchanged; no local full backend/F04 suite is claimed.
- Fresh picker normal 32 and three-profile four pass, with artifacts in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-F7Dg01` and
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-UwZnux`.
  Main independently checked both JSON reports: exact tested head, CSS hash
  `54f0da74a5d30e845e55986a68676911fd6f55772972633b7a6edbf15332f041`,
  zero violations; main also viewed the fresh UwZnux screenshot.
- Fresh parent-stage regression: 48 activations plus six history matrices,
  `C:/Users/Asus/AppData/Local/Temp/vietverse-parent-stage-links-bliQGX`.
  Fresh greeting regression: 30 cases, six switchbacks and 30 PATCH calls,
  `C:/Users/Asus/AppData/Local/Temp/vietverse-map-child-greeting-Y7mQWO`.
- Header branding 32 in `vietverse-kids-brand-B1lBHC` and breakpoint eight in
  `vietverse-kids-brand-Ft7O3R` are reused from the checkpoint with identical
  inputs/CSS hash, not rerun after integration. Those directories are under
  `C:/Users/Asus/AppData/Local/Temp/`.
- Incoming greeting's five-profile/120-character fixtures are stress coverage,
  not new profile quota or name-limit policy. Valid max30/three-profile picker
  acceptance passes its four cases; Add Child validates the destination fixture,
  not the real onboarding form.
- Final integration reviewer reports no actionable findings. All results in this
  entry are tester/main/reviewer handoff, not extra runs by the journal writer.
  Ordinary PR CI is pending. No merge-to-main, deployment, production mutation,
  shared-plan closure or audio/F04 change is claimed.

### Reproducible commands

From `client/`, focused then full frontend (run separately and inspect exit codes):

```powershell
node ../node_modules/vitest/vitest.mjs run --maxWorkers=1 src/test/kidsPickerNameWrap.test.tsx src/test/childStore.test.ts src/test/childJourneys.test.tsx src/test/kidsHeaderBranding.test.tsx src/test/kidsPointsNavigation.test.tsx src/test/kidsCoursesNavigation.test.tsx src/test/parentStageLinks.test.tsx src/test/mapChildGreeting.test.tsx
node ../node_modules/vitest/vitest.mjs run --maxWorkers=1
```

From repository root, run each independently and inspect its exit status:

```powershell
npm run typecheck
npm run build
npm run lint
node plans/261019-kids-picker-name-wrap/browser-smoke.mjs
node plans/261018-parent-stage-links/browser-smoke.mjs
node plans/261019-map-child-greeting/browser-smoke.mjs
```

Normal picker mode requires SMOKE_THREE_PROFILES unset. Run its additional mode
with SMOKE_THREE_PROFILES=1 using the exit-code-preserving PowerShell block in
`docs/kids-picker-name-wrap.md`; capture Node LASTEXITCODE before cleanup and
propagate nonzero, so cleanup cannot turn a failing assertion into apparent pass.

## PR29 external quota HOLD and local main integration

- Coordinator reports remote PR #29 at
  `cf135525beeeb827b01aa25e03125c4d158d7cf4`, Draft/HOLD. At 2026-10-19
  01:24:44 Asia/Saigon, FE Vercel reported
  `Deployment rate limited - retry in 24 hours`. BE preview is SUCCESS; no
  GitHub Actions run exists yet for the conflicting PR at this handoff.
  This external deployment gate is not a reproduced CSS or F04 defect.
- Only one local normal merge was authorized: pinned main
  `40282b502149ed2682870eb55960ea3474fa4d8a` after PR #25 into the picker branch.
  Local resulting HEAD is `820b7329667a61a11267279d454475d3e4d6211f`.
  Additive docs/03 and docs/06 conflicts retained the complete picker and cover
  sections; greeting was preserved. No cover implementation is edited here.
- Historical checkpoint before the latest verification section: remote remained
  the older head and this local integration had not been pushed; fresh
  focused/full/typecheck/build/lint were running. Do not record planned
  suite counts as passes or reuse historical `44d6d7e` counts for this head.
  Browser reuse requires proven identical relevant inputs before it is claimed.
- No push until quota gate verification/authorization; no retry-for-green,
  paid upgrade, manual deployment or dummy commit to bypass the provider limit.
  Documentation-only checkpoint/commit remains with the coordinator later.
- This update modifies only the four owned picker docs/journal, not shared plan,
  cover source, audio/F04 or production. No commit/push by this writer.

## Latest local verification while PR29 remains HOLD

- Tested local HEAD: `820b7329667a61a11267279d454475d3e4d6211f`;
  base: `40282b502149ed2682870eb55960ea3474fa4d8a`. Tester reports fresh exit 0
  for focused 100 tests/9 files, full frontend 460/46 files, root typecheck/build
  (server and client), lint zero errors/100 warnings and diff-check. This is not
  a final documentation-only commit hash. No local backend/F04 test run claimed.
- Latest focused reproduction uses the earlier eight-file command plus
  `src/test/coverPlaceholder.test.tsx` (client working directory), producing
  the 100-test/nine-file scope. The earlier 70-test command remains historical;
  full frontend/typecheck/build/lint commands are unchanged.
- No browser scripts were rerun on this local head. Reuse is explicitly from
  original artifacts: picker32 F7Dg01/three-profile4 UwZnux, stage48+6 bliQGX,
  greeting30+6/30PATCH Y7mQWO at `44d6d7e`; header32 B1lBHC/boundary8 Ft7O3R
  from the earlier `4c7f4d9` plus refined working CSS checkpoint. Exact paths
  and original results remain in the prior entries; artifact heads are unchanged.
- Tester generated global CSS with PostCSS/Tailwind/autoprefixer for old
  `44d6d7e` and current inputs: both 102484 bytes, identical SHA256
  `2a7cc3dd8590df7e676911a1635cbe8df42c80d7476c7d9928cd6a7763c01306`.
  Post-build CSS remained exactly equal to pre-build in both comparisons:
  FormFields SHA256
  `7df7752aab425a7beefa76792d0f456efa135442981254ffcefc9ec22ec2e59f`,
  index SHA256
  `058f5d7ef137ac0475b2db8f8119df12e4270e3b2d3a4a1bd0fb791704d107a3`.
- Main independently checked current dist CSS and KidsLayout hashes against the
  recorded values and confirmed they match.
- Relevant transitive imports have zero changes: picker27/header30/stage35/
  greeting31 modules. Reviewer independently confirmed no CoverPlaceholder or
  application-router import in these fixture mounts; components, stores,
  dictionaries/assets, config, fonts, locked dependencies and four harnesses
  are unchanged. This establishes reuse for those fixtures, not a fresh run or
  acceptance of arbitrary live pages. The source/name/quota/onboarding/stress
  limitations from earlier entries remain in force.
- Final reviewer reports no actionable findings; cover and greeting remain
  identical to base. Results and reuse proof are tester/reviewer handoff, not
  additional executions by the documentation writer.
- Remote PR29 still points to `cf135525beeeb827b01aa25e03125c4d158d7cf4`,
  Draft/HOLD: FE preview 24-hour quota, BE preview success, no GHA run for the
  conflicting PR at the reported state. Fresh local success does not satisfy
  those remote gates. No push/merge until quota verification/authorization;
  no retry, paid upgrade, manual deployment or dummy commit to evade it.
- A final docs-only commit may follow under coordinator ownership. This writer
  edits only the four owned documentation files; no commit/push/deploy or shared
  plan, cover source, audio/F04 or production change.

## RESUME-PICKER-PR29 - fresh integration, 2026-10-19

### Scope, provenance and safety

- Resumed after the user's new request to finish delivery, as narrowed by the
  coordinator to this one picker task. Sources: audit5.2, plan6, consolidated
  RESPONSIVE, the accepted picker docs/history. Read AGENTS/docs README,
  relevant child/auth/architecture/API rules, all review findings, shared plan,
  full customer audit and consolidated QA. These remain separate from business
  decisions about R01, points, language, grading, PIN/email or F04.
- Shared `D:/ki9/codeDuAN` was inspected read-only: HEAD35c51ca,402 deleted,
  eight modified and19 untracked entries. No restore/reset/stash/stage/switch/
  pull/overwrite there. Old picker location was not recreated or restored.
- New managed worktree:
  `C:/Users/Asus/.codex/worktrees/resume-picker-pr29/codeDuAN`, new branch
  `codex/resume-picker-pr29`. Clean start at accepted
  `1d3485ed3cd476c4ef0f83907e228953913f0d9e`; remote PR29 head
  `cf135525beeeb827b01aa25e03125c4d158d7cf4` verified ancestor.
- Normal merge `ecbad05` includes main
  `4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66`, no conflicts. Both additive
  docs03/06 entries retained; no unrelated documentation cleanup. Current-main
  branding/greeting/navigation/auth/audio remain intact. Diff from main has
  exactly the three accepted CSS class-line changes as its only product edit.
- Harness-only commit `4b0071d1e5d3c92822fddbcff589ed3956766c53` pins source
  hashes, keeps an immutable source copy/receipt, forces the synthetic API URL,
  uses envFile:false/own cache/strict loopback listener, and denies requests
  except intercepted children GET/select PATCH, local GET and public font GET.
  Vite resolves requested port0 to5173 on this version; receipts record the
  actual exclusively owned port, and it is no longer listening after cleanup.
- PR30 changes to api/authStore were read in full. This fixture injects a
  synthetic user and mounts guards/KidsLayout, not App.fetchMe; children and
  selection remain real store transitions against intercepted responses.
  It does not prove login, cookie/bootstrap, backend ownership, or onboarding.
  Focused authGateLifecycle/googleSignIn regression covers adapter behavior.
- Reused installed locked dependencies through ignored junctions, with a new
  client cache. Both lockfiles hash
  `9a1c45fa0446f731bc593a1a9d644141e0659be33e6bb8481b6ad1509a33643f`.
  No dependencies installed/updated; no package, lock, env or config file edited.
  No real dotenv files exist in this new checkout (examples only).

### Fresh commands and results

All commands ran sequentially on the tested4b0071d implementation, Node22.15.0,
Vitest3.2.7. Later documentation-only changes do not modify the tested inputs.
Raw log directory:
`C:/Users/Asus/AppData/Local/Temp/vietverse-resume-picker-pr29-20261019-1010`.

| Check | Result | Raw output |
| --- | --- | --- |
| Focused Vitest, one worker/no file parallelism |94/94;10 files;exit0|focused.log/json|
| Full frontend, one worker/no file parallelism |482/482;48 files;exit0|full-client.log/json|
| npm run typecheck (root) |server+client exit0|typecheck.log|
| npm run build (root) |server+client exit0|build.log|
| First npm run lint |exit2 before source lint: missing @eslint/js|lint.log|
| npm run lint after restoring client-local package links |exit0;0 errors/99 warnings|lint-after-client-links.log|
| Normal picker browser |32/32;exit0|browser-normal.log|
| Three-profile browser |4/4;exit0|browser-three.log|
| node --check browser-smoke.mjs; git diff --check |exit0|tool execution receipt|

Focused command, from client/:
`node ../node_modules/vitest/vitest.mjs run --maxWorkers=1 --no-file-parallelism src/test/kidsPickerNameWrap.test.tsx src/test/childStore.test.ts src/test/childJourneys.test.tsx src/test/kidsHeaderBranding.test.tsx src/test/kidsPointsNavigation.test.tsx src/test/kidsCoursesNavigation.test.tsx src/test/parentStageLinks.test.tsx src/test/mapChildGreeting.test.tsx src/test/authGateLifecycle.test.ts src/test/googleSignIn.test.tsx`.
Both Vitest commands also used default+JSON reporters and an absolute outputFile
in the raw directory. Full run uses the same flags without file selectors.
Root types/build/lint are unchanged npm scripts. Browser commands are the two
modes documented above; PowerShell propagates LASTEXITCODE, including failure.

Lint diagnosis: root-only dependency junction exposed ESLint10.11.0 while
client config imports client-local @eslint/js. The installed client tree has
ESLint9.39.5. Linked its existing packages/.bin into the new ignored client
node_modules, leaving both caches private. The corrected lint ran once; no
source assertion was weakened. The initial failure is retained, not erased.
The full-suite audioPlayback act warning remains unchanged and nonfatal.
No new targeted audio/F04 or local backend test suite was run.

### Fresh browser acceptance and review

- Normal:10:15:25-10:15:56 Asia/Saigon,32 cases, VI/EN x320/390/640/1366 x
  zero/1234567890 points xspaced/unbroken30. Artifact directory
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-FdqG67`.
- Three profiles:10:16:08-10:16:15,4 cases, VI/EN x320x844/900. Directory
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-RPJlb2`.
- All name/points ranges stay in options without clipping/overlap, options
  are at least44px; Escape/outside focus and trigger ellipsis stay unchanged.
 32-case run performs128 synthetic select PATCHes. Four-case run performs8
  PATCHes and validates both mouse/Tab-Enter navigation to `/bat-dau`.
- Three-profile menu bottom483, last option336..416, Add Child429..473,
  fixed nav top706/762. Both last and Add hit-tests are true after scrolling;
  actual mouse/keyboard interactions pass. This is a destination fixture,
  not actual account/quota enforcement or the onboarding form.
- Zero page exceptions, zero console errors and zero unexpected requests in
  both receipts. Real Be Vietnam Pro font loaded, no fallback-font acceptance.
  Browser/Vite cleanup true; fresh port checks found no owned listener.
- Viewed VI320 large/unbroken, VI320x844 three-profile and EN1366 spaced
  screenshots. No additional product defect found in this bounded review.
  Product hash remains
  `54f0da74a5d30e845e55986a68676911fd6f55772972633b7a6edbf15332f041`.
- Existing historical RED/results and all other QA folders remain unchanged.
  No subagents used in this resumed task. This is author review, not a new
  independent approval; coordinator owns independent review/merge/postchecks.
  No whole-web, production, real-device, WCAG or audio/F04 acceptance claim.
- Only an ordinary fast-forward push to existing PR29 is permitted after
  fresh remote-ancestor verification; no duplicate PR, force push, direct-main,
  self/auto-merge, manual deploy or quota workaround. Exact-head remote CI and
  previews remain the next gate. R01 stays held pending coordinator release.
- AgentKit CLI is unavailable; native Git/runner/Markdown fallback used.
  No plan-index closure. AgentWiki publish skipped.
