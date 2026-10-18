# AUTH-ROTATION: atomic refresh and revocation

Scope assigned separately from the non-audio replacement PR #18. Initial auth
base: main a8014eec01182ea85dd999253b9ced3b91165bd3. Branch ownership belongs to
this chat: codex/auth-refresh-rotation, isolated auth-refresh-rotation worktree.

## Contract

- Two consumers of one refresh token cannot mint two replacements.
- Consuming the parent and persisting its replacement must commit together;
  failures that abort before commit must restore the parent and remove the
  replacement. Unknown commit acknowledgement is not a rollback guarantee.
- Preserve strict reuse detection: reuse revokes the whole family, without a
  grace window. Concurrent ancestor reuse/logout must include an in-flight child.
- Preserve logout scope, expiry, cookie/response shape, email/Google login/link,
  access JWT lifetime, PIN and email policy. No production session revocation.
- No audio work or changes to PR18. No self-merge, force-push or deployment.

## Execution phases

1. Reproduce duplicate refresh, rollback failure and family/logout races against
   a temporary replica-set DB with deterministic barriers; no production hooks.
2. Reuse the existing account-write transaction pattern, keeping all refresh
   and revocation writes under the same serialized boundary. Commit reuse
   revocation before returning 401. Classify DB failures separately from JWTs.
3. Verify focused auth/Google/cookie regressions, independent review, full suite,
   typecheck/build; update owning docs and create a separate reviewed PR.

## Risks and gates

- Locking a User document serializes refresh/logout for that account; no new
  schema or migration is intended. Transactions require the existing replica-set
  deployment prerequisite and bounded driver timeout.
- Access tokens remain valid until their existing 15-minute expiry; revoking
  refresh tokens is not instantaneous access-JWT invalidation.
- A lost commit acknowledgement can return 503 after successful consumption;
  retrying the old token may trigger strict reuse revocation. New login/Google
  families are outside this lock; concurrent new sign-ins are not serialized
  by account logout.
- Known baseline recordingFinalize race is held by owner. Do not fix, skip, or
  rerun to manufacture green if it fails full/CI verification; report the gate.
- AgentKit CLI is unavailable. This file captures the implementation contract;
  evidence is recorded in a separate journal, without claiming plan-index closure.
