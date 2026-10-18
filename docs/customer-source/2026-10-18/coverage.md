# Explore translation source coverage - 18 October 2026

This is a **source capture**, not a curriculum import, runtime mapping, release or
translation approval. `manifest.json` identifies the Explore tab and exact bytes.
The capture date is Asia/Saigon; no Google revision ID or last-edit time is claimed.
The coordinator supplied the export; the checksum and full text were independently
read here. The 09 October snapshot and default importer/bootstrap remain unchanged.

## Reproduce the inventory

From the repository root, after installing locked dependencies:

```sh
node --import tsx server/src/seeds/customer/reportCustomerTranslations.ts
node --import tsx server/src/seeds/customer/reportCustomerTranslations.ts --entries
```

Both commands only read local source and print JSON. They do not connect to DB,
call APIs, publish, create assets or synthesize speech. `--entries` includes raw
source lines, exact decoded text, lesson/activity headings and per-entry provenance.

## Meaning of the counts

- 79 directly written prompt groups plus one explicit B15 -> B14 cross-reference.
- Five prompt groups have labelled foreign text but **no explicit Vietnamese
  question**. They remain in `blocks`, not in eligible `entries`.
- 75 paired prompt groups and 8 paired hint segments = **415 locale pairs**:
  83 per locale (`en`, `ko`, `ja`, `fr`, `zh`). Every mapped group has all five.
- Hints comprise two full hints (B1/B2) and six labelled table rows (B4/B14).
  They are source segments, not permission to display hints immediately.
- No translated passage/subPrompt was identified. Do not relabel an instruction,
  audio script, answer or question as a translated passage.
- Slash-separated glosses have source text but no explicit per-item language
  labels. Preserve them as `ambiguous-locales`; do not pair by assumed position.
  B6 A2 also contains English-like glosses without a locale label; not a full hint.
- “Mapped” below means **VI-to-labelled-locale within this snapshot only**.
  Runtime activity mappings are **not assigned for every row**.

## B1-B20 coverage

P = supplied prompt groups (including missing-VI groups and the explicit reuse).
M = paired prompts. H = paired hint segments. Count = eligible locale pairs.
Missing/blocked columns describe source/runtime gaps, not missing translations
for already paired groups. A = source activity; B12 uses steps, B20 challenges.

| Lesson | P | M | H | Count | Missing / ambiguity | Separate content or policy blocker |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| B1 | 4 | 4 | 1 | 25 | A5 review questions unspecified; A2 hint absent; A4 gloss unlabelled | Listening script is not an audio asset |
| B2 | 5 | 3 | 1 | 20 | A3/A5 Vietnamese question missing; other gloss locales unlabelled | Cards expand to multiple runtime rows |
| B3 | 6 | 5 | 0 | 25 | A3 Vietnamese question missing; glosses unlabelled | A5 has two distinct questions, not one runtime ordinal |
| B4 | 5 | 5 | 3 | 40 | Glosses unlabelled; A4 structural hint VI only | Step hints do not change self-report or hint timing |
| B5 | 4 | 4 | 0 | 20 | A5 review questions unspecified; hints incomplete/unlabelled | Runtime match/multi-select order differs from source |
| B6 | 4 | 4 | 0 | 20 | A2 unlabelled partial gloss; A4 hint has no translation | Missing exact audio question set |
| B7 | 4 | 4 | 0 | 20 | Hints describe replay/tone guidance, no translated hint | No invented translation of isolated tone syllables |
| B8 | 5 | 5 | 0 | 25 | Hints lack exact translated text | Rhyme/blank/order material not fully specified here |
| B9 | 3 | 3 | 0 | 15 | Hint translations absent | Advanced combinations require exact questions/choices |
| B10 | 3 | 3 | 0 | 15 | Glosses unlabelled; ordering hint lacks translation | Source phrase assembly is not runtime identity |
| B11 | 3 | 2 | 0 | 10 | A3 Vietnamese question missing; glosses unlabelled | `c_ _ -> cá` slot/answer ambiguity remains unresolved |
| B12 | 3 | 3 | 0 | 15 | Final activity has no explicit prompt set; hints absent | Source steps differ from expanded cards/recordings |
| B13 | 4 | 3 | 0 | 15 | A4 Vietnamese question missing; A5 no prompt; hints incomplete | Subject/action curriculum and choices need mapping review |
| B14 | 3 | 3 | 3 | 30 | A1 hint not translated; A2 gloss unlabelled | Title differs between overview and detail; retain both in source |
| B15 | 7 | 7 | 0 | 35 | A7 explicitly reuses B14 A3; exact hint text absent | Story, choices and answers still unspecified; overview title differs |
| B16 | 4 | 4 | 0 | 20 | A5 practice prompt unspecified; glosses unlabelled | No free-response AI evaluation implied; overview title differs |
| B17 | 4 | 4 | 0 | 20 | A3 extra review question unspecified; glosses unlabelled | Passage has no supplied translated subPrompt; retain VI |
| B18 | 3 | 3 | 0 | 15 | Glosses unlabelled | Translation capture does not alter fill/sort grading |
| B19 | 1 | 1 | 0 | 5 | A2-A4 riddles/choices not supplied; A5 explanation unspecified | Existing supplementary bootstrap content is not customer source |
| B20 | 5 | 5 | 0 | 25 | Exact challenge content/choices/hints absent | Completion, score/certificate and challenge rules need separate decision |

## Explicit missing-Vietnamese blocks

`b02.activity-3.prompt` (line 202), `b02.activity-5.prompt` (232),
`b03.activity-3.prompt` (276), `b11.activity-3.prompt` (771),
`b13.activity-4.prompt` (871). The preceding Vietnamese activity description is
not silently substituted as the question. Existing foreign text is preserved.

## Source fidelity and decisions

**Requirement:** retain supplied text and provenance; don't ask for already
available translations again. **Technical choices:** decode Markdown escaping,
strip outer quote delimiters on question labels and retain original raw lines;
do not alter case, spelling, punctuation or meaning. Labels, not array order,
identify locales. B15 reuse requires an explicit reference plus one unique exact
Vietnamese match in B14; both the reference line and donor translation line remain.
No automatic reuse of other repeated wording.

Examples intentionally preserved: B1 “who” versus “whose voice” across languages;
B5 Korean “alphabet M”; differing nuance for cooking. These are supplied text,
not translations authored or linguistically approved by this implementation.

**Unresolved business conflict:** the source requests retry/foreign hints after
each wrong answer, while the approved 09 October contract grades four new types
only at final submission and returns neutral feedback. Capturing strings does
not choose a policy, expose answers or add a per-question grading endpoint.

## Proposed next application contract (not implemented)

1. Review each target by durable lesson/activity ID **and contentVersion**, source
   section identity and exact VI text/hash. Never join `source-N-M` or bootstrap
   IDs by ordinal: cards expand, rows disappear/reorder, and authored supplements
   are distinct. Leave unproven targets unmapped; report stale VI instead of overwriting.
2. Add optional, versioned activity translation fields through author/canonical
   schema, CMS draft validation, snapshot reader and learner DTO together. Preserve
   legacy payloads with missing fields; retain older sessions/snapshots and importer
   skip semantics. Do not silently refresh saved drafts/live revisions.
3. Initially render approved **prompt/subPrompt only** beside VI using existing
   companion-language priority and hide missing translations; there are no source
   subPrompt entries yet. Text-only optional fields should not change activityContract2
   or answer shape; verify old clients ignore them. Hint exposure requires a separate
   policy decision; never send hint/answer content merely because it was captured.
4. Keep grader, canonical answers, rewards, unlock, recording receipts and session
   identity unchanged. Test CMS/source alignment, version compatibility, child switch,
   offline, partial translations, stale VI and no answer leakage before any publication.

Owner/content editor still needs to decide missing VI, explicit gloss labels,
B11/B15/B19/B20 curricular gaps and release approval. Existing clear source pairs
can be reviewed independently of those blockers. Capturing prompts about listening
is **not audio implementation**; no asset URLs, voices or TTS work is included.
