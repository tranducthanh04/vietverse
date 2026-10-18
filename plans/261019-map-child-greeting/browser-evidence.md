# MAP-CHILD-GREETING browser evidence

Date: 2026-10-19, Asia/Saigon. Base:
`bf8651572678ff0f37acc02bca4e57efd940759e`.
Tested the coordinator's uncommitted QuestMapPage greeting change on this base.
Worker owned only browser-smoke.mjs and this report; no production edits/commit.

## Final observed results

`node plans/261019-map-child-greeting/browser-smoke.mjs` completed exit0 at
approximately 00:35. VI/EN x 320/640/1366px, viewport height900:

- 30 greeting cases: short An, long spaced name, 120-character unbroken name,
  markup-like name, and a 30-character unbroken name at the API maximum.
- Six switch-backs; 30 actual KidsLayout child-picker selections issued matching
  local PATCH /children/:id/select calls through the real child store/API adapter.
  Exact full-name option targeting, returned greeting and PATCH sequence asserted.
- Exact translated greeting, one unchanged h1, greeting immediately before h1,
  full literal text with no child HTML elements or name-script execution.
- Previous child's greeting absent after each selection. Browser real guards
  fetch profiles before rendering; no custom substitute guard/layout/picker.
- Text Range bounds remain inside paragraph and clipping ancestors; greeting
  stays below sticky header and above h1. No horizontal page overflow after
  selection, including both long-name stress cases.
- All six actual navigation links retain their hrefs, >=44px hit targets,
  viewport bounds and non-overlap. Main controls can scroll clear of the header
  and fixed navigation, pass center-point hit testing, and the final control
  clears the bottom bar at maximum scroll.
- Real CSS/fonts loaded. No console errors, page errors or unexpected requests.
  Only loopback fixture GET/PATCH and public Google font GET requests allowed.

Final screenshots: 30 full-page greeting captures plus two baseline picker
captures, all synthetic data, outside the repository:
`C:/Users/Asus/AppData/Local/Temp/vietverse-map-child-greeting-w8b2fh`.
Viewed final VI320 max-valid and EN320 baseline-picker captures. Also viewed
initial passing VI320 unbroken, EN320 markup and EN1366 spaced captures under
`C:/Users/Asus/AppData/Local/Temp/vietverse-map-child-greeting-9Iijrc`.
Full-page screenshots show a fixed navigation bar at its viewport position;
control clearance is separately asserted after scrolling, not inferred from
the full-page composite.

## Existing map regression

Ran unchanged `node plans/261018-parent-stage-links/browser-smoke.mjs` once:
exit0, 48 parent-link activations plus six URL/history matrices, both languages
and all three widths. Covers locked/empty, direct/reload/Back/Forward, invalid
stage and child mismatch, six-link navigation and map-control clearance.
Screenshots: `C:/Users/Asus/AppData/Local/Temp/vietverse-parent-stage-links-LdARlF`.
That legacy runner uses Vite's default5173 despite specifying port0; it completed
successfully, and its owned browser/server were closed.

## Harness failures and corrections (not hidden)

1. Initial simultaneous launch failed before browser assertions because Vite
   treats port0 as default5173, already held by the parent-stage runner. The new
   runner now asks a temporary loopback TCP listener for a free port, closes it,
   then gives that explicit port to Vite with strictPort. No process was killed
   and no product behavior was changed. The first four-name run then passed24
   cases, six switch-backs and24 PATCH selections.
2. Added the API-valid30-character case and picker diagnostics. Both worker and
   coordinator runs timed out waiting for that child's PATCH after selecting
   with a case-insensitive substring locator. Live DOM evidence in the corrected
   run shows old locator matches2 options: first is the120-character stress
   name, while the exact30-character target is the other option. This selected
   the wrong child; the app did not owe the expected PATCH. Replaced substring
   plus first() with getByText(name,{exact:true}), asserting exactly one option
   and its full span text before clicking. Final logs preserve SELECTOR_AUDIT
   evidence (old2/exact1) for each language/width. The final complete30-case run
   passed; no product change, sleeps, skipped tests or failure suppression.

## Separate pre-existing picker finding

The valid30-character unbroken name exceeds the dropdown button's right edge
by53.53px in both languages at all three widths:

| Width | Text right | Button right | Outside viewport |
| --- | --- | --- | --- |
| 320 | 263.53 | 210 | No |
| 640 | 267.53 | 214 | No |
| 1366 | 422.53 | 369 | No |

This is the existing KidsLayout dropdown (its name span has no wrap constraint),
not the new greeting. Longer stress names can extend farther; this report does
not claim the open picker has no overflow. The normal closed header deliberately
truncates its name, while the new greeting remains fully visible. No shared
picker/header code was changed. Coordinator should track picker wrapping as a
separate issue; greeting acceptance does not close it.

## Independent source review and limits

Inspected the complete greeting production diff, nine regression tests, real
guards/store, translator, existing VI/EN copy and task contract. No actionable
finding in the scoped greeting change: it reads current activeChild directly,
uses text interpolation, preserves null/error/mismatch branches and the h1,
and does not introduce requests or modify stage/navigation/permission behavior.

The web-testing skill guided real integration components, request allowlisting,
geometry evidence and cleanup; code-review/verification skills constrained the
review to observed changes and fresh results. Node syntax check passed.

Fictional auth user is installed in the real store; local HTTP responses are
intercepted fixtures. No login/refresh cookie/real DB, production data, physical
device, screen-reader/axe, audio, payment, Parent Gate or screen-time-limit
acceptance is claimed. The spaced120-ish/unbroken120/markup stress names exceed
the API30-character write limit and represent defensive rendering, not newly
allowed profile data. No backend/model/API rule was loosened. Auth account
switch/rename/null assertions are coordinator unit coverage, not browser flows
claimed here. F04/audio and other unrelated findings remain open.
