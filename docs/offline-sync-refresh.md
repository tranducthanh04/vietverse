# Offline submission: refresh points and progress

Date: 2026-10-18. Local implementation, not a production release.
Source: customer audit section 6 / step 9, and the offline cache finding in
`06-review-findings.md` (ViVi Points review dated 2026-10-09).

## Existing business decisions

- Actor: a signed-in parent using a child's queued lesson submission.
- The server remains authoritative for grading, stars, points and unlocks.
- Saving an offline answer is not completion and never awards local points.
- An accepted attempt can be unsuccessful; success of transport does not mean
  the learner passed. Versioned answers, ownership and attention states remain.

## Implementation and presentation assumptions

- After a batch acknowledges at least one submission, its existing browser
  event also carries the submitting account ID and unique affected child IDs.
- The app worker uses its actual React Query client to invalidate the affected
  child's `childPoints` prefix (including history), `stages` and `parentProgress`.
  Active queries refetch; inactive queries become stale for their next mount.
- Reload the current account's child profiles once per batch, so the header
  and child picker receive authoritative balances. Do not sum reward amounts
  or copy an old submission response into the currently selected child.
- An event from a different account or while auth is loading cannot trigger
  these refreshes. Existing child-store request/selection guards discard late
  responses after account changes and preserve a newer child selection.
- A failed refresh does not requeue an acknowledged submission or count it as
  a submit failure. Query error states remain available; if the profile read
  fails, its last confirmed values remain until a later successful refresh or
  navigation. No optimistic points or fake completion are shown.
- Install the refresh listener before startup sync and remove it on worker
  cleanup. Startup, online, periodic and manual retry paths share the event.

## Contracts and ownership

- No HTTP endpoint, payload, server schema, reward rule, Parent Gate or unlock
  policy changes. The browser event is internal, not a new server contract.
- Files owned by this task: `client/src/lib/offlineSync.ts`,
  `client/src/app/App.tsx`, `client/src/test/offlineSyncRefresh.test.ts`, this
  document and its report. Other chats own header and backend/audio/admin work.
- Work is isolated in the `offline-progress-refresh` worktree from `35c51ca`.
  Do not merge unrelated dirty workspace files into this task's patch.

## Acceptance and verification

1. Reproduce stale active and inactive query caches after a real worker ACK.
2. Refresh only acknowledged children; no refresh on a failed submission or
   for the next signed-in account. Keep pending/attention answers intact.
3. Preserve child/account switching guards, batch deduplication and cleanup.
4. Run regression tests, full suite, typecheck/build, lint and independent
   review; record actual results in the task report before marking complete.

Browser/device and production/offline network simulation remain separate
acceptance gates; tests with an HTTP adapter do not prove live connectivity.
