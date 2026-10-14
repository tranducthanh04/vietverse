---
title: PayOS webhook registration repair
status: completed
priority: P1
effort: small
branch: main
created: 2026-10-14
---

## Scope and acceptance

Repair the verified webhook registration blocker without bypassing signatures,
creating payments, or changing subscription rules. No VPS credentials available.

- [x] Scout controller, schema, service, SDK, payment tests and deployment evidence.
- [x] Diagnose: PayOS documents signed sample transactions for confirm-webhook;
  the service throws 404 for every signed transaction with no local order.
- [x] Reproduce with the documented payload shape signed using test-only keys.
  RED: two unknown-order cases return 404 instead of 200; diagnostic code case
  returns INTERNAL_ERROR instead of PAYOS_INVALID_SIGNATURE (3 failed, 8 passed).
- [x] Acknowledge authenticated unknown orders without DB writes; preserve
  signature, schema, amount and transaction checks; add diagnostic error codes.
- [x] Run regression, full tests, typecheck/build; review actual diff.
- [x] Update API/inventory/review docs and hand off deployment limitations.

## Verification and review

- Payment suite: RED 3 failures (including the 404 registration reproducer),
  GREEN 11/11; expanded test-order regression GREEN 12/12.
- npm test: backend 486/487; one unrelated recordingFinalize concurrency case
  returned [201, 404, 201, 201] rather than four 201s. No audio changes made.
- Isolated recordingFinalize rerun: 23/23. This does not erase the full-run failure.
- Frontend independently: 232/232. Both workspace typechecks and build passed;
  final server build and git diff --check passed.
- Local diff review: signature verification still precedes lookups/ACK; schema,
  amount checks, test-order isolation, transactions and real-order idempotency
  remain. Unknown signed orders intentionally receive 200 and require manual
  warning-log reconciliation, documented in API/review docs. No secret changes.
- Work is local only: no commit/push/deploy performed in this repair turn.
  Live PayOS registration and production key/channel matching remain unverified.

## Evidence and uncertainty

- https://payos.vn/docs/api/ (confirm-webhook) explicitly sends sample bank data
  and requires signature verification; webhook delivery requires a 2xx response.
- https://payos.vn/docs/du-lieu-tra-ve/webhook documents orderCode 123, amount 3000.
- SDK 2.0.5 verifies data + signature without requiring a local order.
- The screenshot's generic 400 does not identify the backend failure stage.
  Fixing the reproducible unknown-order blocker does not prove the live checksum
  key matches the selected PayOS channel. Production confirmation remains pending.
- main matches remote 0e59153; no remote dev branch, so no branch switch/merge.
- Existing untracked .superpowers/ and plans/261012-user-qa/ are untouched.
- Latest known Actions deploy failed with missing server host; no deployment claim.
