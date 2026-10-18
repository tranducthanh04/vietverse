# Offline progress refresh

## What happened

After the admin handoff, took the independent offline-cache finding while
other chats handled backend/audio/admin and responsive header work. Used a
separate worktree to avoid their concurrent changes. The old worker's
count-only event did not refresh points, progress or profile balances.

Regression tests first reproduced five failures. The fix connects the real
QueryClient to an account/child-scoped ACK event, invalidates affected caches
and reloads profiles without inventing points or requeuing accepted attempts.
Expanded coverage to ten cases. All 497 backend and 314 frontend tests pass;
typecheck/build pass; lint has 0 errors and 103 existing warnings. Independent
review found no actionable issue and independently passed 23 offline tests.

## Decision

Preserve server authority and existing child/account response guards. Keep
the ACK durable even when a follow-up read fails. The durable behavioral
contract and stated assumptions live in `docs/offline-sync-refresh.md`, not
this journal. No changes to scoring, permissions or server contracts.

## Next steps

Submit the scoped PR for coordinator review; do not self-merge. Browser/device
offline acceptance remains open. Other audit tasks remain separately owned.

Local fallback: the ak CLI is unavailable, so this journal was written
directly; CLI indexing/validation was not performed. AgentWiki publish skipped.
