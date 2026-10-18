# Parent stage links - 2026-10-18

Task: PARENT-STAGE-LINKS, customer audit 5.8/F10 and completion plan step 5.
This closes only the missing stage navigation, not the vocabulary, learning-score
or competency-formula portions of F10.

## Behavior and decisions

**Customer requirement:** each parent journey stage offers a way to view its
details or continue it. The destination is the existing child's map, not a new
lesson entitlement or a new parent-only learning page.

- Each card links to `/kham-pha?stage=<stage-id>&childId=<displayed-child-id>`.
  The accessible name includes the stage title. An unlocked, incomplete stage
  with lessons says Continue stage; completed, locked and empty stages say
  View details. Existing progress and lock explanations remain visible.
- New links are hidden if the displayed report no longer matches the selected
  child. The destination checks the optional URL childId against the active
  profile; it never selects a child or fetches data for that query value.
- A mismatched, empty or duplicate childId shows a warning and a link to the
  selected child's bare map. No stage request is issued in that state.
- Stage selection is derived from the current URL and the response to
  `/stages` for the active child. Direct load, refresh and Back/Forward work.
  Selecting a stage updates browser history, retains unrelated query parameters
  and binds the new URL to the current child.
- **Implementation assumption:** without a stage query, keep the existing first
  stage default. An empty, duplicate, unknown or removed explicit stage shows
  an error instead of silently falling back to another stage. The stage list
  remains available for an explicit new selection.
- **Implementation assumption:** locked stage selectors can open read-only
  details. Lock icons and reasons remain visible; selecting a locked stage is
  not unlocking it. An empty stage shows zero lessons, not a fabricated four.
- Existing `/stages` lesson `isUnlocked` remains the sole UI condition for a
  Start/Practice action. Do not infer replay permission from completed status
  or stage order. Server lesson authorization remains unchanged.
- Refetch applies new counts/permissions to the same selected ID. Removing that
  ID produces a missing-stage message. A child change uses a new query key;
  late data for the previous child cannot populate the new child view. A bound
  link shows a mismatch until the correct profile or a new map is chosen.
- Load failures show the common error/retry UI, not an empty or missing stage.

No API/model/store changes, new parameters to backend endpoints, dependency,
score/unlock/replay policy, auth, Parent Gate or screen-time changes. Existing
guards still apply when leaving the parent area for the map. No audio work.

## Evidence and limits

`client/src/test/parentStageLinks.test.tsx` exercises real components, router,
React Query and child store, replacing only the HTTP adapter. Initial 20 cases
failed before implementation; all pass after the scoped change. Existing parent,
child-journey and next-lesson tests remain part of the focused verification.

Browser runner: `node plans/261018-parent-stage-links/browser-smoke.mjs`.
Uses actual components, BrowserRouter, ProtectedRoute, ChildSessionGuard and CSS
with a fictional parent/profile and local HTTP fixtures. Checks VI/EN at
320/640/1366px, click/Tab/Enter, unlocked/completed/locked/empty stages, real
reload/history, invalid IDs and child mismatch. Real font loading is required;
only local requests and public Google Font hosts are allowed. Runtime paths can
be overridden through `PLAYWRIGHT_MODULE` and `CHROME_PATH`.

This is not production authentication/Parent Gate, real student data, real
lesson completion or physical-device acceptance. Full results and integration
baseline are recorded in the task journal and PR. The known intermittent
recording-finalize F04 remains outside scope even if a local suite passes.

Rollback: revert this scoped PR through normal review. Old bookmarked query
parameters are ignored by the old map; no data migration is needed.
