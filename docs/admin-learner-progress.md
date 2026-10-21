# Admin learner detail: audit F08 / F12

Date: 2026-10-18. Status: implemented locally for the replacement non-audio PR;
not a merged or deployed release.

## Scope and existing business decisions

- Actor: authenticated admin reading a learner through the existing admin API.
- Server progress remains authoritative: `not_started`, `in_progress`, `completed`.
- Zero score and zero stars are valid values, not missing data.
- Screen-time limit 0 means unlimited; 15/20/30 remain minute limits.
- The view is read-only; no schema, endpoint, permission, reward or threshold changes.
- Audio rendering/recording behavior and auth remain unchanged from main.

## Presentation assumptions

- Missing score/stars/screen-time fields say `Chua co du lieu`; never infer
  a perfect score, three stars or a 20-minute setting.
- Missing/unknown progress status says `Chua ro trang thai`.
- `updatedAt` is an update date, not a completion date; replay can update it.
- Detail request failures show an error and retry. Successful empty/missing
  child responses show not found, never an endless loading spinner.
- Existing shared Modal behavior, layout and Vietnamese admin copy remain intact.

## Acceptance and verification

`client/src/test/adminLearnerDetail.test.tsx` covers zero/missing values, progress
statuses, screen-time settings, request failure/retry and missing profiles.
Fresh testing of this isolated branch passed: 19 focused client cases (14 admin,
5 sort reset), and the full 335-client/517-server suite after merging main/PR16. Results and remaining
baseline/CI gates are in `plans/journals/2026-10-18-customer-non-audio.md`.
Browser/device/production acceptance remains separate.

Owner requested one replacement non-audio PR including this admin fix, not a
parallel admin PR for the same merge. New audio work remains held and unmerged in
PR #12; this branch does not revert existing main audio behavior.

## Integration evidence, 2026-10-19

The paragraphs above describe the original extraction. Integration with main
`4a6b0a1` preserves all current auth/audio changes. Fresh focused testing passes
14 admin cases plus 12 sort/feedback cases. Actual authenticated browser checks
at VI320 and EN1366 now confirm zero scores/stars, missing progress fields,
all progress statuses and unlimited screen time. Error coverage distinguishes
real HTTP404 from a synthetic HTTP500 followed by real HTTP200 retry, and a
synthetic HTTP200/null response. Missing screen-time fields remain component
coverage, not an assertion about Mongoose's hydration defaults.

This is not production/device acceptance. PR18 remains Draft pending coordinating
review and exact-head CI. The existing320px footer overflow found during this
validation is corrected by its narrowly approved CSS addendum; final bounded
admin/player browser run passes13/13. Receipts: `plans/261019-resume-nonaudio/`.
