# Map child greeting - 2026-10-19

Task: MAP-CHILD-GREETING, customer audit 5.2/5.4 and completion plan step 6.
Source: [captured Explore document](./customer-source/2026-10-18/explore.md),
Main screen section: greet the child by name and invite exploration with Sao Li Lac.

## Decisions and scope

- Customer requirement: the map greets the currently selected child by name.
- Approved implementation copy: reuse `onboarding.readyTitle` in the existing
  VI/EN dictionaries. No new translation or change to learning content.
- Presentation assumption: a paragraph above the unchanged `map.title` h1;
  keep `map.subtitle`, badge, points card and mascot. Full names wrap, including
  unbroken strings; no ellipsis or line clamp on the greeting.
- Read `activeChild.name` directly from the existing child store. React renders
  it as text, not HTML. Selection/rename updates the greeting without another
  fetch or a second cached name. No greeting when activeChild is null.
- Existing route guards withhold the map while profiles hydrate or accounts
  change. Existing auth subscription clears child state on account change.
  Existing URL child mismatch and stage-load error branches still replace the map.
- Keep all stage URL/history/default/CTA semantics, server `isUnlocked`, empty
  and pending-submission states, six navigation items and screen-time/Parent Gate.

No API/model/store/auth changes, extra fetch, new locale, dependency, grading,
audio/F04, source importer, header/footer branding or cover changes.

## Verification and limits

`client/src/test/mapChildGreeting.test.tsx` checks VI/EN, full plain-text names,
selection/rename/null, URL mismatch, real ChildSessionGuard hydration, account
switch and logout. Existing map, parent, next-lesson, child-journey and i18n tests
remain regression coverage. Browser runner and results live in
`plans/261019-map-child-greeting/`; it uses local fixtures and actual KidsLayout,
map and picker, not production accounts or student data.

The task journal records exact commands, baseline and results. Browser evidence
is not physical-device or production acceptance. Known unrelated F04 remains open
regardless of a passing full test run. Rollback is a normal revert of this scoped
PR; there is no data migration.
