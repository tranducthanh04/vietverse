# Schema va catalog - 2026-10-11

## Authorization and target

Owner approved design, database `test`, schema migration and catalog bootstrap. Target allowlist remains `<cluster-host>.mongodb.net/<db-name>` (redacted 2026-10-13). Cloudinary/payment remain out of scope. No secrets read into chat or source, no account/admin creation, no network/role/env changes.

## Local implementation

- Child stores bounded unique companionLanguages and keeps singular first-language compatibility; legacy API writes normalize, legacy JSON reads do not mutate DB.
- Onboarding supports multiple selections and rejects empty selection; backend must deploy before frontend.
- Catalog and language backfill share one transaction, writer lock and exclusive-window gate. Pending legacy preimages are fingerprint-bound, preserved separately with minimal fields, cascade on child deletion. Unrelated fields/timestamps and multilingual profiles are preserved.
- Catalog remains 5 stages,20 lessons,21 readings,8 culture,49 revisions. No points/progress/users/orders/audio fabricated. Source/provenance remains intact.
- Recovery: transaction abort before commit; after commit keep additive schema/revisions, reconcile receipt, no reset/drop. Specific field rollback requires operator review and postimage comparison; see cms-operations.md.

## Evidence and blocker

### Final production execution - 23:34 Asia/Saigon

- Owner entered the Database User password privately and confirmed the exclusive writer window. Launcher ran preflight then apply, exit0. Earlier password-dialog cancellations below are historical, no longer the blocker.
- Target `thanh/test`; preimage stages/lessons/stories/culture/drafts/revisions all0. Verified `applied`: stages5, lessons20, stories21, culture8, drafts0, revisions49. Plan hash `198e80a9e3d6cd429db78764bbf011c78771ea888798290e00322f37c9260aca`.
- Schema receipt `child-companion-languages-v1` verified `already_applied`, pending0/migrated0/invalid0/preimage0: there were no legacy child rows to backfill. Catalog transaction and schema receipt committed; no account/progress/points/payment/audio rows fabricated.
- Backend deployment `dpl_9HGTw9LGVx5s9zqEHXZwa2dx6mJ5`, URL `https://vietverse-backend-gc1k8aumb.vercel.app`, Production Ready, alias `https://vietverse-backend.vercel.app`, iad1/Linux/Node22. Previous deployment for operator rollback: `dpl_C2mLne4U7CW3aJAAJeJvwNyHVUDK`, `https://vietverse-backend-h9tph45d9.vercel.app`.
- Frontend deployment `dpl_CLKDeqCGY3cS8U1oGFSDsLe1iHT9`, URL `https://vietverse-2gwu9u4n6-tranducthanh31102004-gmailcoms-projects.vercel.app`, Production Ready, alias `https://vietverse-nine.vercel.app`. Source was tracked working-tree files from HEAD345077f plus reviewed uncommitted schema/UI changes; not a new Git commit. No secret, local .env, .vercel, or Windows prebuilt upload. No commit/push performed.
- Fresh smoke after both deployments: FE root/login200, JS `index-Bo3eMXyO.js`200 and includes companionLanguages; FE stories200/count21, culture200/count8; unauthenticated auth/me401/UNAUTHORIZED; BE health200/readiness200. No production account/child created for smoke, so authenticated learning/points/cookies/multi-language persistence on Vercel remain outside this smoke evidence.
- Existing Production env retained. Metadata lists MONGODB_URI, JWT secrets, CLIENT_ORIGIN, CMS_PUBLISH_ENABLED, NODE_ENV; no Cloudinary/PayOS keys. No secret values retrieved, no CMS toggle, no DB role/network changes.
- FE build reported12 dependency advisories (5 moderate,5 high,2 critical), monorepo server engine22 versus FE Node24 warning, and673.72KB JS chunk warning. No automatic major dependency upgrade. Dependency risk, Atlas least-privilege/network/credential rotation, full backup/restore, copyright/audio and browser/mobile acceptance remain separate follow-ups.

### Earlier local verification / failed password attempt

- RED witnessed for language API/legacy JSON/validation, migration/stale preflight, multilingual UI and preimage cascade. Focused server20/20; client164/164; root typecheck/build passed.
- Initial full server356/357: recordingFinalize concurrency case returned201/503. Isolated rerun14/14 passed; no recording code changed. Do not hide the transient failure.
- Final full backend rerun357/357 (38 suites) passed; frontend rerun164/164 (21 suites) passed. Typecheck and production build passed; client bundle673.74KB retains the existing chunk-size warning. Independent review: no Critical/Important findings. This evidence does not prove Atlas migration or production deployment.
- Independent read-only reviewer found no Critical/Important issues. Browser/mobile, Atlas/network/least-privilege, actual restore and exclusive writer window remain operational gates.
- Launcher dry-run invoked with permission and private password dialog; ended `BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED` before connection/preflight. This attempt made no Atlas writes. Neither migration nor catalog is verified applied. No code deployed this turn.
- That earlier credential blocker was resolved in the final production execution above. Future loader use still requires private entry and a verified exclusive window; never force re-import an existing catalog.
