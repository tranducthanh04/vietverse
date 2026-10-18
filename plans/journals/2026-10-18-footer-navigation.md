# FOOTER-NAV

## Scope and baseline

- Source: customer Footer tab `t.5rc9r5kx642b`, audit 5.10 / completion step 6; coordinator assigned two missing public links only.
- Isolated branch `codex/footer-navigation`, baseline `01cfa0591feb9bf0015821f19e9f256259544732`; main CI `39145652890` verified success before implementation.
- Preserve PR19, shared dirty checkout, four existing footer links, contact/legal, CTA behavior and all audio. No production writes, deploy or self-merge.

## Decisions

- Use existing five-stage Landing section for public roadmap (explicit presentation assumption), not a new content page. Courses uses existing `/gia`.
- Landing-local exact-hash effect focuses the heading after mount, including same-hash/history navigation; scroll margin clears fixed header.
- Two translated labels; no router/store/API changes or generic hash infrastructure.

## Evidence

- RED: 18 new tests failed before implementation, detecting missing destinations/anchor/focus.
- GREEN: 58 focused tests passed (footer, Landing CTA, route focus, pricing, i18n).
- Initial typecheck/build caught five unsupported `exact` options in Testing Library queries. Removed them (string role names already match exactly); browser Playwright queries retain their supported option.
- Browser: all six VI/EN and viewport combinations passed; 36 click/Tab+Enter navigations plus direct/reload/repeat/history/unknown/delayed cases. Real router/layout/CSS/font; no unexpected requests or browser errors. Local screenshots in temporary directory, not committed.
- Independent reviewer found one P2: expanded mobile menu stayed open on hash-only navigation and covered the heading. Added four tests, observed RED (`aria-expanded=true`), then changed menu close effect to navigation key (including repeated hash). Browser regression adds eight mobile cases.
- Simplifier reviewed the nine deliverables read-only and found no useful simplification; no edits. Reviewer's exclusions (unchanged APIs/payment/auth, unchanged legal/source decisions, physical-device/screen-reader acceptance) remain explicit limitations, not claimed coverage.
- P2 re-review: reviewer independently reproduced same/repeated hash with open menu in Chromium320; menu closed, header bottom81px and heading top96.48px. No remaining findings; 28 footer/focus tests passed independently.
- Final `npm test`: 497 backend + 391 frontend passed. Client phase began after the mobile-menu repair and includes22 footer tests. Existing `audioPlayback.test.tsx` act warning remains; no audio edits. No failed tests or F04 repair claims.
- Final focused62 tests, client typecheck/build passed; lint0errors/103baselinewarnings.
- Browser fixture expansion initially failed its unknown-hash check: native same-document navigation preserved heading focus and scrollY5081, correctly not resetting to0. Diagnostic confirmed identical before/after values. Split cold unknown entry (top/no roadmap focus) from same-document unknown entry (preserve existing link focus/scroll), retaining both assertions.
- One expanded browser run timed out waiting for focus after Back at EN1366. Diagnostic full rerun passed without source changes; reviewer instrumented15rapid attempts, allpassed, but proved Pricing had never mounted before Back (URL changed before view). Added observable pricing-content wait to test completed-route history; no sleep or production change. Exact prior timeout cause remains unproven; do not claim interrupted-transition coverage from these results.
- Final synchronized browser run passed all6combinations,36click/Tab+Enter and8expanded-menu cases plus direct/reload/repeat/history/unknown/delayed. Screenshots retained locally; no browser errors or unexpected requests.
- Before packaging, remote main advanced to `5baf9172029c9f1276697e918e2a345c4723ea07` (PR21 parent-stage links). Committed footer as `bae71d7`, then integrated main without conflicts in `054b39e`; reviewer verified the nine-file diff and retained keys/inventory, no new findings.
- Combined-base full client suite passed411tests/42files; typecheck/build and browser also passed. Browser again passed six combinations,36click/keyboard+8mobile cases and all named lifecycle checks, no unexpected requests/errors. Lint now0errors/100existingwarnings after PR21. Backend and dependency/package files verified identical to the497-test run, so reused that result; no unnecessary backend rerun. Main CI39147316014 for base5baf917 also verified success.
- Lint: 0 errors, 103 pre-existing warnings.

## PR20 integration - 2026-10-19 Asia/Saigon

- Coordinator requested priority integration before the separate remainder report. Verified the human authorization in coordinator chat; no new feature scope was inferred from the delegation alone.
- Git-manager normal-merged pinned main `53a447a369fed0d69b455749a053b694a159a753` into this branch as `f9de3d56b3b4dccaf1511e4b6cc4a577ed1475b0`. The sole conflict was `docs/03-feature-inventory.md`; both auth20 and footer sections remain. No force push or shared-checkout changes.
- `git diff 04678e0 f9de3d5 -- client plans/261018-footer-navigation docs/footer-navigation.md` is empty. Nine footer deliverables still differ from main; report work is separate.
- Fresh full frontend: 411 tests in 42 files passed. Fresh focused footer/CTA/focus/pricing/i18n: 62 tests in five files passed. The first focused invocation used two incorrect file filters and ran only38 tests; corrected to the actual existing filenames, then ran all62. No test was skipped or weakened.
- Fresh root typecheck and build passed for server and client. Client lint: 0 errors, 100 existing warnings. Existing audioPlayback act warning remains.
- Unmodified browser script passed VI/EN at320/640/1366: six combinations,36 click/Tab+Enter navigations and8 expanded-menu cases, plus direct/reload/repeat/history/unknown/delayed checks. No browser errors or unexpected requests. Screenshots: `C:/Users/Asus/AppData/Local/Temp/vietverse-footer-I9UZ7y`; inspected Vietnamese320 roadmap screenshot. Owned browser/server closed by script finally.
- Prior timeout history and limits above are unchanged. This run does not prove interrupted-navigation, real-device or production acceptance.
- Backend tests were not rerun locally for this integration; old497 result is historical, not evidence for the changed auth baseline. Fresh CI on the final pushed head must validate the combined backend. No claim that F04 is fixed.

## PR23 integration - 2026-10-19 Asia/Saigon

- Coordinator explicitly requested a new gate after PR23 merged, superseding the temporary hold on head76af8a3. PR27/report remains separate and unchanged; no avatar-menu task was implemented.
- Git-manager normal-merged pinned main `6cf4ce52724867be75b733c741c5cb72a0b823b5` as `c762dea77abed78290a9b8cd4d152a0161ca1dd4`. Sole conflict: `docs/03-feature-inventory.md`; preserved footer plus branding/source/auth sections. Worktree clean before tests; exactly nine footer files differ from main.
- Footer PublicLayout/Landing, dictionaries, footer tests/browser and behavior documentation are unchanged versus76af8a3. Upstream adds KidsLayout branding and its tests, plus PR22 source-capture utilities/tests/docs. Server/package/lockfile diff against6cf4 is empty; PR24 introduces no backend change.
- Fresh focused run passed98 tests in8files: footer22, Landing CTA23, route focus6, pricing1, i18n10, child journeys22, auth gate9, branding5. Fresh full frontend passed416tests/43files. No test failure, rerun-to-green, skip or assertion change in this integration. Existing audioPlayback act warning remains.
- Fresh root typecheck and build passed for server and client. Client lint:0errors/100existingwarnings. Whitespace and scope checks passed.
- Unmodified browser fixture passed all6 VI/EN320/640/1366 combinations,36 click/Tab+Enter navigations,8 expanded-menu cases, same/cross-page/direct/reload/repeated hashes, Back/Forward, unknown fragments and delayed Landing mount. Focus/header clearance, full link geometry and no unexpected requests/browser errors passed. Screenshots at `C:/Users/Asus/AppData/Local/Temp/vietverse-footer-yaBwxK`; inspected VI320footer and EN1366roadmap. Script closes its own browser/server in finally.
- Historical timeout investigation and limits above remain unchanged. These are local Chromium fixture checks, not production/physical-device or interrupted-navigation acceptance. No local backend suite was run; combined backend validation must come from the new pushed-head CI, not an old baseline result. Audio/F04 remains out of scope.

## Final delivery constraints

- Separate PR base main; coordinator owns review/merge. Audio/F04 remains out of scope even if baseline CI fails.
- `ak` CLI unavailable: journal saved directly; shared completion plan/index not changed. AgentWiki publish skipped.
