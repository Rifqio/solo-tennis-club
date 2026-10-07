# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Customers of Lawu Fun Tennis Club (Lafu) browse classes and book tennis coaching, often for themselves and friends. Club administrators run daily sessions, review payment proof, and handle bookings. Both groups primarily use phones for quick tasks; tablet and desktop support is also required. The user specifically wants an easy, guided experience that people unfamiliar with technology can understand.

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
- Frameworks, database, API, infrastructure, and implementation details will be decided separately. The existing React/TypeScript/Vite starter is project context, not a finalized architecture decision.
- Open details: primary sign-in mechanism; WhatsApp versus SMS delivery; session timezone and currency; cutoff scope and near-start booking behavior; recurring-series edit behavior; cancellation communications.

## Brand Commitments

The confirmed name is Lawu Fun Tennis Club, abbreviated Lafu. The application should feel like a tennis club product. The user likes AYO's Android app and requested analysis of its Google Play screenshots, rather than its website: https://play.google.com/store/apps/details?id=coid.ayo.ayo_mobile_app&hl=en. This is a presentation reference, not permission to copy AYO's identity or introduce its unrelated features. The user selected the Community matchday presentation: a familiar contemporary sports app with clear session facts and guided booking. Its detailed UI brief awaits confirmation; no design system, exact typography, or club logo has been finalized.

## Evidence on Hand

- `.planning/PROJECT.md` contains the user-approved project brief and booking rules.
- The user described the spreadsheet/WhatsApp operation and numbered participant convention; no spreadsheet export or production session data has been provided.
- `src/App.tsx` and its assets are framework starter content, not the club's visual identity.
- No real club photography, logo files, testimonials, customer counts, exact session prices, or sample coach/venue records have been supplied. Future examples must be labeled as illustrative, and commercial claims must not be fabricated.

## Product Principles

1. Start with the phone tasks customers and admins actually perform.
2. Keep schedules public and make authentication necessary only when booking or managing bookings.
3. Make capacity, reservation deadlines, payment review, and cancellation states explicit.
4. Preserve convenient group booking and manual-payment operations while reducing admin navigation.
5. Use the same product meaning in Indonesian and English and expand the experience on larger screens.

## Accessibility & Inclusion

The booking experience must guide people who are not comfortable with technology. Make the current task, next action, and booking/payment state understandable in plain language, with visible labels rather than relying on color or unexplained icons alone.
