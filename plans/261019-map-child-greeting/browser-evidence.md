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

## Integrated PR23 header verification

After the normal pinned-main merge, both unchanged browser runners were executed
fresh on HEAD `ce72d9aa5cb9f4c47364abd71030202d0220a1a4`, base
`6cf4ce52724867be75b733c741c5cb72a0b823b5`. The starting worktree was clean.
Runs started approximately00:39:30 Asia/Saigon on2026-10-19. This section is new
integration evidence, not reuse of the old-header screenshots above.

- Greeting runner exit0:30 greeting cases, six switch-backs and30 real local
  picker PATCH selections, VI/EN at320/640/1366px. All exact-text, literal-markup,
  stale-name, wrapping/clipping, six44px navigation target, horizontal-overflow
  and map-control/header/bottom-clearance assertions passed. No console errors,
  page errors or unexpected requests. No runner edits or retries were needed.
- Existing parent-stage runner exit0:48 parent-link activations and six complete
  URL/history matrices on the new KidsLayout. All locked/empty/direct/reload/
  Back/Forward/invalid-ID/child-mismatch and layout assertions passed.
- Greeting screenshots (30 full-page plus two picker):
  `C:/Users/Asus/AppData/Local/Temp/vietverse-map-child-greeting-1cAaIS`.
- Stage-link screenshots:
  `C:/Users/Asus/AppData/Local/Temp/vietverse-parent-stage-links-X0FkSP`.
- Visually inspected VI320 unbroken, EN640 max-valid and EN1366 spaced greeting
  captures. Each shows the actual VIETVERSE wordmark and translated tagline,
  alongside the real child picker, language controls, points and parent control.
  The taller header occupies approximately206px,134px and90px respectively in
  these screenshots (visual pixel estimates, not logged DOM metrics). At320px
  the branding, child picker and secondary controls occupy separate rows; at
  640px the branding is above the control row; at1366px they share one row.
- Crucially, both runners measure the actual header bounding rectangle during
  geometry assertions, rather than assuming an old fixed height. Greeting text
  stays below its bottom; every main control remains reachable and hit-testable
  between that header and the fixed bottom navigation after scrolling. Full-page
  composites are not used to infer control exposure.
- The separate baseline picker finding remains:30-character name exceeds its
  button by53.53px. New desktop branding shifts absolute right edges to718.53px
  (text) and665px (button);320/640px values are unchanged. It is still outside
  the button but within the viewport. No picker or other production edits made.

These checks use the same synthetic auth/local API/font-only boundary and retain
all limitations listed above. They establish the integrated header/map fixture,
not production auth, physical-device, screen-reader, audio or deployment
acceptance. Both owned browser/server processes closed normally. Only this
report was edited after the integration runs; the runner source is unchanged.
