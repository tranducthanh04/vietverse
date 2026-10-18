# Customer audit: non-audio replacement PR

Date: 2026-10-18.

## Owner decision and isolation

- Owner requested splitting the completed non-audio work from held PR #12.
  New audio code exists but remains unmerged/held; no audio release is authorized
  by this subset. Existing audio on main is not rolled back.
- Branch: `codex/customer-audit-no-audio`.
- Base: `main@c7519c0d8dfe609eee9ac3551dff9aeb29fab64f`.
- Worktree: `C:/Users/Asus/.codex/worktrees/customer-audit-no-audio/codeDuAN`.
- One replacement PR includes integrity, admin and sort reset. No parallel admin
  PR is intended for the same merge. No auth changes belong to this PR.
- Preserve current main header/offline implementation and documentation. Do not
  copy the mixed audit report, old mixed journals or mixed plan into this branch.

## Included changes and boundaries

| Finding | Included implementation | Boundary |
| --- | --- | --- |
| F05 | Atomic virtual-item debit requires item not already owned | Existing compensation retained; no transaction rewrite |
| F06 | Legacy grading never grants credit from client isCorrect; missing/empty canonical answers fail closed | Existing word_card and recording receipt service lookup unchanged; no legacy data rewrite |
| F11 | Paid access requires active true, valid paid plan and finite future expiry | Replay/starter policy unchanged; no subscription repair |
| F08 / F12 admin | Preserve zero/status/screen-time values; explicit missing/error/retry states | Read-only UI; no API, permission or data changes |
| F01 reset only | Reset remains available after selecting all cards incorrectly, including repeated tokens | Reset does not complete, refund hearts or grant points; grading callback unchanged |

Source files were selected from PR #12 by the coordinator; this journal does not
claim audio/finalize changes are present. F04, F09 and F12 parent-recording fixes
remain outside this PR. Audio docs, recorder/player changes and audio i18n keys
are not part of this subset.

## Decisions still open

- F01 mandatory retry/hints and F13 bilingual activity behavior remain open.
  The newer customer document requests per-question feedback, while the approved
  09 October contract grades the new activity types at final submission. Do not
  change that contract without the owner's decision.
- Voice provider/rights, curriculum completeness and real-device/production
  acceptance remain separate gates. This subset does not complete the full plan.
- Legacy content missing canonical answers and old paid records missing valid
  expiry need owner review before rollout; do not invent answers or entitlements.

## Verification and handoff

- Fresh tester evidence: focused 20 server/19 client cases passed; single full
  `npm test` run passed 517 server tests across 53 files and 330 client tests
  across 37 files. Typecheck/build/lint exited 0; lint has 103 existing warnings,
  no errors. Baseline audioPlayback tests still emit React act warnings.
- Dependencies installed with `npm ci` and Mongo download disabled only at
  postinstall; tests use existing MongoDB 7.0.24 and a temporary replica set.
  No production .env copied. Install reports 10 existing development-inclusive
  advisories; dependency files are unchanged.
- Reviewer found no actionable code/docs findings. All nine extracted files
  match PR12 head `8bdc6b9`; excluded audio/finalize/i18n paths and recording
  receipt service/validation match main. Whitespace checks pass.
- Known baseline risk from coordinator: PR15 head
  `0f7ae4120021354b487da165a8b4ccb4abe0e6ea`, CI `39141626708`, failed
  recordingFinalize.test.ts:148 with [201,201,404,201], 496/497 server tests
  passing. Its server/lockfile match main. Our single local finalize run passed
  23/23, which does not disprove the race. F04 remains held; no repair, skipping
  or rerunning merely to obtain green is authorized. Check exact new-head CI
  separately and stop the merge gate if this baseline failure recurs.
- Owning docs updated: business rules, feature inventory, API/data contracts,
  review findings and `docs/admin-learner-progress.md`. Their existing main
  header/offline sections are preserved.
- This documentation handoff performs no stage/commit/push/merge/deployment or
  production-data write. Coordinator owns the PR and final merge gates.
- AgentKit CLI is unavailable; evidence is local Markdown, not a manually edited
  plan/index status. Whole-plan completion is not claimed. AgentWiki publish skipped.
