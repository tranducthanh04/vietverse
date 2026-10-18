# Long child names in the profile picker

Date: 2026-10-19. Task: KIDS-PICKER-NAME-WRAP. Status: PR #29 Draft/HOLD due
to external FE Vercel deployment quota. Latest local checks pass at
`820b7329667a61a11267279d454475d3e4d6211f`/base
`40282b502149ed2682870eb55960ea3474fa4d8a`. Remote and local heads differ as
detailed below; local success is not remote CI or a merge/deploy claim.

## Current remote and local gate

- Remote PR #29 head: `cf135525beeeb827b01aa25e03125c4d158d7cf4`.
  FE Vercel reported `Deployment rate limited - retry in 24 hours` at
  2026-10-19 01:24:44 Asia/Saigon. BE preview succeeded; GitHub Actions has not
  run for the conflicting PR at this update. This is not a CSS or F04 failure.
- Coordinator authorized one local normal merge of pinned main
  `40282b502149ed2682870eb55960ea3474fa4d8a` (after PR #25), producing local
  `820b7329667a61a11267279d454475d3e4d6211f`. Additive docs conflicts preserve
  both picker and cover entries; greeting remains intact and both incoming
  features match base. Fresh local checks exit 0: focused 100 tests/9 files,
  full frontend 460/46 files, root typecheck/build for server and client,
  lint zero errors/100 warnings and diff-check. Final reviewer has no findings.
- No push until the quota gate is verified/authorized. No automatic retry,
  upgrade/payment, manual deployment or dummy commit to bypass the limit.
  No new browser run was performed at this head. Reuse of the historical
  picker32+4/header32+8/stage48+6/greeting30+6+30PATCH evidence is supported by
  identical transitive fixture imports, config/fonts/locked dependencies and
  harnesses, plus byte-identical generated global CSS (102484 bytes, SHA256
  `2a7cc3dd8590df7e676911a1635cbe8df42c80d7476c7d9928cd6a7763c01306`).
  Fixtures do not import CoverPlaceholder or the application router. Full proof
  and unchanged artifact provenance are recorded in the journal; no artifact
  head is rewritten to make the old run look fresh.

## Finding and source trace

- Coordinator found the dropdown overflow in MAP-CHILD-GREETING screenshots.
  It is a UI/header follow-up to shared audit section 5.2 and completion-plan
  step 6, not a new child-profile business requirement. The shared audit/plan
  and PR23 branding journal were read without changing them.
- Real Chrome with actual CSS/font, VI at 320px, and the valid 30-character name
  `abcdefghijabcdefghijabcdefghij`: button horizontal bounds 22..210px;
  name text range 34..263.53125px (53.53125px outside); points right edge
  283.140625px (73.140625px outside). `pageOverflow=false` despite the defect.
- Before-fix evidence:
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-aM3ecc/vi-320-0-unbroken.png`
  and `geometry.json` in that directory. Browser RED exited 1.
- `server/src/modules/children/children.validation.ts` allows names up to 30
  characters on create/update. Both unbroken and spaced test names have exactly
  30 characters. The older 31-character branding fixture is legacy/stress data,
  not an example of a name accepted by the current API.
- Follow-up RED at `4c7f4d9`: with three profiles, the initial narrow name-column
  fix makes the menu extend from y=142 to 783. At 320x844 the fixed nav starts
  at y=706; at 320x900 it starts at y=762 (VI/EN cases). The third option is
  partly covered and Add Child is obscured. Actual hit tests remain false after
  scrollIntoView. Main agent viewed the RED evidence in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-ejQrPD`.

## Behavior and presentation assumptions

- Actor: an authenticated family opening the existing child picker. Opening or
  dismissing it must not select a child or change points. Selecting an option
  still uses the existing child ID/API and closes the dropdown.
- Presentation choice: wrap the complete name within its option instead of
  shortening it, hiding overflow or changing the stored name. Only three class
  lines change: option uses `flex-wrap gap-x-2 gap-y-1`, name uses
  `min-w-0 flex-[1_1_6rem] whitespace-normal break-words`, and points use
  `shrink-0 ml-auto`. Points may move to a separate right-aligned row instead
  of forcing the name into a very narrow, excessively tall column. This is not
  a new name-length rule or permission to hide text/controls.
- Trigger and event handlers remain unchanged. Escape closes and restores
  trigger focus; outside dismissal preserves focus on the clicked control.
- Preserve minimum 44px option targets, brand/tagline, navigation, points link,
  child selection, VI/EN, admin control and Parent Gate. Do not redesign the
  customer avatar menu or change the trigger's existing display truncation.
- No API/model/store/auth/audio/F04/Parent Gate/menu-avatar/grading or production
  change. No new behavior is inferred from the unrelated branding/parent work.

## Verification boundaries

The browser results and 70/430 suite counts in this section identify historical
`44d6d7e`, not fresh runs at `820b7329`. Latest local outcomes and reuse evidence
are in the current-gate section above; artifact provenance remains unchanged.

- Five component tests passed before the fix: complete names/balances in VI/EN,
  selection of both names, Escape/outside dismissal and no incidental mutation.
  They characterize behavior; jsdom does not measure layout, so this is not a
  claim of unit RED/GREEN. Real-CSS browser geometry is the defect reproducer.
- The initial component command ran from the wrong root and failed setup before
  any tests ran; rerunning from the client directory produced five passes.
- Before this refinement, the original column fix passed the 32-case matrix;
  at `4c7f4d9`, focused 61 tests/7 files, full frontend 421/44 files,
  typecheck/build and lint (0 errors/100 warnings) passed. These historical
  checks did not catch three-profile occlusion and do not verify the new CSS.
- Refined-layout diagnostic passes four VI/EN 320x844/900 cases: menu height
  341/bottom 483; last option y=336..416 and Add Child y=429..473 stay above nav
  y=706/762, with true hit tests. Mouse and Tab/Enter select the third profile
  through its PATCH and reach `/bat-dau` for Add Child. This uses a destination
  fixture and does not exercise the actual onboarding form. Main agent viewed
  the fresh integrated screenshot in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-UwZnux`.
- Fresh integrated checks all exit 0: focused 70 tests/8 files, full frontend
  430/45 files, root typecheck/build (server and client), lint 0 errors/100
  warnings. Picker passes 32 normal cases plus four three-profile cases;
  parent-stage passes 48 activations/six history matrices; greeting passes
  30 cases/six switchbacks/30 PATCH calls. Main independently checked the picker
  32+4 JSON heads/hashes with zero violations. Final integration review found
  no actionable findings. No local backend/F04 suite was run; the existing
  nonfatal audioPlayback act warning remains unchanged.
- Branding 32 and breakpoint eight reuse pre-integration evidence for identical
  inputs/CSS hash; these are not fresh post-merge runs. Greeting's five-profile,
  120-character stress fixtures are not current business acceptance: this fix's
  valid max30/three-profile acceptance is the four-case picker mode.
- Evidence directories and commands are in the
  [journal](../plans/journals/2026-10-19-kids-picker-name-wrap.md). CI remains a
  separate pending gate; no final documentation-commit hash is asserted here.
- Browser fixtures use synthetic profiles/network data; real devices and
  production are separate acceptance gates. No merge/deployment is claimed.
- Rollback is a scoped three-class-line revert with no schema/data migration.

## Browser harness modes

Run from the repository root. With `SMOKE_THREE_PROFILES` unset, the normal mode
checks 32 cases:

```powershell
node plans/261019-kids-picker-name-wrap/browser-smoke.mjs
```

The additional mode checks four three-profile cases (VI/EN at 320x844/900):

```powershell
$env:SMOKE_THREE_PROFILES = '1'
$pickerExitCode = 0
try {
  node plans/261019-kids-picker-name-wrap/browser-smoke.mjs
  $pickerExitCode = $LASTEXITCODE
} finally {
  Remove-Item Env:SMOKE_THREE_PROFILES
}
if ($pickerExitCode -ne 0) {
  throw "Picker browser checks failed with exit code $pickerExitCode"
}
```

Both modes passed on the tested integration HEAD recorded above. Runtime paths
follow the harness configuration; a later commit/head needs its own CI status.
