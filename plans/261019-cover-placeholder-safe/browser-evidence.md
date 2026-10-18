# COVER25 integrated browser evidence

Date:2026-10-19, Asia/Saigon. Fresh verification on merge HEAD
`9aeb349145e77bc8524f89bce7c172a542536212`, pinned main
`05872f40b2f8c4c6b90ad18263dd8c8ee11d1d33` (source22/header23/footer24).
CoverPlaceholder and its regression test are byte-identical to prior published
head `852349f2dadc5e80f65f9dc2ee3bc2a6c0090be6`; this run exercises the newer
surrounding layouts, not a new production fallback implementation.

Worker owns only browser-smoke.mjs and this report. No product/backend changes,
commits, pushes, deployment or production requests were made by this worker.
Existing tracked screenshots and prior journal evidence remain historical and
were not overwritten.

## Final execution

Command: `node plans/261019-cover-placeholder-safe/browser-smoke.mjs`.
Corrected full run completed exit0 around00:57. Runner SHA256:
`C058686E1DCEE0727C508CF188D1E986A7D80EEE2BBBE19973379863E8A2844E`.
Node syntax check and diff whitespace check pass.

Both actual AdaptiveContentLayout branches were exercised:

- Guest -> real PublicLayout, including current footer24.
- Fictional authenticated parent -> real ChildSessionGuard -> real KidsLayout,
  including header23, screen-time wrapper and six-link fixed navigation. The
  guard fetches the synthetic child over intercepted local GET /children; the
  fixture does not replace the guard or preload an active child.

Each mode covers VI/EN x320/640/1366px (height900), story/culture list and detail:

- Constructor/legacy values without covers retain BookOpen/Compass fallback.
- Known dong_dao/tet variants retain Music/Gift icons.
- Supplied data-URL SVG covers stay images and decode with naturalWidth400;
  fallback markup is absent for covered items. No external image host needed.
- 96 list-to-detail activations total:48 guest +48 kids. Legacy cards use both
  click and actual Tab/Enter with visible focus; known/covered cards use click.
- 24 legacy detail reloads:12 per mode. Browser Back returns to each real list
  route and its cover is checked again. All requested detail APIs were observed.
- Real Be Vietnam Pro fonts load. No page overflow, console errors, page errors
  or unexpected network requests across all12 mode/language/width matrices.
- Relevant list cards pass full bounds and center hit testing after scrolling.
  Detail back control passes bounds/hit testing; whole detail cover passes
  header/bottom clearance. The fixed/sticky header's actual rectangle is used,
  not a hardcoded height. Kids last-content bottom clearance is checked at
  maximum scroll for each legacy list/detail capture.

## Integrated header/footer checks

- Actual home brand link is visible and retains `/`. Visible header controls
  are >=44px and inside viewport bounds.
- Kids brand accessible name is VIETVERSE; complete existing VI/EN tagline
  renders with text Range bounds inside its element, no clipping.
- Kids navigation retains exactly `/kham-pha`, `/gia`, `/kho-truyen`, `/van-hoa`,
  `/diem-thuong`, `/phong-bau-vat`, with >=44px targets, no overlap, all within
  viewport and fixed bottom bounds. Kids branch correctly has no public footer.
- Guest footer has all six internal links in order: `/`, `/kham-pha`,
  `/#lo-trinh-hoc-tap`, `/gia`, `/kho-truyen`, `/van-hoa`. Link heights >=44px and
  horizontal bounds pass; existing email/tel destinations are preserved. This
  cover run checks footer integration/rendered links, not their destination-page
  navigation or roadmap focus behavior.

Observed header heights, identical for VI/EN:

| Width | Public header | Kids header |
| --- | --- | --- |
| 320 | 81px | 206px |
| 640 | 81px | 134px |
| 1366 | 81px | 90px |

Public tagline remains hidden at these widths by the existing public responsive
rules; the newly integrated kids tagline is visible at every tested width.

## Request boundary

All real components and the real API client run against local intercepted HTTP
responses. A fictional auth user is installed into the real auth store; no
login, refresh cookie, real account or credentials are used.

- Guests perform GET-only fixture traffic, plus allowed Google font GETs.
- Kids GETs include the real child guard's /children request. The existing
  StoryDetail mount effect issues POST /stories/:id/explored for an active child.
  The coordinator authorized intercepting these exact synthetic story paths
  with the expected synthetic childId:15 per language,30 total. Each response is
  fulfilled in memory, never forwarded or persisted. The runner explicitly
  awaits each expected exploration response, including reloads.
- Every other non-GET and every unexpected origin/API path is rejected and
  causes a recorded assertion failure. No backend/production mutation occurs.
  Fixture audio URLs and quizzes are absent; audio controls are not activated.

Do not describe the complete authenticated run as GET-only: it intentionally
observes30 existing client POST effects with zero forwarded writes.

## Harness failure retained

The first expanded run failed before any activation because selecting the brand
as header a[href="/"] matched both the wordmark and Home navigation link.
Playwright reported a strict-mode violation, identifying both DOM elements;
the hidden desktop link is still included by that CSS locator. This was a
fixture-selector defect, not a cover/layout failure.

Changed only the brand selector to its unique accessible name beginning
VIETVERSE, and kept the `/` assertion. No test was skipped or weakened, no
arbitrary sleep or product adjustment was used. The next complete run passed
all96 activations/24 reloads. Failure capture remains at
`C:/Users/Asus/AppData/Local/Temp/vietverse-cover-fallback-2XLzUC/failure.png`.

The runner also replaces the legacy Vite port0 setting (which defaults to5173)
with an explicitly resolved free loopback port and strict binding. This is the
previously proven local-runner isolation fix, not a product change.

## Screenshots and review

Final directory contains66 images (48 list/detail,12 header,6 footer):
`C:/Users/Asus/AppData/Local/Temp/vietverse-cover-fallback-yq12Hg`.
Viewed kids-VI320 culture detail, kids-EN1366 story list, guest-EN320 footer and
kids-EN640 header. They show the fallback icons, all three story cover modes,
full kids branding and all six footer links. They contain only synthetic child
and content data plus already-public footer contact text.

Footer element screenshots can include the fixed header at a composite capture
position; they are not used to infer scroll visibility. Similarly, a detail
capture centers the cover after independently testing the back control, so the
back control need not be visible in that final screenshot.

Reviewed full original runner, actual layout/guard/detail components, cover fix,
and header/footer contracts before expansion. No actionable new product finding
was observed in this scoped run. Existing unknown-story -> Poem taxonomy badge
is unchanged and remains outside this cover fix; no taxonomy acceptance implied.

Limits: Chrome desktop viewport emulation and synthetic authenticated fixture,
not physical devices, production authentication/session rotation, DB/server
authorization, actual exploration persistence, audio/provider, quiz/points,
Parent Gate, screen-time expiry, WCAG/axe or screen-reader acceptance. Full footer
navigation and source22 runtime mapping are not re-certified here. F04/audio,
F13 and other unrelated findings remain open. Owned browser/server closed
normally at completion. No tracked historical images were modified.

## Greeting28 integration: evidence reuse, not a new browser run

Normal merge9721db492f016c842b57002fd6cf4d17126c595b incorporates reviewed main
2c055f28da748ad18dccd0e5256ebd8bcc397a4b. The96 activations/24 reloads above
were executed on9aeb349, not on9721db4; no new screenshots are claimed.

The entire client delta from that browser-tested revision is QuestMapPage plus
its new unit-test file. The cover fixture mounts only story/culture list/detail
under AdaptiveContentLayout, selecting PublicLayout or ChildSessionGuard and
KidsLayout. It does not import the app router or mount QuestMapPage. All mounted
sources, imports, guards, stores, dictionaries, assets, index.html/index.css,
Tailwind/PostCSS/Vite configuration and package/lock inputs remain byte-identical.
The runner, synthetic data, request interception and viewport matrix are unchanged;
runner SHA256 remains
C058686E1DCEE0727C508CF188D1E986A7D80EEE2BBBE19973379863E8A2844E.
The final expanded runner was tested as a working file on9aeb349 and committed
in57b34; equality refers to that tested hash, not the older runner blob at9aeb349.

Tailwind scans the new map source even though the fixture does not mount it.
The added [overflow-wrap:anywhere] utility targets only that exact class, found
only on the absent greeting paragraph. Other added classes already exist in the
application. No global style or CSS configuration changed; generated CSS is not
claimed byte-identical. Thus the new scoped rule does not change mounted cover,
header or footer geometry, and the prior browser evidence is reused explicitly.
Fresh integrated unit/full-frontend/typecheck/build/lint results are recorded in
the journal. All synthetic-auth and production/physical-device limits above remain.
Independent read-only review confirmed the mounted-input comparison and compiled
the added utility to verify it emits only its exact class selector, no global rule.
