# F13-SOURCE-CAPTURE evidence

## Scope and provenance

Assignment: customer audit F13/5.4-5.5 and completion plan steps 3-4.
Original base: 142209912c4711f1d50eeb44ae2dbfb316217eba. Fast-forwarded before
final verification to main 01cfa0591feb9bf0015821f19e9f256259544732 (PR19).
Remote main still matched that integration base at the final pre-package fetch.
Worktree: customer-translations-source; branch: codex/customer-translations-source.
Shared checkout and the separate PR21 worktree were not edited by this task.

Coordinator supplied the Explore-tab Markdown export from Google Docs
1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM, tab t.6aij8uhnuc6p.
Full export was read; exact 46,637 bytes independently checked against SHA-256
173d0c2bf181ec9209b857267063c8454223ef176457339f8f9c8be5d8156d49.
Captured 2026-10-18 Asia/Saigon; this is not a Google revision/edit timestamp.
Local .gitattributes preserves exact source bytes and intentional Markdown spaces.

## Implementation and test progression

- Added separate dated source, manifest, pure opt-in parser and stdout JSON report.
- Initial nine source tests failed against an empty typed parser; implementation
  then exposed five failures from repeated B17 question-specific hint identities.
  Preserved those identities with question suffixes; did not suppress duplicates.
- Added coverage RED tests (including explicit stub outputs), implemented coverage,
  then added malformed-table, orphan-context and ambiguous-reference regressions.
- Final 14 new tests cover checksum, exact labelled pairs, missing VI, reordered
  labels, ambiguous glosses, source identities, explicit reuse, raw lines and gaps.
- Inventory: 75 eligible prompt groups + 8 hint groups = 415 pairs, 83 per locale.
  Five groups missing exact VI are retained but not paired. No translated passage
  or subPrompt was found. Full B1-B20 gaps are in the source coverage document.

## Final local verification on integration base

- Focused source/catalog suite: 19/19 tests pass. Rerun after moving imports to the
  top of the module also passed; server typecheck passed after that edit.
- Full root npm test: 511/511 backend tests in 52 files; 369/369 client tests in
  40 files. Exit 0, run started 23:43:54 Asia/Saigon on 18 October.
- Root npm run typecheck and npm run build passed. Build warnings remain baseline.
- First lint attempt failed before analysis because the new worktree lacked the
  nested client dependency directory (@eslint/js could not resolve). Read-only
  inspection found it in the existing checkout; a local client/node_modules
  junction fixed resolution without changing dependencies/package files.
  Rerun npm run lint passed: 0 errors, 103 existing warnings.
- Existing React act warning in audioPlayback.test.tsx was not hidden or changed.
- Read-only report produced 415 pairs. Snapshot/importer/bootstrap/model/runtime
  and package-lock diff checks against integration base were empty.
- The initial tracked git diff --check passed. During packaging, the staged
  check also covered new files and caught one extra blank line at the parser's
  EOF. Removed that whitespace-only line; staged git diff --check then passed.
  The staged Git source object also retained the exact byte length and SHA-256.
  No production DB writes, importer/publish/migrate,
  browser or runtime translation claims. Tests used local temporary MongoDB.
- recordingFinalize passed in this run; this does NOT close known F04 or authorize
  any audio change. Other PR failures remain evidence for their own heads.

## Review and delegation

Two existing subagents contributed sequentially: review_admin_fix independently
inventoried source before returning to priority PR21; review_source_capture then
reviewed parser/source/coverage and read-only import boundaries. No actionable
correctness finding. Review limits: no linguistic approval, live Google revision
verification, runtime mapping or production validation. Simplifier suggestions
were applied: top-level imports and explicit original/integration bases.
The source reviewer is reused as git-manager for scoped packaging/push/PR only.
Main agent owns implementation and verification. No self-merge is permitted.

## Decisions, deviations and human actions

Technical decisions: exact labelled pairs only; Markdown decoding with raw lines;
explicit uniquely matched B15 reuse; source identities are not runtime ordinals.
No business policy changed. Capture is not translation/publication approval.
ak CLI unavailable: this journal is evidence, not a plan-index completion claim.
Worktree dependency junctions are local environment setup, not tracked artifacts.

Next separately approved task: additive model/CMS/DTO/render contract using
durable target IDs, contentVersion and exact VI validation; preserve legacy
snapshots, grading, answers and hint exposure. Do not silently import this source.
Owner/content editor still must resolve missing VI/gloss labels, B11 slot/answer,
B15 story/choices, B19 supplementary content, B20 rules and retry-vs-final-grading.
Do not request already supplied clear translations again. No audio/provider work.

## PR21 integration verification - 2026-10-19

- Fetched and verified pinned main `5baf9172029c9f1276697e918e2a345c4723ea07`.
  Normally merged it into this branch without conflicts or history rewriting.
  Tested integration code head: `28b72cbbf39faa23361da5009e785173b0ae521e`.
  The subsequent packaging commit changes this journal only; the exact final
  head is recorded in the PR body. No self-merge or production mutation.
- Source/parser/report/tests are byte-identical to reviewed source head
  `7269402a55f79cb2a7680ee54905d223ba9c841f`. All inherited client code and PR21
  dedicated docs/screenshots are identical to pinned main. Shared inventory
  and findings docs retain PR21 sections; only the existing F13 additions differ.
- Focused source/catalog: 19/19 tests in two files, exit 0, started 00:02:56
  Asia/Saigon. Full root `npm test`: 511/511 backend in 52 files and 389/389
  frontend in 41 files, exit 0. Full run started 00:03:23; backend 194.06 seconds,
  client 20.05 seconds. Each command ran once; no failures or reruns-for-green.
  Tests used the local MongoDB 7.0.24 binary and disposable test replica sets.
- Root `npm run typecheck`, `npm run build` and `npm run lint` each passed,
  exit 0. Lint reports 0 errors and 100 inherited warnings after PR21. The
  existing audioPlayback React act warning remains. recordingFinalize passed
  all 23 cases in this run; that does not close intermittent F04 or change audio.
- Both committed source bytes and SHA-256 remain exact: 46,637 bytes,
  `173d0c2bf181ec9209b857267063c8454223ef176457339f8f9c8be5d8156d49`.
  October 9 source/default importer/bootstrap are identical to pinned main.
  Coverage remains 415 pairs (83 per locale); no translation or runtime change.
- Local logs are outside the repository in the worktree parent as
  `integration-focused.log`, `integration-full-test.log`,
  `integration-typecheck.log`, `integration-build.log`, and `integration-lint.log`.
  PR22 is still source-only. Exact-head CI and coordinator code review remain
  separate gates; the prior head's green checks are not claimed for this update.
