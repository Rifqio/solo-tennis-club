# Pitfalls Research

**Project:** Lafu (Lawu Fun Tennis Club)
**Domain:** Mobile-first, bilingual tennis coaching bookings with group places and manual payments
**Researched:** 2026-10-07
**Confidence:** MEDIUM

## Scope and Evidence

The binding product rules come from `.planning/PROJECT.md` and `PRODUCT.md`. External sources inform implementation risks, not the club's policies. Findings and recommendations below have MEDIUM confidence: the GSD `classify-confidence --provider websearch --verified` seam returned MEDIUM. Eight primary sources were checked; digests were stored using the project-scoped GSD research cache. No framework, database, schema, or deployment choice is finalized here.

Sources describe general concurrency, authentication, authorization, calendar, upload, accessibility, and QRIS behavior. The Lafu failure scenarios and acceptance checks are original applications of those principles to the approved brief. No production incident data or user task-test evidence is available yet. Phase names below are provisional topics for the roadmap, not approved phase numbers.

Preserve these rules throughout planning:

- A group booking reserves participant places, not one capacity unit per booking.
- Unpaid reservations last five hours. Submitted proof protects the places while awaiting review.
- Rejection never renews the original deadline. Release places when rejection happens after that deadline.
- Confirmed and active pending-payment places both count toward the session minimum; expired and cancelled bookings do not.
- Automatic session cancellation is optional and uses an admin-configured cutoff. Manual cancellation remains available.
- Customers cannot change, move, or cancel bookings. Admins handle changes, outside payments, and manual refunds.

## Critical Pitfalls

### 1. Reserving group places with a separate availability check

**What goes wrong:** Two customers both see three remaining places and each books three. An admin creates a WhatsApp booking during the same interval. Capacity exceeds the maximum, or a group receives only part of its requested places. A slow response followed by a retry creates a duplicate booking.

**Why it happens:** The interface's displayed availability is treated as authoritative. Checking capacity and creating the reservation happen separately, and admin booking uses a shortcut that bypasses the customer rule. Disabling a button does not coordinate other phones or a retried request.

**Prevention:** Make each group reservation an all-or-nothing server operation that rechecks current session status and eligible occupied places before committing. Use the same rule for customer booking, admin creation, moves, expiry, and cancellation. A failed group request must leave zero new places reserved. Retries must return the same result for the same request intent; changed parameters require a new intent. Reject a capacity reduction below occupied places unless the admin first resolves the affected bookings through an explicit workflow.

**Warning signs:** Availability briefly becomes negative; one customer has duplicate booking references; admin and customer totals disagree; tests run requests only sequentially.

**Phase to address:** Reservation integrity, before public booking or admin booking goes live.

**Acceptance checks:** With three places left, race two three-place requests and an admin request. Successful reservations must never exceed three additional places, and each group must be complete. Repeat a successful request after losing its response. Verify one booking, one original deadline, and one set of participants. Move a group into a full session and verify the source booking remains intact.

**Evidence:** Ordinary reads can observe snapshots while other transactions modify data; stronger isolation may require retrying a complete transaction. This is a concurrency example, not a PostgreSQL selection. Retry identifiers must be recorded atomically with the operation they identify. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [AWS retry-safe APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

### 2. Treating five-hour expiry as unconditional deletion

**What goes wrong:** A customer submits proof at 4h59m, but an expiry job releases the places at five hours while an admin is still reviewing it. Alternatively, rejected proof receives a new five-hour window. A stale admin approval restores a booking whose session was cancelled. A delayed expiry job leaves an abandoned booking occupying capacity indefinitely.

**Why it happens:** Payment review, reservation eligibility, session cancellation, and file upload are collapsed into one status or a generic time-to-live. Jobs act on an old copy of a booking. The phone's countdown becomes the authority for deadlines.

**Prevention:** Keep the original reservation deadline immutable. Define server-validated transitions and their permitted actors. Expiry must recheck the current state: an active unpaid reservation without accepted proof submission can expire; proof awaiting review remains protected beyond the original deadline. On rejection, use the remaining original window or release immediately if it has passed. Retried or stale commands cannot revive expired/cancelled places. Jobs must be safe to repeat, catch up after downtime, and recheck eligibility when they run. Capacity reads must account for effective deadline eligibility even if cleanup is delayed.

Distinguish selecting a file, finishing a storage upload, and the server accepting a proof submission for this booking. Recommend that protection begins only when that last step succeeds. The exact treatment of an upload started before the deadline but completed afterward is an open policy; do not silently add a grace period.

**Warning signs:** Every booking has a deletion timer regardless of state; rejection changes the original deadline; the customer sees success before upload submission commits; cancelled sessions still accept proof approval; refreshing a phone changes remaining time.

**Phase to address:** Reservation lifecycle and payment review, designed together before expiry automation.

**Acceptance checks:** Submit proof just before the deadline, advance server time beyond it, and run expiry repeatedly: places remain held awaiting review. Reject before the deadline: correction uses only the original remaining time. Reject after it: release once. Race submission against expiry, approval against session cancellation, and rejection against replacement proof. Each produces one coherent result without restored capacity or lost evidence. Document the boundary rule for an event exactly at the deadline.

**Evidence:** Server-enforced state transitions and final execution checks prevent out-of-order operations; retry-safe commands avoid duplicated effects. The five-hour and review rules themselves are Lafu requirements. [OWASP transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html), [AWS retry-safe APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

### 3. Assuming a session stays above its minimum after the cutoff

**What goes wrong:** Minimum is four. At the cutoff, two confirmed places plus two active pending-payment places meet it. The pending places expire later, leaving only two. A team may silently switch to paid-only counts to avoid the issue, breaking the agreed rule. Counting booking rows also makes a four-person group appear to be one participant.

**Why it happens:** The cutoff decision is assumed to guarantee future attendance. Pending places have different lifetimes from confirmed places, and the minimum check is written separately from availability calculations.

**Prevention:** Use the agreed participant-place eligibility rule for the cutoff calculation, including active unpaid reservations and proof awaiting review. Use server time when evaluating unpaid eligibility. Record when the cutoff decision was evaluated and which effective count justified it. Make the job repeatable without repeated cancellations or refund obligations. Keep automatic cancellation disabled when the admin has not enabled it.

**Open policy:** Does automatic cancellation run once at the configured cutoff, or also reconsider when places disappear afterward? How do cutoff edits, bookings accepted after the cutoff, or a job delayed past the cutoff behave? Recommend flagging a later drop below minimum to admins while retaining manual cancellation; do not add later automatic cancellation without a club decision. Also decide near-start booking behavior, since a full five-hour window can extend beyond a session start.

**Warning signs:** Queries count only approved payment; one group adds only one to attendance; the UI says a session is guaranteed after meeting the cutoff; expired but unprocessed records still count; automatic cancellation runs on disabled sessions.

**Phase to address:** Session operation and cancellation policy, after reservation eligibility is established.

**Acceptance checks:** For minimum four, a group of three plus one active pending place meets the minimum. Replace that pending place with an expired place and the count becomes three. Repeat with proof awaiting review after five hours: that place still counts. Pass the cutoff, then expire the unpaid place and verify the chosen later-drop policy. Race cancellation with a new booking: a cancelled session must accept no new reservation.

**Evidence:** This risk follows directly from combining Lafu's approved minimum and expiry rules; it is not a competitor policy. Concurrency and transition safeguards are supported by [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [OWASP transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html).

### 4. Equating proof, a paid booking, and a completed refund

**What goes wrong:** Admins approve a convincing screenshot with the wrong amount or recipient. One bank transaction is used for two bookings. An in-person payment is recorded and later recorded again through proof approval. Cancelling a paid group loses the refund obligation, or marking a refund completed falsely suggests the application moved the money. Moving a paid booking changes its price without a visible difference to settle.

**Why it happens:** A single paid checkbox replaces the distinction between a payment claim, verified receipt of money, reservation state, and manual refund tracking. Admin changes overwrite earlier facts. Static QRIS is assumed to carry the exact group total.

**Prevention:** Display and retain the booking's agreed total, participant quantity, payment method, and receiving account/merchant information. Treat proof as evidence for review, not settlement confirmation. Guide admins to reconcile against actual incoming payment records. Keep manual outside-payment recording in the same operational flow and detect possible duplicates. Preserve who recorded, approved, rejected, cancelled, moved, or marked a refund completed, when, and why. Paid cancellations retain payment history and create a visible refund obligation once; completing that record means an admin reports a manual transfer.

**Open policies:** Partial payments, overpayments, one transfer covering multiple bookings, refunds after price-changing moves, refund amounts, and correction of mistaken approval need explicit club decisions. Do not ship silently inferred accounting behavior. Recommend snapshotting the agreed booking amount so editing a future class price cannot rewrite an existing customer's charge.

**Warning signs:** Admins cannot see original amount; proof approval can be repeated; the refund page has no due queue; payments disappear when bookings cancel; there is no explanation for a changed total.

**Phase to address:** Manual payment review and admin adjustments; refund tracking before session cancellation ships.

**Acceptance checks:** Record an outside payment, then review proof for that same booking. Verify no second receipt is recorded accidentally. Cancel a paid group twice: one obligation remains due. Record the manual refund once and verify its history. Edit the class price: previous agreed totals remain intact. Review wrong-recipient and short-payment examples without automatically confirming them.

**Evidence:** Static QRIS requires the customer to enter the amount, and Bank Indonesia describes customer and merchant payment notifications. Reconciliation guidance is a Lafu recommendation; screenshot reliability is not being claimed as a BI policy. [Bank Indonesia QRIS](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx), [AWS retry-safe APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

### 5. Regenerating recurring sessions over existing bookings

**What goes wrong:** Editing a weekly series recreates next week's already-booked session, changes a customer's venue without a clear action, or removes a single-session cancellation. Schedule generation retries produce duplicate sessions. A coach assigned as the second coach is scheduled elsewhere at the same time. A date shown in a remote customer's device timezone differs from the venue's session date.

**Why it happens:** Recurrence is treated as repeated copy-and-paste dates without stable occurrence identity or exceptions. The developer stores a weekday and hour without a venue timezone. Resource conflict checks inspect only the first assigned coach.

**Prevention:** Distinguish the recurrence definition from actual bookable occurrences. Preserve each booked occurrence and its exceptional changes when extending or editing a series. Define explicit edit scope and preview affected bookings before applying changes. Generation must be safe to retry. Choose the club/venue timezone explicitly, calculate deadlines consistently, and display an unambiguous local date/time. Model the responsibility for every assigned coach and venue; flag overlapping use of any coach, not just the first.

**Open policies:** One occurrence versus future occurrences versus entire series edits; changes to occurrences with payments; coach overlap and travel buffers; venue/court sharing; timezone and currency. Do not assume the developer's Asia/Bangkok timezone is the club's timezone. Multi-coach assignment does not itself imply that price or capacity multiplies.

**Warning signs:** Recurrence edits delete sessions; dates use the device timezone; cancelled occurrences reappear; only one coach participates in conflict checks; re-running generation changes session references.

**Phase to address:** Schedule foundation and recurring-session management. Establish occurrence/timezone rules before accepting bookings; more advanced series editing can follow.

**Acceptance checks:** Book a future occurrence, cancel another, then edit and regenerate the series twice. Existing bookings and cancellation exceptions remain attached to the intended occurrences without duplicates. View the same session from different device timezones. Assign a second coach already scheduled elsewhere and verify the selected conflict policy.

**Evidence:** RFC 5545 defines timezone-aware recurrence and separate occurrence identity, including exceptions whose identity remains tied to the original occurrence after moving. Resource and edit restrictions are application decisions. [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html).

### 6. Treating OTP as permanent identity or admin authorization

**What goes wrong:** Local and international forms of the same number create separate accounts. An admin-created customer receives a second account through self-service. Unlimited resend calls generate messaging charges. A used or expired code remains valid. A reassigned telephone number grants access to another person's old bookings, or an OTP-authenticated customer can invoke an admin action.

**Why it happens:** Display names or raw phone strings become account identity. An OTP validates current control of a delivery channel, while recovery, account linking, staff roles, and abuse controls remain undefined.

**Prevention:** Normalize phone numbers before account lookup and create/link accounts only after successful verification. Keep booker account identity separate from guest participant names. Distinguish an admin-created customer record from a customer who has verified access to it; do not merge solely by name. Make challenges short-lived, single-use, and bound to the intended number and login operation. Rate-limit sending and verification with resend cooldowns and spend limits; issuing a new code must not reset the failed-attempt budget. Staff privileges require separate authorization. Protect account recovery and changes to a verified number.

**Open policies:** Primary sign-in method, WhatsApp/SMS provider and fallback, customers sharing a number, recovery after losing a number, number-change verification, and stronger staff authentication. NIST provides risk guidance, not a legal requirement that Lafu must satisfy a particular assurance level. Its PSTN restriction should not be automatically applied as a verdict about WhatsApp.

**Warning signs:** OTP appears in logs; every resend resets attempts; roles come from request fields; phone aliases have different customer histories; support cannot distinguish a guest name from an account owner.

**Phase to address:** Customer identity and admin authorization before private booking/proof access.

**Acceptance checks:** Equivalent number formats resolve to one verified account. Race first-time sign-ins without creating duplicates. Reject replay, expired codes, cross-number codes, and customer calls to admin actions. Burst resends and failed checks remain constrained. Test claiming an admin-created booking and the chosen lost-number recovery path.

**Evidence:** NIST specifies single-use expiring out-of-band secrets, failed-attempt limits, and risks in telephone authenticator changes. Server authorization must independently govern sensitive actions. [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), [OWASP transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html).

### 7. Making payment proof a public image upload

**What goes wrong:** A customer can retrieve another customer's proof by changing an identifier. Public image links expose bank balances, telephone numbers, names, or transaction references. A renamed HTML/SVG file executes in an admin preview. Huge images consume processing memory. A file is stored successfully but never attached to the booking, leaving the customer believing submission succeeded.

**Why it happens:** General marketing-image storage is reused for sensitive proof, and client file type checks are trusted. Upload completion and booking transition are independent operations with no recovery path.

**Prevention:** Store proofs privately and check booking ownership or admin authorization for each upload, submission, preview, and retrieval. Use server-generated object names, a small supported-format allowlist, layered file validation, size and decoded-image limits, and constrained processing. Keep thumbnails private too. Authorize short-lived retrieval links before issuing them. Handle abandoned uploads and attachment failures, while preserving enough review evidence for audit. Do not send private screenshots to public scanning services without assessing disclosure. Decide retention and deletion rules rather than keeping everything forever by default.

**Warning signs:** A proof opens in a signed-out browser through a permanent link; `accept="image/*"` is the only check; previews use the original filename in an executable context; the UI cannot distinguish retryable upload failure from submitted proof.

**Phase to address:** Private proof handling and payment-review workflow before real customer uploads.

**Acceptance checks:** Another customer and a signed-out user cannot access a known proof reference. Reject spoofed content types, unsafe formats, oversized files, and excessive image dimensions. Interrupt upload and attachment separately. Verify retries do not duplicate proof submissions, and only server-accepted submission protects places.

**Evidence:** OWASP recommends layered upload validation, least-privilege access, private storage, untrusted MIME handling, server-controlled filenames, and limits on upload/processing resources. [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## Moderate Pitfalls

### 8. A mobile layout that still requires staff explanation

**What goes wrong:** Customers mistake awaiting-review for confirmed, cannot pay from the same phone displaying QRIS, lose participants when switching to their banking app, or repeat booking after uncertain feedback. Admins approve the wrong proof because key booking details require horizontal scrolling. Indonesian and English labels imply different deadlines.

**Prevention:** Give each customer state a plain explanation and one relevant next action. Show the original deadline as a date/time as well as remaining time; when review protects places, explain that protection without an inaccurate payment countdown. Show rejection reason and remaining correction time, or clear expiry. Explain that changes require contacting the club. Preserve booking context on return from external apps, refresh, and failed upload. Show the group total and recipient, with same-phone payment guidance validated against the chosen banking apps; do not assume every app supports importing a saved QR image. Provide a bank-transfer alternative already in scope.

Place session/date, booker, participant quantity, amount, proof preview, and review actions together on the admin phone flow. Show critical state text alongside color. Test translated complete workflows, including long errors and date/amount formatting. Use the AYO Android Play screenshots only as the user's visual inspiration; neither its website nor screenshots establish evidence that a Lafu workflow is usable.

**Warning signs:** Success feedback is only a disappearing toast; every state says Pending; the admin needs a laptop for proof details; language switching clears the booking; uploads require a second phone; real users ask whether their places are held.

**Phase to address:** Mobile customer booking and mobile admin operation, followed by real task validation.

**Acceptance checks:** Test booking for three people, OTP paste/autofill, banking-app return, proof rejection/correction, and admin verification on real phones in both languages. Verify reflow at 320 CSS pixels, useful touch targets, keyboard access, text zoom, visible focus, and announced status changes. Observe nontechnical users performing the tasks without coaching and assess errors/recovery, not just completion. No usability success rate is assumed before observation.

**Evidence:** WCAG gives testable reflow, target-size, error-prevention, redundant-entry, authentication-assistance, and status-message criteria. Those checks support accessibility; ease of use still needs Lafu task observation. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Capacity checked only in the browser | Fast prototype | Overbooking under the first concurrent request | Illustrative prototype only |
| Separate admin and customer capacity logic | Faster admin page | Different occupancy rules and unsafe moves | Never for live bookings |
| One status for reservation, proof, money, refund | Fewer fields/screens | Ambiguous transitions and lost financial history | Never for live payments |
| Delete expired/cancelled bookings | Easy cleanup | Lost original deadline, review trail, refund evidence | Never as lifecycle implementation |
| All recurring occurrences edited together | Simple series editor | Booked sessions and exceptions overwritten | Only before bookable instances exist |
| Manual payment and refund movement | Matches current operation | Admin effort and reconciliation needs | Intentional first release; retain tracking and accountability |
| Desktop-only admin management | Smaller UI scope | Staff return to spreadsheets/WhatsApp | Never for essential daily tasks |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OTP provider | Provider reports message sent, so account is treated as verified | Verify challenge server-side; distinguish send failure, delivery delay, and bad code |
| WhatsApp/SMS fallback | Each channel owns an unrelated account/challenge | Keep intended identity and challenge policy coherent; research provider-specific limits after selection |
| Static QRIS/bank transfer | Uploaded screenshot automatically sets paid | Admin reconciles receipt and amount; upload remains a claim until accepted |
| Private file storage | Storage success immediately implies proof submission | Commit attachment and eligible booking transition; recover or clean orphan uploads |
| Expiry/cutoff runner | Assume exact delivery time and one execution | Use recorded deadlines, state rechecks, repeat-safe execution, and downtime catch-up |
| Cancellation communications | Mark session cancelled and rely on users checking the app | Decide recipients/channels and failure handling; app status remains authoritative and contact tasks must be visible |

## Performance and Operational Traps

No reliable traffic forecast exists. Concurrency correctness matters with two simultaneous customers; the following thresholds concern actual operations rather than invented user counts.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Expiry depends on an open phone | Abandoned places remain full overnight | Server-side effective eligibility and recoverable jobs | First customer who closes the page |
| Stale availability reused at commit | Last places appear bookable to everyone | Recheck atomically; refresh meaningful feedback after conflict | First overlapping reservation |
| Proof queue has no age/ownership cues | Places held awaiting review are never reviewed | Visible oldest pending items, admin responsibility, overdue attention | When review arrivals exceed staff review capacity |
| Load original full-resolution proofs in every list row | Slow phone page and high transfer costs | Private lightweight previews, open full detail on demand | A small queue of large phone screenshots |
| Generate an unbounded recurring future | Slow edits and duplicate cleanup | Bound generation horizon and make extension repeatable | Long-lived series or repeated generation |
| Notification failure silently discarded | Customers arrive for cancelled sessions | Visible failed-contact tasks and retry policy | First delivery outage or invalid contact |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hide customer cancel/move controls without server enforcement | High: customers invoke restricted changes directly | Validate actor, booking owner, role, and permitted transition |
| Trust uploaded amount, capacity, role, or deadline | High: underpayment, overbooking, privilege changes | Derive authoritative values on the server |
| Put customer participants or proof links in public schedule responses | High: private data exposed during public browsing | Public availability contains only public session facts and counts |
| Permanent public proof links or public thumbnails | High: financial and personal details leak | Private storage with authorized retrieval and bounded link lifetime |
| Unlimited OTP send/verification | High: account attacks and message spend | Combined send/attempt limits, cooldowns, spend monitoring |
| Let any admin action erase audit history | Medium: disputes cannot be reconstructed | Record corrections and actor/time/reason rather than silent overwrites |

These are Lafu threat scenarios and design recommendations, informed by the NIST and OWASP sources above. They do not select a particular authentication provider or storage service.

## Open Policies Requiring Phase Discussion

| Decision | Why It Matters | Recommendation Until Resolved |
|----------|----------------|-------------------------------|
| Five-hour start timestamp and exact deadline boundary | Distinguishes failed attempt from completed reservation | Use authoritative successful reservation time; document boundary explicitly |
| Upload started before expiry but submitted after | Upload latency can change seat eligibility | Do not invent grace; show accepted/failed submission clearly |
| New bookings close to start or after cutoff | Hold deadline can outlive session | Resolve before allowing these bookings |
| Cutoff scope, edits, delayed jobs, later drops below minimum | Determines who makes the final run/cancel decision | Preserve pending-inclusive count; flag late under-minimum for admins |
| Admin move price differences and original deadline | Moving can accidentally renew unpaid holds or alter money due | Keep original history; require an explicit adjustment policy |
| Partial/combined/duplicate payments and refund amount | Manual operation needs consistent reconciliation | Route exceptions to admin review; do not infer a settlement rule |
| Recurring edit scope and resource overlap | Existing customers can be affected by future edits | Preview impacts and preserve exceptions |
| OTP provider, recovery, shared numbers, staff authentication | Access and costs depend on selected delivery/account rules | Research provider and recovery before implementation |
| Proof formats, retention, and deletion | Phone compatibility and exposure must be balanced | Choose a narrow supported set with private access |
| Cancellation/reminder communication responsibility | Failed contact can cause wasted journeys | Define admin contact tasks and channel policy |

## Looks Done But Isn't: Acceptance Checklist

- [ ] Group reservation success is atomic under overlapping customer/admin requests; failed requests leave no partial participants.
- [ ] Repeated booking, outside-payment recording, review, cancellation, and refund-completion requests have one intended effect.
- [ ] Submitted proof stays protected beyond five hours; rejection keeps the original deadline and releases when already past it.
- [ ] Submission/expiry and review/cancellation races have a documented coherent outcome; stale commands cannot revive places.
- [ ] Minimum counts participant places and includes active pending payment; disabled automatic cancellation stays disabled.
- [ ] The club has explicitly decided what happens when pending places disappear after a successful cutoff check.
- [ ] Admin creation, moves, capacity edits, cancellations, and outside payments preserve the same integrity rules.
- [ ] Paid cancellation retains payment evidence and a visible manual refund obligation; the app never claims it transferred money.
- [ ] Recurrence generation is repeatable and preserves booked/cancelled exceptions; every assigned coach is considered.
- [ ] Number normalization, admin-created customer claiming, lost-number recovery, OTP expiry/replay, and abuse limits are exercised.
- [ ] Customer and signed-out requests cannot retrieve another booking's proof; public schedule data exposes no private roster/proof.
- [ ] Phone upload failures and banking-app return preserve context and communicate whether proof was actually submitted.
- [ ] Nontechnical customer and admin tasks are observed on real phones in Indonesian and English.
- [ ] Downtime catch-up and failed cancellation contact have an operational recovery path.

This is a proposed verification checklist. It does not claim these checks have passed in the current starter.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Capacity exceeds maximum | HIGH | Stop new reservations for the affected session; reconcile effective occupied places and recorded requests; have admins contact affected bookers; resolve moves/refunds explicitly |
| Review/expiry race releases valid places | HIGH | Preserve event evidence; inspect original deadline and accepted submission; do not restore automatically if capacity has been reallocated; let admins reconcile |
| Session drops below minimum after cutoff | MEDIUM | Flag admin attention; apply the agreed later-drop policy; record any cancellation/refund/contact obligations |
| Mistaken payment/refund record | HIGH | Record a correction with actor/reason; reconcile actual bank/merchant activity; update outstanding obligations without erasing history |
| Recurring edit damages occurrences | HIGH | Stop generation; recover occurrence identity and exceptions from history; review affected bookings and notify customers if details changed |
| Proof exposure or OTP abuse | HIGH | Revoke affected access/links or throttle sends; preserve incident evidence; assess exposure/account impact; fix permissions before reopening |
| Expiry/cutoff runner downtime | MEDIUM | Resume from recorded eligibility times; execute repeat-safe catch-up; review affected sessions and failed contact tasks |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase Topic | Verification |
|---------|------------------------|--------------|
| Concurrent group/customer/admin reservations | Reservation integrity | Last-place race, all-or-nothing groups, lost-response retry |
| Proof protection and original deadline rejection | Reservation lifecycle plus payment review | Time-boundary and transition-race checks |
| Pending-inclusive minimum changes after cutoff | Session operation and cancellation policy | Pending/confirmed/group count fixtures; explicit later-drop behavior |
| Outside payment, moves, cancellations, refunds | Admin operations and financial reconciliation | Duplicate recording, amount snapshot, repeated cancellation/refund checks |
| Recurrence, timezone, venue, multiple coaches | Schedule foundation and recurring management | Stable occurrence exceptions; cross-timezone display; all-coach conflict checks |
| OTP identity and privileged actions | Identity and access | Account linking, replay/abuse, customer-versus-admin endpoint tests |
| Private upload vulnerabilities | Private proof handling | Ownership retrieval, malicious upload, interruption/retry checks |
| Mobile task confusion and bilingual meaning | Customer/admin workflows plus launch validation | Real-phone observed tasks in both languages and accessibility checks |
| Jobs and cancellation communication failures | Operational readiness | Downtime catch-up and visible failed-contact recovery |

Detailed research is still needed for the chosen OTP provider, job delivery guarantees, private upload/storage mechanism, recovery policy, and recurring edit semantics. The state and capacity rules should be resolved before building screens that depend on them. Mobile task validation must cover complete flows rather than isolated responsive components.

## Sources

All accessed 2026-10-07. Confidence is MEDIUM under the GSD verified-websearch classification. Publication age is separated from relevance: calendar and retry semantics are stable principles, while living documentation was checked at its current URL.

| Source | Currency / Retrieval | Supports |
|--------|---------------------|----------|
| [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) | Current documentation rendered as version 18; live page retrieved | Concurrent reads/writes, serialization anomalies and full transaction retries; exemplar only |
| [AWS Builders' Library: Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) | Article announced 2021-01-15; live article retrieved | Retry identity, equivalent outcomes, atomic request recording, changed intent |
| [RFC 5545: Internet Calendaring and Scheduling](https://www.rfc-editor.org/rfc/rfc5545.html) | September 2009 standards-track RFC; live standard retrieved | Timezones, recurrence identity, exceptions and edit ranges |
| [NIST SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) | Revision 4 document, 2025; current hosted text retrieved | OTP expiry/single use/rate limiting; PSTN and telephone change risks |
| [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Living guidance; live text retrieved; page does not present a publication date | Private storage, file validation, least privilege, processing limits |
| [OWASP Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) | Living guidance; live text retrieved; page does not present a publication date | Server authorization, valid transitions and final execution validation |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Published recommendation 2024-12-12; current page retrieved | Reflow, touch targets, authentication assistance, status and error handling |
| [Bank Indonesia: QRIS](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx) | Official indexed text retrieved and matching static-QR sections cross-checked; direct page open returned an internal error | Static QR requires customer-entered amount; transaction notifications |

**Research limitations:** No real session/payment samples, screenshot-format distribution, review-time statistics, connectivity observations, or task tests were supplied. The sources do not establish Lafu's financial exception policies, cutoff re-evaluation policy, timezone, or provider reliability. Those remain explicit planning decisions.
