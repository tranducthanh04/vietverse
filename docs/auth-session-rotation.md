# Atomic refresh-token rotation and logout

Date: 2026-10-18. Status: locally verified, then integrated main `1422099`;
PR CI and release gates remain pending. Scope is separate from PR #18 and audio/F04.

## Existing policy, unchanged

- Actor: a caller presenting an existing refresh token; account-scoped revocation
  also remains available to existing service callers with a userId.
- Refresh JWT lifetime remains seven days; access JWT lifetime remains 15 minutes.
- Strict reuse detection has no grace period. Reusing a revoked token revokes its
  family, not unrelated families or accounts. Two simultaneous refreshes with one
  token can yield one successful response followed by revocation of that family.
- Existing route authentication, trusted-Origin checks, cookie attributes,
  response profile and email/Google/PIN policies remain unchanged.

## Technical decision and transaction boundary

1. Verify the refresh JWT and locate its stored hash. The locator read is not the
   authoritative authorization check.
2. Begin a MongoDB transaction and perform a real write to the owning User:
   increment existing `__v` with `timestamps: false`.
3. Reread the refresh-token record within the transaction. If already revoked,
   revoke the family and return from the transaction callback. Return 401 only
   after that transaction commits; throwing 401 inside would undo revocation.
4. For an active token, consume the old token, persist its replacement in the
   same family and read the public response profile under the same session.
   A pre-commit error rolls back those changes together.
5. Set the replacement cookie only after the service returns successfully.

Logout takes the same account write boundary before revoking the selected family
and/or existing account sessions. When two owner scopes are supplied by a service
caller, acquire them in stable order. This serializes logout and ancestor reuse
with refresh descendants; transactions on distinct token documents alone would
not provide this shared boundary.

No model, index or migration is added. MongoDB must support transactions (replica
set); there is no non-transactional fallback. Transaction options are
`timeoutMS: 15000` and `maxCommitTimeMS: 5000`, bounding the transaction/commit
budget, not guaranteeing an end-to-end request deadline including locator reads.

## Failure behavior and limits

| Situation | Outcome |
| --- | --- |
| Invalid/expired JWT or missing stored token | 401, no replacement cookie |
| Stored revoked token | Commit family revocation, then 401; no grace |
| Transient DB/transaction failure | 503 `DATABASE_UNAVAILABLE`; no replacement/clear cookie |
| Programming error | Remains an error for the central handler (normally 500), not a fake invalid-token 401 |
| Successful logout | Revoke selected scope, then clear refresh cookie |

Existing domain/validation error mappings remain in force. A known pre-commit
rollback preserves the original token, but an unknown commit acknowledgement can
produce 503 after the server already committed. Therefore not every 503 means the
old token is reusable: retry can encounter strict reuse revocation and 401. No
grace window or idempotent response recovery is introduced here.

New families from login/register/Google issuance remain outside this account
transaction lock. Account logout does not guarantee exclusion of concurrent new
sign-ins. Existing access JWTs are not immediately revoked; their 15-minute TTL
is unchanged. This task performs no production revocation or deployment.

## Acceptance and evidence

`server/src/test/authRefreshAtomic.test.ts` exercises real temporary replica-set
writes with deterministic barriers: simultaneous rotation; replacement/profile
failure rollback; ancestor reuse, family logout and account logout during minting;
revocation after locator read; family/account isolation; partial logout rollback;
HTTP failure cookies/status; sequential profile/cookie compatibility; invalid,
expired and unstored tokens. No production accounts or DB are used.

Six deterministic RED cases before the source fix, then GREEN; expanded 14 new
plus 36 existing auth tests pass (50 total). Independent full validation on base
`8ac98f9`: 511 server and 343 client tests pass; typecheck/build pass; lint has
zero errors and 103 existing warnings. Two-pass source/test review found no
actionable code findings. After integrating main `1422099` at `37c87b4`, fresh
client tests pass 366/366 in 39 files and typecheck/build/lint pass (same warning
count). Server, root package and lockfile are unchanged, so the 511-server-test
evidence is retained, not represented as an additional run. Details are recorded in
`plans/journals/2026-10-18-auth-refresh-rotation.md`. These checks do not prove
production, cross-tab browser behavior or unknown-commit recovery. The existing
recording-finalize race remains held/unresolved even though this local run passed.
