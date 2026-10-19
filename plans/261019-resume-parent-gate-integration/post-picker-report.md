# PR31 post-picker verification and body correction

2026-10-19, same RESUME-API-GATE-403 assignment. Workspace:
`C:/Users/Asus/.codex/worktrees/resume-parent-gate-403/codeDuAN`.
Prior delivered head:9ca4db4db412bdbe35ebb567ae2ee156b93341ee.
Approved main base:9b809bd3b27ea69cad2da2413825ffb8912d3f98.
Actual tested merge head:14c48652af13c707526df5aeb00305bfbdf1aaae.
Tested tree:b5422f972d71f0636c7c9650246644b3621072e8.
Subsequent commit changes delivery docs/harness metadata only, not product/tests.

## Scope and corrections

Coordinator authorized normalmerge after PR29 postchecks, not another task. Inspected
all seven incoming filenames and full integration delta: three KidsLayout CSS lines,
five picker tests and owning/shared additive docs/harness/journal. No conflict.
Relative to approved main, product remains ONLY api.ts (+8/-3); it and its27test file
are byte-unchanged from prior reviewed9ca. No parent/layout/auth-store/server edits.

The original PR body had only Summary/Evidence/Merge Danger. Corrected the Important
delivery-contract finding by adding explicit end-to-end workflow, one reused subagent,
technical decisions, deviations, acceptance evidence, checklist, human actions, Linked
Issues and Ship Mode. Independent read-only recheck reports no outstanding body or
implementation finding. Coordinator's own review remains interim, not final acceptance.
Native gh GraphQL works; ak CLI/body validator/language resolver are unavailable. No
configured locale override found; retained default English GitHub prose and manually
checked every required section. Issue search `parent gate` returned none; no invented
issue link, approval, pipeline result or production claim.

## Fresh commands and receipts

Run from the workspace root; each command exits0. `base` below is the full approved
9b809bd3b27ea69cad2da2413825ffb8912d3f98 value, not an unresolved shell variable.

- `node plans/261019-resume-parent-gate-integration/run-client.mjs post-picker-focused 9b809bd3b27ea69cad2da2413825ffb8912d3f98 focused`:
  109/109 across7files: Axios27/auth14/Google10/settings24/child22/picker5/story7.
- `node plans/261019-resume-parent-gate-integration/run-client.mjs post-picker-full 9b809bd3b27ea69cad2da2413825ffb8912d3f98 full`:
  516/516 across50files, no failed/pending tests. Focused tests overlap; not additive.
  Logs and JSON named post-picker-focused/post-picker-full are in this folder.
- `node plans/261019-resume-parent-gate-403/run-checks.mjs quality quality3`:
  server/client types, server/client builds and client lint all exit0. Lint0errors,
  99warnings, unchanged threshold. Five quality3 logs live in the original plan folder.
- `node plans/261019-resume-parent-gate-403/browser-smoke.mjs browser3`:
  four VI/EN320/1366 matrices pass at actual14c4865. Browser3 evidence/screenshots
  live in the original plan folder; head/headAfter match and cleanedUp:true.

Browser asserts exact new token/deadline survive old403, original error stays visible,
actual Retry sends new token and shows7lessons, current403 clears both keys, fresh
mount redirects and tokenless query is denied. No unexpected requests/page errors;
expected403/blocked-font diagnostics retained. Twelve fresh images SHA256-match all
twelve previously inspected originals. This is byte-identity comparison, not a new
independent human visual review. No font/provider traffic allowed.

## Provenance, limits and next gate

Server534 remains the original4a6b-plus-patch/3983720 execution, not rerun/relabelled.
Server tree stays8c34441c7f3d30e052afe0a7aedf1e1a2d5e8422 across3983720/9ca/14c.
Root/client/server package and lock/config diffs are empty. This is source continuity;
exact-new-head configured full CI must still run. Existing audioPlayback act warning
remains; no audio/F04 repair, targeted acceptance, skip or retry-for-green.

No failures in this continuation. Original RED10fail17pass, lint quality4 missing
dependency exit2 and lint2 missing entry exit1 remain in original reports/logs. Browser
uses synthetic auth/child/HTTP/renewal, fallback fonts and real layout/Axios: no real
PIN/signing/login/cookie/DB, production/device/WCAG/R01/whole-Docs acceptance.

Local-only post-picker-manifest.json includes fresh receipts, relevant current source
hashes and previous manifest bytes; old snapshots are not rewritten. API hash remains
2e2775a21198d92788d6f046ae3bfd9b4aa2db4018ee380f7bc0bc0ba6d4d359. New manifest is not
staged to avoid another bulk duplicate; reviewer can read it in this shared worktree.

Ordinary commit/push updates existing PR31 with auto-merge off. Coordinator owns final
exact-head review, CI/previews, serialized shared-doc links, merge and postchecks.
Author does not merge or manually deploy; no new user policy/credential decision.
