# Word-card layout repair - 2026-10-15

## Scope and decision

User approved fixing the child's reading-card layout. Preserve the existing visual language, audio behavior, lesson completion and grading. No API, database, seed, payment or deployment changes. No push requested in this turn.

Presentation heuristic: more than 12 NFC-normalized code points, more than two whitespace-separated words, or any newline uses passage styling. This is not a business/content validation rule.

## Completed work

1. Read business documentation and trace catalog -> shared WordCardActivity -> learner/CMS preview.
2. Reproduce with real component and Tailwind CSS in Chrome: passage at 1366px uses 96px text, escapes the fixed-height card and overlaps the prompt.
3. Replace fixed height with content-driven layout and responsive text sizes; preserve separate subPrompt narration and target audio.
4. Browser regression passes seven content cases at each of 320, 390 and 1366px. Inspect desktop/mobile screenshots. Add a narration regression for legacy targetWord passages.

## Verification

- Browser: 21 cases pass; no console/page errors. Checks text containment, prompt/audio separation, horizontal overflow, short-word prominence and no automatic completion.
- Targeted tests before the added narration case: 42/42 pass (narration, lesson versions, CMS preview).
- Client production build: passes (TypeScript + Vite).
- Backend: 489/489 tests pass. Final frontend: 233/233 tests pass, including the added narration regression. Existing audioPlayback test emits an act() warning, not a failure.
- Monorepo typecheck, server build and targeted frontend lint pass.
- Subsequent project QA exercises the actual lesson route at 390/1366px and completes the seeded lesson through real local API and synthetic microphone capture. See ../261015-project-qa/qa-report.md.

Run browser regression from repository root:

```powershell
node_modules/.bin/tsx.cmd plans/261015-word-card-layout/browser-smoke.mts
```

The script uses locally bundled Playwright and Chrome by default. Override `PLAYWRIGHT_MODULE` and `CHROME_PATH` for another machine; optional `WORD_CARD_SCREENSHOT_DIR` selects screenshot output. External browser requests are blocked. The fixture exercises the real component/CSS but does not authenticate or exercise the complete lesson route. No production data or secrets are used.

## Local journal

The first fixture attempt lacked Tailwind classes because the working directory was the monorepo root. Running Vite from the client directory corrected the harness; only then was the red/green geometry regression established. No app changes were needed for that harness issue.

Remaining rollout: user-authorized commit/push, deployment and a production learner-session check. Device-specific audio behavior is unchanged and not newly certified here.
