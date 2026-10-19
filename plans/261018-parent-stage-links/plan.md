# PARENT-STAGE-LINKS

Source: customer audit 2026-10-18 section 5.8/F10, completion plan step 5.
Base: remote main a8014eec. Separate from Landing PR #17 and audio work.

## Contract

- Add stage detail/continue links to ParentJourney for the displayed child.
- QuestMap reads stage selection from the URL and supports direct loads/history.
- URL childId is only a context check against the active child, never a selector
  or source of API authorization. Invalid/missing stages and child mismatches
  must not silently open a different stage/profile.
- Locked/empty/completed states remain truthful; only server lesson.isUnlocked
  enables a lesson action. Do not invent replay entitlement or lesson counts.
- Preserve existing auth/child/screen-time/parent guards and API/store behavior.
- Scope: ParentJourney, QuestMap, translations, tests, docs and local evidence.

## Execution

1. Inspect contracts/callers and write failing navigation/state tests.
2. Implement minimal URL selection and accessible stage links; verify focused.
3. Verify full suites/typecheck/build, VI/EN browser3206401366; independent review.
4. Update owning docs/journal, sync current main safely, create scoped PR for
   coordinator review. Never self-merge or deploy; no audio/F04 changes.

Implementation assumption: absent stage keeps the current first-stage default;
explicit invalid selection shows an error rather than silently changing it.
Locked tabs may show stage details without granting a lesson action.
AgentKit CLI unavailable; progress evidence goes in the journal, no index claim.
