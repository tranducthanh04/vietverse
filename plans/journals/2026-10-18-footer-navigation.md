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
- Before packaging, remote main advanced to `5baf9172029c9f1276697e918e2a345c4723ea07` (PR21 parent-stage links). Integrating that separate change and revalidating frontend; backend/dependency inputs are unchanged.
- Lint: 0 errors, 103 pre-existing warnings.

## Handoff constraints

- Separate PR base main; coordinator owns review/merge. Audio/F04 remains out of scope even if baseline CI fails.
- `ak` CLI unavailable: journal saved directly; shared completion plan/index not changed. AgentWiki publish skipped.
