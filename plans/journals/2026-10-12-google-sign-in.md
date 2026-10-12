# Google Sign-In - implementation and verification

## Outcome

Implemented the approved Google Identity Services flow on login/register with server ID-token verification, browser-bound nonce challenge, one-time exchange, explicit Vietverse-password linking, and preserved user roles/subscriptions/data. New accounts receive parent/free defaults. Missing configuration/indexes fail closed.

## Decisions and repairs

- Google client ID is public configuration; no client secret or Google password is requested.
- Google-only users retain required passwordHash via a cryptographically random undisclosed value, not a shared usable password.
- Transactions cover challenge consumption and account/subscription creation or linking. Additive indexes include unique Google subject, flow token hash and TTL.
- Independent review found late auth responses overwriting newer cookies and late cancellation clearing replacement flow cookies. Auth writes now serialize within a tab; cancellation matches nonce without clearing the browser cookie. A 20-second request timeout bounds waiting.
- Fixed StrictMode lifecycle, existing-user/admin registration routing, stale subscription cache and duplicated example env key.
- Simplifier made scoped readability edits; reviewer remained read-only.

## Verification

- Full npm test: server 393/393 (44 files), client 197/197 (25 files).
- Typecheck and build passed; client bundle ~712 KB (existing code-splitting warning remains).
- Client lint: 0 errors, 87 warnings, including generation-ref cleanup warning.
- Production npm audit: 0 vulnerabilities. Full audit: 10 dev-tool issues (3 moderate, 5 high, 2 critical), same Vitest/Tailwind debt as prior work; no forced major updates.
- Google tests cover real RSA verification with certificate download stubbed, replay/expiry/cookie/Origin, password cap, rollback/concurrent exchange, index readiness, cancellation/late response and routing.
- Deployment-index dry run only; no Atlas writes, Vercel config changes, deployment, commit or push.

## Remaining activation

Google Cloud project `vietverse`, OAuth Web Client ID, backend Vercel Production env and authorized frontend origin are configured. Commit `ef1c300` is Ready on FE/BE. Production smoke passed config, challenge start/cancel, health/readiness, login page and catalog; production start=200 also passed the Google flow storage/index gate through `User`/`GoogleAuthFlow` initialization. A new Google account signed in successfully and reached `/bat-dau`; no child, learning or payment data was created. Existing-email password linking remains covered by local tests only; Google-only password recovery/link removal is out of scope.

## Workflow fallback

AgentKit CLI is unavailable on PATH; this local journal is a fallback, not a claimed indexed entry. AgentWiki publish skipped. Existing remediation changes and untracked .superpowers remain untouched.
