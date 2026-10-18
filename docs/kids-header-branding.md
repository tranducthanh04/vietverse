# Kids header branding

Date: 2026-10-18. Scope: KIDS-HEADER-BRANDING, implemented locally; verification
and release status are recorded separately in the journal.

## Customer source and authorized behavior

- Source: [customer structure tab](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.gr96comr6i9f),
  `HEADER CHUNG` -> `Ben trai`. The source says the header remains fixed after
  child login, with `Logo: VIETVERSE` and the complete small tagline:
  `CÙNG CON MỞ KHO BÁU, TIẾNG VIỆT THÊM NHIỆM MÀU`.
- Trace: reviewed the supplied `VIETVERSE WEBSITE-f5a117be-8cae-40e5-b28e-250a9fcc5501.md`
  browser export, lines 59-65, and reread the original tab through its Google Docs
  text export on 2026-10-18. The branding requirement agrees in both sources.
- Actor: an authenticated family in the selected child's existing space.
  Existing route/session guards remain unchanged.
- `KidsLayout` displays the existing `app.name` wordmark and complete
  `publicNav.subtagline`. VI and EN reuse the current dictionaries; EN is the
  existing translation `OPEN THE TREASURE WITH YOUR CHILD, MAKE VIETNAMESE MAGICAL`,
  not a newly approved customer translation or new policy.
- The semantic brand link has the accessible name `VIETVERSE` and points to the
  existing home route `/`. It does not select another child, open Parent Gate,
  award points, purchase a plan or change session state.

## Presentation assumptions, not customer business rules

- Reuse a text wordmark rather than inventing a logo image or new brand asset.
- The brand takes a complete row below `lg`; from `lg`, its width is at most
  18rem. The tagline uses 12px text/16px line height and wraps without truncation.
- The top header remains sticky; its flex layout and controls wrap when needed.
  Existing interactive targets retain their minimum 44px sizing.
- Preserve the six bottom navigation destinations from PR #19, the points link
  from PR #16, child picker, Parent Gate, VI/EN control and admin-only button.

## Acceptance and boundaries

- Five new component tests check complete VI/EN copy, home navigation, language
  switching, parent/admin controls, long child names, large balances and branding
  when no active child is selected. Existing points/courses tests remain relevant.
- Five RED failures for the missing brand/tagline were observed before the fix,
  followed by GREEN, and 13/13 focused brand/points/courses tests passing.
- Full client: 374/374 tests in 41 files. Project typecheck/build pass; lint has
  zero errors and 103 existing warnings. Initial typecheck rejected an unsupported
  Testing Library `exact` option in the new unit test; exact-name regular
  expressions corrected the test, with no product change.
- Browser: 32/32 cases at 320/390/640/1366px, VI/EN, parent/admin, zero/large
  balances; eight additional large-balance cases at 1023/1024px also pass.
  Real Chrome, CSS, fonts and router use synthetic stores/intercepted APIs.
  Checks cover full text bounds, no overlaps/overflow, 44px controls, sticky
  header, content clearance and existing destinations. Large-balance cases
  additionally use actual Tab/Enter for language, picker/selection, brand,
  points, Courses, admin and Parent Gate; visible focus has >=2px outline/ring.
  This is not a WCAG contrast audit or production/physical-device test.
- Independent source/test/docs and final harness reviews found no actionable
  findings. No refactor was needed for the 13-line product change.
- This change does not implement the complete customer header: avatar menu and
  other navigation/business gaps remain independent. No API, model, store,
  points, auth, checkout, audio or avatar-menu behavior changes.
- No production or physical-device acceptance is claimed. Rollback is a scoped
  UI revert with no migration or data repair required.
- Execution evidence: [journal](../plans/journals/2026-10-18-kids-header-branding.md).
