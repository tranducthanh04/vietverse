# HINT-OVERFLOW delivery evidence

## Scope and result

The three changed production lines are layout classes in WrongAnswerFeedback
(card wrapping/min-width and source flex item) and ReviewActivity (responsive
container maximum width). All source/translation text is retained. No shared
SupportTranslation, footer, Sort Order, Fill Blank, audio, API, store, server,
dependency, lockfile, configuration, i18n or curriculum changes are made.

Base and HEAD during local execution: `9b809bd3b27ea69cad2da2413825ffb8912d3f98`
plus the uncommitted repair; per-file SHA256 values identify the actual inputs.
Branch: `codex/wrong-hint-overflow`. Subagents: zero. New managed worktree:
`C:/Users/Asus/.codex/worktrees/wrong-hint-overflow/codeDuAN`.

## Browser RED/GREEN

Actual full LessonPlayerPage, three text renderers, VI/EN, widths 320/390/640/1366,
real CSS and loaded Be Vietnam Pro font, Chrome headless, viewport height 900.
Cases cover short text, 216-character unbroken translation, both source and
translation at 5000 characters (spaced and unbroken), and the exact historical
228-character fixture at VI320 and EN1366. This is synthetic API/auth data with
real guards, router, local session store and IndexedDB, not backend acceptance.

| Run | Actual result | Interpretation |
| --- | --- | --- |
| Startup | Assertion `228 !== 216` before browser | QA fixture-label mistake; snapshot retained |
| RED | 24 short PASS, 4 long FAIL | Real card/main/text overflow at both 216 and 228 |
| First GREEN | 93 PASS, 5 FAIL | All 98 text geometries fit; 5 answer-target hit tests stopped behind sticky footer |
| Targeted GREEN | 5/5 PASS | Same product; center-scroll helper reaches the five targets with actual Tab/Enter navigation |
| Text-end extension | 12/12 PASS | VI320/EN1366, three renderers, both 5000-character variants; last source and translation character reachable above footer |

There was no blanket rerun for a green result. The first GREEN receipt remains
failed. The five targeted case IDs exactly equal its five failures. The later
12 checks extend vertical evidence rather than replace failed data.

Geometry checks use DOM Range rectangles for every source and translation line,
card/main containment and clipping ancestors. Text content is compared in full;
no ellipsis, hidden overflow or font shrink is used. All 24 short-case card
rectangles and source/translation font sizes are identical before and after.
Answer/continue controls remain hit-testable and at least 44px tall; answer
controls are also at least 44px wide. Real Tab/Enter performs correction and next
navigation, removes feedback, advances to step 1 and retains expected hearts and
answer state. Source priority skips `other` and blank Japanese to English.

Every completed browser run has zero forbidden requests, console/page errors and
audio calls, with cleanup recorded. Audio elements/play/speak/microphone/recording
are prohibited in these fixtures. The unchanged full frontend suite separately
runs its existing audio tests as regression only, not new audio acceptance.

Known baseline: fully-wrong Sort Order reset is absent in all 32 initial Sort
Order cases. Partial reorder and next navigation work. Footer overflow is not
observed with these short footer labels; this does not disprove the separate
long-label PR18 finding. Neither baseline is fixed or hidden here.

## Automated quality

- Focused: 118/118 tests, 8 files, including 20 new content/state contracts.
- Full frontend: 509/509 tests, 50 files; zero failed/pending tests.
- Root typecheck and build: exit 0 (both server and client).
- Root lint: exit 0; 0 errors and 99 existing warnings. No suppression added.
- No local full backend run: CSS-only scope. Exact pushed-head configured CI is
  required separately; the workflow runs both backend and frontend tests.

## Evidence locations

All paths below are under `C:/Users/Asus/AppData/Local/Temp/` and remain local,
not uploaded assets. `evidence-manifest.json` records 158 file hashes, snapshots,
receipts, screenshots, logs and tested source. Run
`node plans/261019-wrong-hint-overflow/collect-evidence.mjs --verify` to verify.

- `vietverse-hint-red-OfyqJ5`: initial startup snapshot/product diff; no receipt
  because the fixture assertion occurred before receipt persistence.
- `vietverse-hint-red-QdusmF`: actual RED receipt and screenshots.
- `vietverse-hint-green-8v69Vb`: complete initial 98-case run, including 5 failures.
- `vietverse-hint-green-FCL5aS`: five corrected-scroll checks and target screenshots.
- `vietverse-hint-green-ZbN7QG`: twelve additional text-end checks and screenshots.
- `vietverse-hint-quality-ItAnzL`: focused/full JSON reports, all five logs/receipt.

Native visual inspection included VI320 Review original216 reachable answer,
VI320 Review and Fill Blank 5000-character unbroken endings, VI320 Sort Order
spaced ending, and EN1366 Review spaced ending. The source and translation wrap
without losing text, and the final lines and controls sit above the footer after
scrolling. Not every screenshot was manually inspected; the full matrix has
automated geometry checks.

## Review and integration boundaries

Author reviewed the full product diff, test/harness and existing selection logic;
no outstanding product finding identified in the scoped change. This is not an
independent coordinator review. No credential or private data is introduced;
fixtures use example.test and loopback, and allow external GETs only for fonts.

Main changed to `89a2d850fd3ec13b6334cd4e1b70fd54da11eca0` before delivery. A first
local read failed because the object was not fetched; after a read-only fetch,
the delta was inspected: PR31 changes api.ts and its tests/docs, not these product
files. No merge/rebase was done. The old local run is not relabeled as current-main
integration. Exact PR CI merge provenance must be checked before merge; coordinator
owns integration, review, merge and postchecks. No author merge or deployment.

No business decision is introduced. Synthetic wording is an explicit QA
assumption. Dedicated owning doc is `docs/wrong-hint-responsive.md`; shared
docs02/03/05/06 updates are deferred to coordinator serialization. Physical-device,
screen-reader, production, audio/F04, R01 and whole-Docs acceptance are excluded.
