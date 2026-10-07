# Feature Research

**Project:** Lafu — Lawu Fun Tennis Club
**Domain:** Mobile-first tennis coaching session booking and club administration
**Researched:** 2026-10-07
**Overall confidence:** MEDIUM for market expectations and prioritization; approved product scope comes directly from PROJECT.md and the user's decisions.

## Research Basis

Recommend a focused session-booking product that replaces both the public schedule spreadsheet and the admin's booking/payment spreadsheet. The customer reserves participant places in a scheduled coaching session; the club operates the session, its roster, and its payments. Standalone court rental, league management, subscriptions, and a social network serve different jobs and should not expand the first release.

Eight official help articles provide the evidence below. They establish documented competitor capabilities, not customer demand statistics, competitor market share, or proof that a specific feature improves conversion. Cross-product similarities support the table-stakes recommendations with MEDIUM confidence. Lafu's exact five-hour reservation, proof-review hold, numbered guests, and pending-place minimum rules are approved local requirements; competitor behavior does not override them.

The GSD research-plan seam selected `websearch`. TinyFish search and fetch supplied the actual official-page transport. `classify-confidence --provider websearch --verified` returned MEDIUM; the seam does not recognize `tinyfish` and returns LOW for that provider, so local cached digests retain LOW transport confidence. The corroborated conclusions below remain labeled MEDIUM and distinguish direct documentation from product recommendations. No technology stack or visual direction is decided here.

## Feature Landscape

### Table Stakes and Required First-Release Capabilities

All rows marked **Approved** belong in the first release. Complexity describes operational/product complexity, not a stack estimate. **Research recommendation** adds detail for requirements discussion and needs approval where it changes behavior.

| Feature | Why It Matters | Complexity | Lafu Scope and Confidence |
|---------|----------------|------------|---------------------------|
| Public club discovery and upcoming schedule | Customers need to decide whether a class suits them before identifying themselves. ClubSpark documents website discovery and venue filtering. | MEDIUM | **Approved:** public browsing, quick date navigation, session date/time, coaches, level, venue, price, capacity and remaining places. Market inference: MEDIUM. [ClubSpark customer booking guide](https://sportlabs.zendesk.com/hc/en-us/articles/4404661659793-How-To-Book-A-Recurring-Session-Course). |
| Clear availability and session state | Capacity is a booking promise; a full or cancelled session must not look bookable. | HIGH | **Approved:** available, nearly full, fully booked and cancelled states; temporary reservations reduce availability. Define the nearly-full threshold during requirements. Capacity limits are documented by [CourtReserve event creation](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes). Market inference: MEDIUM. |
| Phone identity and account continuity | The booker must recover their payment instructions and upcoming bookings without a second disconnected record. | HIGH | **Approved:** sign-in/sign-up encouragement plus phone-number entry, WhatsApp or SMS OTP, and name entry to automatically create a new customer account. Delivery channel and existing-account recognition remain open. This exact flow is a local requirement, not a researched competitor claim. |
| One or several places per booking | A group must fit in the remaining capacity and appear as individual participants to the club. | HIGH | **Approved:** one booker, several places, names defaulting to the booker's name and numbered guests, editable during booking. CourtReserve documents guest partner registration, but its two-person team flow is not equivalent to arbitrary group booking. [CourtReserve team-based events](https://help.courtreserve.com/en/articles/11429176-team-based-events-create-an-event). Market inference: MEDIUM. |
| Payment instructions and booking total | Manual payment needs an unambiguous amount and destination. | MEDIUM | **Approved:** static QRIS/bank transfer, phone-friendly instructions and proof upload. **Research recommendation:** show quantity, per-place price, total, booking reference and original deadline together. ClubSpark supports offline instructions and recording received payments. [ClubSpark offline payments](https://sportlabs.zendesk.com/hc/en-us/articles/360020985977-Taking-Offline-Payments-for-Coaching-Courses-and-Sessions). Market inference: MEDIUM. |
| Reservation and payment lifecycle | A customer must know whether to pay, wait, correct proof, or contact the club. | HIGH | **Approved:** five-hour unpaid hold; expiry releases places if no proof; submitted proof holds places until review; approval confirms; rejection preserves only the remainder of the original deadline and releases places when that deadline has passed. Local requirement. |
| Upcoming bookings and readable status | A submitted payment is not yet an approved payment; cancellation is not a completed refund. | MEDIUM | **Approved:** customers see upcoming bookings and clear booking/payment states. **Research recommendation:** retain a readable expired/cancelled booking detail so customers can understand previous actions; confirm whether a history list is needed. |
| Admin today/upcoming view and participant roster | Admins need to run a session and check names/payment state while using a phone. | MEDIUM | **Approved:** today's/upcoming sessions, participants, available places, incoming bookings and proofs. **Research recommendation:** show total places separately from booking count and confirmed/pending counts. ClubSpark's offline guide links paid state to its register. [ClubSpark offline payments](https://sportlabs.zendesk.com/hc/en-us/articles/360020985977-Taking-Offline-Payments-for-Coaching-Courses-and-Sessions). Market inference: MEDIUM. |
| Payment review and outside-payment records | Proof is evidence to inspect; actual receipt must be confirmed by an admin. | HIGH | **Approved:** inspect, approve or reject proof; record payments outside the app flow. **Research recommendation:** retain received amount, method, date and verifying admin; require an understandable rejection reason. TeamUp documents a pending offline queue and manual receipt confirmation. [TeamUp pending offline payments](https://support.goteamup.com/en/articles/9327466-confirming-cancelling-editing-and-managing-pending-offline-payments). Market inference: MEDIUM. |
| Admin-created bookings and customer information | WhatsApp and in-person requests must enter the same capacity and roster as customer bookings. | HIGH | **Approved:** view customer details; create bookings on behalf of customers; apply the same group-place and availability rules. Guest and admin registration are documented by [CourtReserve team-based events](https://help.courtreserve.com/en/articles/11429176-team-based-events-create-an-event). Market inference: MEDIUM. |
| Class, session and recurring schedule management | Repeating weekly coaching cannot require spreadsheet duplication. A recurring timetable and an individual dated session are different operations. | HIGH | **Approved:** classes, individual sessions, recurring schedules, coaches, venues, levels, prices and capacity. ClubSpark supports weekly individual sessions with session defaults. [ClubSpark recurring coaching](https://sportlabs.zendesk.com/hc/en-us/articles/360001052546-Creating-Recurring-Coaching-Sessions). Market inference: MEDIUM. |
| Venue, multiple coaches, minimum and maximum places | These define the session's real operating constraints. | HIGH | **Approved:** venue, one or more coaches, min/max attendees. Each place counts once; confirmed and active pending-payment places count toward minimum, expired/cancelled places do not. Competitor event documentation supports configurable attendance and instructors, but does not establish Lafu's pending-payment counting rule. [CourtReserve event creation](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes). |
| Admin booking changes and session cancellation | Club operations need to correct names, move bookings and cancel sessions without leaving stale availability. | HIGH | **Approved:** admin change/move/cancel; customer changes prohibited; whole-session cancellation. Confirm group splitting, price changes and paid moves. CourtReserve documents disabling customer withdrawal; TeamUp distinguishes one occurrence from its repeating schedule. [CourtReserve event creation](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes), [TeamUp class cancellation](https://support.goteamup.com/en/articles/9327529-how-to-cancel-a-class-on-a-specific-date-and-time). Market inference: MEDIUM. |
| Optional automatic minimum-attendance cancellation | The club can avoid manually monitoring each configured cutoff. | HIGH | **Approved:** optional automatic cancellation at admin-configured cutoff; manual cancellation remains. Confirm configuration scope and post-cutoff behavior. CourtReserve documents minimum participation and cancellation deadlines; its paid/pending semantics must not be assumed to match Lafu. [CourtReserve event creation](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes). Market inference: MEDIUM. |
| Manual refund tracking | Cancelling a paid booking creates work that must remain visible until money is returned. | MEDIUM | **Approved:** refund due/completed; admin moves money manually. **Research recommendation:** amount, reason and completion record tied to the cancelled booking. TeamUp records offline refunds after external transfer. [TeamUp offline refunds](https://support.goteamup.com/en/articles/9327696-confirming-offline-refunds). Market inference: MEDIUM. |
| Indonesian and English on all device sizes | Both audiences must understand deadlines, actions and payment states in their selected language. | MEDIUM | **Approved:** bilingual customer/admin workflows; mobile-first with tablet/desktop expansion. Include validation messages, upload errors, OTP messages, status explanations and management forms. Currency, venue timezone and location are unconfirmed; interface language must not silently change the meaning of a session time or amount. |

### Differentiators

These describe useful product strengths, not claims of uniqueness in the market. Confidence in their value is MEDIUM because the club workflow is known, but customer usability has not yet been tested.

| Feature | Value Proposition | Complexity | First-Release Position |
|---------|-------------------|------------|------------------------|
| Group booking without guest account forms | A customer can reserve for friends quickly while the coach receives individual names. | HIGH | **Approved P1.** Preserve numbered defaults and editable names; do not turn each guest into a mandatory new account. |
| Honest payment status and original deadline | Customers understand why their places are held and how much correction time remains. | HIGH | **Approved P1.** Distinguish unpaid reservation, awaiting review, confirmed, expired and cancelled; expose proof rejection without resetting the deadline. |
| One roster for web, WhatsApp and in-person bookings | The club stops maintaining multiple conflicting lists. | HIGH | **Approved P1.** Outside bookings and outside payments are part of the same daily operation. |
| Phone-complete admin review and session operation | Staff can inspect proof, reconcile bookings and run today's classes away from a desk. | MEDIUM | **Approved P1.** Desktop can add space; phone operation must remain complete. |
| Optional minimum automation reflecting this club's actual participant convention | The app matches the existing red-name pending participant workflow. | HIGH | **Approved P1.** Count places, including active pending places; show enough information for manual judgment. |
| Cancellation and refund follow-through | A cancelled class does not lose its payment obligations. | MEDIUM | **Approved P1.** Keep due refunds visible until the admin confirms the manual transfer. |
| Transactional notifications | Customers can learn about approval, rejection or cancellation without repeatedly opening the app. | MEDIUM/HIGH | **Recommendation requiring approval:** decide minimum events, channel, language and manual fallback. Competitor cancellations include notification options, supporting the need to discuss communication rather than automatically adding a messaging integration. [TeamUp class cancellation](https://support.goteamup.com/en/articles/9327529-how-to-cancel-a-class-on-a-specific-date-and-time). |

### Anti-Features and Scope Creep

The first four rows are explicit exclusions. Remaining rows are research recommendations and must not be mistaken for approved future commitments.

| Feature | Why It Is Tempting | Why Avoid It Here | Alternative |
|---------|-------------------|-------------------|-------------|
| Automatic payment gateway and automatic refunds | Instant money reconciliation | Explicitly excluded from the initial release. It would replace the approved manual operating model. | QRIS/bank instructions, proof review, outside payment records and manual refund completion. |
| Customer rescheduling/cancellation | Common self-service convenience | Explicitly excluded; it requires cancellation terms and payment adjustments the club has assigned to admins. | Clear contact route and admin change actions. |
| Native mobile apps | App-store presence and notifications | Explicitly excluded from the initial release; customers and admins need a capable web experience. | Complete mobile web workflows. |
| Resetting the five-hour window after rejected proof | Makes correction easy | Directly conflicts with the approved original-deadline rule. | Show remaining original time; expire if it has elapsed. |
| Membership subscriptions, credit packs and loyalty schemes | Repeat revenue and promotions | Adds balances, billing periods and eligibility to a per-session payment workflow. | Keep per-session prices; revisit after evidence of a club need. |
| Standalone court rental, leagues, rankings and partner matching | Adjacent tennis features | Different scheduling, pricing and participant models from coaching sessions. | Make scheduled class booking reliable first. |
| Automatic waitlist promotion | Fills released places | Requires group-size fairness, contact deadlines, payment holds and promotion near session start. No approved waitlist policy exists. | Show accurate reopened availability; admins can handle requests manually until a policy is approved. |
| Screenshot OCR auto-approval | Reduces proof review | A screenshot's content does not establish money receipt and introduces a second approval policy. | Human verification against payment records. |
| Public participant names or phone details | Copies the spreadsheet or makes attendance social | Public schedule browsing does not authorize public disclosure of customer/guest identities. | Publish counts and session information; keep detailed rosters in the admin workflow. Recommendation requiring approval if public names are desired. |
| Mandatory full profiles for all guests | Rich customer data | Adds friction and changes the approved numbered-name group booking flow. | Booker identity plus guest display names; discuss additional fields only if coaches need them. |
| Multi-session basket and automatic recurring customer enrollment | Competitors offer series enrollment | Admin recurring schedules are approved; customers purchasing several future dates or being automatically enrolled are separate capabilities. | One selected session with several places; discuss date bundles separately if needed. |

## Feature Dependencies

```text
Class/level/venue/coach records + dated sessions
  -> public schedule and session details
  -> recurring schedule generation and per-occurrence management

Public session selection + verified booker identity + participant quantity/names
  -> capacity-safe customer and admin booking
  -> original five-hour deadline and expiry

Booking + payment amount/instructions
  -> proof upload and review hold
  -> admin approve/reject + original-deadline correction
  -> customer booking/payment status

Shared booking/payment records
  -> admin today/rosters + outside booking/payment entry
  -> admin move/cancel + whole-session cancellation
  -> refund due/completed tracking

Current place counts + session minimum + cutoff policy + cancellation/refunds
  -> optional automatic minimum cancellation

Language support
  -> every customer/admin step, status, validation and approved communication
```

### Dependency Notes

- **Identity and names are different:** the account belongs to the booker; a booking can contain several attendee names. Capacity and minimum count attendee places, not accounts or booking rows.
- **Recurring timetable is not recurring purchase:** recurring schedules produce independently operated dated sessions. Existing bookings must survive edits according to an explicit occurrence/series policy. Customer full-series purchase is not implied.
- **Availability and minimum eligibility share booking states:** confirmed, unpaid-but-active and awaiting-review places consume capacity and count toward the approved minimum. Expired/cancelled bookings do neither. Rejected proof follows the original deadline.
- **Cancellation precedes automation:** establish effects on every booking/payment/refund state before automatic cutoff cancellation uses those effects.
- **Admin booking entry is a first-class path:** it must share capacity and payment rules with the customer path. Admin overrides, if desired, need an explicit policy.
- **Notifications depend on real transitions:** OTP delivery is approved; booking/payment/cancellation communications are a separate policy choice. Do not equate the OTP channel with an approved transactional messaging channel.
- **Bilingual behavior begins with foundational workflows:** translations must preserve the same deadline, amount and status meaning. Localization should not be a final cosmetic phase.

## First-Release Definition

### Launch With All Approved Scope

1. Public Lafu discovery, schedule/date browsing and complete session details in Indonesian and English, with clear availability/cancellation states.
2. Verified phone identity with new-account name entry; recovery of upcoming bookings; an agreed sign-in/sign-up flow.
3. One-session booking of one or multiple places, numbered editable names, accurate total and capacity protection.
4. Original five-hour reservation, expiry, static QRIS/bank instructions, phone proof submission, proof-review hold, approval/rejection and correction within the original deadline.
5. Phone-complete daily admin sessions, rosters, customer details, incoming bookings, proof review, outside bookings and outside payment records.
6. Class/session/recurring schedule management, coaches, venues, levels, prices, venue assignment, multiple coaches and min/max attendees.
7. Admin booking edits/moves/cancellations and session cancellation; customer booking changes remain unavailable.
8. Optional automatic minimum cancellation at the configured cutoff, using all confirmed and active pending-payment places.
9. Refund due/completed tracking for paid cancellations while transfer of money remains manual.
10. Tablet/desktop expansion of all essential customer/admin operations.

These are release criteria, not a claim that everything fits one development phase. Phase ordering can deliver vertical increments, but recurring schedules, outside bookings/payments, automatic minimum cancellation and refund tracking must not be silently deferred from the approved release.

### Additions Requiring Approval

Recommend deciding transactional cancellation and proof-rejection communication before launch because those events require customer action. Also confirm rejection reasons, payment receipt fields, refund amount/completion fields, change history and the customer contact route. They are practical details that complete the approved operations, but their exact policy and channel are not settled by this research.

Consider later, only after validation: simple attendance check-in, export/reconciliation reports, saved guest names and waitlists. Each needs evidence of actual operational demand. Subscriptions, credit packs, court rental and leagues remain separate possible products rather than a planned second release.

## Feature Prioritization Matrix

| Capability | User Value | Product Complexity | Priority |
|------------|------------|--------------------|----------|
| Public session discovery and clear availability | HIGH | MEDIUM | P1 — approved |
| Bilingual customer/admin workflows and mobile completion | HIGH | MEDIUM | P1 — approved |
| Verified booker and multi-place participant booking | HIGH | HIGH | P1 — approved |
| Original hold, proof review, expiry and clear payment status | HIGH | HIGH | P1 — approved |
| Admin today/rosters/customer details and outside entry | HIGH | HIGH | P1 — approved |
| Classes, dated/recurring sessions and operating records | HIGH | HIGH | P1 — approved |
| Admin changes, cancellation and manual refund tracking | HIGH | HIGH | P1 — approved |
| Optional cutoff cancellation with pending-place minimums | HIGH | HIGH | P1 — approved |
| Transactional notification policy and delivery | HIGH | MEDIUM/HIGH | Decide before launch — recommendation requiring approval |
| Attendance check-in and simple exports | MEDIUM | MEDIUM | P2 — unapproved candidate |
| Saved guest names and waitlist | MEDIUM | MEDIUM/HIGH | P2 — only after validated demand/policy |
| Memberships, subscriptions, leagues, court rental | Unvalidated | HIGH | P3 — outside this release |

P1 means required for the approved release; P2/P3 label optional research candidates and do not authorize implementation.

## Official Product Evidence

| Area | Documented Behavior | Lafu Implication |
|------|---------------------|------------------|
| ClubSpark recurring coaching | Weekly recurring individual sessions; coach/time/duration/capacity/cost defaults; booking horizon; session selection by customers. | Recurring session operations are established domain behavior. Preserve Lafu's approved recurring management. [Admin guide](https://sportlabs.zendesk.com/hc/en-us/articles/360001052546-Creating-Recurring-Coaching-Sessions), [customer guide](https://sportlabs.zendesk.com/hc/en-us/articles/4404661659793-How-To-Book-A-Recurring-Session-Course). |
| ClubSpark offline payments | Offline instructions; unpaid register status; admin updates payment amount/type when payment arrives. | Manual payment is a credible operating flow. Lafu additionally requires uploaded proof and a distinct review hold. [Guide](https://sportlabs.zendesk.com/hc/en-us/articles/360020985977-Taking-Offline-Payments-for-Coaching-Courses-and-Sessions). |
| CourtReserve session controls | Recurrence exceptions, participant limits, minimum/cutoff cancellation, instructor assignments and an option to disable customer withdrawal. Drop-in auto-cancellation applies per date; enrollment falling below minimum after cutoff needs manual cancellation. | Supports Lafu's scheduling/control needs; define its own post-cutoff policy and place-count semantics. [Guide](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes). |
| CourtReserve partner registration | A registering player can add a guest partner; admins can register partners. The documented team has two players and is in open beta. | Guest convenience is documented, but do not copy this team model into Lafu's arbitrary-size group booking. [Guide](https://help.courtreserve.com/en/articles/11429176-team-based-events-create-an-event). |
| TeamUp manual reconciliation | A queue for pending offline payments; explicit receipt confirmation; offline refunds confirmed after transfer. | Keep payment receipt and refund completion as separate admin actions. [Payment guide](https://support.goteamup.com/en/articles/9327466-confirming-cancelling-editing-and-managing-pending-offline-payments), [refund guide](https://support.goteamup.com/en/articles/9327696-confirming-offline-refunds). |
| TeamUp cancellation | Cancelling one dated class preserves other occurrences; cancellation offers refund choices and attendee notification with optional note. | Specify cancellation scope, obligations and communication together. Its credits/processor refunds are not Lafu's approved manual refund model. [Guide](https://support.goteamup.com/en/articles/9327529-how-to-cancel-a-class-on-a-specific-date-and-time). |

The evidence establishes positive documented capabilities. Unmentioned features are unknown, not absent. No source was found that validates Lafu's exact five-hour proof-review state machine; the user is its authority.

## Operational Questions for Requirements and Phase Planning

| Question | Why It Changes Behavior | Recommended Direction for Discussion |
|----------|--------------------------|--------------------------------------|
| Can booking occur less than five hours before session start? What happens if a held booking is still unpaid or under review when the session begins? | The approved deadline and review hold can outlast the class. | **Needs approval:** define a booking-close/start policy that preserves the original five-hour and review-hold rules; do not silently shorten holds. |
| Is minimum cutoff set per session, recurring series, class or globally, and relative to start or an absolute time? | Admin configuration must produce a predictable decision per occurrence. | **Needs approval:** show the resolved cutoff on each session. |
| What if active pending places meet the minimum at cutoff but later expire or are rejected? | Under the approved rule a session can qualify without confirmed payment and later fall below minimum. | **Needs approval:** decide single cutoff check plus manual follow-up versus additional automation; do not change the eligible participant rule. |
| What happens to pending proof if the session is cancelled before review? | A cancellation can precede confirmation of money already transferred. | **Needs approval:** ensure admins can reconcile received money and create the appropriate refund record without reviving the session booking. |
| Which edits affect one occurrence, future occurrences or the whole recurring series? | Changing price, coaches, capacity or time can affect existing bookings. | **Needs approval:** explicit edit scope, cancellation exceptions and protected historical session information. |
| Can admins split a group, cancel one place, or move only some participants? | Partial operations alter capacity, amounts and possible refunds. | **Needs approval:** decide supported operations and price-difference handling; do not infer partial moves from generic admin edit approval. |
| How are partial, excess, duplicate or unidentified payments handled? | A proof image can differ from the booking amount or be reused. | **Needs approval:** define acceptance/rejection and reconciliation paths; no automatic screenshot-based receipt decision. |
| Does admin-created booking receive the same five-hour deadline; can admins waive payment or override capacity? | An undocumented exception undermines availability and minimum counts. | **Needs approval:** default to shared rules; make exceptions explicit if required. |
| Which events notify customers/admins, through what channel, and in which language? | Rejection, cancellation and schedule changes can need action before a deadline. | **Needs approval:** prioritize those events; define manual fallback and contact responsibility. OTP channel choice alone does not answer this. |
| Are refunds always full, or can cancellations/moves generate partial refunds? What records mark completion? | Due/completed states alone do not define amount or entitlement. | **Needs approval:** amount, reason, completion date/admin and applicable club terms; no invented cancellation fee policy. |
| Are minors/family booking, waivers or emergency contacts part of the club's classes? | Participant fields and the booker/attendee relationship may need additional rules. | **Needs approval:** collect only what club operations require. No automatic waiver, date-of-birth or full guest profile requirement. |
| What are venue locations, operational timezone, currency and bilingual content responsibilities? | Language choice must not reinterpret time, money or class descriptions. | **Needs approval:** confirm these explicitly; Indonesian language/QRIS does not settle every operational setting. |

Also define the nearly-full threshold, proof file expectations, realistic review turnaround and phone/account-change recovery during phase-specific planning. These complete the operational contract without selecting providers or technology here.

## Sources and Confidence

All pages were searched and fetched on 2026-10-07. Dates below are page-reported publication/update metadata, not assumed product version dates. Official help content was readable; marketing claims, usage statistics and speculative omissions are not used as evidence.

| Source | Reported Date | Supports | Confidence |
|--------|---------------|----------|------------|
| [ClubSpark: Creating Recurring Coaching Sessions](https://sportlabs.zendesk.com/hc/en-us/articles/360001052546-Creating-Recurring-Coaching-Sessions) | 2025-10-08 | Recurring timetable and session defaults | MEDIUM, corroborated recurring behavior |
| [ClubSpark: How To Book A Recurring Session Course](https://sportlabs.zendesk.com/hc/en-us/articles/4404661659793-How-To-Book-A-Recurring-Session-Course) | 2024-08-23 | Customer discovery, venue/session/participant selection | MEDIUM; older help article cross-checked against newer recurring admin documentation |
| [ClubSpark: Taking Offline Payments for Coaching Courses and Sessions](https://sportlabs.zendesk.com/hc/en-us/articles/360020985977-Taking-Offline-Payments-for-Coaching-Courses-and-Sessions) | 2025-11-19 | Offline instructions and admin payment/register updates | MEDIUM, corroborated by TeamUp |
| [CourtReserve: Create an Event](https://help.courtreserve.com/en/articles/1146549-creating-events-recurring-events-camps-and-classes) | 2026-04-17 | Recurrence, capacity, minimum/cutoff policy, instructors and withdrawal control | MEDIUM; exact Lafu pending-payment behavior is a separate local requirement |
| [CourtReserve: Team-Based Events — Create an Event](https://help.courtreserve.com/en/articles/11429176-team-based-events-create-an-event) | 2026-07-08 | Guest partners and admin registration | MEDIUM; open beta and two-person model limit generalization |
| [TeamUp: Managing Pending Offline Payments](https://support.goteamup.com/en/articles/9327466-confirming-cancelling-editing-and-managing-pending-offline-payments) | 2026-06-16 | Manual confirmation queue and received-date record | MEDIUM, corroborated by ClubSpark |
| [TeamUp: Confirming Offline Refunds](https://support.goteamup.com/en/articles/9327696-confirming-offline-refunds) | 2026-06-16 | Recording refund completion after external payment | MEDIUM; useful operating pattern, not evidence of Lafu refund terms |
| [TeamUp: Cancel a Class on a Specific Date and Time](https://support.goteamup.com/en/articles/9327529-how-to-cancel-a-class-on-a-specific-date-and-time) | 2026-09-16 | Occurrence cancellation, refund choices and notifications | MEDIUM; notification channel for Lafu remains open |

**Review limits:** This is an official-documentation feature survey, not customer interviews or a usability study. Validate the short group-booking flow, proof correction wording and phone admin review with actual Lafu customers/admins. No competitor feature absence, universal user expectation, pricing assumption, club timezone or quantitative benefit is asserted.
