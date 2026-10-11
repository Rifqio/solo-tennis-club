# Requirements: Lafu — Lawu Fun Tennis Club

**Defined:** 2026-10-07
**Status:** All 69 first-release requirements (67 approved 2026-10-08; OPER-12 recap and OPER-13 recap export added 2026-10-11) and their five-phase roadmap approved by the user on 2026-10-08; Phase 1 accepted by the user after manual workflow testing on 2026-10-09; Phase 2 accepted by the user on 2026-10-11; Phase 3 decisions confirmed 2026-10-11. Requirement checkboxes track acceptance.
**Core Value:** Customers can book tennis classes from their phones with clear, reliable availability, while club admins can manage those bookings and payments without spreadsheets.

## v1 Requirements

All requirements below belong to the initial release. Delivery in separate phases does not defer any of this scope.

### Public discovery and schedules

- [x] **DISC-01**: Visitor can explore Lafu's club information without signing in.
- [x] **DISC-02**: Visitor can browse upcoming tennis sessions without signing in.
- [x] **DISC-03**: Visitor can switch dates using quick date navigation and a date picker.
- [x] **DISC-04**: Visitor can see each session's date, time, all coaches, level, venue, price per place, minimum participants, maximum capacity, and remaining places.
- [x] **DISC-05**: Visitor can distinguish available, nearly full, fully booked, and cancelled sessions before starting a booking.

### Identity and access

- [ ] **AUTH-01**: Customer is offered sign-in or sign-up when needed for booking, with a phone-number entry option that does not require a separate registration form.
- [ ] **AUTH-02**: Customer can verify their phone number with an OTP delivered through WhatsApp or SMS.
- [ ] **AUTH-03**: New customer can enter their name after phone verification to complete automatic account creation.
- [ ] **AUTH-04**: Returning customer can sign in to access their bookings and can sign out.
- [ ] **AUTH-05**: Customer can access only their own private booking information and payment evidence; neither is exposed through public schedule browsing.
- [x] **AUTH-06**: Administrator can access operational and management actions through authenticated, authorized admin access.

### Booking and availability

- [ ] **BOOK-01**: Customer can select an available session and request one or several participant places in one booking.
- [ ] **BOOK-02**: Customer receives default participant names based on the booker's name and numbered guests, such as Andy, Andy 2, and Andy 3.
- [ ] **BOOK-03**: Customer can edit participant names during booking.
- [ ] **BOOK-04**: Customer can provide the required customer information during booking.
- [ ] **BOOK-05**: Customer can see the session, participant count, price per place, and group total before proceeding to payment.
- [ ] **BOOK-06**: Customer's requested places are temporarily reserved for five hours, with the original payment deadline visible.
- [ ] **BOOK-07**: Customer's unpaid reservation expires and releases its places when the original deadline passes without submitted proof.
- [ ] **BOOK-08**: Customers and admins cannot overbook a session, including simultaneous requests and group bookings; an insufficient-capacity group request cannot reserve only part of the requested group.
- [ ] **BOOK-09**: Customer can view their upcoming bookings and open their details.
- [ ] **BOOK-10**: Customer can distinguish awaiting payment, awaiting verification, confirmed, correction required, expired, and cancelled booking states, with an explanation of the next action when one is available.

### Manual payment and proof review

- [ ] **PAY-01**: Customer can access static QRIS payment instructions that are usable while completing the booking on the same phone.
- [ ] **PAY-02**: Customer can access bank-transfer details and the amount due for their booking.
- [ ] **PAY-03**: Customer can upload payment proof directly from their phone and see whether submission succeeded.
- [ ] **PAY-04**: Customer's submitted proof enters pending verification and keeps the booking's places reserved until admin review, even after the original five-hour deadline.
- [ ] **PAY-05**: Administrator can approve submitted proof to confirm payment and the booking.
- [ ] **PAY-06**: Administrator can reject submitted proof, and the customer can see that correction is required.
- [ ] **PAY-07**: Customer can replace rejected proof using only the time remaining before the original payment deadline; rejection and resubmission do not reset that deadline.
- [ ] **PAY-08**: Customer's places are released when proof is rejected after the original deadline, and payment-proof correction is no longer offered for that expired reservation.

### Daily administration and booking operations

- [ ] **OPER-01**: Administrator can open today's and upcoming sessions directly from the operational portal.
- [ ] **OPER-02**: Administrator can view each session's participant roster, including group participants and their pending or confirmed booking states.
- [ ] **OPER-03**: Administrator can see current session availability and participant-place counts without confusing them with booking counts.
- [ ] **OPER-04**: Administrator can view incoming bookings and open their details.
- [ ] **OPER-05**: Administrator can access a pending-payment-proof queue and inspect a proof alongside its customer, participants, expected total, submission time, deadline, and current state.
- [ ] **OPER-06**: Administrator can view a booking customer's information.
- [ ] **OPER-07**: Administrator can create a booking for a customer contacting the club through WhatsApp or in person, using the same capacity protection as customer bookings.
- [ ] **OPER-08**: Administrator can record payments received outside the application's customer proof-submission flow.
- [ ] **OPER-09**: Administrator can edit customer booking information.
- [ ] **OPER-10**: Administrator can move a customer booking to another session without exceeding the destination capacity.
- [ ] **OPER-11**: Administrator can cancel a customer booking and release its places.
- [ ] **OPER-12**: Administrator can see a monthly recap of revenue counted only from paid (Lunas) bookings, payments still pending, places filled, sessions held, the last six months' revenue and a per-class breakdown (board D7). Added by the user on 2026-10-11.
- [ ] **OPER-13**: Administrator can export the monthly recap to an Excel file. Added by the user on 2026-10-11 as an approved exception to the v2 note on exports.

### Classes and scheduling management

- [x] **SCHED-01**: Administrator can create and manage tennis classes.
- [x] **SCHED-02**: Administrator can create and manage dated sessions and their date/time.
- [ ] **SCHED-03**: Administrator can create and manage recurring schedules that produce dated sessions.
- [x] **SCHED-04**: Administrator can manage coaches.
- [x] **SCHED-05**: Administrator can manage venues.
- [x] **SCHED-06**: Administrator can manage class levels.
- [x] **SCHED-07**: Administrator can manage session prices per participant place.
- [x] **SCHED-08**: Administrator can set each session's minimum participant count and maximum capacity without creating an overbooked session.
- [x] **SCHED-09**: Administrator can assign a venue and one or more coaches to every session.

### Session minimums, cancellations, and refunds

- [ ] **CANC-01**: Administrator can cancel an entire session manually, including when too few participants have joined.
- [ ] **CANC-02**: Administrator can enable or disable automatic minimum-participant cancellation and configure its cutoff.
- [ ] **CANC-03**: An enabled session is automatically cancelled if its eligible participant-place count is below its minimum at the configured cutoff.
- [ ] **CANC-04**: Administrator's minimum-participant count includes confirmed, unexpired awaiting-payment, and awaiting-verification places; every place in a group counts individually.
- [ ] **CANC-05**: Administrator's minimum-participant count excludes expired and cancelled places.
- [ ] **CANC-06**: Customer can see the session's minimum-participant status separately from their own booking/payment status.
- [ ] **CANC-07**: Session cancellation marks affected bookings as cancelled, releases their places, and prevents further bookings for that session.
- [ ] **CANC-08**: Administrator can track refunds due for paid booking or session cancellations.
- [ ] **CANC-09**: Administrator can mark a refund completed after returning the money manually.

### Mobile experience and language

- [ ] **UX-01**: Customer can complete discovery, schedule selection, booking, payment instructions, proof upload, and status lookup entirely on a phone without horizontal page scrolling or obscured primary actions.
- [ ] **UX-02**: Administrator can check today's sessions, participants, incoming bookings, and payment proofs and approve or reject payments entirely on a phone with direct access to these frequent tasks.
- [ ] **UX-03**: Administrator can complete essential booking and schedule management on a phone, including manual bookings, booking changes, recurrence, and session cancellation.
- [ ] **UX-04**: Customers and administrators can use tablet and desktop layouts that expand the same workflows while preserving available actions and status meaning.
- [ ] **UX-05**: Customers and administrators can use the interface in Indonesian or English, with equivalent booking/payment instructions and status explanations.
- [ ] **UX-06**: Customer can follow booking through labeled next actions, clear instructions, and useful validation messages without knowledge of club administration or technical terminology.
- [ ] **UX-07**: Customers and administrators can identify availability and booking/payment states through text as well as color, with readable content and comfortably spaced touch targets.
- [ ] **UX-08**: Customer can return from OTP or payment tasks without losing the selected session and entered booking information, and resume an active reserved booking to submit proof.
- [ ] **UX-09**: Customer can understand and recover from insufficient capacity, OTP-delivery failure, or interrupted proof upload without a false reservation or false submission-success message.

## v2 Requirements

No additional features have been approved for a later release (the recap export, OPER-13, was approved into Phase 3 on 2026-10-11). Waitlists, attendance check-in, other exports, saved guests, memberships, and leagues are research candidates only, not committed requirements. Adding them requires a separate scope decision.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated payment gateway integration in v1 | Static QRIS, bank transfer, and manual proof verification are the agreed initial payment workflow. Future provider support is an architectural constraint, not a v1 integration. |
| Automated refund transfers in v1 | Administrators return money manually; the application tracks due/completed refunds. |
| Customer booking edits, moves, or cancellations | Administrators handle booking changes in the initial version. |
| Native Android or iOS applications in v1 | The requested deliverable is a mobile-first web application with tablet and desktop support. |
| AYO marketplace, scores, ratings, leagues, and public participant profiles | AYO is a presentation reference; its other features and participant exposure are not part of the confirmed Lafu scope. |

## Constraints and decisions for phase planning

The confirmed [UI brief](UI-BRIEF.md), Community matchday direction and code-led build preference informed UI planning. Root DESIGN.md now owns the confirmed Jalur Lawu visual system; Phase 1 architecture is selected in phases/01-publish-and-browse-sessions/01-SKELETON.md. Hosted deployment and later-phase decisions remain open. Payment design must accommodate future providers without requiring a gateway in v1.

Impeccable supplied UI brainstorming; the user confirmed Antislop for UI validation during planning and building. Its core Delivery Gate and UI/mobile-layout checklists supplement functional, browser, accessibility, and user-task verification. No implemented UI has been validated yet.

The following policies must be decided before dependent implementation and reflected in acceptance scenarios. They do not remove or silently change the requirements above:

- Reservation start relative to OTP/account entry; booking eligibility near session start; treatment of unpaid or awaiting-review bookings at session start. Preserve the five-hour window and submitted-proof review hold.
- Primary sign-in mechanism, WhatsApp/SMS OTP channel selection and provider, account recovery, and admin identity provisioning.
- Required customer fields, group limits, the nearly-full threshold, club timezone/currency, and bilingual content responsibilities.
- Automatic-cancellation cutoff scope and edits, delayed checks, and what happens when qualifying pending places expire after the cutoff.
- Recurring schedule edit scope and effects on already-booked occurrences, historical prices, coach assignments, and capacity reductions.
- Admin changes to paid bookings, partial-group moves/cancellations, destination price differences, outside-booking deadline rules, and any approved administrative exceptions. Capacity cannot be overridden implicitly.
- Partial/excess/duplicate payments, proof formats and retention, review turnaround, and payment reconciliation after session cancellation. Cancellation must not revive a booking through later payment approval.
- Refund entitlement/amount and completion records; customer-readable rejection reasons; cancellation/change/rejection communications and manual contact fallback. No additional notification channel or financial term is assumed.

## Traceability

Requirements and roadmap were confirmed on 2026-10-08. Each maps to one acceptance-owner phase in the approved roadmap. Cross-cutting mobile, bilingual, accessibility, and privacy behavior applies from the first relevant workflow; a later acceptance owner verifies the integrated result.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISC-01 | Phase 1 | Accepted by user 2026-10-09 |
| DISC-02 | Phase 1 | Accepted by user 2026-10-09 |
| DISC-03 | Phase 1 | Accepted by user 2026-10-09 |
| DISC-04 | Phase 1 | Accepted by user 2026-10-09 |
| DISC-05 | Phase 1 | Accepted by user 2026-10-09 |
| AUTH-01 | Phase 2 | Source implemented; manual acceptance pending |
| AUTH-02 | Phase 2 | Mock flow implemented; real delivery release gate open |
| AUTH-03 | Phase 2 | Source implemented; manual acceptance pending |
| AUTH-04 | Phase 2 | Source implemented; manual acceptance pending |
| AUTH-05 | Phase 3 | Pending |
| AUTH-06 | Phase 1 | Accepted by user 2026-10-09 |
| BOOK-01 | Phase 2 | Planned |
| BOOK-02 | Phase 2 | Planned |
| BOOK-03 | Phase 2 | Planned |
| BOOK-04 | Phase 2 | Planned |
| BOOK-05 | Phase 2 | Planned |
| BOOK-06 | Phase 2 | Planned |
| BOOK-07 | Phase 2 | Planned |
| BOOK-08 | Phase 2 | Planned |
| BOOK-09 | Phase 2 | Planned |
| BOOK-10 | Phase 4 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| PAY-03 | Phase 3 | Pending |
| PAY-04 | Phase 3 | Pending |
| PAY-05 | Phase 3 | Pending |
| PAY-06 | Phase 3 | Pending |
| PAY-07 | Phase 3 | Pending |
| PAY-08 | Phase 3 | Pending |
| OPER-01 | Phase 2 | Planned |
| OPER-02 | Phase 2 | Planned |
| OPER-03 | Phase 2 | Planned |
| OPER-04 | Phase 2 | Planned |
| OPER-05 | Phase 3 | Pending |
| OPER-06 | Phase 2 | Planned |
| OPER-07 | Phase 2 | Source implemented 2026-10-10; acceptance pending |
| OPER-08 | Phase 3 | Pending |
| OPER-09 | Phase 4 | Pending |
| OPER-10 | Phase 4 | Pending |
| OPER-11 | Phase 4 | Pending |
| OPER-12 | Phase 3 | Pending |
| OPER-13 | Phase 3 | Pending |
| SCHED-01 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-02 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-03 | Phase 5 | Pending |
| SCHED-04 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-05 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-06 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-07 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-08 | Phase 1 | Accepted by user 2026-10-09 |
| SCHED-09 | Phase 1 | Accepted by user 2026-10-09 |
| CANC-01 | Phase 4 | Pending |
| CANC-02 | Phase 5 | Pending |
| CANC-03 | Phase 5 | Pending |
| CANC-04 | Phase 5 | Pending |
| CANC-05 | Phase 5 | Pending |
| CANC-06 | Phase 5 | Pending |
| CANC-07 | Phase 4 | Pending |
| CANC-08 | Phase 4 | Pending |
| CANC-09 | Phase 4 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 5 | Pending |
| UX-04 | Phase 5 | Pending |
| UX-05 | Phase 5 | Pending |
| UX-06 | Phase 3 | Pending |
| UX-07 | Phase 5 | Pending |
| UX-08 | Phase 3 | Pending |
| UX-09 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 69 total (OPER-12 and OPER-13 added 2026-10-11)
- Mapped to phases: 69
- Unmapped: 0
- Duplicate phase assignments: 0

---
*Requirements defined: 2026-10-07*
*Last updated: 2026-10-08 after roadmap approval and Antislop validation preference confirmation*

Phase 2 development uses the approved mock OTP API response. AUTH-02's real WhatsApp/SMS delivery remains a release prerequisite; its acceptance checkbox stays open. The completed 02-00 structural refactor establishes no product requirement acceptance.
