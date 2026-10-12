---
gsd_state_version: "1.0"
current_phase: 3
current_phase_name: Pay and Verify Bookings
status: planning
stopped_at: Phase 2 manually accepted by the user on 2026-10-11; Phase 3 policy decisions next
last_updated: "2026-10-12"
last_activity: 2026-10-11
last_activity_desc: Phase 2 accepted after the motion pass, the G1 status and feedback system and the desktop session editor; 210 unit and integration tests pass
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 16
  completed_plans: 16
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-08)

**Core value:** Customers can book tennis classes from their phones with clear, reliable availability, while club admins can manage those bookings and payments without spreadsheets.
**Current focus:** Phase 3 - Pay and Verify Bookings: resolve the planning prerequisites (payment setup, proof storage and formats, payment edge cases, rejection, outside payments, deadline edges) before plans

## Current Position

Phase: 3 (Pay and Verify Bookings) - PLANNING; policy decisions precede plans (ROADMAP Phase 3 planning prerequisites).
Phase 1: accepted 2026-10-09. Phase 2: all plans implemented and manually accepted by the user on 2026-10-11, including the desktop boards (Rekap D7 and QRIS D8 belong to Phase 3), the motion pass, the G1 status and feedback system and the desktop session editor.
Open gates carried forward: the full browser e2e run with the updated specs; hosted deployment as a free portfolio demo on Vercel + Turso + Vercel Blob: release slice R1 was built on 2026-10-12 at the user's request, ahead of Phase 3 acceptance (Turso adapter, Blob storage with direct uploads, Build Output function, daily cron, demo mode with nightly reset; 274 tests pass). Account setup and the go-live checklist remain ([DEPLOYMENT-PLAN.md](DEPLOYMENT-PLAN.md) sections 6-7). STC is a personal portfolio project, so real OTP delivery and real payment details are no longer release prerequisites; release cleanup (ONBOARDING_ALWAYS, photo licences, lafu* identifiers). The empty-form admin shortcut is gone; the "Masuk sebagai admin demo" button replaces it on development servers and the demo.

Progress: 2 of 5 phases accepted (40%).

## Performance Metrics

**Velocity:**

- Total plans with implementation summaries: 13
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Implementation summaries: 01-01 through 01-10, 02-00 through 02-02
- Trend: Phase 1 accepted; Phase 2 customer access source verified and reservations next

## Accumulated Context

### Decisions

Full product decisions are recorded in PROJECT.md and REQUIREMENTS.md.

- All 67 v1 requirements were approved on 2026-10-08; separate phases preserve the full first-release scope.
- The user chose Vertical MVP. Every phase uses mvp mode and delivers an end-to-end usable capability.
- Community matchday and the detailed UI brief were confirmed on 2026-10-07; the build path is code-led.
- The five-phase roadmap was approved on 2026-10-08. Impeccable supplied UI brainstorming; Antislop core, UI, and mobile-layout checks apply during planning/building, with evidence-based validation before UI delivery.
- Mobile-first, Indonesian/English, accessible text-based states, and privacy apply from each workflow's first delivery; later UX ownership is integrated acceptance.
- Phase 1 framework/database/API/admin access and the persistent single-host baseline are confirmed in 01-SKELETON.md. Hosted deployment and later-phase technical/policy choices remain open. Workflow is interactive with auto-advance disabled.
- [Phase 1]: Customer, publishing, regional/availability, and admin decisions are confirmed in .planning/phases/01-publish-and-browse-sessions/01-CONTEXT.md; Impeccable direction and Antislop validation remain in force.
- [Phase 1]: User selected SQLite with Prisma for initial persistence and excluded Supabase; React/Vite and Express are selected in 01-SKELETON.md; hosted deployment remains open. — Start with a simple local database behind the application server; preserve transactional booking and admin authorization rules.
- [Phase 1]: Use shadcn/ui with Tailwind; customize each used component for Lafu and retain Community matchday colors #164D45, #FFFFFF, #1D252C, #EDF4F1. Initialization approved; preset string pending.
- [Phase 1]: User selected express-spa verbatim: React/Vite, Express 5, Prisma 7 SQLite, fixed provisioned admins with cookie sessions, persistent disk; persisted IDs, timestamps, IDR and session defaults approved.
- [Phase 1]: User explicitly disabled Chromium/browser automation as too heavy and reviewed manually. On 2026-10-09 they confirmed all listed workflows tested; record user manual acceptance separately from unrun automated browser checks.
- [Phase 1]: From 2026-10-08 the user has plans executed by hand without GSD skills, with Antislop DURING alongside Impeccable.
- [Phase 1]: User requested a full native-app redesign (2026-10-08): Material 3 idiom, club palette kept as tonal roles, light and dark follow the phone, installable manifest. Impeccable direction "Jalur Lawu" (seed b5fc1590) chosen. Root DESIGN.md (Google Labs DESIGN.md spec) is now the visual source of truth and supersedes 01-UI-SPEC visual sections; later UI plans (01-04, 01-07 to 01-10, admin) inherit it.
- [Phase 1]: User chose react-day-picker for the date picker (2026-10-08): Club Calendar in a bottom sheet on phones and a popover from 640px, replacing UI-SPEC's native input; recorded in DESIGN.md.
- [Phase 1]: 01-06 sample seed is richer than planned at the user's request (two weeks, empty days, cancelled, long names) and gained --refresh; still isSample, "Contoh"-named, development only.
- [Phase 1]: Schedule close-out, public details, reference/class management and guided create/edit are implemented and summarized. Build/lint and all 137 non-browser tests passed before acceptance. User subsequently confirmed manual workflow testing; shortcut cleanup has its own fresh verification record.
- [2026-10-10]: **Club renamed.** "Lawu Fun Tennis Club" / "Lafu" is now **Solo Tennis Club** / **STC** (Solo = Surakarta). Use the full name on first or prominent mention and STC for the wordmark and compact spots. The canvas is renamed; the code is not yet (see Pending Todos). Earlier entries keep the old name as history.
- [2026-10-10]: Desktop design epic started before 02-05, from the user's four Dribbble references. Decisions: the public club page gets a top nav, while app and admin screens use the ink rail from DESIGN.md. Entrance and scroll-reveal motion appears on the club page only; app screens keep the functional motion. Boards D1 Klub and D2 Jadwal are on the canvas; booking flow, Booking kamu and admin desktop come next. Unsplash stock photos stand in until the club supplies photos.
- [Phase 1]: Schema gate push-event heuristic skipped per documented GSD_SKIP_SCHEMA_CHECK after real committed migrate deploy/status and clean-file tests passed; do not substitute db push for migration history.

### Pending Todos

- [x] Implement admin sign-in, shell, and dated Sessions list (01-04); non-browser checks passed.
- [x] Add the requested temporary development test-admin shortcut and fix the configured HTTPS tunnel origin check.
- [x] User confirmed the temporary shortcut opens admin successfully (2026-10-09); this verifies that entry path only.
- [x] Close out schedule/date navigation (01-05): source, E2E specifications and summary; manual acceptance subsequently confirmed by user.
- [x] Implement public session details and exact availability states (01-07). Source/non-browser checks complete; manual acceptance confirmed by user.
- [x] Implement Manage hub and coach, venue, and level management (01-08). Source/non-browser checks complete; manual acceptance confirmed by user.
- [x] Implement classes and defaults management (01-09). Source/non-browser checks complete; manual acceptance confirmed by user.
- [x] Implement guided session create/edit and safe capacity edits (01-10); author integrated acceptance specs.
- [x] User confirmed all listed manual workflows tested on 2026-10-09; see 01-PHASE1-REVIEW.md.
- [x] Remove the temporary development sign-in shortcut after manual testing; legacy mock sessions are rejected in both modes.
- [x] User confirmed the listed access, management, publication, bilingual and interaction checks manually; no exact device/viewport evidence supplied.
- [x] Confirm Phase 2 development OTP, recovery, required fields, group limits, hold timing/cutoff and outside-booking identity/deadline policies; see 02-CONTEXT.md.
- [x] Complete 02-00 readable backend layers with regression evidence.
- [x] Implement 02-01 development customer access; build/lint and 161 tests pass, local schema up to date.
- [ ] Complete user manual UI checks for 02-01.
- [x] Implement 02-02 capacity-safe customer reservations and real occupancy; build/lint pass, local migrations applied.
- [ ] Complete user manual acceptance and independent-connection concurrency/rollback proof for 02-02.
- [x] Implement 02-03 private bookings and expiry worker (2026-10-10); see 02-03-SUMMARY.md.
- [x] Implement 02-04 roster and incoming bookings (2026-10-10); see 02-04-SUMMARY.md.
- [x] Build the approved Courtside canvas boards: club page, venue Maps links, wrong-code state, admin shell/sessions/roster/manage/classes (2026-10-10).
- [ ] Complete user manual acceptance for 02-03 and 02-04 on a phone.
- [x] Implement 02-05 admin-created bookings, explicit customer linking and audit (2026-10-10); see 02-05-SUMMARY.md. Browser spec authored, not run.
- [ ] Complete user manual acceptance for 02-05 (02-05-MANUAL-CHECKS.md); migrate the live local DB after backup when merging.
- [x] (2026-10-11) Desktop layouts built from the canvas: club home, schedule, booking flow, Booking kamu, admin sign-in, Sesi (D5), Booking masuk (D6, with name/phone search), Kelola (D9-D9c), Kelas (D10). Rekap (D7) and the QRIS page (D8) wait for Phase 3.
- [ ] Phase 2 is code-complete (02-00..02-05 merged 2026-10-11). Run the full browser suite, fix failures, then the user's manual acceptance.
- [ ] Decision (2026-10-10, user): **start QRIS payment now**, using a mock QR until the real static QRIS image and NMID arrive. The UX is a dedicated payment page, not a modal (board D8): QRIS and bank-transfer tabs, the exact amount with a copy button (static QRIS does not prefill the amount), then a proof upload and "Bukti terkirim". "Bayar sekarang" replaces "Chat admin" on Booking kamu and on the booked screen. This pulls part of Phase 3 (payment proof upload) forward. Reconcile with ROADMAP.md before planning.
- [x] (2026-10-10) Coach photos built: upload in Kelola (stored under data/uploads, backed up with db:backup), agent-select picker on Kelas. New scope (2026-10-10, user request): **coach photos**. On Kelas, the coach picker is a photo card grid in game agent-select style: photo, name and class count; picking several is allowed (board D10). This adds a photo field and upload to coaches in Kelola. Cards without a photo show initials. Canvas photos are Unsplash stand-ins.
- [ ] New scope (2026-10-10, user request, desktop first): an admin **Rekap** dashboard with monthly revenue and an Excel export. Revenue counts only Lunas bookings; unpaid money shows separately as "Nunggu dibayar". The Excel export is a button only for now, with no logic, by user decision (2026-10-10). The file contents are decided later. Board D7 is on the canvas. It is not yet in REQUIREMENTS.md or ROADMAP.md, and it depends on Phase 3 payment confirmation for real paid dates. Mobile comes after desktop is approved.
- [ ] Rename the club in code to Solo Tennis Club / STC: index.html title/meta, club-content.ts, club.messages.ts, api-error-messages.ts, docs. Ask before renaming technical identifiers: cookies `lafu_*` (renaming signs everyone out), env vars `LAFU_*`, `data/lafu.db` and backup names, the localStorage key `lafu.language`, and the package name.
- [x] (2026-10-10) Admin screens brought to boards D5, D9b and D10 and phone boards 10-17; Kelola archives instead of deleting.
- [ ] Select/integrate real OTP delivery and verify AUTH-02 before Phase 2 release completion.
- [ ] Before production launch, review real club content/logo/catalog, exclude samples and verify deployment/provisioning operations.

### Blockers/Concerns

- Phase 2 development policies are settled. Real WhatsApp/SMS provider/channel delivery remains a release prerequisite; mock API codes establish development flow only.
- Phases 3-4 need evidence/payment exception rules, paid/partial-group changes, refund records, and rejection/change/cancellation communication.
- Phase 5 needs booked-occurrence edit semantics, cutoff/delayed-check behavior, and post-cutoff pending-expiry policy. Preserve all approved reservation/minimum rules.
- Phase 1 architecture and trusted admin provisioning/rotation are selected and implemented at the API/CLI level. Phase 1 workflow manual acceptance is confirmed by the user. Real club content and hidden terminal-password/deployment checks remain production-launch prerequisites. WIB, IDR, the 25% nearly-full threshold, Indonesian default, and admin email/password with fixed setup accounts are settled.

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-10
Stopped at: 02-05 implemented (branch gsd/02-05-admin-bookings); all Phase 2 source plans done, manual acceptance and real OTP delivery remain
Resume file: .planning/phases/02-reserve-places-and-see-daily-rosters/02-05-MANUAL-CHECKS.md

## Manual acceptance update

User confirmed "All tested manually" on 2026-10-09 after the seven-item workflow checklist. This is user-reported manual acceptance; no agent browser run, screenshots, device inventory or exact viewport measurements were supplied. Real club content/production launch checks remain separate.

## Phase 2 decisions and backend standard

User confirmed development-only mock OTP with code available in the API response, required name + verified phone, groups up to remaining capacity, hold start at final confirmation, and admission closing five hours before session start. Admin outside bookings store contact without verified ownership; same-phone verification precedes explicit admin linking. Same-number recovery uses OTP; lost-number recovery needs club assistance, without automatic merging. Controller/service/repository code is now the backend standard. See `BACKEND-CONVENTIONS.md` and `phases/02-reserve-places-and-see-daily-rosters/02-00-SUMMARY.md`. No GSD skills or browser automation were run.
