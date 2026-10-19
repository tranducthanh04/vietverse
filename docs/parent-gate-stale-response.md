# Parent Gate response ownership

RESUME-API-GATE-403, 2026-10-19. Client lifecycle correction, not a new business
policy or server authorization bypass. Separate prerequisite for R01 navigation.
This integrates the scoped correction from local6ef8ab6 onto main4a6b0a1 while
preserving PR30 session hints, legacy probing and the auth/401 request queues.

## Contract

- Server signature, purpose, account ownership and expiry remain authoritative.
  No endpoint, payload, token TTL, PIN/email policy or model changes.
- A403 PARENT_GATE_* clears the stored gate token AND unlock deadline only when
  the failed request carried a nonempty string token equal to the current one.
  Header lookup is case-insensitive, including plain error-header maps.
- A delayed old/tokenless request, missing config or missing header evidence
  must not erase a replacement credential. The original error still rejects.
- A current-token denial still clears both keys. Same token bytes remain the
  same credential even if a local deadline was rewritten; no lifetime extension.
- No automatic403 retry, navigation redirect, reactive storage subscription or
  generation counter is introduced. The existing caller error/retry UI remains.
- Ordinary403/non403 behavior,401 refresh/retry, authPost ordering, session-hint
  cookies, legacy probes and explicit auth lifecycle cleanup remain unchanged.

## Decision and assumptions

Technical decision: compare the actual outgoing credential stored in the failed
Axios request config with current storage at response handling time. Missing
evidence is insufficient to invalidate another credential, never permission to
accept the failed request or bypass server enforcement.

Browser renewal deliberately writes synthetic token/deadline values to isolate
ordering. Real ParentLayout, ProtectedRoute, dashboard, retry component, router,
CSS and Axios interceptors execute; auth/child/progress HTTP data are fixtures.
This does not certify server challenge/signing, PIN, real login/cookies, R01 or
production. A fresh ParentLayout may issue a tokenless query before redirecting;
this patch neither hides nor changes that existing lifecycle.

## Integration status and documentation boundary

Shared docs02/03/05/06 are deliberately unchanged while other assignments run.
Their historical blanket403 invalidation description must be read with the
more precise ownership rule here. Coordinator owns later index/inventory links.
The old6ef worktree and all QA snapshots remain unchanged. The old quota/local-only
delivery restriction was superseded by the new human instruction to finish
nonaudio delivery; this assignment may create a scoped PR, but author may not merge.

Fresh evidence and command receipts live in
`plans/261019-resume-parent-gate-403/`. Historical green tests are not reused as
integration acceptance. Audio/F04 and other open findings are not closed.
Rollback is the scoped API comparison revert; no migration or data rewrite.

Final integration: coordinator authorized merging main2a8cd86 (PR15 story labels)
into commit3983720. Runtime/test changes remain identical. Fresh integration gates
and source-continuity limits are recorded in
`plans/261019-resume-parent-gate-integration/report.md`; this supersedes only the
delivery checkpoint, not the original receipts or contract.

Latest PR31 continuation integrates approved main9b809bd (PR29) at14c48652.
The API/test patch is unchanged. Fresh109focused,516full frontend, quality and four
browser matrices pass; server534 retains original execution provenance with exact
source continuity. See `plans/261019-resume-parent-gate-integration/post-picker-report.md`.
The PR-body omission is corrected; coordinator final review/CI/merge remain separate.
