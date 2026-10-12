# Roadmap: Lafu

## Overview

Lafu's first release replaces schedule spreadsheets and WhatsApp booking records with public session browsing, capacity-safe reservations, manual payment verification, and phone-complete club operations. Five vertical MVP slices deliver usable workflows from session publication through recurring schedules and optional minimum-participant cancellation. All 67 approved requirements remain first-release scope.

**Status:** Phase 1 accepted by the user on 2026-10-09. Phase 2 accepted by the user on 2026-10-11 after manual checks of reservations, rosters, admin bookings and the desktop boards. Phase 3 planning starts with its prerequisites below.
**Granularity:** standard
**Project mode:** mvp

## Delivery Rules

- Each requirement has one acceptance-owner phase. Dependent phases preserve and extend the behavior delivered earlier.
- Every screen is mobile-first, supports Indonesian and English, uses readable text-based statuses and accessible controls, and expands appropriately on tablets and desktops from its first delivery. Privacy applies from the first public or private workflow. Later ownership of cross-cutting UX requirements means final integrated acceptance, not postponed implementation.
- Follow the confirmed [Community matchday UI brief](UI-BRIEF.md) through the selected code-led build path. Final routes, tokens, fonts, and component specifications belong to phase UI planning; illustrative club data must be labeled.
- Impeccable supplied UI brainstorming and the confirmed direction. Apply the installed Antislop core, UI, and mobile-layout skills during planning and building for UI validation. Run their Delivery Gate and applicable checklists with recorded evidence before delivering implemented UI. Browser/build checks, accessibility checks, and complete customer/admin task verification remain part of acceptance; a visual review alone does not establish functional correctness.
- Phase 1 architecture is selected in `phases/01-publish-and-browse-sessions/01-SKELETON.md`: React/Vite, Express 5, Prisma 7 with SQLite, provisioned admins with cookie sessions, and a persistent single-host baseline. Hosted deployment remains unrequested. Resolve later phases' technical and policy choices before their dependent implementation.
- Resolve each phase's policy prerequisites during discussion/planning and include the resulting acceptance scenarios. Preserve the original five-hour unpaid window, submitted-proof review hold, all-or-none group capacity protection, and pending-inclusive minimum counting.
- Communications require an explicit decision before the relevant rejection, change, or cancellation flow. No notification channel, payment gateway, automated refund transfer, or customer booking-change feature is assumed.

## Phases

Integer phases are planned first-release work. Decimal phases are reserved for later urgent insertions.

- [x] **Phase 1: Publish and Browse Sessions** - Admins publish real dated sessions that visitors can explore without signing in.
- [x] **Phase 2: Reserve Places and See Daily Rosters** - Customers and admins reserve individual or group places with reliable deadlines and operational visibility.
- [x] **Phase 3: Pay and Verify Bookings** - Customers submit payment proof and admins complete the manual review and correction cycle from a phone.
- [ ] **Phase 4: Adjust Bookings and Settle Cancellations** - Admins handle booking changes, cancellations, and manual refund obligations without losing capacity or payment state.
- [ ] **Phase 5: Run Recurring Sessions and Minimum Cutoffs** - Admins manage recurring schedules and optional minimum enforcement, with the complete bilingual experience verified across devices.

## Phase Details

### Phase 1: Publish and Browse Sessions

**Goal:** Visitors can choose a suitable session from a public schedule maintained by authorized club administrators.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, AUTH-06, SCHED-01, SCHED-02, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09
**Success Criteria** (what must be TRUE):

1. A visitor can explore Lafu's club information, browse upcoming sessions, and change dates through quick navigation or a date picker without signing in.
2. A visitor can see date/time, all coaches, level, venue, price per place, minimum participants, maximum capacity, and remaining places, with distinct available, nearly full, full, and cancelled labels.
3. An authorized administrator can manage classes, dated sessions, coaches, venues, levels, prices, participant limits, and each session's venue and one or more coaches; capacity changes cannot create an overbooked session.
4. Administrators can authenticate to manage the schedule, while visitors and customers cannot access those management actions; published changes are visible in public session details.

**Plans:** 10/10 source implementation plans summarized; user manual acceptance confirmed 2026-10-09

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Walking skeleton read path: architecture checkpoint, Prisma/SQLite migrations, public schedule API and page, persistence tests (wave 1)

**Wave 2**
- [x] 01-02-PLAN.md — Admin provisioning, cookie-session auth, protected publish API, validated idempotent session create (wave 2)
- [x] 01-03-PLAN.md — Bilingual public shell, design tokens and wrappers, About Lafu page (wave 2)

**Wave 3**
- [x] 01-04-PLAN.md — Admin sign-in, admin shell with working-only navigation, dated Sessions list (wave 3); source verified; user manual acceptance confirmed
- [x] 01-05-PLAN.md — Schedule date strip, picker, next-date shortcut, summary rows and states (wave 3); source/non-browser verified; user manual acceptance confirmed
- [x] 01-06-PLAN.md — Backup/restore, labeled sample seed, operations README (wave 3)

**Wave 4**
- [x] 01-07-PLAN.md — Session detail bottom sheet and exact availability states (wave 4); source/non-browser verified; user manual acceptance confirmed
- [x] 01-08-PLAN.md — Coaches, venues, levels management, Manage hub, discard confirmation (wave 4); source/non-browser verified; user manual acceptance confirmed

**Wave 5**
- [x] 01-09-PLAN.md — Class management with future-only defaults and coach checklist (wave 5); source/non-browser verified; user manual acceptance confirmed

**Wave 6**
- [x] 01-10-PLAN.md — Guided session create/edit, safe capacity edits, Phase 1 acceptance (wave 6); source/non-browser verified; user manual acceptance confirmed

**Cross-cutting constraints:**
- E7 loading: save disables submit with a named pending label and prevents duplicate records
- E7 error: validation and save failures show associated field errors and an inline save error with retry; values are preserved
- E7 overflow: forms reflow to one column at 320px with the action region reachable above keyboard and fixed navigation

**UI hint:** yes

**Planning prerequisites:** Select the framework/rendering approach, persistence and API ownership, deployment baseline, and admin identity/provisioning required for this slice. Decide club timezone/currency, nearly-full threshold, required schedule content, and bilingual content responsibility. Establish stable dated-session identity and historical-value handling before bookings depend on them. Public browsing must expose no private customer, participant, or payment information.

### Phase 2: Reserve Places and See Daily Rosters

**Goal:** Customers can reserve individual or group places and administrators can see and record the same reservations in their daily operation.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09, OPER-01, OPER-02, OPER-03, OPER-04, OPER-06, OPER-07
**Success Criteria** (what must be TRUE):

1. At booking, a customer can choose sign-in/sign-up or phone entry, verify an OTP through the selected WhatsApp or SMS channel, and enter a name to complete a new account; returning customers can sign in and sign out.
2. A customer can request one or several places, receive booker/numbered-guest name defaults, edit those names, supply required customer details, and review the session, place count, unit price, and group total.
3. Customer and admin reservations share accurate capacity: competing requests cannot overbook, and a group with insufficient available places receives no partial reservation.
4. A customer can open upcoming booking details with the original five-hour deadline; an unpaid reservation without submitted proof expires at that deadline and its places become available again.
5. On a phone, an administrator can open today's/upcoming sessions, group-aware rosters and pending/confirmed states, participant-place availability, incoming booking details, and customer information, and create a booking for a WhatsApp or in-person customer.

**Plans:** 6/6 implemented and accepted by the user on 2026-10-11. See [execution plan](phases/02-reserve-places-and-see-daily-rosters/02-PLAN.md).

- [x] 02-00 — Readable controller/service/repository backend; build/lint and 137 tests pass.
- [x] 02-01 — Customer access and development API OTP source; build/lint and 161 tests pass.
- [ ] 02-01 — User manual UI acceptance.
- [x] 02-02 — Guided, atomic individual/group reservation; build/lint pass, manual and concurrency acceptance pending.
- [ ] 02-02 — User manual UI and capacity-conflict acceptance.
- [ ] 02-03 — Private bookings and durable five-hour expiry.
- [ ] 02-04 — Daily admin rosters and booking visibility.
- [ ] 02-05 — Admin reservations, explicit verified-account linking and integrated development acceptance.
- [ ] Release gate — Real WhatsApp/SMS OTP delivery and AUTH-02 acceptance.

**UI hint:** yes

**Confirmed policies:** Development mock OTP returns a code through the API; real delivery remains a release prerequisite. Require name and verified phone, allow groups up to available capacity, start the unchanged five-hour hold at final confirmation, and close customer/admin admission five hours before session start. Admin outside bookings remain unowned contact records until explicit linking after same-phone verification; same-number recovery uses OTP, lost-number recovery requires club assistance. See [context](phases/02-reserve-places-and-see-daily-rosters/02-CONTEXT.md), [architecture](phases/02-reserve-places-and-see-daily-rosters/02-ARCHITECTURE.md), [UI brief](phases/02-reserve-places-and-see-daily-rosters/02-UI-BRIEF.md) and [validation](phases/02-reserve-places-and-see-daily-rosters/02-VALIDATION.md). Awaiting-review protection remains intact; later cutoff processing and payment exceptions require their dependent phase decisions.

### Phase 3: Pay and Verify Bookings

**Goal:** Customers can pay and submit private proof, and administrators can confirm or reject payment with accurate reservation consequences.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** AUTH-05, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, OPER-05, OPER-08, OPER-12, OPER-13, UX-01, UX-02, UX-06, UX-08, UX-09
**Decisions:** confirmed 2026-10-11 in [03-DECISIONS](phases/03-pay-and-verify-bookings/03-DECISIONS.md); Rekap (board D7) and its Excel export added by the user.
**Success Criteria** (what must be TRUE):

1. A customer can use static QRIS instructions on the same phone or access bank-transfer details and the exact amount due, upload proof, and receive a truthful submission result.
2. Accepted proof places the booking in awaiting verification and protects its places beyond the original deadline until review; customers can access only their own private booking information and evidence, and neither appears in public schedules.
3. From a phone, an administrator can inspect the pending-proof queue with customer, participants, expected total, submission time, original deadline, and current state, approve proof to confirm the booking, and record payments received outside customer proof submission.
4. Rejected proof shows correction required only for the time remaining on the original deadline; replacement does not restart that deadline, and rejection after expiry releases the places and removes correction actions.
5. A customer can complete discovery through payment/status lookup on a phone with visible primary actions and clear instructions/validation, return from OTP or payment tasks without losing booking data, resume an active reservation, and recover from capacity loss, OTP failure, or interrupted upload without false reservation or upload success. Admins can reach daily sessions, participants, bookings, and proof approval/rejection directly on a phone.

**Plans:** 6 slices planned 2026-10-11, see [execution plan](phases/03-pay-and-verify-bookings/03-PLAN.md); 03-01 next.
**UI hint:** yes

**Planning prerequisites:** Validate the club's actual same-phone QRIS and transfer setup. Select private evidence storage and authorized upload/retrieval, decide proof formats/retention and durable submission boundaries, and resolve partial/excess/duplicate payments, review turnaround, outside-payment recording, customer-readable rejection reasons, and rejection communication/manual fallback. Agree deadline-edge and interrupted-upload scenarios. Review must respect current booking state and cannot later revive a cancelled booking. This phase owns integrated customer-flow, daily-admin, recovery, and private-evidence acceptance while preserving earlier baseline behavior.

### Phase 4: Adjust Bookings and Settle Cancellations

**Goal:** Administrators can resolve booking changes and cancellations while customers see accurate states and paid cancellations retain their manual refund obligations.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** BOOK-10, OPER-09, OPER-10, OPER-11, CANC-01, CANC-07, CANC-08, CANC-09
**Success Criteria** (what must be TRUE):

1. An administrator can edit booking information and move a booking to another session without exceeding destination capacity; a failed move leaves the original reservation intact.
2. An administrator can cancel an individual customer booking and release its places.
3. An administrator can cancel an entire session manually, including for low participation; affected bookings become cancelled, their places are released, and the session accepts no further bookings.
4. For paid booking or session cancellations, an administrator can see refunds due and mark a refund completed after returning the money manually.
5. A customer can distinguish awaiting payment, awaiting verification, confirmed, correction required, expired, and cancelled bookings, with an explanation and next action whenever one is available.

**Decisions:** confirmed 2026-10-12 in [04-DECISIONS](phases/04-adjust-bookings-and-settle-cancellations/04-DECISIONS.md).
**Plans:** 5 slices planned 2026-10-12, see [execution plan](phases/04-adjust-bookings-and-settle-cancellations/04-PLAN.md); 04-01 next.
**UI hint:** yes

**Planning prerequisites:** Decide edits to paid bookings, partial-group moves/cancellations, destination price differences, moved-deadline treatment, and any administrative exceptions; capacity cannot be implicitly overridden. Resolve refund entitlement/amount, completion records, late-payment reconciliation, and change/cancellation communication with manual contact fallback. Include cancellation-versus-review and failed-move scenarios. Customers continue to request booking changes through admins; no customer edit/move/cancel controls are added.

### Phase 5: Run Recurring Sessions and Minimum Cutoffs

**Goal:** Administrators can run recurring schedules and optional minimum-participant cancellation, and customers can understand session viability separately from their own booking state on every supported device.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** SCHED-03, CANC-02, CANC-03, CANC-04, CANC-05, CANC-06, UX-03, UX-04, UX-05, UX-07
**Success Criteria** (what must be TRUE):

1. An administrator can create and manage recurring schedules from a phone that produce dated sessions; series/occurrence changes handle already-booked dates according to the agreed edit policy.
2. An administrator can enable or disable automatic minimum cancellation and configure its cutoff; disabled automation does not cancel a session for an unmet minimum.
3. Administrators see eligible participant places counted individually across groups: confirmed, unexpired awaiting-payment, and awaiting-verification places count, while expired and cancelled places do not.
4. At the configured cutoff, enabled sessions below their minimum are cancelled through the established booking-release and refund-tracking behavior; customers can see session minimum status separately from their personal booking/payment status.
5. Customers and admins can complete all essential workflows in Indonesian or English on phones, including manual bookings, changes, recurrence, and cancellations, with readable text-based states and comfortably spaced controls; tablet/desktop layouts expand the same actions and preserve status meaning.

**Plans:** TBD
**UI hint:** yes

**Planning prerequisites:** Decide recurrence generation horizon, series-versus-occurrence edit scope, and effects on existing bookings, historical prices, coach assignments, and capacity reductions. Resolve cutoff configuration scope/edits, delayed checks, and what happens when qualifying pending places expire after a successful cutoff check. Select repeat-safe recurring/cutoff execution and agree applicable cancellation communications before automation. Final integrated mobile, bilingual, accessibility, and tablet/desktop acceptance covers all earlier slices; none of these behaviors is deferred until this phase.

## Progress

Phases execute in order: 1 → 2 → 3 → 4 → 5. Discussion, policy decisions, UI specification, and approved plans precede each phase's dependent implementation.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Publish and Browse Sessions | 10/10 | Accepted by user | 2026-10-09 |
| 2. Reserve Places and See Daily Rosters | 6/6 | Accepted by user | 2026-10-11 |
| 3. Pay and Verify Bookings | 6/6 | Accepted by user | 2026-10-12 |
| 4. Adjust Bookings and Settle Cancellations | 0/5 | Decisions confirmed, planned; 04-01 next | - |
| 5. Run Recurring Sessions and Minimum Cutoffs | 0/TBD | Not started | - |

## Coverage

All 67 v1 requirements map to exactly one phase in [REQUIREMENTS.md](REQUIREMENTS.md). Phase totals are 14, 19, 16, 8, and 10. There are no orphaned or duplicate assignments and no approved first-release features deferred to v2.

*Created and approved: 2026-10-08. UI validation uses Antislop during planning and building.*
