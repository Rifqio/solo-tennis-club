# Lafu UI brief: Community matchday

**Date:** 2026-10-07
**Status:** Community matchday direction and detailed brief confirmed by the user on 2026-10-07.
**Method:** Impeccable shape. Planning only; no implementation or direction contract.

## Job and audience

Customers, including people unfamiliar with technology, need to choose and book tennis coaching from a phone. Admins need to run today's classes and verify payments from a phone. Both surfaces use Operate mode: completing the task takes priority, with club identity expressed through consistent typography, color, and real content.

## Outcome and evidence

Customers can identify a suitable date/session, see remaining places, book a group, understand payment instructions, submit proof, and recognize what happens next. Admins can find today's participants and pending proofs with little navigation.

Product truth comes from `.planning/PROJECT.md` and `PRODUCT.md`. AYO's publisher screenshots inform visible mobile presentation, especially its date strip, chronological activity summaries, and readable session facts. They do not prove a full checkout or admin flow. No Lafu production schedules, images, exact prices, or usability measurements have been supplied; later demonstrations must label illustrative data.

## Selected direction

The user chose **Community matchday**, keeping the direct-from-brief build preference. The concept combines a familiar sports app with explicit booking and payment guidance. Clear date choices and session summaries lead into a short booking sequence; after reservation, the customer's original payment deadline and next action remain easy to find.

The concept uses readable bold sans headings, neutral task surfaces, and a committed club-green identity with separate semantic statuses. The direction-page palette is an exploration reference, not a finalized token set. Exact fonts, contrast-tested tokens, component specifications, and motion belong to the later UI design contract. No mockup was generated or approved.

## Scope and boundaries

- First customer surfaces: public schedules, session details, group/customer entry, payment/proof submission, booking status, and upcoming bookings; club discovery remains reachable.
- First admin surfaces: Today/upcoming sessions, participants and booking detail, incoming bookings, and payment review; management of classes/sessions/recurrence and reference data remains in the full product scope.
- This brief describes intended behavior and hierarchy. Frameworks, database/API/infrastructure, detailed routes, and implementation sequencing remain separate decisions.
- Preserve all agreed capacity, five-hour deadline, pending-review, minimum-participant, cancellation, and manual-refund rules.
- AYO's unrelated marketplace, scores, leagues, ratings, public profiles, and promotional claims are not added by the visual reference.

## Interaction and layout

### Customers

1. **Browse:** show a concise Lafu identity and accessible club information, then date choices and sessions grouped by time. Keep login prompts out of public browsing. Add an explicit date picker for dates outside the visible strip.
2. **Decide:** show class/level, date/time, venue, all coaches, price per place, and remaining places. Use words such as available, nearly full, or full alongside visual status. Put the booking action in a comfortable phone reach area.
3. **Book:** guide customers through place count, editable numbered guest names, identity/name entry when needed, and a clear group total. Keep chosen session context visible and preserve entered information when returning from OTP or payment tasks.
4. **Pay:** show the original deadline, exact payment instructions, QRIS/bank options, and proof upload with one obvious next action. Make same-phone QRIS usage practical; method-specific instructions need validation against the club's payment setup.
5. **Understand status:** distinguish awaiting payment, proof awaiting verification, confirmed booking, correction required, expired reservation, and cancellation. Show whether the session has met its minimum separately. After rejected proof, retain the original deadline and remove correction actions when no time remains.
6. **Return:** make upcoming bookings directly accessible. Customer booking changes remain admin-managed.

Proposed phone destinations are Schedule, My bookings, and Account/help; final labels and whether discovery warrants a separate destination remain open. Use familiar back navigation and visible labels. Tablet/desktop may show session list and detail together while keeping the same sequence.

### Administrators

1. **Today:** lead with sessions, time, venue, coaches, participant places, minimum/maximum, and payment state counts. A booking count must not be mistaken for a participant count.
2. **Participants:** open a readable roster with expandable groups and labeled pending/confirmed states. Preserve the operational meaning of the old red names without relying on color alone.
3. **Review:** make the proof queue directly accessible. Put proof and booking context together: customer/group, expected total, submission time, deadline, and current state. Approval and rejection need clear feedback; the details of customer-readable rejection reasons are to be scoped.
4. **Manage exceptions:** allow manual bookings/payments, moves/cancellations, and refund tracking through the same meaningful booking states. Financial effects should be clear before applying changes.
5. **Manage schedules:** keep daily edits fully phone-usable; use desktop space for longer lists and complex recurring operations without requiring it.

Proposed destinations are Today, Sessions, Bookings, Payments, and Manage, with short translated labels. These are an information-architecture proposal, not finalized routes. On larger screens, use list/detail or proof/review panes to speed up the same operations.

## States and content ranges

Cover empty-date results, loading, full sessions, capacity changing during booking, group sizes larger than remaining places, OTP delivery failure, interrupted upload, review pending, rejected proof before/after the original deadline, expired holds, cancelled sessions, and refunds due/completed.

Handle multiple coaches, long participant/venue names, groups spanning several places, and longer Indonesian/English labels without clipping or shrinking text. Actual typical/maximum sessions per day, name lengths, proof sizes, prices, and booking-group limits have not been supplied and must not be invented as policy.

## Constraints and open decisions

- Phone-first hierarchy, comfortably spaced touch targets, visible keyboard focus, text-based statuses, and safe areas around fixed navigation/actions.
- Indonesian and English across customer/admin flows; keep user-entered names separate from translated interface labels.
- No public exposure of participant names or customer payment evidence is authorized by the reference screenshots.
- Set reservation start/eligibility rules relative to OTP, available capacity, and session start before implementation.
- Resolve what happens if active pending places meet a minimum at cutoff and subsequently expire.
- Decide timezone/currency, cancellation communications, primary identity path, recurring edit scope, partial-group changes, and payment/refund differences during requirements and phase planning.
- Final UI design specifications, real club assets, and usability evidence remain work for later phases.

## Review

The user confirmed this brief on 2026-10-07. It can inform the detailed UI specification during planning. Final design tokens, component specifications, and implementation remain subject to the later planning workflow.

## UI validation

On 2026-10-08, the user confirmed Antislop for UI validation during planning and building. Impeccable supplied the brainstorming and direction above. Apply Antislop core plus its UI and mobile-layout skills to the later design specification and implemented screens: product-specific hierarchy and identity, purposeful styling, mobile reflow, touch targets, safe areas, readable states, and complete interactions. Declare the design read and dials during detailed UI planning, using the confirmed direction.

Before delivering implemented UI, record the Antislop Delivery Gate and applicable checklist evidence alongside browser/build, keyboard/contrast, responsive, and complete booking/admin workflow checks. This brief's approval is not a claim that implemented UI has passed those checks.
