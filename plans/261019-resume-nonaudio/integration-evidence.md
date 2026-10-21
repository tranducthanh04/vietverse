# PR18: approved main9b809 integration

Date: 2026-10-19. Same RESUME-NONAUDIO-PR18 task; no new implementation.
This report supersedes the current delivery state in evidence.md, whose prior
2a8 results and historical failures remain intact. Draft, no author merge/deploy.

## Exact inputs and merge

- Prior published PR18: 9f67c3cca7ee9d0482211b0da30eff1797499b53.
- Approved post-green main: 9b809bd3b27ea69cad2da2413825ffb8912d3f98 (PR29).
- Normal merge: adc4705270d6a50e7f0a3276afd7a358467846b7.
- Incoming delta from2a8 has seven files. Only product change is three accepted
  picker class strings in KidsLayout; other files are its test/docs/harness.
- Only conflicts: docs/03-feature-inventory.md and docs/06-review-findings.md.
  Resolved additively, retaining every line from both parents in order (verified
  by subsequence comparison for both files/both parents). No ours/theirs replace.
- All five non-conflict incoming files match9b809 byte-for-byte. Complete
  seven-file merge diff inspected. Original ten PR18 source/test SHA256 values
  match manifest-final.json; no additional product implementation.
- Final client tree:604e4cc5a80a2851b43925ce0e1096a5778bc8ed.
- Runner before/after source diff hash against4a6:
  58b162b843b869675559ea6609cdcdac4055f26c0c77e9ae5bc0bb3680bca007.

## Full backend evidence reuse (not a new execution)

Original full-1 actual result:554/554 server tests in55files on4a6-integrated
source subsequently committed as32afb71. Reuse is allowed by the assignment
because every server source/test/config and all package/lock/CI inputs are
identical. No local backend suite or new audio actions were run in this step.

`git rev-parse 32afb71:PATH adc4705:PATH` returns identical values for each row:

| Path | Both Git object IDs |
| --- | --- |
| server |ab85b50ef824a77aec9886e1af2af1bfbac6548a|
| package-lock.json |aee624cd7040be16c8092041d8ac501a12555dd2|
| package.json |28e2f790ef6d6f2f0947e5c8e0dc53d10c05c3be|
| client/package.json |413171df7ce6a8839b78fe9b237e1555848a87f0|
| server/package.json |9c315ee2c071293af9da238a63aefbbdabd1564c|
| .github |d9c48b9fcedda0b9e09dbf4fe29a8f55486e0404|
| client/vite.config.ts |33b9ab8975492a22447b33265ee824aab2509019|
| client/tsconfig.json |335e6fb21fe91b9907424e3afea365ba80ddaef4|
| client/tailwind.config.js |1bdd06d633aeef0c94110d81d03edaa7ea85cb61|

No dependency install/config/env changes. The original full-1 receipt/JSON and
old F04 failure evidence are not modified or relabelled. New exact-head CI must
still run the unchanged configured full checks; green does not close F04.

## Fresh final-input checks

Run from this worktree with Node22.15.0 and the existing isolated runner:
`node plans/261019-resume-nonaudio/run.mjs PHASE ATTEMPT`.
The runner snapshots its scripts, scrubs env, disables dotenv, rejects non-loopback
connections and uses only a disposable synthetic local replica set for browsers.
No provider/recording/payment/publish/production action is authorized or exercised.

| Command suffix | Actual result | Evidence directory |
| --- | --- | --- |
| client-integration 1 |57/57;6files;exit0 |client-integration-1|
| client 2 |505/505;50files;exit0 |client-2|
| checks 3 |typecheck/build/lint exit0;0errors/99warnings |checks-3|
| browser 4 |13/13;exit0;no page errors/forbidden requests |browser-4|
| footer 4 |57/57;exit0;no page errors/forbidden requests |footer-4|

Focused scope: admin learner detail, sort reset, WrongAnswerFeedback activities,
next-lesson navigation, incoming picker and child journeys. Five additional
picker tests explain505 vs the prior500 full frontend. Existing full-suite
audio warnings/tests remain unchanged regression coverage, not audio acceptance.

Browser assertions/harnesses are unchanged from browser3/footer3: actual admin
HTTP/Express/auth/Mongo and full-player wrong/reset/correct; VI320/EN1366 for
original13 cases, plus VI/EN320/390/640/1366 for57 footer matrix checks. Synthetic
faults are separated from real responses. No second picker-specific browser
suite is claimed by this author; picker/child-journey component regression and
the original integration browser flows are the requested fresh checks.

All five receipts pin adc4705/main9b809 and the same before/after source hash.
Native inspection of fresh footer4 VI/EN320 Finish-correct screenshots shows
full labels, separated praise/action and in-viewport controls. Numerical text,
44px target/hit/keyboard bounds and actual HTTP completions remain established
by structured assertions, not inferred from images. Both language flows retain
existing11-point one-activity and12-point two-activity awards, with no reset
reward/heart refund. All new runs pass on their first execution at this pin;
there is no retry-for-green. Prior failures are preserved separately.

## Review and delivery boundaries

Prior independent source/footer review remains in review.md; this integration
does not add product code beyond approved main. Author checked the full merge
delta and continuity, not an independent coordinator approval. Coordinator owns
review of exact final head/base, readiness, merge and post-merge checks.

Keep six production files/four product tests relative to9b809; no seventh-file
fix or unpublished API31/hint/F13/map/R01/audio work. No direct-main write,
force-push, branch deletion, auto-merge, manual deploy or historical-test weakening.
Before ordinary push, verify remote main remains9b809; if it advances, report
instead of silently integrating. Check exact published-head CI and both previews.

Original rawbrowser1/2, footer1 invalid harness RED, footer2 valid product RED,
and historical F04 remain intact. Evidence from9f67's successful previews is
historical only; its absent Actions while conflicting is not current CI.
Fallback fonts/synthetic local Chrome/Mongo do not establish real-device,
production, all-activity recorded-status, linguistic/rights, provider or F04/F13
acceptance. No canonical-data/paid-record backfill is performed.

manifest-integration.json inventories this new pin and all local artifacts;
manifest.json and manifest-final.json remain their original immutable files.
Their historical mutable harness/plan entries refer to their respective Git
versions, not a claim those current working files never evolve. Old raw run
directories remain byte-identical; selected new receipts/snapshots/screenshots
are published and remaining raw logs/PNGs are retained locally, not deleted.
