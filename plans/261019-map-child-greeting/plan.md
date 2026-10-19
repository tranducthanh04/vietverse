# MAP-CHILD-GREETING

Baseline: bf8651572678ff0f37acc02bca4e57efd940759e (PR22); CI39149362873 succeeded.
Source: customer audit 5.2/5.4, completion step 6; captured explore.md greeting.

## Contract

Add the active child's greeting using existing onboarding.readyTitle VI/EN strings.
Keep map.title as the sole h1 and preserve map.subtitle, stage selection, URLs,
guards, server permissions, pending submissions, loading/error/empty states.
Read existing activeChild only; no new requests, model, API, auth/store, audio,
grading or other chats' header/footer/cover/source changes.
Presentation assumption: greeting is a paragraph before h1, wrapping full names.

## Work sequence

1. Add regression tests; capture missing-greeting RED before implementation.
2. Implement minimal paragraph and safe wrapping; focused map/i18n and full checks.
3. Real KidsLayout browser matrix, independent review, owning docs and journal.
4. Scoped commit/PR to main, hand off evidence; implementing chat never merges.

## Verification contract

VI/EN, escaped markup-like names, long names, immediate child/null/account change,
real guard hydration and URL mismatch; existing map21 regressions remain green.
Browser 320/640/1366, child switching, bounds/touch/header clearance, screenshots.
Full root tests, typecheck, build, lint. Known intermittent F04 is outside scope;
a green suite does not close it. ak CLI unavailable: no plan-index closure claim.
