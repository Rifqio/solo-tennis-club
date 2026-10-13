# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Customers of Solo Tennis Club (STC) browse classes and book tennis coaching, often for themselves and friends. Club administrators run daily sessions, review payment proof, and handle bookings. Both groups primarily use phones for quick tasks; tablet and desktop support is also required. The user specifically wants an easy, guided experience that people unfamiliar with technology can understand.

## Product Purpose

Replace a shared schedule spreadsheet plus WhatsApp reservations with self-service customer booking and a mobile operational portal. Success means customers can find an appropriate session, reserve places, and submit payment proof from their phones, while admins manage availability, participants, and payment verification without spreadsheets.

## Positioning

A focused tennis club application that preserves the club's group-booking and manual-payment habits while making availability and booking states clear. It is designed around booking a class and running today's sessions, rather than treating daily operations as a generic business dashboard.

## Operating Context

- Customer flow: Discover → Schedule → Select Session → Book → Pay → Confirmation.
- Admin flow: Today → Sessions → Bookings → Payment Verification → Manage.
- Current customers consult a shared schedule spreadsheet and contact an admin through WhatsApp. Admins record bookings and payments manually.
- Pending-payment names remain listed in red in the current spreadsheet; customers have five hours to pay.
- Customers may reserve multiple places for friends or family. Participants default to the booker's name plus numbered guests, with optional name edits during booking.
- Admins also handle WhatsApp and in-person bookings and payments outside the customer proof-submission flow.
- Phone use includes browsing dates, uploading proof, verifying payments, and checking session participants. These tasks must not require a laptop.

## Capabilities and Constraints

- Public club discovery and schedule browsing; no authentication before choosing a booking.
- Session information includes date, time, one or more coaches, level, venue, price, minimum and maximum participants, and remaining capacity.
- Group bookings reserve the requested participant places and must never overbook.
- Sign-in and sign-up are encouraged. A customer may start with a phone number, verify it through WhatsApp or SMS OTP, then enter a name to create an account automatically.
- Unpaid reservations last five hours. Abandoned bookings expire and return places to availability.
- Customers pay using static QRIS or bank transfer and upload proof from their phones. Proof awaits admin verification; submitted proof keeps places reserved until review.
- Approval confirms payment and the booking. Rejection allows correction only within the original reservation deadline; an already-passed deadline releases the places.
- Customers can see booking/payment status and upcoming bookings. They cannot change, move, or cancel their own bookings.
- Admins can create and change bookings, record outside payments, review proof, see customer information, cancel sessions, and track manually handled refunds as due or completed.
- Sessions have a venue, minimum/maximum attendance, and one or more coaches. Confirmed and active pending-payment places both count toward the minimum; each group place counts individually.
- Admins may enable automatic cancellation if the minimum is unmet at a configured cutoff; manual cancellation is also available.
- Admins manage classes, sessions, recurring schedules, coaches, venues, levels, prices, and capacity.
- Customer and admin interfaces support Indonesian and English.
- Mobile-first information architecture and interaction are required; tablet and desktop expand that experience.
- Automated payment gateways and refund transfers are outside the initial release. Future payment-provider support remains an architectural consideration.
- Phase 1 architecture is confirmed in `.planning/phases/01-publish-and-browse-sessions/01-SKELETON.md`: React/Vite SPA, Express 5 internal HTTP API, Prisma 7 with SQLite, provisioned admin email/password accounts with cookie sessions, persistent single-host storage. No hosted deployment is requested.
- Phase 2 decisions: phone OTP with mock code returned through the development API; require name + verified phone; group size is limited by available capacity; the five-hour hold begins at final confirmation, and new customer/admin reservations close five hours before start. Outside bookings require explicit admin linking after the same phone is verified. Real WhatsApp/SMS delivery remains a release prerequisite. Later open details: minimum-cutoff processing, recurring-series edits and cancellation communications. Club dates/times use WIB (UTC+7) and prices use integer IDR.

## Brand Commitments

The club is Solo Tennis Club, abbreviated STC (renamed from Lawu Fun Tennis Club, Lafu, on 2026-10-10). The user likes AYO's Android app and its publisher screenshots as mobile presentation references, without copying its identity or unrelated features. Community matchday was confirmed on 2026-10-07. On 2026-10-08 the user selected the Jalur Lawu Material 3 redesign, preserving the club palette while using tonal trail-post time plates, a green signboard, system reading typography and Barlow Condensed sign numerals. DESIGN.md is the current visual authority. Light and dark follow the phone. The club crest (blue shield lettered STC, lime ball seated in a notch) was approved on 2026-10-13; masters and the generator live in brand/logo, and the app uses a small cut (src/components/brand/club-crest.tsx). Real club photography remains unsupplied.

## Evidence on Hand

- `.planning/PROJECT.md` contains the user-approved project brief and booking rules.
- The user described the spreadsheet/WhatsApp operation and numbered participant convention; no spreadsheet export or production session data has been provided.
- `src/App.tsx` routes the public schedule/club/detail and complete Phase 1 admin management workflows. All ten implementation summaries exist; build, lint and 137 tests pass. Manual workflow acceptance confirmed by the user on 2026-10-09; see `.planning/phases/01-publish-and-browse-sessions/01-PHASE1-REVIEW.md`.
- No real club photography, logo files, testimonials, customer counts, exact session prices, or sample coach/venue records have been supplied. Future examples must be labeled as illustrative, and commercial claims must not be fabricated.

## Product Principles

1. Start with the phone tasks customers and admins actually perform.
2. Keep schedules public and make authentication necessary only when booking or managing bookings.
3. Make capacity, reservation deadlines, payment review, and cancellation states explicit.
4. Preserve convenient group booking and manual-payment operations while reducing admin navigation.
5. Use the same product meaning in Indonesian and English and expand the experience on larger screens.

## Accessibility & Inclusion

The booking experience must guide people who are not comfortable with technology. Make the current task, next action, and booking/payment state understandable in plain language, with visible labels rather than relying on color or unexplained icons alone.
