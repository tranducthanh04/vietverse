# Long child names in the profile picker

Date: 2026-10-19. Task: KIDS-PICKER-NAME-WRAP. Status: CSS refinement passes
four three-profile browser cases; remaining fresh full/regression gates pending.

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
  screenshots in `C:/Users/Asus/AppData/Local/Temp/vietverse-picker-name-j77YED`.
- Remaining fresh full/regression gates are pending. Results belong in the
  [journal](../plans/journals/2026-10-19-kids-picker-name-wrap.md); normal wrapping
  and multi-profile occlusion are distinct harness modes, both required.
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

The commands describe how to verify; they are not a claim both modes have been
rerun on the latest CSS. Runtime paths follow the harness configuration.
