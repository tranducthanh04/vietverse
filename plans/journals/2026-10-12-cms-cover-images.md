# CMS cover images

## Outcome and scope

Admin story/folk-song and culture editors now support signed Cloudinary cover uploads (JPG/PNG/WebP, 5 MiB). Upload/finalize only changes the unsaved form; existing CMS save/publish rules remain in control. Audio and payment paths are unchanged.

## Verification

- Full backend: 417/417 tests, 45 suites; full frontend: 215/215 tests, 27 suites.
- Image regressions: 19 backend and 8 frontend, including provider rejection, revoked admin, draft version, retry, session replacement and save/upload mutual exclusion.
- Build passed; lint passed with 87 existing warnings. Bundle size warning remains (~716 kB).
- First backend attempt failed on sandbox cache access, second on 60-second MongoDB binary download timeout. Final run used installed MongoDB 8.2.3 with isolated MongoMemoryReplSet and an unreachable dummy app URI; no production DB tests.
- Independent review found missing page metadata request and upload/save race; both repaired and verified.

## Production configuration

Created signed preset `vietverse_content_images_signed` in account `dh947pv3u`: overwrite false, allowed formats jpg/png/webp, generated identifiers/display names, discard original filename and media metadata. Added `CLOUDINARY_IMAGE_UPLOAD_PRESET` to backend Production. No secrets stored here.

Provider account limit is 10 MB / 25 MP; 5 MiB is enforced by client/backend. No new provider-level size cap was exposed by the preset UI. Actual upload/finalize with a real file remains unverified; no customer image, draft mutation or publish was used as smoke data.

## Tooling and remaining gates

`ak` CLI is unavailable, so this local journal was written directly; AgentWiki publish skipped. Deployment revision and smoke evidence will be recorded in the deployment runbook after release. Existing audio/device, orphan cleanup, CMS publishing and payment gates remain separate.
