# Lesson-player action footer

## Scope and diagnosis (2026-10-19)

RESUME-NONAUDIO-PR18-FOOTER is a CSS-only addendum to PR18. At VI320 after
a correct answer, the footer's non-wrapping row combines praise with a
non-shrinking completion button. Its min-content widths exceed the available
288px, producing a332px document and a partly off-screen action. The existing
full-player browser-2 screenshot reproduces this on main4a6 integration; the
same footer is unchanged on main2a8. Wider English layout does not expose it.

Affected surface: the shared bottom action footer, including Next/Finish,
unanswered, wrong/correct legacy feedback and existing recorded-answer status.
Not affected: hints, activity renderer, audio/replay, session logic, handlers,
disabled conditions, rewards/grading/retry policy or locale text.

## Presentation decision

Stack feedback and the full-width action below the existing640px `sm`
breakpoint. Keep the desktop row and natural-sized action from640px upward.
Allow feedback to shrink/wrap within available space without truncating text,
hiding overflow, reducing readable font sizes or changing button semantics.
Retain at least44px controls. This is a layout assumption, not new business
behavior or authorization to alter when children may continue.

## Verification contract

Run actual React/router/Axios/Express/auth against a temporary loopback Mongo
replica set. No audio URLs, playback or provider calls. Check VI/EN at
320/390/640/1366 for Next and Finish in unanswered/wrong/correct states:
document and control bounds, text bounds, no feedback/action overlap, target
size, center hit test for enabled controls and keyboard focus/activation.
Keep the original one-activity wrong/reset/correct browser journey through
real server completion and the bounded admin flows. Failed attempts remain
separate from final evidence; font fallback and real-device limits stay explicit.

Results are recorded under `plans/261019-resume-nonaudio/`. Final verification
and coordinating review are required before release; no self-merge or deploy.

## Local results

- Integrated exact main2a8. Only three footer class strings changed.
- Expanded pre-fix matrix:55/57 PASS; VI320332px and EN320363px failed.
- After-fix matrix:57/57 PASS; both now320px, full labels, readable20px buttons,
  valid target bounds/hit tests, and keyboard/pointer activation across8journeys.
- Original admin and one-activity full-player regression:13/13 PASS, with the
  existing11-point award and unchanged two-heart reset behavior.
- First matrix attempt had incorrect expected labels, retained as a harness
  error, not a product result. New-activity recorded-answer variants were not
  directly exercised; no claim of all-activity or real-device acceptance.
