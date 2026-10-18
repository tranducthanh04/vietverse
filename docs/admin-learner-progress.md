# Admin learner detail: audit F08 / F12

Date: 2026-10-18. Scope: local UI repair, not a production release.

## Ownership and acceptance

This chat owns `AdminLearnersPage.tsx`, `adminLearnerDetail.test.tsx` and this
document. The companion chat owns backend/audio and SortOrderActivity work.
Baseline: `main@35c51ca`; remote has no `dev` branch. Implementation was isolated
in the `admin-learner-progress` worktree, then integrated into the shared local
workspace and included in the isolated `customer-audit-ship` PR preparation.
This is not evidence of a merged PR or production deployment.

1. Reproduce zero-value, status and detail-load failures with component tests.
2. Repair rendering without changing server grading, rewards, rights or data.
3. Run focused and full checks; review and integrate only owned files.

## Existing business decisions

- Actor: authenticated admin viewing a learner via the existing admin API.
- Server progress is authoritative: `not_started`, `in_progress`, `completed`.
- Zero score and zero stars are valid values, not missing data.
- Screen-time limit 0 means unlimited; 15/20/30 are minute limits.
- The view is read-only. No schema, endpoint, permission, points or threshold changes.

## Presentation assumptions

- Missing score/stars/screen-time fields say `Chua co du lieu`; do not infer a
  perfect score, three stars or a 20-minute setting.
- Missing/unknown progress status says `Chua ro trang thai`.
- `updatedAt` is labeled as the update date, not the completion date (a replay
  can update the record after its first completion).
- A failed detail request shows an error and retry; a successful empty/missing
  child response says the learner was not found. Neither is an endless spinner.
- Existing shared Modal behavior, layout and Vietnamese admin copy stay intact.

## Evidence

Implementation/verification results are recorded in the companion report
`plans/reports/2026-10-18-parallel-customer-completion.md`: admin tests went from
10 failing / 4 passing to 14 passing; the companion reported 325/325 frontend
tests passing after local integration, with client typecheck/build passing.
These are the companion's recorded checks, not a fresh test run for this PR.
Fresh isolated shipping verification is recorded separately by the coordinator.
Browser/device and production verification remain separate gates.
