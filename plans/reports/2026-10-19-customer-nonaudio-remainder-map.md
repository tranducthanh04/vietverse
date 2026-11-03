# Customer non-audio remainder map

## Outcome and scope

Research timestamp: 2026-10-19 00:22 Asia/Saigon. Assignment: DOCS-REMAINDER-MAP, analysis only. This report proposes **four implementation tasks: two READY and two BLOCKED**. These are tasks, not PR counts, and not a count of every remaining item in the full customer backlog. READY means bounded requirements can reuse existing behavior; the navigation tasks still wait for the overlapping header PR to merge and for coordinator assignment. Nothing here implements a feature or approves a new business policy.

Code baseline and report branch start: `5baf9172029c9f1276697e918e2a345c4723ea07`, branch `codex/customer-remainder-map`. All repository file/line citations below refer to that immutable commit unless explicitly marked otherwise. Fresh remote main overlay checked: `53a447a369fed0d69b455749a053b694a159a753` (PR20). The overlay changes server auth and its docs/tests, not the cited Kids/Parent layouts, client auth/session stores, parent reporting, Lesson or LessonProgress models. Thus the UI/data gaps remain applicable, but the old server-auth implementation is not presented as current.

Only this report and a separate journal may change. Audio/TTS/recording/provider/storage/F04, PIN/email policy, scoring, retry/final grading, B20, rights, taxonomy and content authoring are excluded. Existing audio code is not removed. No production login/logout, writes, publish, migration or deployment was performed.

## Sources and provenance

Primary customer source: [VIETVERSE WEBSITE / Cấu trúc](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.gr96comr6i9f), read-only exported Markdown. Export path: `C:/Users/Asus/AppData/Local/Temp/browser-use/exports/VIETVERSE WEBSITE-f5a117be-8cae-40e5-b28e-250a9fcc5501.md`. SHA256: `687205D1F74EF616849BDA905C4FEFD02E5AEDB552C16A1B55FFF559F00BDF5D`. Line numbers describe this captured export, not Google Docs live line numbers. Export retrieval time was not independently recovered; this is source evidence, not a claim that the live document has not changed.

Exact relevant excerpts:

```text
45: ├── TIẾN ĐỘ HỌC TẬP
46: │   ├── Tổng quan
47: │   ├── Chặng đã hoàn thành
48: │   ├── Điểm
49: │   ├── Từ vựng đã học
50: │   └── Hoạt động gần đây

107: ### Avatar bé
109: Click mở menu:
111: * Hồ sơ bé
112: * Tiến độ học tập
113: * Cài đặt
114: * Đăng xuất
```

The same source has `### TIẾN ĐỘ` at87 and `→ /progress` at89. An English example URL does not require duplicating the existing Vietnamese route.

Historical local context, not proof of current main: `D:/ki9/codeDuAN/plans/reports/2026-10-18-customer-docs-full-audit.md` sections5.2 (line112),5.8 (line240),7 (line320), SHA256 `5D9C22D77B680811005898E29AEB9F295F00DE4F51BEEAC0933D234413EF8944`; `D:/ki9/codeDuAN/plans/261018-customer-completion/plan.md`, steps5-7, SHA256 `6D857D26A5411FF39AEFAF4505C2F1C18296704C996321347A329128908192D2`. These shared-checkout files were read, not edited or copied into the PR. Old findings about missing stage links and course navigation are superseded by merged work.

Business authority checked: `docs/README.md`, `docs/02-business-rules.md` (language29, grading47/51, parent portal120, snapshots138), `docs/05-api-and-data-contracts.md` (auth59, children93, parent187), relevant `docs/06-review-findings.md` sections P0.4, P1.1, P1-FE.7 and offline refresh, and `docs/07-change-workflow.md`. Internal docs are authoritative for existing rules; a customer menu label does not override those rules.

## Source-to-code gap matrix

| Customer quote/location | Pinned implementation evidence | Gap and proposed task |
| --- | --- | --- |
| “Tiến độ học tập”, export112; “Cài đặt”,113 | `client/src/app/layouts/KidsLayout.tsx:56` opens gated progress; `KidsLayout.tsx:67` hard-codes the same success destination. `client/src/app/router.tsx:141` and143 already route to progress/settings. `client/src/app/layouts/ParentLayout.tsx:34` exposes both tabs. | Avatar only selects/adds children. Add shortcuts to the existing destinations, preserving gate: R01. |
| “Đăng xuất”,114 | `KidsLayout.tsx:91` opens picker, with selection at117 and creation at132. Existing parent logout at `ParentLayout.tsx:73` awaits the store then navigates to login; `client/src/store/authStore.ts:67` owns the operation. | No avatar logout action. Reuse current logout contract without claiming stronger session deletion: R02. |
| “Hồ sơ bé”,111 | `client/src/app/router.tsx:99` is onboarding/create, not profile edit. `KidsLayout.tsx:116` only selects a child. Existing API `server/src/modules/children/children.routes.ts:12` supports owner-authenticated PUT; validation at `children.validation.ts:31` allows selected profile fields. No profile-view/edit route exists in the inspected router. | A label alone does not choose view versus edit, editable fields or gate expectations. R03 remains blocked. |
| “Từ vựng đã học”,49 | `server/src/modules/parent/parent.service.ts:114` reads completed lesson IDs and counts, not words; overview at195 contains four counters. `client/src/features/parent/parentProgress.types.ts:24` has no vocabulary field; dashboard at96/106/130 renders journey/counters/recent activity. | No learned-word aggregation/count/list contract. R04 needs definition, identity/version and display decisions. |

## Existing gates, logout and data constraints

### Parent navigation

- KidsLayout checks both the stored gate token and deadline before opening progress; otherwise it opens ParentGateModal. `client/src/features/parent/ParentGateModal.tsx:76` stores the signed token/deadline and invokes caller `onSuccess`. A destination-aware caller can preserve that flow; navigating to settings first and hoping the parent layout permits it is not an equivalent flow.
- `client/src/app/layouts/ParentLayout.tsx:24` rejects missing/expired client gate. `server/src/modules/parent/parent.routes.ts:15` and16 enforce the signed gate for progress and screen-time; parent service also checks child ownership at107. Client shortcuts grant no permission.
- ParentSettings currently exposes subscription information and screen-time only (`client/src/features/parent/ParentSettingsPage.tsx:131`,143,151). It is not proof that account email, PIN, profile editing or all conceivable “settings” exist.
- There is no separate ChildPicker component at this baseline: the picker is inline in KidsLayout. Preserve choosing/adding children, equipped avatar, six navigation destinations, ViVi link, Parent Corner, language switch and admin shortcut when adding actions.

### Logout is not “erase all local data”

- `authStore.ts:67` calls `/auth/logout`; its catch ignores request failure, and finally clears Parent Gate, API token, user, subscription and store token. The existing action signs out locally even offline. It does **not** prove the server revoked a refresh cookie when the request failed; a later reload may restore a session. Do not advertise guaranteed offline revocation or change this policy inside a menu task.
- `client/src/store/childStore.ts:109` invalidates in-flight child requests and clears children/active child on account change. `client/src/store/lessonSessionStore.ts:144` invalidates the active in-memory session generation. These are existing subscriptions, not work for a new menu to duplicate.
- Durable lesson sessions use IndexedDB keys per child/lesson (`lessonSessionStore.ts:35`); account-change handling clears active memory, not all durable keys. Offline submissions remain in localStorage (`client/src/lib/offlineSync.ts:24`); ownership filtering at47 and75 prevents selecting another account's queued items for submission. Do not wipe pending submissions or unrelated language preferences on logout without a retention decision.
- `client/src/app/App.tsx:9` owns a module-level QueryClient; the inspected application code does not clear the entire query cache on logout. ProtectedRoute checks user/loading, while child-related query keys include child identity. This is a static boundary observation, **not a reproduced cross-account disclosure**. Do not claim comprehensive cache erasure; test that existing protected views are inaccessible after logout and that stale child responses do not revive the old child.
- Client refresh interception and the logout request are separate paths (`client/src/lib/api.ts:98` excludes logout from refresh retry). A menu action is not authorization to redesign in-flight refresh cancellation. PR20 already owns the server atomic rotation/revocation fix and is merged; it is not a new backlog task.

### Vocabulary cannot be inferred from a reading percentage

- Lesson vocabulary entries have `word`, `meaning`, optional phonetic/media (`server/src/models/Lesson.ts:51`,138); there is no domain-level stable lexical identity linking vocabulary across lessons or versions.
- LessonProgress stores one record per child/lesson, status, best score/stars and attempts (`server/src/models/LessonProgress.ts:5`,61). It does not store completed contentVersion or per-word evidence. `server/src/modules/lessons/lessons.service.ts:161` updates status/best score/attempts; it does not persist an item-level mastery list.
- Completion needs at least50%, and word_card completion is an exposure/self-report assumption, not a mastery test (`docs/02-business-rules.md:47`,51). Passed activity point transactions are one-time awards, not an exhaustive versioned word-learning log. Thus neither “completed lesson” nor ViVi total proves every word was learned.
- The reading percentage at `parent.service.ts:141` is completedCount/4 capped at100. Its “vocabulary & matching” comment does not implement a word query. Keep the MVP metric distinct from any future vocabulary count.
- Lessons are graded against the opened contentVersion (`lessons.service.ts:81`); `server/src/modules/content/content.reader.ts:20` can read published revisions but still requires live content/access. `server/src/models/ContentRevision.ts:18` keys snapshots by kind/content/version. A snapshot alone does not tell which revision generated an old LessonProgress. Joining historical progress to today's vocabulary silently changes historical counts after publishing; no backfill rule was found.

## Four proposed tasks

### R01 — AVATAR-EXISTING-DESTINATIONS — READY, dependency pending

**Source:** customer lines112/113 and existing gated parent routes. **Scope:** KidsLayout action menu/destination state, existing i18n labels or minimal new UI strings, focused navigation tests and behavior docs. No API/store/policy changes.

**Explicit implementation assumption:** “Tiến độ học tập” and “Cài đặt” point to the existing `/phu-huynh/tien-do` and `/phu-huynh/cai-dat`. This completes shortcuts only, not a new profile/settings product. Coordinator should retain this narrow mapping in the assignment; a broader settings requirement moves that extension to BLOCKED.

**Acceptance:** both actions are reachable from avatar; preserve picker/add-child and all current header actions. Valid gate opens the selected destination; absent/expired gate opens the current signed challenge, success opens the requested destination, cancellation/error does not navigate. No bypass of server ownership/gate. Menu closes after activation, outside click and Escape; Escape returns focus. Keyboard and44px targets work in VI/EN at320/640/1366px without clipping. Do not insert a fake or onboarding-linked “Hồ sơ bé” item merely to make four labels appear complete.

**Tests:** extend KidsLayout integration tests with valid/absent/expired gate, both post-challenge destinations, failed challenge/retry/cancel, account/child changes and picker preservation. Reuse `client/src/test/childJourneys.test.tsx:69` and `authGateLifecycle.test.ts:34` for gate semantics; run parentSettingsSave and parentStageLinks regressions. Browser must use real gate/layout UI with local fixtures, assert destinations/focus/geometry and no production calls.

**Dependencies:** merge/integrate PR23 header branding first; retain merged PR19/16/21 and PR14 settings behavior. No missing content source for these two shortcuts. Missing policy for broader settings is explicitly excluded.

### R02 — AVATAR-LOGOUT-REUSE — READY, sequence after R01

**Source:** customer line114; existing ParentLayout/authStore contract. **Scope:** add one avatar action invoking current `logout()` and navigating to login, i18n, focused tests and limitations documentation. Use a pending state to avoid duplicate activation; no new server auth behavior.

**Acceptance:** logout success and request failure both end the current client session as the existing action does; gate/token/user/child/active-session memory is cleared by current stores, not by duplicated manual cleanup. Protected routes must not remain usable via Back. **Implementation assumption, not a new retention policy:** reuse existing logout without adding deletion of unrelated durable data or preferences; any different retention requirement needs a separate decision. Do not claim all-device/offline/server logout success on network failure. Do not add a new Parent Gate to logout or change login/rotation/PIN/email behavior.

**Tests:** mount real auth/child/session stores with a controlled network adapter; success, rejected request, duplicate clicks, Back, delayed child response and another-account login. Verify existing durable data remains, without asserting a total cache wipe. Reuse `authGateLifecycle.test.ts:103`, childJourneys stale-response cases and offlineSync ownership tests. Smoke VI/EN keyboard/touch at320/640/1366; no real account logout.

**Dependencies:** R01 owns the same menu; sequence the changes, do not create concurrent conflicting menu implementations. PR20 is already merged, not a new dependency to implement. Stronger offline revocation/cross-tab/in-flight refresh guarantees require separate evidence and scope; none are assumed here.

### R03 — CHILD-PROFILE-DESTINATION — BLOCKED

**Source:** customer line111. **Missing decision:** is this a read-only profile, editing name/age/languages/avatar, a child switcher, or another existing destination? Which actor may edit, and is step-up required? The existing owner-authenticated PUT is implementation capability, not proof the customer approved a child-facing edit flow or new gate policy.

**Proposed bounded scope after decision:** one confirmed destination and menu action using existing owned child data/validation; no delete flow, subscription/quota changes, PIN/email or language-policy changes. Do not send the action to `/bat-dau`, which creates a child.

**Acceptance/tests after decision:** display current child only; enforce the chosen read/edit boundary and existing ownership; validate confirmed fields; show loading/error/retry; ignore responses after changing child/account; preserve unrelated fields and multi-language order. Add wrong-owner API regressions only if API changes are actually approved, and VI/EN320/640/1366 keyboard/browser checks. Dependencies: source/owner destination decision and merged R01/PR23. No implementation until the decision is recorded.

### R04 — LEARNED-VOCABULARY-CONTRACT — BLOCKED

**Source:** customer line49. **Missing decisions:** what qualifies as “đã học” (encountered, completed lesson, successful activity, mastery); lesson-only or also story/culture vocabulary; count versus list and fields; duplicate identity (surface text, normalized text, sense/meaning); accents/case/spacing; ordering; replay/version changes; deleted lessons and legacy data; whether unavailable history is excluded, labelled unknown or backfilled from an explicitly approved approximation.

**Proposed bounded scope after decisions:** one server-derived, owner-and-gate-protected vocabulary summary plus a read-only parent view, with explicit version/dedup/legacy contract. No scoring, new reward rule, learner grading or content generation. If historical mastery cannot be reconstructed, report that limitation rather than fabricate precise counts from today's catalog.

**Acceptance/tests after decision:** zero and failed reads stay distinct; no cross-child/parent leak; a partially passed lesson follows the approved definition; duplicate words/diacritics/meanings obey the approved key; replay does not duplicate; publishing/old snapshots/deletion/legacy records follow the chosen historical policy. Test API ownership/gate, fixtures across versions, FE count/list states and VI/EN responsive display. Starting regression references: `server/src/test/parentDashboard.test.ts:40`,108 and `server/src/test/contentLearning.test.ts:87`. These current tests cover reporting/versions, **not learned-word aggregation**. Dependencies: source/owner contract; backend data-design review before any historical migration.

## Ownership and completed work — do not duplicate

Fresh GitHub status read at approximately2026-10-19 00:19 Asia/Saigon; live status may advance after this report.

| Status | Work | Evidence / owner |
| --- | --- | --- |
| MERGED | PARENT-STAGE-LINKS | PR21 merge `5baf9172029c9f1276697e918e2a345c4723ea07`; included in report baseline. Do not count stage links as missing. |
| MERGED | AUTH-ROTATION | PR20 merge `53a447a369fed0d69b455749a053b694a159a753`; do not duplicate under R02. |
| ALREADYOWNED | KIDS-HEADER-BRANDING | Rà soát phần Khám phá, PR23 OPEN, head `fe0a3e6df1e90d0f0d1ea6c40fd9be26ab533a12` at the snapshot. R01 must integrate its final merged head, not overwrite it. |
| ALREADYOWNED | F13-SOURCE-CAPTURE and activity translation contract analysis | Phối hợp owns PR22 OPEN head `02449444a4f75c41846b3ae4ec616b7c9c815849`; Rà soát is analyzing the next contract. Neither is a vocabulary mastery implementation. |
| ALREADYOWNED | COVER-FALLBACK-SAFE | Phối hợp, PR25 OPEN on `codex/cover-placeholder-safe`; not a new task here. |
| ALREADYOWNED | FOOTER-NAV | This chat, PR24; integration with PR20 is handled in its own worktree/journal. This report is not added to PR24. |

Both referenced implementation chats were read before relying on their progress. PR12 audio and PR15/18 F04-related HOLD remain outside this report; a green unrelated run does not close those issues. Previously merged header-overflow/course/points/settings/CTA work is not counted as new remainder work. No global “all customer requirements complete” claim is made.

**Freshness addendum, 00:28 Asia/Saigon:** PR22 is now MERGED at `bf8651572678ff0f37acc02bca4e57efd940759e` (GitHub `mergedAt: 2026-10-18T17:23:24Z`), verified as remote main. Its diff from53a contains source-capture seed utilities/tests/docs, not the cited runtime UI/parent/models; it still does not implement learner translation rendering or vocabulary mastery. Coordinator has also assigned MAP-CHILD-GREETING to Phối hợp (QuestMap greeting reusing existing onboarding text): **ALREADYOWNED**, not an avatar task or an additional proposal here. PR24 integration is handed off at head `76af8a37f896ffcec9e1c32e3f0805350ff1b73e`, base53a; its review remains separate. Do not churn PR24 to follow every later main commit while it awaits coordinator review.

## Verification, limitations and next actions

- Read exact source excerpts and SHA256, pinned source/models/routes/stores/tests/docs; searched the full router for profile destinations and application code for logout/cache subscriptions; checked PR state with `gh pr view` and ownership with `gh pr list`.
- Verified the PR20 changed-file list and empty diff for the cited UI/session/parent/model files between5baf and53a. Static reading establishes available fields/routes; it does not prove every runtime race or security property.
- No test suite or browser session was run for this documentation-only report. Existing test cases were inspected, not counted as new passing evidence. PR24's separate integration tests must not be attributed to this report or the proposed tasks.
- Report checks: scoped two-file diff, whitespace, source hashes and citation existence/line bounds before commit. No production actions, source edits, shared-plan update or product code changes.
- Independent read-only report review verified source hash/quotes and core code claims, and identified one policy-wording issue: R02 initially stated durable retention as an acceptance requirement. Corrected to an explicit implementation assumption to preserve existing behavior, not a customer retention decision. Live-source changes and runtime/browser behavior were declined as outside this static review; those exclusions remain limits, not completed verification.
- Next: coordinator can schedule R01 after PR23 merges, then R02 on that menu baseline. R03/R04 remain blocked until explicit destination and learned-word contracts are supplied. This report does not dispatch or implement them.

Unresolved questions for the owner/content owner: the exact profile destination/edit boundary; whether “Cài đặt” requires anything beyond the existing settings shortcut; learned-word definition, source scope, identity, display and historical-version/legacy policy. No answer is invented here.
