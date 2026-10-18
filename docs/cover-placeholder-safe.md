# Safe story/culture cover fallback

COVER-FALLBACK-SAFE, 2026-10-19. Technical correction; no business policy change.
Scope: the shared CoverPlaceholder used by story/culture lists and details.

## Contract

- If coverImage is supplied, existing page rendering still uses that image.
- Without an image, only an own key in the selected kind's variant table chooses
  its declared icon, gradient and icon color. All existing variants stay intact.
- Unknown, empty or missing variants use the existing kind-specific fallback:
  BookOpen for story, Compass for culture. Object-prototype names such as
  constructor, toString, __proto__ and hasOwnProperty are unknown variants too.
- The wrapper remains decorative (aria-hidden), retaining caller className.
- No category/enum/validation, API/model/store, route/guard, assets or permissions
  change. Legacy category strings remain readable. No point/quiz/audio changes.

## Cause and evidence

The previous plain-object lookup read inherited properties. A legacy culture
category of constructor with no cover selected Object's constructor instead of
a Variant; its missing icon caused React's "Element type is invalid" exception.
CultureArticle.category is a string, so the input is not limited to the UI's
listed categories. Both kinds used the same unsafe lookup.

The fix checks ownership with Object.prototype.hasOwnProperty.call, compatible
with the existing ES2020 target. It does not add categories or silently normalize
content. The prior fallback palette and icon choices are retained.

Thirty regression tests cover all twelve known variants, seven fallback inputs
for each kind, both culture routes with legacy constructor data and both existing
cover-image paths. Before repair, ten tests failed (eight inherited-key cases and
two API-backed culture routes); after repair all thirty pass.

Browser and full-suite evidence/limits are recorded in
[the task journal](../plans/journals/2026-10-19-cover-placeholder-safe.md).
Local fixtures are not production or real-device acceptance. This fix does not
resolve F04 recording-finalize, F13 runtime translations, story taxonomy or
content/asset licensing decisions.
