---
phase: 01-publish-and-browse-sessions
plan: 04
subsystem: admin-browser
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
requirements-progress: [AUTH-06, SCHED-02]
browser_acceptance: manual-pending
---

# Plan 01-04: Admin sign-in, shell, and Sessions

## Outcome

Implemented the administrator browser entry and dated Sessions destination in the confirmed Jalur Lawu system. Club has a subdued admin sign-in link. Protected routes verify the server session before exposing the admin shell. Email/password sign-in uses labeled fields, an accessible show/hide control, associated required errors, named pending feedback, duplicate-submit protection, preserved email, and server throttle timing. Language changes keep input. Failed attempts clear the password.

The admin shell uses the existing Material palette, 48px controls, bottom navigation below 640px and a rail above it. Only Sessions exists in navigation. There are no Add/Edit session, Classes, Manage, booking, payment, signup, recovery, or cancellation controls ahead of their implementation. Sign-out revokes the session through the protected API; network failure keeps the signed-in interface and offers recovery rather than pretending success.

Unauthorized admin routes return to sign-in with a restricted-access explanation and safe local return path. A 401 after login shows the session-ended explanation and sign-in at the same route. The protected outlet remains mounted but hidden and inert during that recovery. Race guards prevent an old session check or unauthorized response from replacing a newer login. CSRF data lives in provider memory; no credentials are written to browser storage or logs.

GET /api/admin/sessions returns today/upcoming records by default, with an optional validated WIB date filter used by the browser. It retains stored coach order, cancelled records, integer IDR, minimum/maximum, sample flags and the existing occupancy seam. It rejects invalid/out-of-window dates, excludes yesterday, includes today's midnight, and exposes only explicit session fields. Results are capped at 200 with an explicit truncation flag and visible notice. Pagination beyond that existing plan limit is not implemented.

The Sessions screen reuses the public date strip, Club Calendar, sample notice and tonal time/fact rows. Empty, loading, load failure and forbidden states are distinct. A next-date action appears only with a server-provided date. Coach names and capacity facts are visible beneath each row. The shared row supports a div container inside the semantic admin list; existing public rows remain list items. Date controls can wrap at narrow widths or enlarged text.

## Verification performed after final source edits

| Check | Evidence |
|---|---|
| npm run build | Exit 0; Prisma generation, all TypeScript projects including new E2E specs, and production Vite bundle succeeded. |
| npm run lint | Exit 0, no errors or warnings from ESLint. |
| npm run test | 19 files, 115 tests passed; final run duration 14.49s. |
| Targeted new tests | 2 files, 10 tests passed: protected list and admin client/return-path handling. Included again in the full suite. |
| Credential storage review | No localStorage, sessionStorage or console calls in src/features/admin or src/lib/admin-api.ts. |
| Browser/E2E execution | Not run under the user's standing instruction; no browser PASS claimed. |

The build emits the existing large-main-chunk advisory (approximately 532 kB uncompressed). Admin route modules are separate lazy-loaded chunks; no packages, lockfile, Prisma schema or migrations were changed. An early build/test collision in Prisma generation was resolved by sequential execution. Windows sandbox EPERM required scoped approval for Vite/test subprocesses.

## Browser specifications and manual scenarios

tests/e2e/admin-sign-in.spec.ts covers Club entry, server-backed sign-in/list/sign-out, anonymous return paths, required/partial input, wrong credentials, network failure, duplicate requests, throttle timing, expiry recovery, failed sign-out, bilingual password controls, preserved input and enlarged narrow-screen text.

tests/e2e/admin-shell-layout.spec.ts defines the 320/390/640/820/1024/1440 width matrix in ID and EN with sample rows, long names, single working navigation, target sizes, end-of-list clearance, loading/error/retry and zero/one/many states. These specs are typechecked, not executed. They do not substitute for physical-phone soft keyboard or one-handed-use evidence.

Manual review: from Club, sign in with an operator-provisioned account; browse today and a future date with the picker; switch languages; toggle password visibility; sign out; revisit the protected route signed out. Check failed login/network, session expiry, list retry, narrow/intermediate widths, both system themes, keyboard focus, safe areas and final-row/action reachability. No default production password is supplied.

## Antislop Delivery Gate evidence

Overall: MANUAL ACCEPTANCE PENDING. The following source checks are limited to code evidence; this UI is not delivery-approved. The user explicitly disabled browser automation and will assess manually.

| Rule | Source evidence / remaining runtime evidence |
|---|---|
| R-01 | No gradients or glow introduced; existing tonal Material roles used. |
| R-02 | New UI messages contain no em dash. |
| R-03 | Narrow-screen wrapping, min-width zero, rail/bottom reflow specified in source; actual overflow checks pending. |
| R-04 | Eye visibility and calendar navigation icons explain actual controls; no decorative AI glyphs. |
| R-05 | Date-led records and sign-in form follow their tasks; no dashboard template blocks. |
| R-06 | System reading font and existing Barlow time/wordmark voice; no new font. |
| R-07 | No background pattern. |
| R-08 | No decorative button arrows. |
| R-09 | No capsule/eyebrow badges. |
| R-10 | No glass or backdrop blur. |
| R-11 | Fields use small radius, time plates medium radius, controls full-round. |
| R-12 | No per-row or form shadows introduced. |
| R-13 | No glow. |
| R-14 | Comparable session rows retain common structure for time/date comparison. |
| R-15 | Controls name Sign in, Sign out, Show/Hide password, Retry and date actions. |
| R-16 | No marketing buzzwords in new copy. |
| R-17 | Session values come from the protected API; no invented metrics. |
| R-18 | No testimonials, avatars or invented activity feed. |
| R-19 | Existing date-selection motion retained; no new looping decorative motion. |
| R-20 | Existing Lafu signboard and tonal time-plate identity retained. |
| R-21 | Both system themes inherit DESIGN.md roles; actual theme inspection pending. |
| R-22 | No illustration introduced. |
| R-23 | Confirmed LAFU text identity; samples visibly disclosed; no new raster asset. |
| R-24 | Club entry, public back link and Sessions destination have routes; unknown admin routes provide recovery. |
| R-25 | Existing contrast-tested token pairs reused; runtime contrast inspection pending. |
| R-26 | Source wires each control to an input change, route, API or date selection; click-through pending. |
| R-27 | Named auth/list loading, empty, failure and recovery states implemented. |
| R-28 | No FAQ. |
| R-29 | No new palette; existing club and semantic roles reused. |
| R-30 | Lafu's approved Material idiom retained. |
| R-31 | Form supports access; date strip selects records; plates compare times; state text explains availability. |
| R-32 | Native controls, field associations and inherited focus outlines in source; keyboard/focus review pending. |
| R-33 | All application changes written in source; no external source-patching script. |
| R-34 | Both theme roles inherited; runtime theme validation pending. |
| R-35 | Production build passes; running-browser click-through not performed and remains pending. |
| R-36 | No security/compliance/performance/customer claims added to the product UI. |
| R-37 | Confirmed DESIGN.md and blueprint; ENERGY 2 / RHYTHM 2 / MOTION 2 declared before edits. |
| R-38 | No realistic fictitious club content introduced; tests and sample records remain labeled. |

Liveliness source review: one main sign-in action; dates/time plates lead the list; field/fact groups structure spacing; green retains selection/primary-action meaning; the repeated signboard/plate motif remains. Visual judgment is pending, not inferred from these source checks.

Craftsmanship source review: task-derived screens and recovery paths; no template fillers or fabricated claims. Functional completeness and resilience across themes, widths, states and keyboard use still require interaction evidence. UI checklist source items cover identity palette, accent purpose, truthful records, named controls/states and restrained shapes; its runtime breakpoint/theme/keyboard item is pending. Mobile checklist source items cover phone reflow, intermediate widths, 48px targets, safe-area clearance and tap equivalents; actual overflow, keyboard reachability and device verification remain pending.

## Next work

User-requested temporary manual-testing shortcut (2026-10-09): in development, submitting empty sign-in fields creates a labeled test-admin session through `/api/admin/auth/dev-sign-in`. Normal credentials still exercise real sign-in. Production does not register the shortcut and rejects the reserved test-admin identity's cookies; the test identity has no usable password. Remove this shortcut after manual testing. Browser acceptance remains pending.

Follow-up evidence: the configured HTTPS phone tunnel initially reproduced ORIGIN_REJECTED; development now accepts exact HTTPS origins derived from Vite's allowed host list, with explicit public-origin configuration taking precedence. A running-server request returned 200 after the fix. The user confirmed shortcut entry works. Latest auth regression run passed 17 tests; type checking and lint passed. Normal-credential and full UI acceptance remain pending.

01-05 needs its remaining browser specifications and close-out summary. 01-07 supplies the public detail sheet; 01-08/09/10 supply management and publication/editing UI. This summary does not accept full AUTH-06 or SCHED-02 integrated workflows, complete Phase 1, or close manual verification items.
