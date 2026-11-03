# HINT-OVERFLOW

Base: 9b809bd3b27ea69cad2da2413825ffb8912d3f98. Initial worktree clean.
Branch: codex/wrong-hint-overflow. No subagents.

## Contract

Repair only feedback text wrapping and Review container sizing. Preserve complete
source/selected translation (up to 5000 characters), first-available language,
status semantics, handlers/state/scoring, audio and all other runtime files.
No shared docs indexes, footer/reset, policy, content, API or dependency changes.
QA snapshots and shared checkout remain read-only. Exact pin supersedes generic
pull-before-code guidance; no dev branch integration or shared-checkout mutation.

## Steps

1. Read domain docs/source QA; reproduce current-pin browser geometry RED.
2. Apply minimal caller-scoped CSS; prove GREEN and add text-only contract tests.
3. Run full frontend, types/build/lint; browser VI/EN at 320/390/640/1366,
   all three text renderers, short/long spaced/unbroken/boundary content,
   navigation, keyboard and scroll reachability. Retain raw failures.
4. Author diff/security review, owning docs/journal/evidence manifest, scoped
   commit and ordinary new-branch push/PR; verify exact-head CI. No author merge.

## Boundaries

Browser uses actual LessonPlayerPage, activities, IndexedDB session and CSS with
synthetic local API/auth. Not backend auth/grading or production acceptance.
Fail-on-audio guards prohibit play/speak/recording/microphone/provider requests.
Known full-sort reset and footer issues belong to PR18; measure/report separately,
do not hide or copy unmerged fixes. Physical-device/screen-reader acceptance excluded.

## Progress

- Preflight complete: dedicated managed worktree; docs01-07 and source audit/plan
  plus Delta-A report/journal/matrix inspected before product edits.
- RED complete: real player 24 short controls pass, 4 long-token cases fail
  (VI320/EN1366, 216 and original228). Raw receipt in Temp/vietverse-hint-red-QdusmF.
- Root cause: default word wrapping leaves unbroken hint/translation at intrinsic
  width; Review max-width36rem exceeds a narrow parent. Long data exposes this,
  shared by three text renderers, not a locale-policy defect.
- Repair: caller-scoped anywhere wrapping/min-width0 and responsive Review max
  width. No shared SupportTranslation edit.
- GREEN complete: 98 distinct cases covered by initial 93 passes plus targeted
  5 passes after correcting nearest-scroll hit testing. Initial 5 failures retained.
  Extra 12 boundary cases prove last-character scroll/hit reachability. All 24
  short card rectangles and font sizes match RED controls exactly.
- Quality complete: focused 118/118, full frontend 509/509, root typecheck/build/
  lint pass (0 errors, 99 warnings). No local full backend execution.
- Author source/security review complete; no runtime changes outside the three
  CSS lines. Manifest covers 158 local evidence/source files. Dedicated docs and
  journal written; shared indexes remain reserved for coordinator integration.
- Main advanced to 89a2d850fd3ec13b6334cd4e1b70fd54da11eca0 during validation.
  Read-only delta inspection shows PR31 API/tests/docs, no overlap with the two
  product files. Do not silently merge; local evidence stays pinned to 9b809bd
  plus the recorded patch.
- Implementation/harness commit: 159817989e341cba1fb8087e330a401f5ec9e60a.
  Local gates are complete. Exact final delivery head, ordinary push/new Draft PR
  and fresh CI are recorded in the chat delivery receipt; independent review,
  current-base integration, merge and postchecks remain coordinator gates.
