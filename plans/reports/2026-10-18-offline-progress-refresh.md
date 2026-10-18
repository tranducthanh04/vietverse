# Offline progress refresh handoff

Date: 2026-10-18. Status: implemented and locally verified; pending PR review,
merge and browser/device acceptance. This does not close the whole customer audit.

## Scope and source

- Existing ViVi Points offline-cache finding in `docs/06-review-findings.md`.
- Customer full audit section 6 / step 9, read from the shared checkout's
  `plans/reports/2026-10-18-customer-docs-full-audit.md`.
- Separate worktree `offline-progress-refresh`, baseline
  `35c51ca3072f24a674431aa9c0e683ace9d3d8b3` (remote main when verified).
- Remote has no dev branch. No stash, branch switch or edit in the shared
  checkout, and no duplicate packaging of the earlier admin handoff.

## Root cause and implementation

The outbox removed acknowledged submissions and emitted a count-only event.
Nothing refreshed the application's query cache or child-profile store, so
points, map and parent progress could remain stale after successful sync.

The event now includes the submitting account and unique acknowledged child
IDs. The worker receives the application's actual QueryClient, invalidates
points/history, map and parent-progress prefixes, and reloads profiles once
per batch. It installs the listener before startup sync and removes it on
cleanup. Read failures remain separate from submission acknowledgements.

Existing business decisions and implementation assumptions are separated in
`docs/offline-sync-refresh.md`. No server API/schema, grading, reward, unlock,
Parent Gate or screen-time policy changes. No optimistic point arithmetic.

## Verification evidence

- RED: the initial new suite had 5 failing and 2 passing tests against the
  old worker, reproducing unchanged caches and the absent profile refresh.
- GREEN: 10 new regression tests and 13 existing offline tests passed.
  Command: `npm run test -w client -- src/test/offlineSyncRefresh.test.ts src/test/offlineSync.test.ts`.
- Full `npm test`: server 51 files / 497 tests passed; client 36 files /
  314 tests passed. Exit 0. Server used the existing cached MongoDB 7.0.24
  system binary; no production database was used.
- `npm run typecheck` and `npm run build`: server and client passed.
- `npm run lint`: 0 errors, 103 existing warnings. Full tests also emit an
  existing React act warning in the unrelated audio playback test.
- `git diff --check`: passed.
- Independent read-only review: no actionable findings; reviewer separately
  ran the 23 focused tests successfully and checked App/store integration.

Tests cover active/inactive caches, partially acknowledged batches, unsuccessful
saved attempts, submission failures, account changes, profile refresh failure,
listener cleanup/restart, per-child deduplication, legacy queue ownership,
child switching during refresh and logout before a late profile response.

## Remaining gates and ownership

- A failed profile GET retains the last confirmed display until a later
  successful refresh/navigation. It never resends an acknowledged lesson.
- Browser/device offline simulation and production acceptance are not done.
- Existing broader outbox cross-tab races, auth lifecycle and server
  idempotency are unchanged; this patch does not claim to resolve them.
- Other chats own backend/audio/admin/SortOrder and public header/parent
  settings work. Their files and PRs are not included here.
- Coordinator reviews and merges the scoped PR. Do not self-merge, deploy,
  write production data or take another chat's task. Remaining audit work
  requires coordinator ownership/dependency checks before assignment.
