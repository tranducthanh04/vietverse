# Responsive wrong-answer hints

## Existing business decision (unchanged)

Per `02-business-rules.md` section 3 and `05-api-and-data-contracts.md`, feedback
is presentation-only. Preserve the complete source hint (up to 5000 characters)
and the first available companion translation. Skip `other`, missing and blank
translations; retain legacy singular preference, no-child and generic fallback
behavior. This change introduces no API, data, scoring, retry or permission rule.

## Presentation repair

Unbroken source/translation text previously retained its intrinsic width. The
Review activity could also exceed a narrow parent because its maximum width was
36rem at every viewport size. The feedback card now inherits
`overflow-wrap:anywhere` and allows flex content to shrink. Review uses a
parent-relative maximum width below the existing `sm` breakpoint, retaining its
desktop maximum. Short text keeps normal word wrapping and the existing font.

Only layout classes in `WrongAnswerFeedback.tsx` and `ReviewActivity.tsx` change.
No truncation, ellipsis, clipping, reduced font size, handlers, audio hooks or
global `SupportTranslation` behavior are changed. The same feedback card serves
Review, Fill Blank and Sort Order; the latter two runtime files are unchanged.

## Assumptions and limits

- Synthetic text is QA data, not approved curriculum or translated content.
- Chrome viewport checks cover VI/EN at 320, 390, 640 and 1366 pixels. They do
  not establish physical-device, assistive-technology or production acceptance.
- Browser checks mount the actual full player and use synthetic local HTTP/auth
  fixtures, real CSS/font and IndexedDB. Public Google Fonts GETs are allowed;
  external application requests and audio playback/recording are prohibited.
- Existing footer and fully-wrong Sort Order reset findings are separate PR18
  work. This patch neither fixes nor conceals those baseline observations.
- Earlier Delta-A evidence called `SYNTHETIC_UNBROKEN_` repeated 12 times a
  216-character fixture. It is actually 228 characters. Both the exact historical
  fixture and a separately sliced 216-character fixture are tested here.

## Verification and integration

See `../plans/261019-wrong-hint-overflow/report.md` for raw RED/GREEN results,
quality checks, retained failed attempts and local evidence paths. Unit tests
characterize content/state; real-browser range and container measurements prove
wrapping. Existing generic fallback, language tags, polite status, correction
and navigation clearing remain covered.

Shared docs02/03/05/06 index edits are deferred to coordinator serialization to
avoid concurrent edits. On integration, link this owning document from the
feature inventory and the responsive-hint review finding. No new business
decision or API-contract amendment is needed.
