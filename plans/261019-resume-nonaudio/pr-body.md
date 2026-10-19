## RESUME-NONAUDIO-PR18: current delivery (2026-10-19)

This section supersedes the old integration status below, not its historical
failure evidence. Remains Draft for coordinator review; no self-merge or deploy.

### End-to-end work summary

Completed the existing F05/F06/F11, admin learner detail and sort-reset scope,
integrated main4a6 and then approved main2a8 by normal merges, and repaired the
confirmed320px action-footer overflow with only three CSS class changes.
Six production files and four product test files; no audio/auth/CMS/F13/schema/
endpoint/dependency/lockfile changes relative to the approved2a8 base.

### Subagent delegation

One independent read-only review agent reviewed the original five files and
the approved footer addendum. No new findings after the footer fix; no reviewer
test rerun or merge approval. The author ran tests and prepared delivery.

### Technical decisions

- Keep virtual ownership inside the atomic debit predicate; real authenticated
  HTTP regression synchronizes both ownership reads, expecting200/400 and one debit.
- Keep canonical legacy grading fail-closed and paid entitlement strict; preserve
  existing receipt validation, starter/replay and compensation.
- Preserve zero/missing/status/unlimited/error/retry states and duplicate sort
  tokens. Reset alone changes no heart/reward/answer policy.
- Stack footer feedback/action below640px, preserve desktop row, labels,
  readable text,44px targets, disabled conditions and handlers.

### Deviations from plan

- Approved footer addendum expands the original five production files to six
  after a genuine pre-existing overflow was reproduced (VI332px/EN363px at320).
- Approved main integration moved4a6 ->2a8. Local merge de8b2ef and its tested
  working-tree source hashes identify final local evidence; source will be
  committed unchanged. Remote main9b809bd was later observed and is NOT the
  locally tested base; coordinator owns latest-base review/integration.
- Full BE554 is reused with identical server tree/config/lock proof. Full FE
  and all root checks were rerun after the footer/main2a8 changes.
- Complete local raw artifacts are preserved; selected new receipts, runner
  snapshots and screenshots are published to avoid100+ redundant PNGs.
- AgentKit CLI is unavailable; native Git/check commands are used.

### Completion evidence

Evidence: plans/261019-resume-nonaudio/evidence.md, review.md,
manifest-final.json and docs/lesson-player-footer.md.

- Focused BE40/40 and initial FE26/26; final focused FE30/30.
- Full BE554/554 in55files; final FE500/500 in49files.
- Server tree at32afb71 andde8b2ef:
  ab85b50ef824a77aec9886e1af2af1bfbac6548a.
  Lock blob: aee624cd7040be16c8092041d8ac501a12555dd2; package/config unchanged.
- Final root typecheck/build/lint exit0; lint0errors/99warnings.
- Valid pre-fix footer55/57; final57/57 across VI/EN320/390/640/1366,
  Next/Finish and unanswered/wrong/correct, hit/keyboard/geometry checks.
- Final original admin/full-player browser13/13; real HTTP200 completions,
  zero reset points, correct existing11point and12point awards.
- First focused test errors, browser1/2 failures and footer1 harness-label
  errors are retained separately. Historical F04 failure below is NOT erased.
- Final automatic exact-head CI/previews: pending publication/check, not reused
  from old head. No audio/provider/device/production acceptance.

### Checklist

- [x] Scoped implementation, additive main integration and documentation.
- [x] Final local gates, browser evidence and independent code review.
- [x] Preserve historical failures and existing main audio baseline.
- [ ] Ordinary push and automatic exact-head CI/previews verified.
- [ ] Coordinator latest-base review and merge decision.
- [ ] Device/production acceptance (outside this task).

### Human actions required

No further business choice is needed for this bounded CSS repair. Coordinator
must review exact published head/base and current CI/previews before deciding
merge; this author does not merge. Canonical-data/paid-record operational review,
F04/audio, F13 and device/production acceptance remain separate. Do not merge
held mixed PR12 for duplicate scope.

## Historical PR body (retained verbatim)

## Integration Gate Blocked - Do Not Merge

The coordinator requested integration of latest main
`142209912c4711f1d50eeb44ae2dbfb316217eba`. Local normal merge
`a480b8534360ed9f35a49ee48daedba1bc365bb9` preserves the 15-file non-audio scope
and all nine implementation/test files are unchanged from reviewed head `e924877`.
Published evidence head: `b096d6d874dcea6431526471dfc33032341ba9e1` (only journal
changes after the tested integration). Base: `142209912c4711f1d50eeb44ae2dbfb316217eba`.
Fresh focused checks pass 52 server and 19 client cases; typecheck/build/lint pass.
However, the new full test run reproduced the held baseline F04 race:
`recordingFinalize.test.ts:148` expected four 201 responses but received
`[201, 201, 201, 404]`. Publication/merge gate stopped. No retry-for-green,
skipped/weakened test or audio fix. Coordinator explicitly requested pushing
the normal merge and failure evidence while keeping this PR draft/HOLD.
The green CI below belongs only to remote head `e924877`, not this new integration.
Coordinator must not merge using that historical green evidence. Full result:
516/517 server tests passed, 52/53 files passed, exit 1 (179.14s); full client
tests did not run because the root command short-circuited. Any automatic CI
from the evidence push does not erase the local failure or release this hold.
Automatic CI run [39145597609](https://github.com/tranducthanh04/vietverse/actions/runs/39145597609)
was triggered on evidence head `b096d6d`; no manual rerun was requested.

## End-to-end work summary

Extract the completed non-audio customer-audit fixes from held draft PR #12 into one replacement PR. Initial base was main `c7519c0d8dfe609eee9ac3551dff9aeb29fab64f`; normal merges incorporate PR16 and current main `142209912c4711f1d50eeb44ae2dbfb316217eba` (including PR14/17) without conflicts. Included: F05 virtual redemption atomic ownership, F06 canonical legacy grading, F11 paid eligibility, F08/F12 admin values/error states, and F01 sort reset only. Current full-test gate is blocked as recorded above.

Owner explicitly paused unmerged audio work. PR #12 remains intact as a draft; do not merge it alongside this replacement for overlapping non-audio/admin work. This PR neither introduces held audio changes nor reverts audio already on main. AUTH-ROTATION is separate.

## Subagent delegation

- Three shipping delegates: tester, read-only reviewer, and documentation owner.
- Tester installs isolated dependencies and runs focused/full tests, typecheck, build and lint without editing product code.
- Reviewer found no actionable code/documentation findings and verified the audio exclusions and baseline receipt validation.
- Documentation owner updates only the non-audio business/API/inventory/findings/admin documents and a dedicated journal.

## Technical decisions

- Reuse exactly the nine reviewed implementation/test files from PR #12 head `8bdc6b986a77bc9ab3433a778cabf6b44bf3e292`; no cherry-pick of mixed audio commits.
- Ownership belongs in the atomic virtual-item debit condition. Existing compensation remains; this is not a transaction rewrite.
- Missing/empty canonical legacy answers fail closed; client correctness alone never grants credit. Introductory cards and record_voice receipt lookup/validation remain unchanged.
- Paid access requires explicit active status, monthly/yearly plan and finite future expiry; starter/replay policies remain unchanged.
- Preserve zero/status/unlimited values in admin, with explicit missing/error/retry states. Keep sort reset available after an incorrect complete selection without changing hearts/rewards/continuation policy.
- No dependency, schema, endpoint, auth, audio, provider, storage, cleanup, production-data or deployment changes.

## Deviations from plan

- Owner's audio hold supersedes shipping the mixed PR #12. F04 finalize, F09 model audio and F12 parent-recording fixes are excluded and not marked released.
- F01 mandatory retry/hints and F13 bilingual activity behavior remain open pending the documented grading-policy decision. Curriculum and provider/device acceptance are not completed by this PR.
- This is scope extraction, not a new release-version change; no unrelated package metadata bump is carried over.
- AgentKit CLI/language/body-validation scripts are unavailable; Markdown evidence and manual section validation are used. No plan-index closure is claimed.

## Completion evidence

- Dedicated evidence and acceptance boundaries: `plans/journals/2026-10-18-customer-non-audio.md`, `docs/admin-learner-progress.md`.
- Focused tests: server 20/20; client 19/19. All nine extracted files match the prior reviewed commit.
- Historical PR16-base full tests, single fresh run after PR #16 merge: 517/517 server across 53 files and 335/335 client across 38 files; exit 0. Typecheck/build passed; lint 0 errors, 103 existing warnings. Baseline audioPlayback tests emit existing React act warnings. The earlier extraction-base run also passed (517 server/330 client); the second run verified a changed base, not a failed-suite retry. These do not override the current integration failure at the top.
- Install passed with Mongo download disabled only for postinstall; tests use MongoDB 7.0.24 and temporary replica-set data. No production .env copied. Install reports 10 pre-existing development-inclusive advisories; dependencies are unchanged.
- Review: no actionable findings. Excluded audio/finalize/i18n/docs paths and lesson receipt service/validation match baseline main exactly. Whitespace check passes.
- Known baseline risk: unrelated PR #15 head `0f7ae4120021354b487da165a8b4ccb4abe0e6ea`, [CI 39141626708](https://github.com/tranducthanh04/vietverse/actions/runs/39141626708), failed recordingFinalize.test.ts:148 with statuses [201,201,404,201] (496/497 server tests passed). Its server/lockfile match main. Owner still holds F04; this PR does not fix or conceal the race. A local pass does not prove it absent. Do not skip the test or rerun only to obtain green CI.
- Historical CI: [run 39143231119](https://github.com/tranducthanh04/vietverse/actions/runs/39143231119) passed typecheck, full tests and build on head `e924877921e0f7b05b6532a916fa1284b843f5ff`, base `a8014eec01182ea85dd999253b9ced3b91165bd3`; both previews passed. Current-head automatic CI from the evidence push is not merge authorization: confirmed local F04 failure remains open regardless of that result. No self-merge or auto-merge.
- UI screenshots: unavailable for this isolated extraction. Component tests cover admin/retry and sort-reset behavior; they do not replace authenticated browser/device/production acceptance. Existing header/offline behavior remains main's baseline.

## Checklist

- [x] Extract only the authorized non-audio implementation/tests and corresponding documents.
- [x] Preserve held PR #12 code/history and existing audio baseline.
- [x] Independent code/documentation scope review.
- [x] Focused tests, typecheck, build and lint.
- [x] Historical full tests on PR16 base: 517 server and 335 client passed.
- [x] Historical CI/previews on e924877/a8014ee passed (run 39143231119).
- [ ] Latest-main integration gate: blocked by baseline F04 failure; see top.
- [ ] Merge: coordinating review only; auto-merge disabled.
- [ ] Browser/device/production acceptance remains separate.

## Human actions required

- Coordinator reviews the exact head/base and decides merge; this chat does not merge or deploy.
- If the held baseline finalize race fails this PR's checks, stop the gate and report exact run/head. Only owner may authorize a separate F04 exception; do not silently include it here.
- Review legacy canonical answer completeness and incomplete paid-subscription records before rollout; no backfill is performed.
- Resolve remaining F01/F13 policy choices separately. Do not merge both this replacement and the held mixed PR #12 for duplicate scope.
- Rollback, if needed, is a reviewed revert of this non-audio PR, without altering main's pre-existing audio behavior.

## Linked Issues

No linked issue. Replaces the non-audio subset of PR #12; maps F05/F06/F11/F08/F12 admin and F01 reset in the dedicated journal.

## Ship Mode

- Mode: official; target: main; branch: codex/customer-audit-no-audio.
- Base confirmed: 142209912c4711f1d50eeb44ae2dbfb316217eba (initial extraction base c7519c0d8dfe609eee9ac3551dff9aeb29fab64f).
- Delivery: replacement PR for coordinating review, stop before merge.
- Writing language: en (fallback: resolver/project language config unavailable).
