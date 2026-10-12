# Review remediation - 2026-10-12

Implement the verified review findings in order. No changes to payment or Cloudinary,
no production data writes, secret rotation, commit, push or deployment in this task.

## Phases

1. Security: redact refresh/gate tokens; remove screen-time from ordinary profile updates.
2. Learning integrity: transactionally commit progress, rewards and balance; preserve
   earned progress under concurrent submissions and serialize quota checks for child creation.
3. UI: distinguish failed lessons/quizzes from success, allow quiz retry, isolate late
   responses across child/account/content changes, and confirm registration passwords.
4. Verification: regression tests, full tests/typecheck/build/lint, independent review,
   owning docs and journal. Record remaining external prerequisites separately.

## Acceptance

- HTTP logs retain diagnostic fields but contain neither refresh nor gate tokens.
- Ordinary child profile updates cannot change screen time; gated endpoint still works.
- Failed persistence leaves progress/ledger/balance unchanged; retry earns exactly once.
- Concurrent pass/fail never downgrades completed progress; quota is enforced concurrently.
- Failed learning results are truthful; stale responses cannot affect another learner.
- Password mismatch is rejected before registration; existing email API stays compatible.

## External prerequisites

Google OAuth application configuration, approved translations/audio/provider, private
read-only Atlas audit access and educational/mobile acceptance remain separate gates.
Do not invent credentials, translations or automatically repair historical balances.

## Continuation: dependency hardening

On the owner's follow-up, address production dependency advisories (bcrypt and
React Router), and security headers on Vercel's early database-error response.
Preserve existing password hashes, routing/guards, APIs and all prior local changes.
Verify with legacy hash login fixtures, serverless regression, full tests,
typecheck/build/lint and fresh production audit. Do not force toolchain major upgrades;
record remaining dev advisories separately. No live data writes or deployment.

## Tracking

The AgentKit CLI is unavailable on PATH. This file records scope/acceptance; execution
evidence and completion limits will be recorded in the journal rather than claiming
an indexed plan state was updated.
