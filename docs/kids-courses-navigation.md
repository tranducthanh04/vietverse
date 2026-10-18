# Kids courses navigation

## Authorized behavior

- KIDS-COURSES-NAV implements customer audit 2026-10-18 section 5.2: children can find Courses from the kids navigation, alongside all five existing destinations.
- Actor: an authenticated family using the selected child's space. Existing authentication, child-session and screen-time guards still apply to that space.
- The semantic link is `Khóa học` in Vietnamese and `Courses` in English, pointing to the existing public `/gia` route. Clicking or pressing Enter opens the existing pricing page under PublicLayout; it does not create a payment, change subscription, award points or open Parent Gate.
- Pricing retains its existing loading/error/checkout behavior and all server authorization. No API, model, store, learning policy or payment flow changes.
- The points pill, child picker, language switcher and Parent Corner remain separate controls with their existing behavior.

## Presentation assumptions (implementation choices, not business policy)

- Keep the existing bottom bar, icons above labels, active text color and font weight. Use the centralized lesson icon for Courses.
- Below 400 CSS pixels use three columns and two rows; at 400px and above use six columns in one row, within a 576px maximum width. The 400px breakpoint is a layout choice, not a product rule.
- Keep complete labels (wrapping permitted), minimum 56px height and at least 44px measured width at supported viewports. Remove active-link scaling so hit areas and focus outlines do not collide with neighbors.
- Reserve 176px below content on narrow screens and 96px elsewhere. The bottom bar stays fixed on desktop too, so desktop also needs clearance.

## Acceptance and limitations

- Verify VI/EN at 320/390/399/400/640/1366px, including every existing active route, six non-overlapping targets, full labels, keyboard focus, and the last content control after scrolling to the bottom.
- Exercise both click and Tab/Enter to the real PricingPage, points navigation, and the real Parent Gate modal with local API responses. Reuse existing auth/child/session/i18n tests.
- Browser fixture uses production components, CSS and font with synthetic children and network responses. The five destination bodies are tall layout fixtures; this is not whole-page acceptance or production/real-device/payment testing.
- Rollback: revert this scoped navigation change; no data migration or cleanup is needed. Audio and F04 remain outside this task.
- Execution evidence: [journal](../plans/journals/2026-10-18-kids-courses-nav.md).
