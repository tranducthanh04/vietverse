# Customer pricing and narration feedback

## Outcome and scope

Implemented locally: monthly VND 250,000, yearly VND 990,000, truthful 67% comparison against twelve monthly purchases. Shared narration uses real media first, then explicitly labelled matching-locale device speech. Story fallback follows lines without a fake timeline. Culture, word-card passages and new activity instructions reuse the same lifecycle. No payment activation, QR, provider integration, translations, production catalog changes, push or deployment.

## Work sequence and evidence

1. Reused the approved bounded feedback scope and repository documentation. Initial worktree had unrelated untracked `.superpowers/`; preserved it. Prior remote check put HEAD and origin/main at ac9382e, divergence 0/0.
2. RED: monthly amount expected 250000 but received149000; six AudioButton lifecycle tests and the pricing display failed before implementation. Added page-level RED tests for story fallback, culture errors, passage reading and game instructions.
3. Implemented shared playback ownership, generation invalidation, voice discovery, matching-language selection and long-text chunks. Replaced native activity controls with one shared control; preserved instruction visibility and no-autoplay semantics in regression tests.
4. The ak:cook >8-file simplify gate prompted a scoped independent pass. It removed a duplicate native player. Review identified same-source content changes retaining the previous media position; regression observed12 instead of0, then passed after reset. A claimed cross-reader overlap was checked against the actual stop implementation and a regression confirming that the first media element is paused before the next reader starts. No second simplifier loop.
5. Full root test run passed BE368/368 but caught the newly added FE content-reset regression before its fix. After repairs, final full FE suite passed182/182 in23 files. BE source/tests remained unchanged since the full BE pass (39 files,368 tests). Narrow payment suite passed5/5 with mocked PayOS and memory DB; no real payment calls.
6. Final npm run build passed both workspaces (TypeScript and Vite). npm run typecheck passed earlier; final build recompiled the latest runtime/tests. Final FE lint passed with0 errors/86 warnings. Vite retains a >500kB chunk warning. git diff --check passed. No browser/device listening acceptance is claimed.

## Decisions and limitations

Current business/API docs contain the price decision, deferred PayOS scope, feature status and review risks. customer-audio-translations.md describes pending translation/source approval and provider confirmation. Device speech is not studio-quality audio, singing or pronunciation grading. No bilingual model/API/editor/UI was added; locale support in the reader alone is not multilingual content delivery.

The customer called the service Evernote; obtain its name/link before choosing an integration. Request approved text/audio by content ID, version, section and locale. Never request a password in chat. Test representative voices on target desktop/mobile devices before release.

## Tooling and handoff

ak CLI was unavailable in this environment, so this is a local Markdown journal fallback, not an ak-created/indexed plan or journal. No existing plan status was rewritten. AgentWiki publish skipped. No secrets or raw environment values were stored. Automatic journal capture followed ak:cook; the source implementation remains uncommitted and undeployed pending owner direction.
