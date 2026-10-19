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

Pre-PR baseline updates: merged main normally after header PR11, then after
offline PR13 (`c7519c0`), without conflicts or changes to story code. Fresh
client321/321, typecheck/build and diff-check pass on the combined branch.
No rebase or force-push. Earlier backend/browser inputs remain unchanged.

ak CLI unavailable: local journal fallback, no CLI index/validation claim.
AgentWiki publish skipped.

## 2026-10-19 delivery resume

Human instruction "lam not cho xong nhe" releases scoped nonaudio delivery.
Coordinator creates managed resume-story-label-pr15/codeDuAN from old0f7ae41;
branch codex/resume-story-label-pr15. Old checkout/head and shared deletions are
untouched. No dev ref exists; pinned remote-main4a6b is merged normally into the
new branch, yielding5e4ae65174aeaa75b2d41503e6f6e07f96a5ef13. No conflict;
net production diff remains only StoriesPage. Baseline audio/auth/CMS is retained.

Node22.15.0; npm ci --ignore-scripts --no-audit --no-fund installed locked742
packages without lifecycle scripts or dependency changes. Only env examples are
present; browser uses envFile:false. Focused command actually executed story7
and cover30, all37 pass; the guessed contentPresentation filter matched no file
and is not counted. Full frontend uses direct Vitest CLI maxWorkers=1 and
fileParallelism=false:48 files/484 tests pass in127.80s. qaPresentation's10
tests are included there. Root typecheck/build exit0; lint0errors/99warnings.
No additional backend execution; new remote full CI is still required.

Fresh browser command: node plans/261018-story-type-label/browser-smoke.mjs.
Eight VI/EN320/639/640/1280 cases pass; no page exceptions/page overflow.
Artifacts: C:/Users/Asus/AppData/Local/Temp/vietverse-story-labels-1oAguA.
All four PNGs equal the corresponding committed historical PNG hashes, so no
image overwrite is needed. Coordinator viewed all four using native vision.
The fixture does not load a real learner/account or publish content. Browser
and Vite close in finally; port5194 is free. Clean HEAD/status before/after.

Source/test/runner SHA256:
- StoriesPage:60FD01C1353162DC400A01B113D6D93311B99F372B48AF55B9E255A3F13360FC.
- storyTypeLabels:1086423E792CF5DC88AE4C3B2AB6B732BB12683FF36A1B6D78E934DCD08DC39D.
- runner:7BF8616E3C45EF68C00DA68ED64A01A8FCF743EE81E848E64CCD86DEC6A7A66A.

Historical CI39141626708 F04failure is not erased: recordingFinalize.test.ts:148
got[201,201,404,201]. No retry-for-green or F04/audio edit. Main's external PR30
does not establish audio approval. New integration must receive exact-head CI
and previews before merge. Full source/test/docs review found no Important or
Critical product issue; PR body needed explicit current evidence/required
sections and historical-vs-current gates, corrected with this delivery update.
Final docs-only delta can reuse unchanged local runtime/test evidence, not old
remote CI. No merge/deploy/whole-backlog completion claim.
