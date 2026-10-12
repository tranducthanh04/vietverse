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

`ak` CLI is unavailable, so this local journal was written directly; AgentWiki publish skipped. Deployment revision and smoke evidence are recorded below and in the deployment runbook. Existing audio/device, orphan cleanup, CMS publishing and payment gates remain separate.

## Production release evidence

- Backend: `dpl_DiVucxhrRbozLoatYaBAV3xFPNNk`, Ready, alias `https://vietverse-backend.vercel.app`.
- Frontend: `dpl_DLzGCo6eMX88JZD7EEqtQHCXrzBq`, Ready, alias `https://vietverse-nine.vercel.app`.
- GET `/health`, `/ready`, `/`, and `/api/v1/stories` each returned HTTP 200 after release.
- The real Cloudinary upload/finalize flow was intentionally not exercised with customer data; production readiness is limited to code, configuration, build, and read-only smoke evidence.
- Browser `/admin` redirected to `/kham-pha` with the existing non-admin session; no role change or new account was attempted. Admin UI smoke requires an authorized admin session.
- Vercel frontend build also reported dependency advisories (3 moderate, 5 high, 2 critical) and a Node 24 / backend-workspace Node 22 engine warning; the frontend build succeeded. These warnings are not evidence that the entire website is production-ready and remain separate remediation work.
