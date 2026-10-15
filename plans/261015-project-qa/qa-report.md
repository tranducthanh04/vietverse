# Vietverse QA - 2026-10-15

## Outcome

The authorized word-card overflow repair passes local browser checks, including the authenticated lesson route. Broader QA finds two reproducible admin defects: this is not a clean release sign-off.

| Gate | Final result |
| --- | --- |
| Backend Vitest | 489/489 pass, 50 files, 162.21s |
| Frontend Vitest | 233/233 pass, 29 files, 19.03s |
| Public and learner browser | 19/19 pass |
| Admin browser | 11/13 pass |
| Four new activity types | 11/11 pass |
| Combined E2E/UI checks | 41/43 pass |
| Word-card component geometry | 21/21 pass at 320/390/1366px |
| TypeScript/build | Monorepo typecheck, server build, client production build pass |
| Targeted ESLint | WordCardActivity and narration test pass |

Backend full_flow.test.ts is HTTP integration despite its E2E name. The new browser journeys use real frontend pages, Express endpoints and a temporary MongoDB replica set, without mocked app/API responses. The43 checks are scenario groups, not43 independent complete user journeys. Coverage percentages were not measured.

Existing warning: audioPlayback.test.ts emits `An update to ParentRecordingsPage inside a test was not wrapped in act(...)`; its five tests pass. The warning remains unresolved.

## Confirmed defects

### F01 - P2 - Zero progress appears perfect in admin

- Steps: Admin -> Learners -> QA Zero Progress -> View details. Fixture has one LessonProgress: in_progress, scorePercent0, stars0.
- Real API returns those values; UI shows100%/3 stars and a completed label.
- Failure: `API fixture scorePercent=0 must not render as perfect score: '100%' !== '0%'`.
- Source: client/src/features/admin/AdminLearnersPage.tsx:307 and :311 use `|| 3` and `|| 100`. Completed-row copy also ignores status.
- Impact: misleading learning results for operators. Preserve legitimate zero values and display progress status accurately.
- Evidence: [screenshot](./screenshots/admin-zero-score.png), browser-results-admin.json. Reproduced on repeated isolated runs. Not fixed during QA.

### F02 - P2 - Learner dialog lacks keyboard lifecycle

- Steps: activate View details, Tab three times, Escape.
- Expected: focus enters dialog, remains inside, Escape closes it and restores trigger focus.
- Observed failure: `focusInsideAtOpen:false, tabFocus:[true,true,false], escapeClosed:false, focusRestored:false`.
- Source: client/src/features/admin/AdminLearnersPage.tsx:229 creates a custom aria-modal dialog without focus/keyboard lifecycle; shared components/ui/Modal.tsx implements it already.
- Impact: keyboard users can reach background controls and cannot dismiss with Escape. Click-to-close works. Not fixed during QA.

## E2E and manual-style coverage

Real Chrome clicks, typing, reload, keyboard and permission changes were executed. The agent directly inspected screenshots and layout geometry. This is agent-driven exploratory/manual-style review plus automation, not a separate human tester or physical-mobile acceptance session.

| Area | Observed coverage |
| --- | --- |
| Public | Home/pricing at1366/390px, prices, mobile menu,404, protected-route login redirect |
| Stories/culture | Search/no-results recovery, details, guest reward-login prompt; wrong/correct/replay quiz awards0/+5/0 |
| Auth/onboarding | Mismatched passwords block API; actual registration, four-step child creation, map at zero points |
| Legacy lesson | Seeded passage at390/1366px; wrong/correct choice, blank, ordering, reload restores recording step |
| Recording/completion | Denied mic blocks progress; Chromium synthetic mic -> actual MediaRecorder -> real local upload; final review, completed result, reward and lesson2 unlock survive reload |
| Points | Ledger/history, one-point avatar redemption, equip without extra debit, owned state |
| Parent | Wrong/correct gate, settings persist through reload, admin access denied |
| Payment | Test-payment warning; absent local provider keys return recoverable503; no real link/transfer |
| Admin | Login/KPI, revenue/date validation,3 CMS lists/search, learners, inventory, invalid rule blocked without PATCH, draft create/save/reload/preview, mobile navigation, keyboard defect |
| New activities | Published multi_select/group_sort/fill_blanks/follow_steps; duplicate M choices persist; neutral feedback and explicit self-report; real grading100%/+14; fit390px |

The standard seed catalog is reused. Extra controlled fixtures: zero-score learner, one-point avatar, and a four-activity lesson published through the real content service in the activities group only. That publish is disposable setup data, not browser publish acceptance or a production mutation.

## Isolation and rerun

- Revision afa9082 plus local UI/test/docs changes. Node22.15.0, installed Chrome, bundled Playwright, installed Vite/Vitest.
- Frontend127.0.0.1:5188 -> API127.0.0.1:5515 -> temporary MongoDB replica set.
- Backend config imports run from a new empty temporary directory so dotenv cannot read the user's .env; provider keys are explicitly blank and auth/seed credentials are QA-only.
- Browser external requests blocked. No production DB, keys, users, PayOS, Google or Cloudinary touched.
- Final groups each start fresh services and close browser, Vite, HTTP, Mongoose and MongoDB in finally. Do not use the combined group as the final release receipt.

Run sequentially from repository root in PowerShell:

```powershell
$env:QA_GROUP='learner'
node_modules/.bin/tsx.cmd plans/261015-project-qa/browser-e2e.mts
$env:QA_GROUP='admin'
node_modules/.bin/tsx.cmd plans/261015-project-qa/browser-e2e.mts
$env:QA_GROUP='activities'
node_modules/.bin/tsx.cmd plans/261015-project-qa/browser-e2e.mts
Remove-Item Env:QA_GROUP
```

Admin exits1 while the two real defects remain. Do not skip assertions to make it green. QA_MONGODB_BINARY, PLAYWRIGHT_MODULE and CHROME_PATH override machine-specific defaults. Final receipts: browser-results-learner.json, browser-results-admin.json, browser-results-activities.json and screenshots/.

## Harness failures distinguished from product defects

- 404 selector initially expected literal404; corrected to actual localized heading. Final pass.
- CMS reload selector getByLabel exact included saved textarea text in implicit-label textContent. Minimal Chrome reproduction confirmed accessible-role lookup correctly finds the textbox; persistence assertions retained. Final draft/preview pass.
- Expanded learner script originally read a response after navigation and left an unhandled response waiter. Immediate JSON consumption plus allSettled fixed the harness race. Final recording/completion pass.
- Earlier combined-run mobile-admin timeout did not recur in isolated runs; root cause unestablished, not claimed fixed. Initial browser-results.json retained as non-final evidence. A one-IP fast run can hit the real120/min limiter; final groups isolate their server state without changing limits.
- Initial empty-cwd Mongo lookup attempted an unnecessary download. Interrupted it and reused the repository cached executable.
- A duplicated new narration test was removed before the final233-test frontend run; the earlier234 count is not the final receipt.

## Inspection-only risks and acceptance gaps

See [backend review](./backend-review.md): non-atomic refresh-token consumption, partial email signup after DB failure, CI/runtime gaps. These are inspection-only risks, not runtime-reproduced failures here. Expired-plan child quota requires a business-policy decision.

Not verified: real PayOS webhook/channel/transfers, Cloudinary direct uploads, Google OAuth, Safari/Firefox, physical mobile microphones, audible TTS quality, real elapsed screen-time expiry, browser offline reconnect/outbox, multi-child switch/delete, physical shipping/fulfillment, browser CMS publish/unpublish, all long-content legacy activities, full WCAG/axe, security penetration/load tests or Core Web Vitals. Unit/integration coverage does not replace these gates.

No commit/push/deployment. Only the previously approved word-card bug was fixed; new findings require approval before repair. ak:test/ak:web-testing governed isolated environments, browser evidence and failure classification. The ancillary ak:plan CLI was unavailable, so no AgentKit plan/journal scaffolding was claimed; this report records execution directly.
