## Summary

```diff
 on PARENT_GATE_*403
-  clear stored gate token and deadline
+  clear both only if failed request token is nonempty and equals current token
   reject the original error
```

Prevents a delayed old/tokenless denial from erasing a newly unlocked gate.
Current-token denial still clears both keys, even if the local deadline changed.
Only production change is client/src/lib/api.ts; PR30 hints/probes/auth401 queues
remain unchanged. No server authorization or business-policy change.

## Evidence

- **Before:** new27-case real-Axios regression suite:10failed/17passed on main4a6b0a1.
  **After:** focused97/97; full server534/534 +client504/504; both typechecks/builds pass.
- Browser:4/4 actual-layout VI/EN320/1366 matrices; old403 preserves newpair,
  Retry sends newtoken, current403 clears pair, fresh mount redirects.
- Lint:0errors99warnings after correcting local dependency links; two infrastructure
  failures retained. No dependencies, lockfile, config or warning thresholds changed.
- Independent review: no outstanding findings; runner signal-exit handling corrected.
- Full receipts/commands/limitations: plans/261019-resume-parent-gate-403/report.md;
  local artifact hashes: evidence-manifest.json. Raw artifacts remain in author worktree.

Browser auth/renewal/HTTP are synthetic fixtures, not real login/PIN/signing or
production proof. External fonts blocked. Existing full-suite audio tests are
regression evidence only; audio/F04 and R01 remain excluded. Shared docs index
links are coordinator-owned; dedicated contract documents the changed behavior.

## Merge Danger

**Door:** two-way

Revert scoped comparison; no database or schema migration.

**Blast Radius:** ParentGate

Shared Axios403 cleanup affects gate-protected callers. Always reject original
error; no automatic403 retry. Coordinator owns exact-head CI/preview review,
merge and postchecks. Author has not merged or deployed.
