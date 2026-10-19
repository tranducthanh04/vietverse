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

## End-to-end work summary

The RESUME-API-GATE-403 assignment follows docs02 Parent Gate, docs05 auth contracts
and docs06 P0.4/P1-FE.7. Reproduced the race on main4a6b, applied the ownership
comparison, ran regression/browser/quality gates, obtained independent local review,
and created this PR by ordinary push. Normal merges then integrated main2a8 (PR15)
and main9b809 (PR29) with fresh affected gates. This continuation corrects the missing
PR-body contract; coordinator review is interim, not final approval. No author merge
or manual deployment has occurred.

## Subagent delegation

One subagent, `resume_gate_review`, was reused for this assignment (not a model-family
comparison): read-only product/test/harness review completed with no outstanding
product issue; its P3 runner signal-exit finding was fixed and rechecked. As the Git
delivery seat it pushed/created PR31 and later merged exact approved main9b809 without
conflict. The main agent authored the fix/reports and executed the tests. Coordinator
is a separate existing chat and owns final review/merge/postchecks; not counted as a
spawned subagent or claimed final approval.

## Technical decisions

- Compare the actual failed-request credential case-insensitively, not a caller's
  intended header. Only equal nonempty string bytes own current state.
- A rewritten local deadline does not make identical token bytes a new credential.
  Missing request evidence preserves storage but never accepts a denied response.
- Keep original error rejection and server enforcement; no automatic403 retry or
  auth/401 queue change. Synthetic browser renewal isolates ordering; it does not
  substitute for real server signing/PIN/auth acceptance.

## Deviations from plan

Main advanced twice while delivery was underway. Coordinator authorized normal
integration of PR15 and PR29; the existing API/test patch stayed unchanged and new
affected gates ran, without relabeling old receipts. Initial lint used the wrong
local dependency entry; both failed attempts remain recorded before corrected links
passed, with no install or lockfile change. The first PR body omitted delivery-contract
sections; this revision fixes that Important finding. No product-scope expansion.

## Evidence

### Completion evidence

- **Before:** new27-case real-Axios regression suite:10failed/17passed on main4a6b0a1.
  **After:** focused97/97; original full server534/534 +client504/504.
  Prior main2a8 integration atd730e58: full client511/511.
  Current main9b809 integration at14c48652af13c707526df5aeb00305bfbdf1aaae:
  focused109/109 and full frontend516/516 across50files; both typechecks/builds pass.
- Browser: fresh4/4 actual-layout VI/EN320/1366 matrices at14c4865; old403 preserves newpair,
  Retry sends newtoken, current403 clears pair, fresh mount redirects.
- Lint:0errors99warnings after correcting local dependency links; two infrastructure
  failures retained. No dependencies, lockfile, config or warning thresholds changed.
- Independent local code review: no outstanding product findings; runner signal-exit
  handling corrected. Coordinator found the body omission above; final review pending.
- Latest receipts/commands/limitations: plans/261019-resume-parent-gate-integration/post-picker-report.md;
  local artifact hashes: post-picker-manifest.json in the same author-worktree folder.
  Previous reports/manifests are historical snapshots, not overwritten. Original
  RED/failed lint/full receipts remain preserved in plans/261019-resume-parent-gate-403/.

Current base9b809bd3b27ea69cad2da2413825ffb8912d3f98 includes PR15 and PR29.
Server534 was run before this merge, not relabeled: server tree/package/config/lock
inputs remain identical. Exact-PR-head automatic CI must still pass configured gates.

Browser auth/renewal/HTTP are synthetic fixtures, not real login/PIN/signing or
production proof. External fonts blocked. Existing full-suite audio tests are
regression evidence only; audio/F04 and R01 remain excluded. Shared docs index
links are coordinator-owned; dedicated contract documents the changed behavior.

## Checklist

- [x] Failed-request ownership and current-token cleanup have real-Axios regressions.
- [x] PR30 auth/hints/probes, server, packages and lock inputs are unchanged.
- [x] Fresh focused tests, types/build/lint and four browser matrices pass on14c4865.
- [x] Fresh full frontend516/516 passes at tested integration14c4865.
- [x] RED10fail17pass and both lint infrastructure failures are preserved with causes.
- [x] No new secrets, provider/production writes, dependencies or business policies.
- [ ] Exact-new-head configured CI and both previews must pass; old green is historical.
- [ ] Coordinator final review, serialized shared-doc links, merge and postchecks remain.

Real authentication/PIN/signing, production/device/fonts, audio/F04, R01 and whole-Docs
acceptance were not performed or claimed; these are explicit scope limits.

## Human actions required

None from the user for this scoped fix: no new policy, credential or purchase decision.
Coordinator must complete independent review and exact-head CI/preview gates before
merging, then verify postchecks. Live production/auth acceptance remains outside this
author's verification; no manual rollout is requested.

## Linked Issues

No linked GitHub issue identified; repository issue search for `parent gate` returned
none. Traceability is RESUME-API-GATE-403 and the source docs/plan above. No automatic
issue closure is requested.

## Ship Mode

Ordinary commit/push update of existing PR31 into `main`; no duplicate PR, force push,
auto-merge, author merge or manual deployment. CLI `ak` and its PR-body/language
validator scripts are unavailable locally; native Git/gh and manual contract checks
are used. English is retained as the default GitHub prose language; no locale override
was found. Remote API uses native `gh` GraphQL, not a REST fallback.

## Merge Danger

**Door:** two-way

Revert scoped comparison; no database or schema migration.

**Blast Radius:** ParentGate

Shared Axios403 cleanup affects gate-protected callers. Always reject original
error; no automatic403 retry. Coordinator owns exact-head CI/preview review,
merge and postchecks. Author has not merged or deployed.
