# Customer audio and companion translations — 2026-10-12

## Agreed scope

- Monthly price: VND 250,000; yearly: VND 990,000. QR/PayOS is deferred at the owner's request.
- Prefer supplied audio. Device speech is an explicitly labelled fallback, never a claim of studio quality, singing, pronunciation assessment or a child's recording.
- The Vietnamese catalog remains unchanged. No automatic translations, provider purchases, production writes or CMS publication are authorized by this implementation.

## Implemented locally

One playback owner coordinates the shared lesson, story and culture narration controls. Clicking another reader stops the previous one; source/text/locale/content changes and unmount invalidate pending promises and speech callbacks. Asset errors before a click do not autoplay.

Device speech selects an exact locale, then a matching language voice. It waits up to 1.5 seconds for asynchronous voice discovery and reports absence instead of reading Vietnamese with an unrelated default voice. Long text is chunked; stories track source lines through speech events. TTS stops/restarts from the beginning and does not support timeline seeking; recorded media pauses/resumes and stories seek only when actual media duration is available.

Word cards read `subPrompt` separately, without reusing the short target-word audio for the passage. New activity instructions include prompt/subPrompt and ordered follow_steps text. Narration never completes, submits or awards points. Recording/upload behavior is unchanged.

## Pending customer decisions and inputs

The customer named “Evernote”; the provider is not confirmed. Ask for the service name/link, chosen voice and permitted usage. Do not ask for passwords in chat. If it is a paid synthesis service, agree on server-side secret setup, cost and asset publication separately. The current change makes no provider calls.

Supply approved translations using the following fields (one entry per language/content section):

| Field | Required input |
| --- | --- |
| Content | Lesson/activity ID, story ID or culture ID; current content version |
| Section | Prompt, subPrompt, lyric line index, title, intro, fact index or step ID |
| Vietnamese source | Exact current text, so editors can detect stale translations |
| Locale | For example en-US, ja-JP or fr-FR; a specific locale is required for `other` |
| Translation | Reviewed text, preserving meaning and age suitability |
| Audio | Approved URL/file and locale/voice; rights or permission |
| Approval | Content owner, review date and permission to publish |

Assumption pending approval: display reviewed translations beside Vietnamese, retaining Vietnamese as primary. Child companion-language preferences alone do not generate translated content.

### Companion-language text translations — implemented locally (2026-10-17)

The text side of this assumption is now built (not the audio/provider side). `Story` and `CultureArticle` carry an optional `translations` object keyed by support language (`en`, `ja`, `ko`, `zh`, `fr` — `companionLanguages` minus `other`): culture holds `title`/`intro`/`funFacts`, story holds `title`/`description`/`lyrics`/`vocab`, with arrays parallel by index to the Vietnamese source. Reads return it, the CMS story/culture editors have a collapsible per-language block that saves and previews, and the child culture/story pages render the first companion language that has a translation beneath the Vietnamese text (smaller, secondary colour, correct `lang` attribute), hiding entirely when none exists. Legacy documents without the field simply omit it from the payload, so no migration is required and existing data keeps working.

Still pending the customer/content owner: the English translations added to the demo seed are **unreviewed drafts** for preview only; reviewed translations and any translated audio must still arrive through the input table above, and no provider calls, production writes or CMS publication are authorised here. The bilingual **audio** layout and locale-tagged narration beyond the existing device-speech fallback are not part of this change.

### Translation row alignment follow-up (2026-10-18, local)

Technical repair, not a new business rule: CMS now remaps translated lyrics, vocabulary and fun facts with the source row on deletion/reordering in every language, including duplicate source strings and partially translated lists. Appending a row leaves its translation blank; orphaned entries beyond the source length are not reused. Text-only edits preserve translations for manual editorial review. This prevents new index drift; it does not infer corrections for previously misaligned saved content, generate translations, publish content or integrate a voice provider.

## Release acceptance still needed

### Recording activity follow-up — 2026-10-18, local

The recording activity now displays its existing subPrompt and offers model listening using audioUrl or labelled device speech (targetWord, falling back to subPrompt/prompt). The model control is unmounted/stopped while requesting microphone permission, recording or replaying the child's take; listening never completes the activity. Parent recordings distinguish load failures from an empty archive, offer fetch retry and report playback failure instead of silently resetting. Upload completion still requires an owned, version-bound receipt.

The backend finalize flow now rechecks the owned receipt if the intent becomes completed or disappears between reads. Deterministic database tests reproduce the previous 404 race, including intent TTL removal. This is not a fix for missing provider configuration, approval of a paid voice service, or real-device acceptance. See the current implementation journal at `plans/journals/2026-10-18-customer-completion.md`.

Listen to representative words, long passages and rhymes on target desktop/mobile browsers. Confirm accent, tone marks, pacing, missing voices, failed assets, stopping/navigation and text layout. Device TTS quality varies and may use the browser/OS speech service; do not promise offline or studio-quality narration. Obtain source audio for consistent results. No push/deploy occurs as part of this local feedback pass.
