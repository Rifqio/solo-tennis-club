# Phase 1 implementation and manual review

Updated: 2026-10-09. All ten plans have implementation summaries. Source implementation is complete; Phase 1 manual acceptance confirmed by the user on 2026-10-09. Work followed the user-authorized direct workflow with Impeccable, Antislop core/UI/mobile, React best practices, and verification before completion. No GSD skill or browser automation ran.

## Implemented checklist

- [x] 01-01: migrated SQLite persistence, server-owned public schedule, walking skeleton.
- [x] 01-02: fixed admin provisioning, cookie authentication, protected idempotent publication.
- [x] 01-03: Indonesian/English public shell and club information.
- [x] 01-04: admin sign-in, shell, dated Sessions list.
- [x] 01-05: date strip, calendar, next-date shortcut, schedule states and authored browser specifications.
- [x] 01-06: development samples, backup/restore and operations documentation.
- [x] 01-07: public session detail sheet, all coaches, venue address, exact availability logic and recovery.
- [x] 01-08: Manage hub and coach/venue/level creation and editing.
- [x] 01-09: classes with ordered coaches and editable defaults that affect future sessions only.
- [x] 01-10: guided create/edit, review before publication, safe capacity edits, draft recovery, conflict handling and authored integrated browser specifications.

Source ticks record implementation/non-browser verification; Phase 1 and its 14 acceptance-owned requirements are now checked following user manual acceptance.

## Fresh verification

| Check | Result on 2026-10-09 |
| --- | --- |
| `npm run build` | PASS after shortcut removal: TypeScript and Vite production build; main bundle 464.81 KB |
| `npm run lint` | PASS |
| `npm run test` | PASS after shortcut removal: 26 files, 137 tests, 19.96 seconds |
| Earlier running development server smoke | Sign-in 200; admin sessions/references/classes 200; public schedule/detail 200; sign-out 204 |
| Browser specifications | Authored and type checked; NOT RUN under the user's standing instruction |
| Manual workflows | User confirmed all listed checks on 2026-10-09; measured visual/audit evidence not supplied |

The running-server smoke read the existing 20 sessions, three coaches, two venues, two levels and three classes. It created and revoked its own authentication session without creating business records.

Acceptance cleanup: removed the development shortcut route and blank-input client branch. Reserved legacy mock accounts cannot authenticate or use existing cookies in either mode. Regression tests verify empty/partially empty credential denial, removal without account/session creation, legacy cookie denial, real-credential tunnel sign-in/sign-out, CSRF and other-origin rejection. Latest build/lint and all 137 tests pass. Existing database records were preserved.

New integration evidence: `tests/integration/admin-references.test.ts`, `admin-classes.test.ts`, `admin-session-update.test.ts`, and `public-session-detail.test.ts`. Cases cover authorization/CSRF, strict validation, replay-safe creates, normalized duplicate names, stale edits, same-version concurrent edits, transactional rollback, unchanged past sessions, capacity reductions, future-only defaults, public field allowlisting and inherited sample disclosure. Unit tests cover availability thresholds, class rules and owner-scoped draft restoration. Earlier authentication, persistence, migration, restart, backup and bundle-boundary tests remain passing.

Capacity edits use the occupancy seam inside the write transaction. Phase 1 has no booking engine; tests inject occupied places to prove reductions cannot overbook. Actual booking lifecycle and concurrent reservations belong to Phase 2.

## Historical source review before user acceptance

Mode: Operate. ENERGY 2 / RHYTHM 2 / MOTION 2. Jalur Lawu remains the visual authority in `DESIGN.md`.

| Check | Concrete source evidence | Acceptance limit |
| --- | --- | --- |
| Working destinations and actions | `src/App.tsx`, admin `AdminLayout.tsx`, references/classes forms and `SessionEditorPage.tsx` connect to protected APIs | Complete task interaction still needs manual review |
| Bilingual, readable states | `admin.messages.ts`, public `detail.messages.ts`, named loading/error/empty/saving states and sample notices | Long copy and both languages need runtime inspection |
| Recovery and truthful success | Same request UUID retained for retries; latest/yours conflict feedback; defaults never update existing sessions; pending saves block discard | Recovery browser specifications are unrun |
| Privacy and authentication | Server guards; public DTO allowlist; CSRF held in memory; draft stores only allowlisted input plus owner ID | Normal-credential sign-in/expiry browser path pending |
| Draft continuity | `session-draft.ts`, auth identity handling and `use-unsaved-changes-guard.tsx`; clear after save/discard/sign-out or owner change | Reload, language, reference detours and soft keyboard pending |
| Touch, responsive and safe areas | Shared 48px fields/actions, label-sized coach targets, sheet internal scroll and safe-area padding; calendar 44px minimum width/48px height at narrow widths | 320/390/640/820/1024/1440 widths and physical phone pending |
| Keyboard/focus and motion | Radix sheet/dialog primitives, error/step focus, trigger restoration, global reduced-motion rules | Actual Tab/Escape/focus restoration and zoom pending |

These are source findings, not a visual or accessibility PASS. The user subsequently confirmed manual workflows. The detailed source assessment remains historical; no agent-run visual review or measured accessibility audit is claimed. Calendar day width is a recorded narrow-screen exception to the preferred 48px square target; height stays 48px and width never drops below 44px.

## User-reported manual acceptance

User confirmed "All tested manually" on 2026-10-09 after the seven-item workflow checklist. This is user-reported manual acceptance; no agent browser run, screenshots, device inventory or exact viewport measurements were supplied. Real club content/production launch checks remain separate.

## Manual acceptance checklist

The subsequent picker/form/microinteraction pass is recorded in [01-UI-POLISH-REVIEW.md](01-UI-POLISH-REVIEW.md). Its manual checklist supplements this phase checklist.

Start in admin: **Manage → Coaches / Venues / Levels**, then **Classes**, then **Sessions → Add**. Use clearly named test records and inspect the published result on the signed-out public schedule.

- [x] Sign in with normal credentials; sign out, expire authentication and reauthenticate on the same route. Normal access included in the user-reported manual checklist; the temporary shortcut has now been removed.
- [x] Create/edit each reference type, check duplicate/invalid values, retry failures and confirm unsaved-discard behavior.
- [x] Create a class with two coaches and defaults; publish a session, change class defaults and verify that the existing session stays unchanged.
- [x] Complete all four session steps; use Back and contextual Edit, switch languages, reload a creation draft and return from adding a missing reference.
- [x] Review every fact before Save. Edit a published session; confirm date, WIB time, cross-midnight end, venue/address, ordered coaches, level, exact IDR price and limits in public details in ID and EN.
- [x] Check stale edits, expired sign-in, save retry and navigation during a pending save. API safeguards passed; interface workflow acceptance is user-reported.
- [x] Open/close details using close, overlay and Escape; check Tab containment, returned focus, internal scrolling and unavailable/cancelled states.
- [x] Inspect loading/error/retry/empty states, long names and coach selections at 320, 390, 640, 820, 1024 and 1440 widths, both themes/languages, keyboard and zoom.
- [x] On a real phone verify safe areas, soft keyboard, comfortable targets and reachable final actions.
- [ ] Confirm actual club description, contact, address, logo and real catalog/session values; keep samples out of production.
- [x] Remove the temporary development sign-in shortcut after manual testing, as requested.
- [x] Record final Phase 1 user manual acceptance.
- [ ] Attach detailed visual/Antislop audit evidence if a formal measured audit is needed; no screenshots or agent browser execution claimed.

## Next phase

Phase 2 is **Reserve Places and See Daily Rosters**. It has not started. Resolve customer authentication/OTP/recovery, required fields/group limits, hold-start and near-start eligibility, and admin-created booking identity/deadline rules before implementation. Preserve the approved five-hour hold, proof-review protection and pending-inclusive minimum counts.
