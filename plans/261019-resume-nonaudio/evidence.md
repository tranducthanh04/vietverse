# NONAUDIO PR18: final local delivery evidence

Date: 2026-10-19. Existing PR: https://github.com/tranducthanh04/vietverse/pull/18.
Local implementation and verification complete; Draft push, automatic exact-head
checks and coordinator review are separate gates. No author merge or deploy.

## Scope and provenance

- Original PR18 head: b096d6d874dcea6431526471dfc33032341ba9e1.
- First integrated main: 4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66.
- Normal integration commit: 32afb71 (retains both sides of additive conflicts).
- Final approved main: 2a8cd86badacb5206202d2a5d41de82d74ffac53.
- Normal integration commit: de8b2efcd4cf2f8372b963237cdf694181998cc6.
- Final tests include the uncommitted three-string footer change on de8b2ef;
  source hashes, not that HEAD alone, identify the tested contents.
- All final-run before/after diff hashes against4a6 agree:
  14c2afbaf9b577696d5b1ff36878e4ba4d7843482d5df77744e8f3e290d4556c.
- Read-only remote check after testing observed main
  9b809bd3b27ea69cad2da2413825ffb8912d3f98. This newer base was NOT locally
  integrated or tested here; coordinator owns further integration/merge review.

Six production files only: points service (atomic virtual ownership), legacy
grading (canonical fail-closed), paid policy (explicit active/valid expiry),
admin learner detail (zero/missing/status/error/retry), sort reset (including
duplicate words), and three footer CSS classes (stack below640px). Four product
test files accompany these changes. No new schema, endpoint, auth, CMS, F13,
audio/provider/storage/cleanup, receipt, dependency or lockfile changes.

## Commands and actual results

All commands use `node plans/261019-resume-nonaudio/run.mjs PHASE ATTEMPT`.
Runner command receipts contain exact subprocess arguments and timestamps.

| Phase | Actual result | Provenance |
| --- | --- | --- |
| install1 | exit0 | exact lock, no production env |
| focused1 | BE39/40; FE26/26 | new HTTP test fixture/assertion errors |
| focused2 | BE40/40; FE26/26 | corrected fixture, no product workaround |
| full1 | BE554/554 in55files; FE493/493 in48files | initial4a6 integration |
| checks1 | typecheck/build/lint exit0 | initial integration;99warnings/0errors |
| browser1 | failed | early layout and award assertion errors retained |
| browser2 |12PASS/1FAIL | genuine VI320 footer overflow332px |
| footer1 |1PASS/8FAIL | harness expected wrong Next labels; invalid product RED |
| footer2 |55PASS/2FAIL | genuine VI320332px and EN320363px overflow |
| footer3 |57PASS/0FAIL | final footer classes on2a8 integration |
| browser3 |13PASS/0FAIL | final original admin/full-player flows |
| client-focused1 |30/30 in4files | final admin/sort/feedback/navigation |
| client1 |500/500 in49files | final frontend; exit0 |
| checks2 | typecheck/build/lint exit0 | final source;99warnings/0errors |

Server554 result is reused with explicit continuity proof, not relabelled as a
fresh final-head execution. `git rev-parse 32afb71:server de8b2ef:server` returns
the same tree twice: ab85b50ef824a77aec9886e1af2af1bfbac6548a. Both lock blobs are
aee624cd7040be16c8092041d8ac501a12555dd2. Package/config/CI files do not change
between these merges; the remaining footer patch is client CSS only. Final
automatic CI must still run its configured suites on the published PR input.

## What the browser evidence establishes

Real React/router/Axios/Express/auth and a temporary loopback Mongo replica set;
random synthetic JWT secrets, dotenv disabled, Vite envFile:false, off-host
network blocked. Node22.15.0, Chrome155, Mongo8.2.6; no provider/audio actions.

- Admin: zero/missing/status/unlimited values, actual404, injected500 followed
  by actual200 retry, and injected200/null; VI320 and EN1366.
- One-activity full player: wrong loses one heart; reset preserves two hearts,
  stored answer and zero ledger/points; correct completion returns HTTP200,
  score100, stars3 and existing11points (1activity+10lesson).
- Footer matrix: VI/EN320/390/640/1366, Next/Finish, unanswered/wrong/correct;
  document/control/text bounds, no overlap,44px targets,20px font, center hit
  testing when enabled, Tab focus, Enter/pointer activation. Eight real two-
  activity completions return HTTP200/score100/existing12points.
- No page errors or forbidden requests in final browser runs. Native screenshot
  inspection confirms full VI/EN320 labels and separated controls.

## Review, retained failures and limitations

Independent read-only reviewer found no introduced defect in the original five
files, then independently reviewed the approved sixth-file patch, matrix source,
RED/GREEN receipts and screenshots. Final verdict: no new findings; scoped Draft
push after final gates, no merge approval. See review.md; reviewer did not rerun.

Historical F04 failure remains: integration a480b8534360ed9f35a49ee48daedba1bc365bb9
on main1422099 ran516/517 server tests, recordingFinalize.test.ts:148 received
[201,201,201,404] rather than four201. Root command short-circuited before full
frontend. Later green CI39145597609 and current554 passing do not close F04.
Main's existing audio changes are preserved without audio acceptance.

No real-device/production, remote-font, all-activity recorded-status, F13,
linguistic/content-rights or provider acceptance is inferred. Admin copy remains
Vietnamese. Layout assumptions are documented in docs/lesson-player-footer.md.
No new business policy or data backfill is chosen. Missing canonical answers and
incomplete paid records need operational review before rollout.

## Artifact publication

Baseline evidence and manifest.json remain intact. manifest-final.json hashes
all local artifacts and changed source/test files against2a8. Selected new
receipts, exact runner snapshots and before/after screenshots are published;
remaining PNGs/raw logs stay preserved locally in ignored run directories.
The manifest is an inventory, not a claim that every local entry is in Git.

Selected screenshots: footer-2/{vi320,en320}-Finish-correct-failure.png,
footer-3/{vi320,en320,en1366}-Finish-correct.png, and browser-3/vi320-admin-values.png
plus browser-3/vi320-sort-finished.png. Structured receipts retain all attempts.

Delivery uses ordinary push to the existing PR18 branch only. No force push,
branch deletion, direct-main write, self-merge, auto-merge or manual deployment.
Latest-base review and eventual merge are coordinator-owned.
