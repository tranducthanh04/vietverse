# Customer feedback: mobile language control and translation row alignment

Date: 2026-10-18 (Asia/Saigon)
Base: main at 37804b05b2004fb758987264382613d62f0203da; fetched and already current.

## Scope and causes

- The user authorized the next fixes after a review of customer screenshots.
- KidsLayout and ParentLayout hid the only language control below 640px.
- StoryEditor and CultureEditor updated source arrays without moving/deleting the matching translated entries. Lyrics, vocabulary and fun facts share this index-based contract.
- No changes to business policy, API payloads, permissions, points, provider integrations, production data or deployment.

## Repairs

- Show the existing VI/EN control at all widths and wrap header controls when space is limited.
- Carry source-row indices through StringRows structural edits and remap every existing language in the same form update. New rows have empty translations; source text duplicates do not affect mapping.
- Preserve missing translation fields and unrelated translated sections; remove emptied translated fields/languages. Text/timestamp edits retain the same row's translation for editorial review.
- Update the current CMS operations, feature inventory, audio/translation scope and review findings documents. Previously misaligned saved content still requires manual review.

## Verification history

- Added 23 tests: 21 source-row scenarios and two CSS-backed mobile control tests. Before the fix, 15 translation cases and both mobile cases failed on the expected behavior. The six compatibility cases already passed.
- First mobile test attempt imported inline CSS that Vitest did not compile. Replaced it with actual Tailwind utility generation using the project config; the test then correctly failed on the hidden controls before the implementation change.
- Related suite after repair: 41/41 passing. Corrected an unsupported Testing Library `exact` option found by typecheck, without changing assertions.
- Typecheck and build passed for server and client. Lint passed with zero errors and 103 existing warnings.
- Browser fixture mounted the real layouts and stylesheet with synthetic local state only. Both layouts at 320/390/640/1366px expose both language buttons, each 44x44px, with no document/header horizontal overflow. Verified Vietnamese/English switching using click and Enter. This is not an authenticated production-route test.
- First full backend run: 495/497 passed; recordingOwnership/full_flow failed because dummy nonempty Cloudinary credentials selected the external adapter. No real credentials were used. With Cloudinary variables explicitly empty, the intended local test adapter was selected and both affected files passed (15/15). No application changes were needed for these failures.
- Full monorepo rerun with the corrected isolated test environment: `npm test` passed, 497/497 backend tests (51 files) and 304/304 frontend tests (35 files). The existing audioPlayback/ParentRecordingsPage `act()` warning remains. No skipped or failed tests in this final run.

### PR preparation verification

- The user subsequently authorized creating a PR and merging it into main. The PR contains only the mobile/CMS fixes, regression tests and their documentation; the original untracked directories remain excluded.
- A fresh full-suite run before committing failed one unchanged backend test: `recordingFinalize.test.ts:148` received `[201, 201, 404, 201]` for four concurrent finalize calls (496/497 backend tests passed; the root command then stopped before frontend tests).
- Five consecutive isolated reruns of all 23 tests in that file passed without code changes. Backend, lockfile, test configuration and workflow files are identical to the fetched main baseline. This is an intermittent baseline risk, not a repaired issue.
- The existing main CI run at the same baseline also failed on exactly this assertion and status sequence: https://github.com/tranducthanh04/vietverse/actions/runs/39048063090 (2026-10-17). This independently confirms that the failure predates this PR.
- Code inspection found a possible read race in `recordings.directUpload.ts`: the receipt lookup can miss immediately before another request commits; the following intent lookup can then see `completed` and return 404 without rechecking the receipt. This is a diagnosis hypothesis, not a deterministic reproduction. No backend fix or weakened assertion is included in this frontend PR.
- A subsequent complete run on the unchanged code passed all 497 backend and 304 frontend tests, followed by successful server/client typecheck and build. Fresh lint also passed with zero errors and the same 103 warnings. The earlier concurrency failure remains disclosed; a green rerun does not mean that baseline risk is fixed.

## Remaining gates and cleanup

- Paid voice provider still needs customer confirmation and approved audio; device voice absence is not repaired by these changes.
- Production recording acceptance and the ambiguous question-entry feedback remain unverified.
- Removed the temporary browser fixture, stopped its local Vite server, closed the test tab and reset the viewport. Preserved the pre-existing untracked .superpowers/ and plans/261012-user-qa/ directories.
- At the end of the local implementation pass, no commit, push, CMS publication or deployment had been performed. PR preparation and merge were authorized afterward; no manual CMS publication or deployment is included.
- The `ak` CLI is unavailable; this local journal was written with file tools. AgentWiki publish skipped.
