# Project Research Summary

**Project:** Lawu Fun Tennis Club / Lafu  
**Domain:** Mobile-first bilingual coaching reservations and club operations  
**Researched:** 2026-10-07  
**Confidence:** MEDIUM for research recommendations; product scope comes from user decisions  
**Decision status:** Advisory synthesis for requirements and roadmap creation. Technology and phase structure remain open.

## Executive Summary

Lafu replaces a public schedule spreadsheet and WhatsApp reservations with public class discovery, guided customer booking, and a phone-complete admin operation in Indonesian and English. Its central unit is a participant place in a dated coaching session: one account can reserve several editable named places. Established coaching products support recurring sessions and manual payment reconciliation, but Lafu's five-hour reservation, proof-review protection, and pending-inclusive session minimum are specific approved club rules. Build around those rules before treating the product as a collection of calendar and payment screens.

The strongest recommendation across the research is one authoritative reservation lifecycle shared by customers, admins, scheduled jobs, and availability views. Group acquisition must be atomic; repeated requests must have one effect. Preserve the original five-hour deadline, hold places while accepted proof awaits review, and release on rejection when that deadline has passed. Keep payment evidence, verified receipt, booking allocation, and manual refund obligations distinguishable. Compare the existing React/TypeScript/Vite starter with other rendering approaches and evaluate transactional persistence, private storage, managed OTP, and durable jobs separately; no framework, database, API, or infrastructure is selected.

The user selected **Community matchday**, with a code-led build path inspired by the AYO Android publisher screenshots. The detailed UI brief still awaits confirmation; no implementation, mockup, design tokens, or direction contract is approved or built. Carry that direction into novice-friendly session summaries and explicit next actions, while validating complete customer and admin tasks on real phones. The largest unresolved risks are near-start reservation eligibility, pending places disappearing after a successful minimum check, booked recurrence edits, and financial effects of partial group changes or moves. Resolve those policies before their dependent workflows are implemented.

## Key Findings

### Stack evaluation

[STACK.md](STACK.md) supplies a shortlist and selection criteria, not a chosen stack. Retaining React/TypeScript/Vite is the first comparison baseline; evaluate React Router framework mode or Next.js only against explicit public rendering, sharing, and operational requirements. The starter alone provides no booking backend.

- **Transactional persistence:** PostgreSQL is the strongest initial database candidate because coordinated sessions, participants, payments, and concurrent reservations need explicit consistency. ORM choice cannot replace a proven transaction strategy. [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html).
- **Service ownership:** Compare an integrated Supabase approach with an application-owned TypeScript backend, managed database, storage, verification, and scheduled execution. Select ownership and recovery responsibilities together.
- **Identity and proofs:** Evaluate managed WhatsApp/SMS OTP and private object storage with authorized upload/retrieval. Provider support does not establish actual delivery, account recovery, or admin authorization.
- **Bilingual and verification tooling:** i18next, runtime validation, server-state caching, Vitest, and Playwright are candidates. Choose exact dependencies after framework/runtime decisions, and avoid competing cache ownership.

Version guidance is conditional: local manifest ranges are inventory, not audited installed versions. Vite 8 documentation reports Node 20.19+ or 22.12+; the researched Vitest guide requires Node 22.12+. Select a supported runtime and smoke-test exact releases together rather than applying either minimum in isolation. [Vite announcement](https://vite.dev/blog/announcing-vite8.html), [Vitest guide](https://vitest.dev/guide/).

### First-release features and differentiators

[FEATURES.md](FEATURES.md) corroborates familiar coaching operations through official competitor help articles. Every approved item below remains first-release scope, even when delivered in separate increments:

- Public discovery, date navigation, full session facts, and available/nearly-full/full/cancelled states.
- Phone OTP and new-account name entry; upcoming bookings; one or several places with editable booker/numbered-guest defaults.
- Original five-hour unpaid reservations; static QRIS/transfer instructions; mobile proof upload; review protection; approval/rejection and correction within the original deadline.
- Admin Today/upcoming sessions, rosters, customer information, proof review, outside bookings, and outside-payment recording.
- Classes, independent and recurring sessions, levels, prices, capacity, venues, multiple coaches, and participant minimum/maximum.
- Admin booking edits/moves/cancellations, whole-session cancellation, manual refund due/completed tracking, and optional automatic cancellation at a configured minimum cutoff.
- Guided Indonesian/English customer and admin workflows on phones, with tablet/desktop expansion.

Group convenience, honest payment states, one roster across web/WhatsApp/in-person bookings, and complete phone admin operation are practical differentiators. Both confirmed and active pending-payment **places** count toward minimums; expired/cancelled bookings do not. Recurrence, outside operations, refunds, and optional cancellation automation must not be silently deferred.

Defer gateways, automatic refund transfers, native apps, and customer cancellation/rescheduling as explicitly excluded. Waitlists, attendance check-in, exports, saved guests, memberships, and leagues are unapproved future candidates. Transactional notifications and detailed financial records require policy decisions rather than automatic scope expansion. [ClubSpark offline payments](https://sportlabs.zendesk.com/hc/en-us/articles/360020985977-Taking-Offline-Payments-for-Coaching-Courses-and-Sessions), [TeamUp offline refunds](https://support.goteamup.com/en/articles/9327696-confirming-offline-refunds).

### Architecture approach

[ARCHITECTURE.md](ARCHITECTURE.md) recommends cohesive modules behind shared business commands; it does not require separately deployed services:

1. **Schedule:** class defaults, recurring definitions, stable dated occurrences, venues/coaches, prices, limits, and cancellation configuration.
2. **Identity/access:** verified booker identity, customer ownership, and independent admin permissions; guest names remain display data.
3. **Booking/capacity:** all-or-none group allocation, immutable deadline, effective active-place counting, moves, expiry, and cancellation.
4. **Payment/private evidence:** durable authorized proof submission, current evidence version, guarded review, and outside-payment records.
5. **Refunds/jobs/recovery:** manual obligations, repeat-safe expiry/cutoff execution, decision history, and recoverable downstream work.

Use one effective active-place predicate for admission, availability, rosters, and minimum checks. Awaiting-review places remain active beyond five hours; unpaid/rejected places do not after their original deadline. Delayed cleanup cannot keep abandoned places occupied indefinitely. Protect a stable session authority during admission and cancellation; a successful move must acquire destination capacity consistently, while a failed move preserves the source. Generate recurrence into independent occurrences with stable identity and preserved exceptions. [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html), [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html).

### Critical pitfalls

[PITFALLS.md](PITFALLS.md) identifies five priority failure families:

1. **Concurrent overbooking and retries:** share protected reservation commands across customer/admin paths; prove last-place races, atomic groups, and lost-response retries.
2. **Incorrect deadline/review transitions:** use server time, immutable deadlines, durable accepted proof, current-state guards, and repeat-safe reconciliation. Ordinary expiry must preserve awaiting-review places.
3. **Minimum and cancellation races:** count eligible participant places, including active pending places; coordinate cutoff decisions with admission and decide later drops explicitly.
4. **Financial ambiguity and proof exposure:** separate evidence from actual receipt/refund completion, retain reviewed evidence and original amounts, and enforce private per-booking access. Static QRIS requires customer-entered amounts, so screenshots cannot substitute for reconciliation. [Bank Indonesia QRIS](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx).
5. **Recurrence and mobile confusion:** preserve booked occurrences and exceptions; explain states and next actions in both languages; test banking-app return, interrupted upload, and admin review on actual phones. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Implications for Roadmap

The following are suggested **phase topics and dependencies**, not final phase numbers or a committed roadmap. Each implementation increment should carry bilingual mobile behavior and relevant integrity checks.

### Topic A: Policy, technical evaluation, and guided UI brief

Agree lifecycle examples, near-start eligibility, minimum/cutoff semantics, timezone/currency, and implementation ownership before dependent behavior. Confirm the detailed Community matchday brief through the selected code-led path. Deliver explicit decisions and acceptance scenarios, not an inferred design contract. Avoid silently choosing technology, shortening holds, or inventing financial terms.

### Topic B: Public schedule and independent session operations

Deliver public discovery/date browsing and admin management of classes, dated sessions, levels, prices, venues, multiple coaches, min/max, and availability labels. Establish stable occurrence identity/time semantics now, so later recurrence preserves bookings. Include staff access appropriate to management. Avoid exposing private rosters or building a desktop-dependent calendar. Depends on Topic A's settings and boundaries.

### Topic C: Identity and capacity-safe group reservations

Deliver verified phone/name accounts, customer ownership, numbered editable participants, upcoming bookings, shared customer/admin reservation admission, original five-hour deadlines, and effective expiry. Prove concurrency and duplicate-request behavior before payment handling. Outside booking entry belongs to this shared path. Depends on eligible sessions and agreed authentication/hold policy; avoids overbooking, duplicate accounts, and guest-profile friction.

### Topic D: Manual payment and mobile review

Deliver static QRIS/transfer instructions, durable private proof upload, awaiting-review holds, approval/rejection, original-deadline correction, outside payments, and clear customer/admin status. Design proof and expiry transitions together. Depends on ownership and reservation integrity; avoids public screenshots, false confirmation, renewed deadlines, and duplicate receipt recording.

### Topic E: Admin adjustments, cancellation, and refund tracking

Deliver agreed edits/moves/cancellations, whole-session cancellation, preserved payment history, and manual refund due/completed queues. Resolve partial-group and price-difference policies before those actions. Depends on shared capacity/payment commands; avoids failed moves losing source places, cancelled bookings being revived, and paid cancellations losing obligations.

### Topic F: Recurrence and optional cutoff automation

Deliver bounded repeat-safe recurring generation, agreed series/occurrence edits, and optional minimum cancellation at the configured cutoff. Both remain launch requirements. Depends on stable sessions plus proven cancellation/refund behavior. Avoid regenerated booked instances, stale jobs, paid-only minimum counts, and accidental automation when disabled.

### Topic G: Operational and real-phone release validation

Validate complete bilingual novice/customer/admin tasks, tablet/desktop expansion, private access, provider delivery, delayed/repeated jobs, recovery, review throughput, and agreed cancellation communication. This integrates evidence gathered throughout the build rather than postponing accessibility/localization. Release requires all approved scope, not merely a successful booking demo.

### Ordering and research flags

Independent sessions precede reservations; trustworthy reservation state precedes payment review; cancellation/refunds precede automated cancellation. Recurrence relies on stable occurrences and explicit edit semantics. Topics may be combined or reordered where their prerequisites remain satisfied.

**Deeper research:** A/C for selected architecture and OTP/recovery; D for storage finalization, evidence immutability, and submission boundaries; E for financial exceptions; F for recurrence semantics and scheduler guarantees; G for hosting/restore and communication delivery. Use phase-specific research once final phases exist.

**Standard patterns:** B's public lists/date navigation and basic management, translation resource wiring, and responsive expansion are well documented. They need implementation/usability validation; new broad research is unnecessary unless selected tooling introduces uncertainty.

## Confidence Assessment

| Area | Confidence | Evidence and limits |
|---|---|---|
| Stack | MEDIUM | Current official documentation; no assembled/deployed candidate or exact compatibility audit; Context7 unavailable. |
| Features | MEDIUM | Eight official competitor guides corroborate operations; no customer interviews or measured demand. Approved scope has direct user authority. |
| Architecture | MEDIUM | Primary transaction/calendar/provider sources support mechanisms; boundaries and race handling are engineering inferences, not tested implementation. |
| Pitfalls | MEDIUM | Primary security, accessibility, concurrency, and QRIS guidance; no Lafu incident/workload/task-test data. |
| UI | MEDIUM | Publisher screenshots support visible composition; no installed AYO walkthrough or Lafu usability testing. Direction selection is a user decision. |

The research seam classified verified websearch as MEDIUM. Features/architecture used TinyFish transport, whose unsupported classifier label left LOW cache scores; retain this provenance without implying either production guarantees or disproven findings. Bank Indonesia's direct open failed; indexed official text was cross-checked. This synthesis aggregates researcher evidence and adds no independent live verification.

### Gaps to Address

- **Hold/start boundaries:** booking closing time, exact deadline/submission boundary, uploads in flight, and proof/attendance treatment near session start.
- **Minimum policy:** cutoff scope/edits/delayed execution and pending places expiring after a successful check; preserve pending-inclusive counts.
- **Recurrence:** edit scope, existing bookings/prices, exceptions, booking horizon, and all-coach/venue overlap policy.
- **Admin/financial exceptions:** partial groups, moved deadlines, price differences, partial/duplicate/late payments, refund amounts, and corrections.
- **Identity and operation:** primary sign-in, OTP provider/channel, recovery and admin-created customer claiming; review responsibility and real delivery performance.
- **Presentation/communication:** club timezone/currency, translation ownership, nearly-full threshold, proof formats/retention, notification channels/manual fallback, and confirmed detailed UI brief.

## Sources

Primary product authority: [PROJECT.md](../PROJECT.md), [PRODUCT.md](../../PRODUCT.md), and subsequent user selection of Community matchday. Detailed provenance and full source inventories: [STACK.md](STACK.md), [FEATURES.md](FEATURES.md), [ARCHITECTURE.md](ARCHITECTURE.md), [PITFALLS.md](PITFALLS.md), [UI.md](UI.md). Earlier UI selection-pending language is superseded by that user selection only.

Additional primary sources, accessed by researchers on 2026-10-07:

- [ClubSpark recurring coaching](https://sportlabs.zendesk.com/hc/en-us/articles/360001052546-Creating-Recurring-Coaching-Sessions) and [CourtReserve events](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes): timetable, instructors, capacity and cutoff controls.
- [TeamUp pending offline payments](https://support.goteamup.com/en/articles/9327466-confirming-cancelling-editing-and-managing-pending-offline-payments): manual receipt queue.
- [AWS retry-safe APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): repeat-safe intent and effects.
- [Supabase phone login](https://supabase.com/docs/guides/auth/phone-login), [Twilio WhatsApp Verify](https://www.twilio.com/docs/verify/whatsapp), [NIST authentication guidance](https://pages.nist.gov/800-63-4/sp800-63b.html): delivery candidates and identity safeguards.
- [OWASP uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) and [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html): private validation/access and evidence replacement risks.
- [AYO Android publisher listing/screenshots](https://play.google.com/store/apps/details?id=coid.ayo.ayo_mobile_app&hl=en): mobile visual inspiration, not interaction validation or a feature mandate.

*Research completed: 2026-10-07. Ready for requirements and roadmap discussion; policies and implementation choices remain open.*
