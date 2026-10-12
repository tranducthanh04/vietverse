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

Assumption pending approval: display reviewed translations beside Vietnamese, retaining Vietnamese as primary. The player accepts a locale, but the content model/API/CMS and bilingual layout are not implemented in this change. Child companion-language preferences alone do not generate translated content.

## Release acceptance still needed

Listen to representative words, long passages and rhymes on target desktop/mobile browsers. Confirm accent, tone marks, pacing, missing voices, failed assets, stopping/navigation and text layout. Device TTS quality varies and may use the browser/OS speech service; do not promise offline or studio-quality narration. Obtain source audio for consistent results. No push/deploy occurs as part of this local feedback pass.
