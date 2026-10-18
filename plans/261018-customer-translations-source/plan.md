# F13-SOURCE-CAPTURE

Source: customer audit F13/5.4-5.5, completion plan steps 3-4; coordinator
assignment on 2026-10-18. Original main base:
142209912c4711f1d50eeb44ae2dbfb316217eba. Integrated before final verification
by fast-forward to main 01cfa0591feb9bf0015821f19e9f256259544732 (PR19).

## Contract

Capture the supplied 18 October Explore export byte-for-byte in a new dated
source directory, with tab/date/checksum provenance. Preserve 09 October source.
Build an opt-in, pure translation catalog with source lesson/activity/section
identities and exact Vietnamese/locale text. Only explicit one-to-one pairs
are eligible; preserve ambiguous/missing text as gaps, never invent it.
Report B1-B20 coverage separately from runtime mapping/readiness. No importer,
bootstrap, API/model/player/grading/hint timing, audio/TTS or database writes.

## Execution

1. Read source/contracts; independent source inventory and mapping-risk review.
2. Test integrity, exact pairs, missing/ambiguous source and stable identities
   before implementing the pure catalog. Capture provenance and source bytes.
3. Generate coverage, document blockers and propose compatible model/render
   follow-up without changing grading. Verify focused/full tests/type/build.
4. Independent review/simplifier, current-main integration and separate scoped
   PR handoff. No self-merge. Keep PR21 worktree unchanged for review.

CLI ak unavailable; journal records execution evidence, no plan-index claim.
