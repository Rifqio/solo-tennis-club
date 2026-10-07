# Lafu UI research and brainstorming inputs

**Date:** 2026-10-07
**Status:** Reference analysis with Community matchday and the detailed UI brief confirmed by the user on 2026-10-07. No application UI has been implemented.
**Method:** Impeccable `init` and `shape` guidance, with antislop applied during planning/building at the user's request.

## Confirmed brief

Lafu is Lawu Fun Tennis Club's mobile-first bilingual Indonesian/English booking application and admin portal. Its interfaces must guide people unfamiliar with technology. The user chose building directly from the design brief. Product rules live in `.planning/PROJECT.md`; Impeccable's product record is `PRODUCT.md`.

Initial exploration covers customer schedule browsing, session selection, group booking, payment submission, and booking status; admin Today, participant lists, and payment review. Discovery must be possible without login, and submitted proof must not be represented as a confirmed booking before approval.

## AYO Android reference

**Primary source:** [AYO's Google Play listing and publisher screenshots](https://play.google.com/store/apps/details?id=coid.ayo.ayo_mobile_app&hl=en), retrieved 2026-10-07. The listing identifies Ayo Sport Technology and reports a 2026-09-13 update.

Seven public publisher images were downloaded to `.planning/research/references/ayo-01.png` through `ayo-07.png` and viewed. These are promotional images with phone frames and cropped screens, not an installed-app walkthrough. Observation confidence is high for visible composition, limited for full navigation, interaction, accessibility, and payment behavior. The imagery includes device mockups; listing on Android does not prove Android-specific behavior from those frames.

| Image | Visible content | Relevant lesson for Lafu |
|---|---|---|
| 01 | Home shortcuts, an upcoming activity summary, capacity fraction, venue information | Give returning customers a clear upcoming-booking summary. Keep the number of initial choices aligned with Lafu's actual jobs. |
| 02 | Activity detail and scoring/standings promotion | Detailed sports content can exist on a phone, but scoring is not part of Lafu's approved booking scope. |
| 03 | Horizontal date choices, activities grouped by time, level/duration/venue metadata, capacity fractions | Date selection and time-grouped lists can replace a dense calendar on the phone. Explain remaining places directly. |
| 04 | Session detail with clearly labeled skill level, date/time, venue, and price | Group the facts needed to decide whether a class fits, with a clear booking action and one or more coaches added for Lafu. |
| 05 | Scoring table and rules | Dense expert content belongs behind a specific task, rather than becoming the default customer booking screen. |
| 06 | Venue cards with photos, price and filters | Venue context can help decisions when real photos exist. A single club does not require AYO's multi-sport marketplace controls. |
| 07 | Community profile and activities | A club identity can make the product feel local and social. Do not invent membership statistics, ratings, or public participant profiles. |

### What can be learned, with limits

The visible app screens use large bold task headings, neutral backgrounds, modular activity summaries, compact facts, and strong selected-date treatment. AYO's red promotional background and logo are its identity; they do not determine Lafu's palette. The screenshots support an activity/date-oriented starting point. They do not establish the complete booking wizard, OTP sequence, offline-payment proof upload, or admin verification experience.

## Proposed interaction foundations

These are recommendations to review, not additional approved requirements or a chosen design system.

### Customer

- Keep a short club introduction accessible and make schedules easy to reach. Use a date strip plus an explicit date picker for days outside the visible range; do not require swipe discovery.
- Lead session summaries with time, class/level, venue, coaches, price per place, and words such as "3 places left" rather than an unexplained capacity fraction alone. Any example counts are illustrative.
- Explain session operation separately from booking state: a place can be reserved while the session is still waiting to reach its minimum.
- Use a guided booking sequence: choose places and participant names, verify customer identity, review details, then reserve and pay. The exact moment capacity is held remains a policy decision; do not silently consume places simply because a visitor opened session details.
- Default names to numbered guests and make editing optional. Show the group total before committing a reservation.
- Present payment as a resumable task with its original deadline and one clear next action. Keep QRIS/bank details, proof upload, and pending verification understandable without promising immediate confirmation.
- When proof is rejected, explain what to correct and the original deadline. Do not show an upload action after expiry; offer an appropriate route to a fresh available booking or admin assistance.
- Make QRIS practical on the same phone: saving the code and switching to a payment app may be needed. Do not assume a second device is available or that every bank supports the same import interaction.
- Proposed frequent destinations: schedules, my bookings, and account/help. Exact labels and whether a separate home tab is needed remain design choices.

### Admin

- Start from today's sessions, with upcoming sessions readily accessible. A session summary should expose time, venue, all coaches, confirmed/pending participant places, minimum/maximum counts, and an actionable warning when needed.
- Keep pending payment review one action away. A review should show proof alongside booking context, expected amount, submitted time, original deadline, and customer/group details.
- Make approval fast while protecting against wrong-booking review. Rejection should include a customer-readable reason; exact reason collection is to be approved in requirements.
- Use labeled participant lists and expandable group entries. The historical red name can be accompanied by a "Pending payment" label rather than being the only status signal.
- Put complex recurring-series management behind Manage without making everyday session editing desktop-only.
- Moving/cancelling a paid booking should make the refund or payment difference visible; partial group changes and price differences still need explicit club policies.

### Across devices and languages

- Design phone layouts first, with comfortably spaced touch targets, visible focus, text-based statuses, and safe areas around fixed actions.
- Indonesian and English must fit the same controls; longer labels should wrap or reflow, not be reduced to tiny text. Keep translated UI separate from user-entered coach/venue/participant names.
- Desktop can show lists and detail/review beside each other; it should preserve the same tasks and states.
- Include loading, empty-date, full-session, changed-capacity, OTP failure, interrupted upload, pending-review, rejected-proof, expired-reservation, and cancelled-session states in future UI specifications.

## Direction exploration

Seven grounded visual sources considered across sports identity, civic wayfinding, event graphics, packaging, apparel information, and member welcome materials. Impeccable direction seed `19c946b3` assigned candidate 6 for exploration; this is generation metadata, not user approval.

1. Contemporary community sports identity, informed by AYO's app presentation.
2. Outdoor trail wayfinding typography and readable labeled progression.
3. Tennis event accreditation graphics with concise session identity.
4. Sportswear care-label clarity and progressive detail.
5. Racket/string packaging contrast and explicit specification labels.
6. Community park wayfinding: readable labels, a committed club header, and a persistent next-action guide.
7. Club member welcome materials with practical schedule and booking summaries.

The sources influence type, palette, density, and one purposeful interaction. They must not replace familiar web navigation or controls with literal signs, printed tickets, maps, or instruments.

The user selected **Community matchday** (`model-pick`) on decision page `15d298d3`, retaining `buildPath: code` without flipping it. The choice selects the contemporary sports-app presentation and guided flow; it does not start implementation. No decision mockup was generated, so no approved or rendered comp exists. The detailed proposal in `.planning/UI-BRIEF.md` was subsequently confirmed by the user on 2026-10-07.

### Options to present

- **Club wayfinding:** candidate 6; readable club identity, date-led sessions, and a next-action panel that persists as booking progresses.
- **Community matchday:** top grounded candidate, closer to AYO's familiar activity presentation; strong session summaries with understandable remaining-place labels and guided checkout.
- **Session pass:** the competitive catalog alternative; segmented booking facts and a persistent change/status message, with normal web controls and no invented check-in barcode.

### Catalog assessment

| Catalog source | Audience identification | Product clarity | Verdict and useful discipline |
|---|---|---|---|
| Emission-line rail | Weak match for a tennis club; instrument-derived vocabulary | Tiny labels and line-only states conflict with guided novice use | Declined; retain disciplined alignment and explicit state distinctions. |
| Midnight transit diagram | A journey can explain booking, but a transit appearance is indirect | Labeled sequence is useful; a literal map would add interpretation | Declined; retain persistent orientation and one obvious next step. |
| Star atlas | Weak club/task association | Dot magnitude and spatial lookup add decoding work | Declined; retain a clear hierarchy that prevents secondary facts competing with the current task. |
| Lexicon shoulder and plate | Weak contemporary sports association | Long dense entries reduce phone booking scanability | Declined; retain a stable reading order and secondary-detail boundaries. |
| Japanese high-density web | Useful to experienced operators, weaker for first-time bookers | Packed modules and tiny type oppose the user's guided requirement | Declined; retain compact admin information through disclosure rather than shrinking type. |
| Boarding pass and gate board | A scheduled booked place has some transferable familiarity | Segmented booking facts and persistent changed-status information translate cleanly | Competitive; must avoid airline styling, barcodes, and code-only labels. |

The competitive session-pass board and hero were viewed from the Impeccable catalog. They are inspiration, not Lafu mockups or a selected design. Root source: https://impeccable.style/worlds/cards/vernacular-ephemera-boarding-pass-and-gate-board.webp.

## Open decisions

- Confirmation of the detailed Community matchday UI brief; design tokens and exact typography remain future implementation decisions.
- Reservation start moment relative to group entry and OTP, especially if the last places disappear during authentication.
- Policy when pending places expire after the minimum check.
- Booking/hold cutoff relative to session start; timezone/currency and cancellation notification channels.
- Whether and how customers see anonymized participant counts; no permission to expose participant names publicly has been established.
- Exact navigation labels, rejection reasons, and same-phone QRIS instructions.

## Sources and provenance

- [AYO publisher listing and screenshots](https://play.google.com/store/apps/details?id=coid.ayo.ayo_mobile_app&hl=en).
- User-approved project definition, name, bilingual requirement, guided-use priority, and explicit AYO reference in this session.
- Local Impeccable 4.5.0 `shape`, `init`, `new-work`, and `operate` guidance; antislop core, UI, and mobile-layout checks.
- Impeccable catalog roll `19c946b3` (API catalog revision `c3b204a1eed6`); catalog alternatives are design material, not user research evidence.

No live AYO app interactions or Lafu production behavior were tested. No framework, database, or infrastructure decision was made by this analysis.
