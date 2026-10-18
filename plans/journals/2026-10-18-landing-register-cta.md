# LANDING-REGISTER-CTA - 2026-10-18

## Scope and cause

Coordinator assigned audit section 5.1 / completion plan step 6 to this chat.
The three Landing buttons sent guests into protected routes, which redirected
them to login instead of registration. Work is isolated from the other chats
and PR #15; audio/F04 and CoverPlaceholder are explicitly excluded.

## Implementation and evidence

- Landing subscribes to the existing auth store. Guests navigate to `/dang-ky`;
  known users retain hero/final `/bat-dau` and map `/kham-pha`.
- Assumption: temporarily disable the native buttons with `aria-busy` while
  bootstrap has no user. No auth/store/guard/API changes or new dependencies.
- TDD: 13/20 tests failed at the expected guest/login and bootstrap boundaries;
  all 20 passed after the minimal change. Independent review found no actionable
  issues. Three additional known-user recheck cases now pass: 23/23 focused.
- On baseline c7519c0, `npm test` passed 497 server + 337 client tests. Existing
  `audioPlayback.test.tsx` emitted an act warning; no test failure. The baseline
  F04 recording race remains known and is not fixed by this passing run.
- `npm run typecheck`, `npm run build`: passed. Initial test typing used an
  unsupported Testing Library `exact` option; removed it (string role names
  already match exactly), then reran checks successfully.
- `npm run lint`: exit 0, 103 existing warnings, no errors.
- Browser: 72 real Chrome navigations passed, VI/EN at 320/640/1366px, all three
  CTAs, guest/parent, mouse and Tab/Enter. Real CSS and loaded font; checked bounds,
  text clipping, focus-visible and destination. Four final-CTA screenshots saved.
  The fixture initially blocked Google Fonts; explicitly allowed only those
  public font hosts, kept the loaded-font assertion, and reran successfully.
- Browser uses synthetic auth state and destination probes with real guards;
  not a production registration/login journey or complete page-layout audit.

## Handoff

Remote main advanced to a8014ee (PR #16 points link) during verification.
Merged that baseline without conflicts. Post-merge checks passed: 342 client
tests, client typecheck/build, lint (same 103 warnings/zero errors), and all 72
browser navigations. Server and lockfile inputs are byte-identical to the
497-test server run; no server changes were introduced. The final independent
review/simplifier pass found no actionable issue or useful simplification and
independently reran all 23 focused tests. Final screenshots use the merged base.
No self-merge, production writes, deployment or audio work. Coordinator owns
review/merge; CI must be checked at the exact head SHA before acceptance.

AgentKit CLI unavailable: local Markdown journal fallback; no plan index/status
claim. AgentWiki publish skipped. Durable behavior belongs to
`docs/landing-register-cta.md`, not this journal.
