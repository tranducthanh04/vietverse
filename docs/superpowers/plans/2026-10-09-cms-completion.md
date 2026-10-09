# CMS completion and review handoff

Date: 2026-10-09. Plan: `2026-10-09-cms.md`. All ten implementation tasks completed. Independent review range: `f727c60..b7a83da`; final fixes are committed after that range.

## Review and evidence

- No Critical findings. Important seed/import identity collision fixed with draft reservations and shared writer lock; regressions cover editing/discarded drafts, split identities, lock contention and first publication.
- Blank-renderer mismatch re-graded Important because accepted published questions lost text. Renderer now agrees with the validator on one underscore run; learner and preview regressions prove the suffix remains.
- Both fixes followed RED -> GREEN; final full suite: server 171/171 (21 files), client 87/87 (16 files). Typecheck/build pass. FE lint: 0 errors, 101 existing warnings. Full outgoing whitespace check passes, preserving raw source checksums.
- Final local Chrome headless QA passes at 1366x900 and 390x844: real source lyrics, seven preview types, old-version child reload, stale-editor 409 preserving text, publish/withdraw, failed media, parent gate/dashboard reload. No pageerror. QA used isolated MongoMemoryReplSet and loopback only; no microphone, payments or production writes.
- Remaining warnings: client bundle 626.57 KB (gzip 186.27 KB), large-chunk and React Router v7 warnings. Dependency advisories were not re-assessed.
- Source bundle: 49 entries (20 lessons, 21 stories, eight culture). Imported only into test/QA databases. Missing editorial content, unsupported activity formats, media and rights are not declared production-ready. Publish defaults false; no real environment setting changed.

## Rulings I made

The following are the complete chronological decisions from the implementation ledger, including their costs if wrong.

- Ruling: remain on main in current checkout per user's explicit preference; no new worktree — avoids moving agreed work — cost if wrong: local changes share checkout, checked before each task.
- Ruling: use partial unique creator/requestId index — sparse compound indexing would index drafts without requestId if creator exists — cost if wrong: retry identity requires migration before use.
- Ruling: plan task headings are level 2; bundled task-start successfully extracts them — no workflow script adaptation needed.
- Task 1: Ruling: add normalization editorial-note reason and shared metadata helper — avoids mislabeling a legacy conversion as missing source and avoids duplicated model fields — cost if wrong: additive DTO enum adjustment.
- Task 2: Ruling: reopen startDraft adds optional expectedDraftVersion — spec requires deliberate CAS reopen, absent from abbreviated plan signature — cost if wrong: callers must supply one additional version on reopen.
- Task 2: Ruling: list merges projected summaries in memory for current small catalog, avoiding payload arrays and regex entirely — scope is existing fixed catalog — cost if wrong: larger catalogs require aggregation pagination.
- Task 4: Ruling: upload response explicitly includes id alongside _id — the existing recorder expects id, and a fallback truthy answer is unsafe — cost if wrong: additive response field only.
- Task 5: Ruling: add userId to new outbox items; legacy items may sync only after their child is loaded under the current parent — prevents cross-account sends before ownership context exists — cost if wrong: legacy queue waits until child list loads.
- Task 5: Ruling: disable legacy learner preview URL and link to CMS now; dedicated renderer arrives in Task 9 — avoids childless access and preview mutations during cutover — cost if wrong: old preview links require an extra click, no partial deployment.
- Task 7: Ruling: import drafts atomically in one transaction rather than start/save separately; retain immutable internal seedKey on draft-only imports through first publish — prevents partial provenance and duplicate seeds after rename — cost if wrong: additive internal metadata/migration, no client write access.
- Task 7: Ruling: reviewed import uses deterministic new IDs and optional expectedPlan; same checksum always skips even discarded/synced/manual edits — preserve lifecycle and authored content — cost if wrong: source changes require explicit reviewed re-import tooling.
- Task 8: Ruling: use createMemoryRouter in tests instead of MemoryRouter because production uses data-router useBlocker — exercises real navigation guard — cost if wrong: tests require router context.
- Task 8: Ruling: lock nested lesson controls during save while metadata remains editable; response updates assigned activity IDs and preserves in-flight metadata typing — avoids array identity merges and lost server IDs — cost if wrong: brief save latency blocks activity editing.
- Task 9: Ruling: preview imports six pure renderers directly, never the registry containing live recorder — structural exclusion of recording/child effects — cost if wrong: new renderer types need explicit preview wiring.
- Task 9: Ruling: source variant choice remains explicit lyric editing with immutable snapshot and visible notes, not an automatic variant-switcher — preserves all source without assuming equivalent variants — cost if wrong: selecting another variant needs deliberate edit.
- Task 10: Ruling: whitelist legacy reads independently from stricter CMS authoring schema, allow immutable existing lesson order above20 — explicit preserve-old-catalog contract — cost if wrong: extra projection schema must stay aligned, unsafe legacy media must be corrected before new publication.
- Task 10: Ruling: built-in CUA kernel fails sandbox initialization; use bundled Playwright with existing headless Chrome and loopback-only requests, no dependencies installed — still exercises real browser without native UI — cost if wrong: does not prove headed/Safari/device behavior.
- Final: Ruling: preserve exact raw Markdown export trailing spaces and scope whitespace exception to only three checksummed source snapshots — stripping would invalidate provenance — cost if wrong: Git whitespace lint intentionally excludes end-of-line spacing in those three source files.
- Final: Ruling: re-grade blank renderer mismatch to Important — published content accepted by CMS loses part of the learner question, not cosmetic polish; align renderer with existing validator — cost if wrong: existing underscore runs are now interpreted as one blank, matching authoring contract.
- Final: Ruling: keep draft seedKey reservations through discard and serialize seed/import apply using existing catalog writer lock — avoids silently publishing demos or racing between planning and insert — cost if wrong: interrupted imports require operator reconciliation of a stale lock.
- Final: Ruling: unchanged non-recording grading fallbacks and reward compensation remain baseline remediation, not expanded in this CMS change — current version/ownership protections and reward keys stay intact — cost if wrong: baseline compensation failures still need manual reconciliation.
- Final: Ruling: production media/rights, devices/Safari/axe and advisory exploitability remain unverified external acceptance items — local tests and browser QA cannot establish them; publish remains disabled — cost if wrong: production launch waits on separate evidence and content review.

## Deferred minors

- At the original handoff: source notes were only above the editor, and dialogs lacked full focus trap/Escape behavior. User continuation authorized completing both on 2026-10-09.
- Both now implemented: exact-field/group source notes including empty groups and accessible descriptions; native modal confirmations and navigation blocker, cancel-first focus, Tab/Shift+Tab wrapping, Escape cancellation and focus restoration. Original source/payloads remain unchanged.
- Browser acceptance: actual Chrome at 1366px/390px proves native `:modal`, inert background, keyboard wrapping, Escape and opener focus, source descriptions and unsaved text retained without mutation; no pageerror. Safari/real devices/axe remain outside this local proof.
- Follow-up reviewer: no Critical/Important. Minor missing adjacent legacy `activities.N.correctAnswer` notes fixed with its own RED -> GREEN regression. Whole frontend suite 92/92; backend 171/171 unchanged, typecheck/build pass, lint remains 0 errors/101 warnings.
- Follow-up rulings: native dialog targets modern supported browsers; Safari/physical devices/screen readers/axe still need separate acceptance (cost if unsupported: modal requires a browser upgrade or reviewed polyfill). Production import/configuration/media rights/assets stay outside this UI-only change (cost: content still cannot be declared published/ready). Arbitrary hidden/custom dialog children are not introduced; current callers only have visible action buttons (cost if expanded later: revisit focus selector). Reviewer does not certify executor test counts; command output and actual browser runs are the evidence (cost: verification must be rerun after later code changes).

## Release boundary

User authorized direct main work and push. A pushed commit is not proof of a successful hosted deployment or a production database import. Follow `docs/cms-operations.md` for backup, target/admin confirmation, dry-run, import and controlled publication. Never replace live customer content by rerunning seed.
