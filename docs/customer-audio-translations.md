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

### Existing Explore text source captured on 2026-10-18

F13 source capture now preserves the supplied Explore tab in
[`customer-source/2026-10-18/`](./customer-source/2026-10-18/coverage.md), separate
from the immutable 09 October snapshot. It contains 415 clear VI-to-labelled-locale
pairs for prompts and hints across EN/KO/JA/FR/ZH. Five prompt blocks lack exact
Vietnamese; unlabelled gloss lists remain unresolved. Do not request translations
already present in this snapshot again. The input table below is for genuinely
missing or stale material and publication approval, not a claim that all Explore
translations are absent. No translated passage/subPrompt was found in this tab.

Technical decision: opt-in source catalog/report only. Default importer,
bootstrap, models, APIs, learner rendering, grading and hint timing are unchanged.
Runtime target mapping must use verified identity/version/exact VI, never source
array positions. Capturing text about listening is not audio implementation; no
audio/provider/voice assets or production data are changed. Remaining gaps and
the proposed additive model/render contract are in the linked coverage report.

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

### Device-speech messaging pass — implemented locally (2026-10-18)

Audit sau phản hồi khách về badge "Giọng đọc thiết bị" và cảnh báo "Thiết bị chưa có giọng đọc vi-VN…" trên trang truyện/văn hoá. Xác nhận lại ràng buộc nghiệp vụ: production hiện **không có file audio** cho bất kỳ truyện/văn hoá nào (21 + 8 mục đều `audioUrl: null`), nên giọng đọc thiết bị vẫn là phương án dự phòng duy nhất cho tới khi có nguồn audio được duyệt.

Thay đổi chỉ ở lớp thông báo/UX, **không** đổi nghiệp vụ, điểm, quyền hay API: (1) chuỗi lỗi narration nay đi qua i18n (`audio.cantRead/tryAgain/assetFailed` ở `vi.ts` + `en.ts`) nên giao diện EN không còn hiện tiếng Việt; (2) thông báo thiếu giọng đọc bỏ mã `vi-VN` và lời khuyên "cài giọng đọc", đổi sang câu trấn an hướng người dùng cùng đọc trên màn hình; (3) nhãn giọng đọc thiết bị chỉ hiện khi đang đọc, màu trung tính thay vì vàng‑cảnh‑báo. Vẫn giữ nguyên tắc **không hứa chất lượng studio** và không giả vờ phát được. Việc tích hợp provider audio để thay thế giọng thiết bị vẫn là hạng mục chờ khách xác nhận ở các mục trên.

### Auto-play on activity open — implemented locally (2026-10-21)

Business decision (2026-10-21), from the customer request to have audio play as soon as a lesson opens so children do not have to press play. Opening any activity that has a speaker now auto-reads its primary source once: `listen_choose` reads the main speaker (`targetWord`/`prompt` or `audioUrl`), `word_card` reads the `targetWord` button (not the `subPrompt` passage), and `NewActivityFrame` types read the instructions. The speaker button stays so a child can replay. Playback reuses the one-reader `useNarration`/`AudioButton` engine through a new opt-in `autoPlay` flag, so nothing overlaps, switching activities or leaving the page stops the old audio, and a rerender with the same `activity.id` does not replay. When the browser blocks auto-play (no prior gesture, iOS) it stays silent with no error and the button remains tappable; an asset load error never triggers playback, keeping the existing "no autoplay from a preload error" rule. This is presentation only: scoring, stars, hearts, attempts and points are unchanged. It does not add any provider call, production write or CMS publication. Not pushed or deployed; real-browser and device acceptance is still pending.

## Release acceptance still needed

Listen to representative words, long passages and rhymes on target desktop/mobile browsers. Confirm accent, tone marks, pacing, missing voices, failed assets, stopping/navigation and text layout. Device TTS quality varies and may use the browser/OS speech service; do not promise offline or studio-quality narration. Obtain source audio for consistent results. No push/deploy occurs as part of this local feedback pass.
