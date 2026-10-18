# Landing registration CTAs - 2026-10-18

## Contract

Source: customer-docs full audit 2026-10-18, section 5.1; completion plan step 6.
Task ID: LANDING-REGISTER-CTA. This change covers only the three main Landing
buttons, not the discovery cards, header or other public links.

**Business decision from the assigned customer requirement:** guests should
reach registration directly, without a detour through protected routes/login.
Authenticated visitors keep their existing destinations:

| Button | Guest | Authenticated |
| --- | --- | --- |
| Hero | `/dang-ky` | `/bat-dau` |
| Treasure map | `/dang-ky` | `/kham-pha` |
| Final CTA | `/dang-ky` | `/bat-dau` |

**Implementation assumption:** a null user while session restoration is pending
is not yet a confirmed guest. The three native buttons are temporarily disabled
and expose `aria-busy` until restoration resolves. A known user retains access
to the original route during a session recheck; its existing guard still waits
for authentication. The subscribed store state also handles logout while Landing
is open. No new authentication request, timeout or session policy is introduced.

VI/EN copy, styling, focus behavior, discovery links (`/kho-truyen`, `/kham-pha`,
`/van-hoa`) and contact links stay unchanged. Registration, onboarding, child,
screen-time and Parent Gate guards are unchanged. No API, data, role, points,
subscription, payment or audio changes.

## Verification

- Real Landing + MemoryRouter + auth store + ProtectedRoute tests cover guests,
  signed-in users, bootstrap success/failure, logout, recheck and preserved links.
- TDD: initial 20 tests produced 13 expected failures (guests reached Login and
  bootstrap buttons were not disabled), then 20 passed. Added three recheck
  characterization cases after review.
- Local Chrome with real component, CSS and loaded Be Vietnam Pro font passed
  72 navigations: VI/EN, 320/640/1366px, guest/parent, all three CTAs, mouse and
  Tab/Enter. Assertions check button bounds, minimum 44px height, text clipping,
  focus-visible and destination. Four screenshots are in
  `plans/261018-landing-register-cta/`.
- Browser command: `node plans/261018-landing-register-cta/browser-smoke.mjs`.
  Optional `PLAYWRIGHT_MODULE` and `CHROME_PATH` override the local runtime paths.
  The script closes its browser/server and puts new screenshots in an OS temp folder.

Limits: browser sessions and destination pages are local fixtures; no real
registration, backend session, production data or physical-device acceptance.
This is not a page-wide layout audit. A passing local backend suite does not
resolve the known intermittent recording-finalize race (F04), which is outside
this task. See the task journal for final full-suite results and review handoff.

Rollback: revert this scoped change through the normal PR process; no data
migration or backfill is needed.
