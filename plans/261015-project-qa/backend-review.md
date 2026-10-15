# Backend QA coverage review - 2026-10-15

## Evidence scope

Read-only inspection of backend implementations, tests, CI and business contracts. No app code changed, no backend tests rerun by this reviewer, no production requests, no credentials read, and no payment/provider calls made. The main tester separately owns executable E2E evidence and final test totals. Findings below are inspection evidence, not reproduced runtime failures.

Read the repository documentation index, account/child/lesson rules, API contracts and relevant existing review findings. Existing known limitations (default Parent Gate PIN, unverified email ownership, public recording URLs and cleanup-worker backlog) are not reported as new discoveries.

## Findings and coverage gaps

1. **P1 inspection risk: refresh-token consumption is not atomic.** `server/src/modules/auth/auth.service.ts:121` reads a token and checks its revocation state, then `:131` changes the document and saves it. Two requests can read the same unused token before either save and both issue successors at `:140`. The schema (`server/src/models/RefreshToken.ts:44`) does not enable optimistic concurrency. `server/src/test/auth.test.ts:96` covers sequential reuse, not simultaneous consumption. Add a deterministic two-request test synchronized before token consumption, assert at most one successful exchange and verify the documented family-revocation outcome. Prefer an integration test over unreliable browser timing. This has not been reproduced in this review; do not label it an observed failed test.

2. **P2 inspection risk: email registration can leave a partial account after failure.** `server/src/modules/auth/auth.service.ts:64` creates the user before creating its subscription at `:72`, with no enclosing transaction or rollback. If subscription creation fails, retrying registration encounters the email conflict at `:60`; the original response has failed but the account exists. Existing email tests check success and duplicate email only (`server/src/test/auth.test.ts:22`, `:46`). In contrast, `server/src/test/googleAuthIntegrity.test.ts:40` explicitly covers rollback of Google account creation. Add a targeted email-registration failure injection that checks user/subscription/token consistency and safe retry. No failure was injected in this inspection.

3. **P2 coverage classification gap: the existing "full E2E/button" test is HTTP integration, not browser E2E.** `server/src/test/full_flow.test.ts:2` imports Supertest; its named journey at `:11` invokes API endpoints directly and seeds MongoDB. It does not load React, click buttons, exercise browser cookies, permissions, layout, navigation or frontend state. Keep this useful integration test, but do not count its eleven steps as browser/manual coverage. The main agent's new real-backend browser harness should report its own verified scenarios separately.

4. **P2 CI coverage/runtime mismatch.** `.github/workflows/ci.yml:19` selects Node 20 while `server/package.json:7` declares Node 22.x. The workflow runs typecheck, the Vitest suites and builds (`:26`, `:29`, `:32`), but has no browser E2E gate. The existing browser smoke scripts under `plans/` are not invoked by these scripts. CI green therefore does not establish browser correctness or the declared Node 22 environment. Align runtime intentionally and adopt a small isolated browser gate after the local harness is stable; no workflow edits were made here.

## Open business question, not a confirmed defect

`server/src/modules/children/children.service.ts:36` reads a subscription and uses its stored `maxChildren` directly at `:37`, ignoring expiry and `active`. An expired/inactive yearly record retaining `maxChildren: 3` can therefore permit additional profiles up to three. Current rules explicitly require expiry for paid learning, but do not clearly state whether expired-plan profile creation must fall back to the free quota. Confirm that policy with the owner before changing it. Preserve existing profiles regardless; deletion is not an implied remedy. Current child quota test exercises simultaneous free-account creation, not expired-plan policy.

## Existing useful coverage (inspected, not newly executed here)

| Area | Existing test evidence | Remaining acceptance boundary |
| --- | --- | --- |
| Authentication | `auth.test.ts`, `securityHardening.test.ts`, Google auth/integrity suites | Actual browser reload/session restoration; multi-tab refresh contention; real Google consent remains external |
| Child ownership/quota/deletion | `children.test.ts` tests other-parent access, guarded screen time, concurrent quota and cascade rollback | UI onboarding/quota feedback; owner decision on expired quota |
| Lesson/points integrity | `lessonIntegrity.test.ts`, `lessons.test.ts`, `newActivityGrading.test.ts`, `learnerActivityProjection.test.ts` | Real activity controls, persisted state and reload; never infer UI coverage from API tests |
| Parent Gate/dashboard | `parent.test.ts`, `parentDashboard.test.ts` | Browser gate cancellation, wrong answer, successful unlock and refresh retention |
| Payment | `payments.test.ts` uses the actual SDK verifier and test-key signatures; only external checkout creation is mocked (`:7`) | Live provider registration/delivery and money movement are not established by local tests |
| Admin/CMS | `admin.test.ts`, content draft/publish/identity tests, revenue suites | Browser role denial, edits/preview and error/retry presentation |

## Recommended isolated browser/manual-style scenarios

Use temporary localhost MongoDB replica-set data and local-only test accounts. No production writes. Report every scenario as executed/pass/fail/not-run, and label mocked provider boundaries explicitly.

| Scenario | Expected observable result |
| --- | --- |
| Register with mismatched confirmation, then valid input | Client blocks mismatch without API mutation; valid registration reaches onboarding with free plan |
| Wrong-password login, correct login, reload, logout | Wrong login stays unauthenticated; reload restores the correct account; logout returns to a public route |
| Create/select a child, try another under free plan | First profile persists after reload; second attempt is visibly denied without a second DB record |
| Open lesson, read long paragraph, answer and submit | Text is contained on desktop/mobile; actual backend response determines score, progress and points |
| Reload or replay completed lesson | Correct selected child/session; no duplicate completion points |
| Parent Gate wrong answer, cancel, correct answer, reload | Wrong/cancelled gate cannot expose progress; correct answer opens it; reload does not silently discard valid authorization |
| Direct parent access to admin route and API | No admin data is exposed; UI navigation and server role guard both deny access |
| Payment return URL with pending local order | Query parameters alone cannot show a paid plan or activate subscription |
| Local signed payment webhook + retry | Actual verifier accepts test signature; local order/subscription update once; UI reads server-confirmed status |
| Invalid signature and another parent's order | Signature fails with no plan change; order lookup denies cross-account access |
| Microphone denied or unavailable | Clear fallback/error, no fabricated recording success or fake activity completion |
| Simulated local API outage, then retry | Visible recoverable error; no fake zero-data success, no duplicate points or lost entered answers |

## Limits

This review does not establish real PayOS checkout/webhook operation, Cloudinary uploads/deletion, Google identity exchange, iOS/Android microphone/TTS behavior, accessibility conformance, load capacity or production deployment correctness. Those require separately authorized environments or device checks. No coverage percentages were collected.
