## Summary

MAP-CHILD-GREETING: customer audit5.2/5.4, completion step6, captured Explore
main-screen greeting. Reuse approved VI/EN copy and current activeChild only.

```diff
 map banner
+  selected child's greeting (plain text, full-name wrapping)
   existing map.title h1
   existing map.subtitle
```

No new fetch, auth/store/API/model, stage/URL/permission/point/audio changes.
Normal-merged main `05872f40b2f8c4c6b90ad18263dd8c8ee11d1d33` (footer, after
header23). Only inventory text conflicted; preserved both sections. No header
or footer implementation is part of this PR's diff against main.

## Evidence

- Before:7 regression tests failed from missing greeting; after:9/9 passed.
- [x] Footer-base focused map/header/i18n/parent/child/next-lesson:76 tests pass
  (the prior75 plus childStore1).
- [x] Footer-base full frontend:425 tests,44 files pass, including footer22.
- [x] Root typecheck/build pass; lint0 errors,100 existing warnings.
- [x] Full root preintegration:525 backend +398 frontend pass. Backend/package/
  lock inputs are unchanged by both integrations; backend evidence reused.
- [x] Reused browser evidence from ce72d9a, not a fresh footer-base run:
  real KidsLayout/guards/picker/map with new header, VI/EN320/640/1366,
  30 greeting cases +6 switch-backs/30 matching PATCHs; full text/escaping,
  range/clipping bounds, six44px nav targets, header/bottom clearance pass.
- [x] Reused stage browser regression on new header:48 activations +6
  URL/history matrices pass, including locks, invalid IDs and child mismatch.
- [x] Independent review found no actionable scoped issue; reviewer ran39
  relevant tests; conditional simplifier found no worthwhile changes.

Details and local screenshot locations: `plans/261019-map-child-greeting/browser-evidence.md`.
Commands, failures and integration history: `plans/journals/2026-10-19-map-child-greeting.md`.
Fresh unit/typecheck/build/lint revision: `3fcbe569954b77e913e5efdf0a6f0c0dfd253563`.
Browser-tested revision: `ce72d9aa5cb9f4c47364abd71030202d0220a1a4`. The diff
changes only public components not mounted by the fixtures, footer tests and
two unused footer keys per dictionary; map/KidsLayout/guards/stores, existing
copy, CSS/config, package/lock inputs and runners are unchanged. The new public
landing scroll utility is scoped to a heading absent from both fixtures. This
supports scoped evidence reuse, not a claim of byte-identical compiled CSS.
Subsequent evidence-only commits do not alter executable inputs.

## Merge Danger

**Door:** two-way. Revert this scoped change; no migration or new environment setup.

**Blast Radius:** map presentation. Existing guards and server unlock rules stay.

## Limits, Delegation And Human Actions

- Main owns code/tests/docs; browser delegate owns runner/report; separate
  read-only reviewer and git-manager package verified changes.
- Harness failures retained: initial Vite port collision, then substring name
  matching selected the wrong fixture. Free-port strict binding and exact-name
  assertions fix those proven harness causes; no timeouts widened or tests skipped.
- Baseline picker dropdown has separate30-character-name overflow beyond its
  option (53.53px); not fixed/hidden by greeting. Coordinator informed.
- Synthetic local fixtures only; not production login/DB, physical-device,
  screen-reader, axe, payment, Parent Gate or screen-time acceptance.
- Existing act warning and F04 remain outside scope; a green suite does not
  close F04. No audio work or production writes/manual deploy.
- ak CLI unavailable: files/journal fallback, no plan-index closure claim.
- Coordinator reviews CI/exact head and merges; implementation chat never merges.
  No new owner policy or credential action required for this scoped task.
