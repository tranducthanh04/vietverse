# KIDS-COURSES-NAV - 2026-10-18

## Scope and baseline

- Customer audit section 5.2 / completion plan step 6, assigned by coordinator after owner authorized non-audio backlog implementation.
- Isolated branch `codex/kids-courses-nav`; started from verified `a8014eec`, fast-forwarded before implementation to remote main `8ac98f9c2c7fe288630f6f688042599d8fdaa589` (includes PR14). Shared checkout and prior PR worktrees untouched.
- Add `Khóa học` / `Courses` to existing `/gia`, retain five prior links. No route, store, API, pricing, checkout, subscription, points or audio changes.
- Presentation assumptions and acceptance are in [the owning document](../../docs/kids-courses-navigation.md). The narrow-screen two-row layout and 400px breakpoint are implementation choices, not newly approved business rules.

## Evidence and corrections

- RED: all 3 new component tests failed because the course link did not exist. Real-browser baseline failed at VI/320px: 5 rather than 6 links and overlapping link rectangles.
- GREEN: 50 focused tests passed (courses, points navigation, i18n, child journeys, auth/gate lifecycle and pricing).
- Build initially caught unsupported Testing Library `getByRole` option `exact`; removed it (string names already match exactly). Subsequent client build and typecheck passed.
- First post-change browser run passed 10 viewport/language combinations, then reported last-content coverage at VI/1366px. A diagnostic run passed without product changes. The route focus hook runs as a passive effect after URL commit and can scroll main into view; the fixture now explicitly waits for main focus after each route change before scrolling and measuring. No layout assertion was removed or weakened.
- Final navigation browser run passed 12 combinations: VI/EN x 320/390/399/400/640/1366px, five active destinations each (60 geometry samples). Includes six complete labels/hit areas, no overlap/horizontal overflow, last-content clearance, click and Tab/Enter into real PricingPage, points link, Parent Gate challenge/verify. Real application font loaded, zero page errors or unexpected API requests. Local screenshot directory: `vietverse-kids-courses-7AF4yQ` under the OS temporary directory. Inspected narrow VI layout and EN breakpoint keyboard focus screenshots.
- Existing points-browser script also passed all 16 combinations with this navigation: VI/EN x 320/390/640/1366px x zero/long balance, real PointsShopPage and guards, header geometry and focus. Screenshots: OS temporary directory `vietverse-kids-points-IHxMw7`.
- `npm test`: 497/497 backend (51 files) and 346/346 frontend (39 files), exit 0. The existing audioPlayback `act()` warning remains. This passing run does not resolve the known F04 finalize race; it remains deferred.
- `npm run build -w client`, `npm run typecheck -w client`: passed. Client lint: 0 errors, 103 pre-existing warnings. `git diff --check`: passed.
- Independent read-only reviewer `/root/review_kids_points` found no actionable issues and independently ran 8/8 courses/points component tests. It reviewed source, tests, docs and browser assertions; full-suite/browser execution belongs to the main agent.
- Conditional simplify review (nine deliverable files) by `/root/review_parent_settings`: clean, no useful simplification and no edits; existing nav renderer/route/icon/i18n are already reused. Git packaging is delegated to `/root/git_manager` under the git workflow; primary verifies the resulting remote head and checks.

## Delivery and limits

- Before packaging, main advanced to `142209912c4711f1d50eeb44ae2dbfb316217eba` (Landing CTA PR17). Committed the scoped change as `87477cd`, then ordinary merge `ec0db56ed71b803ca0d248b1eeca7cccba786ca0`, without conflicts. PR diff remains the same nine files; no Landing changes belong to this PR.
- Combined-base verification: frontend 369/369 tests (40 files), client TypeScript/Vite build and all 12 navigation browser combinations passed. Latest screenshots: OS temporary directory `vietverse-kids-courses-VEjSqi`. Backend tree and root package/lockfile are unchanged from the successful 497-test run; that result is reused, not reported as a second run. Points/header source and its inputs are unchanged, so the 16-case result remains applicable.
- Reviewer rechecked the merged diff and journal at `ec0db56e`: no new findings; previous approval still applies.

- Separate PR to main; coordinator owns review/merge. No auto-merge, main push, manual deployment, production writes, purchase or real payment testing.
- Browser uses production shared components and local API responses, with synthetic tall destination bodies. Not whole-page, production, iOS/Android or screen-reader acceptance. Existing pricing/payment behavior is unchanged and was not re-audited.
- No user action needed for local implementation; coordinator must accept the exact PR head before merge. Real-device acceptance remains separate.
- CLI `ak` is not installed: journal recorded directly, no shared plan/index status changed. AgentWiki publish skipped.
