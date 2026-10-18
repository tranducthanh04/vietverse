# Auth refresh rotation: atomic session boundary

Date: 2026-10-18. Base: `8ac98f9`.
Branch: `codex/auth-refresh-rotation`, isolated worktree.

## Root causes and implementation

- Separate token consume/create/profile reads were not atomic; concurrent live
  reads could mint twice and a failure after consume could lose a valid session.
- Family revocation/logout could finish before an in-flight descendant insert,
  leaving that descendant live. A transaction on token documents alone is not
  enough to serialize this cross-document race.
- Refresh, ancestor reuse and logout of existing sessions now share a real
  transactional User.__v write. Refresh rereads the token and reads the response
  profile in-session; logout uses stable account ordering when needed.
- Reuse revocation returns from the callback so the revoke commits before 401.
  Throwing inside the callback would roll back that security action.

## Unchanged decisions and explicit limits

- Strict reuse/no grace; access JWT 15 minutes; refresh JWT seven days. No schema
  migration; replica set required. Transaction budget 15 seconds, commit budget
  five seconds; locator work is outside that bound.
- Transient DB errors map to 503, invalid JWT to 401, programming errors retain
  their central error path (normally 500). Failure does not set/clear cookies.
- Unknown commit ACK can return 503 after commit. Do not promise every 503 leaves
  the original token usable; a retry may trigger strict family revocation.
- Login/register/Google family issuance remains outside this lock. Account logout
  is not a barrier excluding all concurrent new sign-ins; existing access JWTs
  keep their TTL.
- Audio/F04, PIN and email policies are unchanged. PR #18 remains separate. No
  production session revocation, credentials/config changes or deployment.

## Verification evidence and pending release gates

- Coordinator reported six deterministic RED failures before the source fix and
  six GREEN after it. Expanded suite: 14 new plus 36 existing auth tests pass,
  50 total; server TypeScript check passes.
- This writer inspected auth.service.ts, authRefreshAtomic.test.ts, controller
  cookie sequencing and existing transaction error mapping; the counts above are
  coordinator evidence, not additional test runs by this documentation agent.
- Independent final tester, one full run on base `8ac98f9`: server 511/511 in
  52 files (271.99s), client 343/343 in 38 files (20.12s), `npm test` exit 0.
  New atomic auth tests 14/14. Typecheck, build and lint each exit 0; build 1,832
  modules, lint zero errors and 103 existing warnings. Existing audioPlayback
  act warning remains. Finalize passed in this run but its known race is not
  repaired; no retry-for-green, skipped tests or audio edits.
- Independent two-pass code/security review found no actionable source/test
  findings. Scoped simplifier ran clean. Review's documentation caveat about
  unknown commit acknowledgement was incorporated into the plan and docs.
- PR CI, coordinator merge and post-merge verification remain pending; local
  passing tests are not a production/browser acceptance claim.
- Owning docs: docs/03-feature-inventory.md, docs/04-system-architecture.md,
  docs/05-api-and-data-contracts.md, docs/06-review-findings.md and
  docs/auth-session-rotation.md. Baseline sections remain intact.
- No stage/commit/push/merge performed by this docs handoff. AgentKit CLI is
  unavailable; preserve evidence as Markdown without hand-editing plan status or
  claiming whole-plan completion. AgentWiki publish skipped.
