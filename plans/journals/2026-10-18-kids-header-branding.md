# Kids header branding: customer source alignment

Date: 2026-10-18.
Branch: `codex/kids-header-branding`.
Base: `01cfa0591feb9bf0015821f19e9f256259544732`.
Worktree: `C:/Users/Asus/.codex/worktrees/kids-header-branding/codeDuAN`.

## Source and scope

- Owner-confirmed baseline CI run `39145652890` succeeded; this is baseline
  evidence, not CI for the new branding changes.
- Read repository instructions and related inventory/review/i18n/navigation docs.
  The customer structure tab `t.gr96comr6i9f` specifies fixed post-login header,
  `VIETVERSE` and a complete tagline in `HEADER CHUNG` / left side.
- Source evidence: local browser export
  `C:/Users/Asus/AppData/Local/Temp/browser-use/exports/VIETVERSE WEBSITE-f5a117be-8cae-40e5-b28e-250a9fcc5501.md`,
  lines 59-65. Reread original Google Docs tab via its text export; both state
  the same branding requirement. The export is evidence, not a new repo file.
- Missing brand/tagline is repaired only in KidsLayout, using existing `app.name`
  and `publicNav.subtagline` VI/EN values and a semantic home link to `/`.

## Decisions and constraints

- Full-row brand on smaller screens, desktop max 18rem, 12px tagline and flex
  wrapping are presentation assumptions, not customer-specified business rules.
- Preserve sticky positioning, 44px controls, six-item PR #19 navigation,
  PR #16 points link, picker, Parent Gate, VI/EN and admin control.
- No API/store/points/auth/checkout/audio/avatar-menu change. Do not equate this
  scoped repair with completing every customer header feature.
- Existing baseline docs, including public header and courses navigation, remain
  intact. Current source and limits live in `docs/kids-header-branding.md`.

## Evidence and pending gates

- Five new tests were RED before source changes for absent
  branding/tagline, then GREEN. Focused brand/points/courses suite: 13/13 passing.
- The documentation writer inspected KidsLayout, the five new component tests
  and current dictionaries; the test results above are coordinator handoff,
  not separate reruns by this writer.
- Full client: 374/374 tests in 41 files (59.21s), lint zero errors/103 existing
  warnings. Existing audioPlayback act warning remains; no backend/audio edits.
- Initial typecheck/build rejected four unsupported Testing Library `exact`
  options in the new unit tests. Replaced them with exact-name regular
  expressions; focused 5/5, project typecheck and build then passed (1832 modules).
  Main agent independently reran focused brand/points/courses: 13/13, 3 files.
- Initial real-Chrome browser matrix: 32/32 at 320/390/640/1366px, VI/EN,
  parent/admin and zero/large balances. Actual CSS/fonts/router, synthetic
  children and intercepted APIs; no production login or writes. Main agent
  viewed VI/admin/320 and EN/admin/1366 large-balance screenshots in
  `C:/Users/Asus/AppData/Local/Temp/vietverse-kids-brand-9DcvxO`.
- Final hardened browser script passed 32/32 (exit 0); screenshots:
  `C:/Users/Asus/AppData/Local/Temp/vietverse-kids-brand-OteNk2`.
  Additional 1023/1024px x VI/EN x parent/admin x large-balance cases: 8/8
  (exit 0); screenshots: `C:/Users/Asus/AppData/Local/Temp/vietverse-kids-brand-c7SkGg`.
  Commands from repository root: `node plans/261018-kids-header-branding/browser-smoke.mjs`;
  for the extra run set `SMOKE_WIDTHS=1023,1024` and `SMOKE_BALANCES=1234567890`.
  Runtime paths are configurable through PLAYWRIGHT_MODULE and CHROME_PATH.
- Large-balance cases use real Tab/Enter for language, picker/selection, brand,
  points, Courses, admin and Parent Gate. Check focus-visible plus rendered
  >=2px nontransparent outline/ring, not WCAG contrast or fully opaque color.
  Earlier harness false failures compared already-focused styles or sampled
  mid-transition; corrected by waiting for actual animations (500ms bound)
  before strict indicator assertions. No product CSS change or weakened check.
- Independent source/test/docs and final harness reviews found no actionable
  findings; scoped simplifier assessment found no necessary refactor.
- Main remained `01cfa0591feb9bf0015821f19e9f256259544732` at final fetch;
  normal merge reported already up to date. PR/CI and coordinator merge gates
  remain separate from local completion. No self/auto-merge, manual deployment,
  production writes, audio edits or whole-plan completion/status edit.
- AgentKit CLI remains unavailable; local Markdown records evidence. AgentWiki
  publish skipped.

## PR21 integration (2026-10-19 local time)

- PR #23 was created at `7012fc3c2be01a342c5cda5b906ccc3f5ee7f92f` while main
  advanced to PR21 merge `5baf9172029c9f1276697e918e2a345c4723ea07`.
  Normal merge `4b45c237a345f1b64e0688ed0eff80e67661d82f` has no conflicts.
- Independent incremental review confirms all PR21 content retained, the same
  seven owned files / 13 product lines versus main, unchanged branding source,
  tests and harness, and no server/audio/package/lockfile delta.
- Fresh integrated full client: 394/394 tests in 42 files; project typecheck
  and build pass (1832 modules). Prior lint evidence remains for unchanged
  branding source. No fresh local full-server suite claimed.
- Fresh hardened branding browser matrix: 32/32, exit 0; screenshots
  `C:/Users/Asus/AppData/Local/Temp/vietverse-kids-brand-zFD92r`.
- Existing PR21 browser script ran unchanged: 48 parent-stage link activations
  and six URL/history matrices pass, exit 0. Real QuestMap controls clear the
  taller header and fixed navigation. Synthetic API only; screenshots
  `C:/Users/Asus/AppData/Local/Temp/vietverse-parent-stage-links-Nwh8tZ`.
- Integrated breakpoint matrix: 8/8, exit 0; screenshots
  `C:/Users/Asus/AppData/Local/Temp/vietverse-kids-brand-SpnbxD`.
  Exact-new-head CI remains pending; old-head CI `39147352186` succeeded but
  does not replace verification of this integration head.
