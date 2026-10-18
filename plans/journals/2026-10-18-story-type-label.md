# Story type labels

## What happened

Coordinator assigned customer audit 5.6 after the offline-cache PR. Started
from verified remote main 35c51ca in a separate story-type-label worktree;
kept PR13 isolated. StoriesPage's ternary mapped fables and all legacy values
to poems. The corrected regression suite first showed 5 failures / 2 passes.

## Decision and implementation

Use an explicit switch for the four existing types, reuse typeNguNgon, and
omit unknown badges in both responsive positions. No taxonomy, dictionary,
API or content changes. Durable behavior/assumptions and evidence are in
docs/story-type-labels.md. A malformed constructor/no-cover fixture exposed
an unrelated inherited-key crash in CoverPlaceholder; reported, not fixed.

## Verification and next steps

Focused 17/17, full server497/client311, typecheck/build pass. Lint has zero
errors and 103 existing warnings. Independent code/test review has no
actionable findings. Browser smoke passes eight VI/EN viewport cases with
local fixtures; four screenshots are included. Real device/production
acceptance remains open. Submit a separate scoped PR for coordinator review;
do not self-merge or change tasks already assigned to the other chats.

ak CLI unavailable: local journal fallback, no CLI index/validation claim.
AgentWiki publish skipped.
