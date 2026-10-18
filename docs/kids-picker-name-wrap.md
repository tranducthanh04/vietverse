# Long child names in the profile picker

Date: 2026-10-19. Task: KIDS-PICKER-NAME-WRAP. Status: local CSS fix,
post-fix browser/full verification pending at this update.

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

## Behavior and presentation assumptions

- Actor: an authenticated family opening the existing child picker. Opening or
  dismissing it must not select a child or change points. Selecting an option
  still uses the existing child ID/API and closes the dropdown.
- Presentation choice: wrap the complete name within its option instead of
  shortening it, hiding overflow or changing the stored name. Only three class
  lines change: add `gap-2` to the option, use
  `min-w-0 flex-1 whitespace-normal break-words` for the name and `shrink-0`
  for the points. This is not a new name-length rule.
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
- The 32-case browser matrix, branding/map regressions and full checks are
  pending. Results belong in the [journal](../plans/journals/2026-10-19-kids-picker-name-wrap.md),
  not inferred from pre-fix component passes or page-overflow checks alone.
- Browser fixtures use synthetic profiles/network data; real devices and
  production are separate acceptance gates. No merge/deployment is claimed.
- Rollback is a scoped three-class-line revert with no schema/data migration.
