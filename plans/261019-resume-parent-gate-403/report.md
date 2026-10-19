# RESUME-API-GATE-403 verification and handoff

Date:2026-10-19. Worktree:
`C:/Users/Asus/.codex/worktrees/resume-parent-gate-403/codeDuAN`.
Branch:`codex/resume-parent-gate-403`.
Tested base/HEAD before commit:`4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66`.
API worktree SHA256:`2e2775a21198d92788d6f046ae3bfd9b4aa2db4018ee380f7bc0bc0ba6d4d359`.
Tests execute the uncommitted correction on that base; these are not tests of
unchanged base nor a fabricated final commit SHA. Final delivery head is supplied
separately in the PR handoff.

## Change and authority

New human instruction to finish nonaudio delivery was verified in coordinator
chat. This assignment may commit, ordinary-push and create a new PR to main;
author must not merge or deploy. Only production file is client/src/lib/api.ts:
add AxiosHeaders import and compare failed-request token with current storage
before clearing both Parent Gate keys. All other API/auth401/hint/probe code is
unchanged. Original error always rejects; no automatic403 retry.

Technical decision, not business-policy change: nonempty identical token bytes
identify the same credential, even if its local deadline changes. Missing or old
request evidence cannot invalidate a newer credential. Server enforcement remains
authoritative. Contract: docs/parent-gate-stale-response.md.

Shared docs02/03/05/06 remain coordinator-owned for later index/contract links.
The previous local6ef worktree, shared checkout deletions and all QA artifacts
remain untouched. No audio/F04, R01, picker, F13, model, policy or dependency edits.

## Executed gates

All commands below ran from this worktree; paths are relative to this folder.

| Command | Actual result | Receipt |
| --- | --- | --- |
| node plans/261019-resume-parent-gate-403/run-checks.mjs red red | Expected exit1;27tests=10fail17pass before fix | red.json, red-0-client.log |
| node plans/261019-resume-parent-gate-403/run-checks.mjs focused green | Exit0;97/97 | green.json, green-0-client.log |
| node plans/261019-resume-parent-gate-403/run-checks.mjs full full | Exit0;server534/534 (53files), client504/504 (48files) | full-server.json, full-client.json, full-0-server.log, full-1-client.log |
| node plans/261019-resume-parent-gate-403/run-checks.mjs quality quality | Server/client typecheck and build exit0; final lint infrastructure failure exit2 | quality-0-server.log through quality-4-client.log |
| node plans/261019-resume-parent-gate-403/run-checks.mjs lint lint2 | Exit1; attempted client ESLint entry not linked yet | lint2-0-client.log |
| node plans/261019-resume-parent-gate-403/run-checks.mjs lint lint3 | Exit0;0errors99warnings, repository threshold unchanged | lint3-0-client.log |
| node plans/261019-resume-parent-gate-403/browser-smoke.mjs | Exit0;4/4 matrices | browser1-evidence.json, browser1-screenshots/ |

Focused tests overlap full suite; do not sum counts. RED failures all show expected
new token/deadline replaced by null/null, not harness errors. Full unchanged suites
ran once. Existing audioPlayback act warning remains. Passing existing recording
tests does not close F04 or certify audio.

Lint diagnosis: root ESLint10 was selected and client @eslint/js was missing.
The whole client dependency junction failed because this run's Vite caches already
occupied that folder. Preserve caches and link only existing @eslint, eslint and
eslint-plugin-react packages from the QA installation. Package-lock hashes match;
no install/version/lockfile change. Correct client ESLint9.39.5 passes. Both failed
attempts remain available; there was no test retry to hide a product failure.

## Browser evidence and limits

Chrome real ParentLayout, ProtectedRoute, ParentDashboardPage, QueryErrorState,
router, QueryClient, CSS and Axios; VI/EN x320/1366. Each matrix verifies:

1. Request actually leaves with synthetic old token; network response is held.
2. Synthetic new token/deadline are installed, then old403 is released.
3. Both exact new values survive, original error UI remains, no fake success.
4. Actual Retry sends new token and displays the fixture's7completed lessons.
5. Reload/current403 clears both keys while error UI remains.
6. Fresh mount redirects to kids fixture; tokenless in-flight request is denied.

All12screenshots (old403/retry-success/current403 for each matrix) were inspected
with native vision. Error/Retry content is readable; successful dashboard renders
the expected7. Mobile tab strip remains horizontally scrollable/cropped as before;
this is not acceptance of all parent navigation or picker issues.

No page errors or unexpected requests. Intentional403 and blocked-font diagnostics
are retained. External font requests were blocked; fallback-font only, not real
font/device/WCAG acceptance. Browser and Vite server were closed (cleanedUp:true).
afterCurrent in JSON is captured after fresh mount; the null pair was also directly
asserted immediately after current403. Both assertions are present in the runner.

Auth/child/progress HTTP fixtures and synthetic storage renewal deliberately isolate
ordering. No real server challenge/signing/PIN/login/cookie/DB is exercised by this
browser test. Real server gate behavior, R01, providers, audio, production and
whole-Docs acceptance are not established.

## Safety and review

Test runner sanitizes environment, refuses non-example env files, pins cached
Mongo8.2.6 with runtime download disabled and guards mongoose.connect against
non-loopback/credential-bearing URIs. Existing server tests use disposable Mongo.
No production/provider/payment/publication writes. Generated logs and screenshots
are preserved locally, not staged as bulk PR artifacts; manifest records hashes.

Independent read-only review found no critical/important production issues. P3
runner signal termination could appear successful: fixed by recording code+signal,
awaiting log flush, and failing on code!==0. Syntax and0/1/null truth table checked;
reviewer rechecked final diff and receipts and reports no outstanding findings.
Runner refinement did not change product/test inputs; full suite not repeated.

Coordinator still must review exact PR head/base, required CI/preview and handle
merge/postchecks. No self-merge, auto-merge, force push, bypass or manual deploy.
Rollback: revert scoped API comparison; no migration or data rewrite.
