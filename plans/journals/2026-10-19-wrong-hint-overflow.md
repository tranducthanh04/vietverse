# 2026-10-19: scoped wrong-hint overflow repair

Times are Asia/Saigon. This is a new task after PR29; PR29 is not modified.

- About 10:42: started at approved pin 9b809bd in a new managed worktree, clean
  status and branch codex/wrong-hint-overflow. Shared checkout and QA snapshots
  remain untouched. No subagents or new chats.
- Read AGENTS, docs README/01-07, completion plan/full audit and Delta-A/consolidated
  QA evidence. Existing business behavior is authoritative; scope is CSS only.
  Used fix/debug/TDD/frontend/test skills to require actual geometry RED/GREEN,
  preserve runtime behavior and keep new browser work text-only.
- First harness startup caught `SYNTHETIC_UNBROKEN_`.repeat(12) being 228, not
  216 characters. Terminal assertion `228 !== 216` was a harness error before
  browser launch. Immutable snapshot remains in vietverse-hint-red-OfyqJ5.
- RED QdusmF: 24 short controls passed, four long cases failed actual geometry
  (VI320/EN1366, true216 and original228). Root cause is intrinsic token width
  plus Review's nonresponsive maximum width.
- Applied exactly three class-line changes in two product files; no text or
  state changes. No global SupportTranslation edit needed.
- About 11:00: initial GREEN 8v69Vb finished 93/98. All text geometries contained;
  five target checks failed because Playwright nearest-scroll stopped behind
  the sticky footer. Retained full failed receipt/screenshots. Corrected only
  the helper to center-scroll when hit testing fails and record both geometries.
- 11:02: targeted FCL5aS passed exactly those five cases. Actual Tab/Enter and
  unchanged hit/size assertions prove reachability; no product or footer edit.
- 11:02-11:05: quality ItAnzL passed 118 focused, 509 full frontend, root types,
  build and lint (0 errors/99 warnings). Existing audio tests ran unchanged as
  regression, no new audio testing. No local full backend run.
- 11:05-11:06: twelve ZbN7QG boundary cases pass extra last-character hit/scroll
  checks. Both source/translation5000 and both spacing variants covered in all
  three renderers at VI320/EN1366. Inspected representative native screenshots.
- Collector confirms all 24 short rectangles/fonts unchanged, 98 distinct cases
  covered, 32 known full-sort reset absences and zero observed footer overflow
  for these fixtures. It verifies actual loaded font and 158 source/evidence hashes.
- 11:06: remote main advanced to89a2d85 (PR31). Local object read first failed;
  read-only fetch enabled delta inspection. No overlap with scoped runtime
  files. Kept base9b809 and reported provenance instead of silently merging.
- Author review found no scoped product issue. Added owning doc, report and
  manifest; shared docs indexes remain deferred. ak CLI absent: native Git/gh
  workflow used, no AgentWiki publication or plan-index closure claim.

Delivery is a new Draft PR with ordinary branch push only. Coordinator owns
independent review/current-base integration/merge/postchecks. Final head, PR and
configured CI status are recorded in the chat delivery receipt, not inferred
from the local evidence. No secret/dependency/config/audio/policy changes.
