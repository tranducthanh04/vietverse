# Read-only review: NONAUDIO PR18

Reviewer: independent code-review subagent, 2026-10-19.
Compared integrated working tree against main
`4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66`.

## Verdict

No introduced defect found in the five production files. Draft/HOLD, not ready
to merge: browser layout remains red and exact-head CI still requires checking.

## Finding

P2, pre-existing: VI320 full-player footer extends to332px and clips completion
control. `client/src/features/lesson-player/LessonPlayerPage.tsx:412` has a
non-wrapping flex row and line437 a non-shrinking button. File is unchanged from
main. Saved screenshot and browser-2 result corroborate the failure. Keep the
assertion red and obtain separate assignment before changing this sixth file.

## Reviewed behavior

- F05: real HTTP/auth/DB reads synchronize before atomic debit. One purchase,
  one ownership ID, one ledger/redemption; compensation/physical/equip retained.
- F06: legacy correctness fallback removed, empty canonical fails closed,
  valid canonical and introductory behavior preserved. Service receipts unchanged.
- F11: strict active, paid plan and finite future expiry; starter/replay unchanged.
- Admin: zero/missing/status/unlimited/error/retry/unavailable states covered.
- Sort: reset preserves duplicate tokens with no completion callback and no
  reward/heart side effects. All incoming WrongAnswerFeedback preserved.
- Browser: real404 separated from injected500/empty, two full-player sequences
  passed with two hearts after reset and existing +1 activity/+10 lesson reward.

## Limitations / declined to judge

Reviewer read focused40BE/26FE and browser12PASS/1FAIL evidence but did not rerun
tests. Full suites/checks were running during review. Blocked external fonts
mean geometry uses fallback fonts. New audio/provider behavior, F04 closure,
F13 translation completeness, auth/PIN/email policy, migrations, production
data correctness and device/production acceptance were outside review scope.
Incoming main changes are not independent acceptance of these domains.
