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

## Incremental review after approved footer addendum

No new findings. Suitable for scoped Draft push subject to final frontend/root
checks and exact-head CI; no merge approval. Reviewer independently read the
three CSS-only changes, matrix source, RED55/57 and GREEN57/57 receipts and
VI/EN320 screenshots. Button labels are full and controls separated/in bounds.
Eight journeys activate Next/Finish and receive real HTTP200 with12 points.
Original browser-3 now passes13/13 with no page errors. Server tree identity
`ab85b50ef824a77aec9886e1af2af1bfbac6548a` matches32afb71 andde8b2ef.

Recorded-answer status variants are not directly exercised by the sort matrix.
Footer-1 is retained as a harness-label error; footer-2 is valid historical RED.
The reviewer made no edits and did not rerun tests. No new audio/auth/F04/F13
acceptance, device acceptance, merge or deployment is inferred.
