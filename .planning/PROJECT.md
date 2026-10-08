# Lafu — Lawu Fun Tennis Club

## What This Is

A mobile-first web application for Lawu Fun Tennis Club (Lafu), replacing a shared schedule spreadsheet and WhatsApp booking workflow with customer self-service and an operational admin portal. Visitors can explore the club and browse schedules without signing in, then reserve places, pay by static QRIS or bank transfer, and submit payment proof from their phones. Customers and administrators can use the application in Indonesian or English, with expanded layouts on tablets and desktops.

## Core Value

Customers can book tennis classes from their phones with clear, reliable availability, while club admins can manage those bookings and payments without spreadsheets.

## Business Context

- **Customer**: Tennis coaching club customers book classes; club administrators operate the service.
- **Revenue model**: Customers pay for tennis classes using static QRIS or bank transfer; software monetization is not defined.
- **Success metric**: Customers complete bookings and payment submission, and admins manage daily operations without the spreadsheet workflow; numerical targets are not yet defined.

## Requirements

### Validated

(None yet — ship to validate. The existing React starter contains no implemented tennis club capabilities.)

### Active

- [ ] Visitors can explore the club and browse upcoming schedules without authentication.
- [ ] Customers can quickly move between dates and see session date, time, coaches, level, venue, price, capacity, and remaining places.
- [ ] Customers can immediately distinguish available, nearly full, fully booked, and cancelled sessions.
- [ ] Customers can select an available session and book one or several participant places without overbooking.
- [ ] Group participants default to the booker's name and numbered guests, and the customer can edit those names during booking.
- [ ] The booking flow encourages sign-in or sign-up, while also allowing a phone-number entry path verified by WhatsApp or SMS OTP. Name entry completes automatic account creation for a new customer.
- [ ] Customers can provide required booking information, see the payment instructions, and complete booking comfortably from a phone.
- [ ] Unpaid bookings reserve their requested places for five hours, then expire and release those places if no payment proof was submitted.
- [ ] Customers can pay using static QRIS or bank transfer and upload payment proof directly from their phones.
- [ ] Submitted proof enters pending verification and keeps the places reserved until an admin reviews it.
- [ ] Admins can approve proof to confirm a booking, or reject proof and allow correction within the remainder of the original five-hour reservation window.
- [ ] Rejection does not extend the original reservation deadline. If the deadline has already passed when proof is rejected, the places are released.
- [ ] Customers can see clear booking and payment states and view their upcoming bookings.
- [ ] Admins can quickly access today's and upcoming sessions, participants, availability, incoming bookings, and pending payment proofs from their phones.
- [ ] Admins can view customer information and create bookings for customers who contact the club through WhatsApp or book in person.
- [ ] Admins can record payments received outside the application's customer payment-proof flow.
- [ ] Admins can change, move, or cancel customer bookings; customers cannot change, move, or cancel their own bookings in the initial version.
- [ ] Admins can cancel an entire session, including when its minimum participant count is not met.
- [ ] Every session has a venue, minimum and maximum participant counts, and one or more assigned coaches.
- [ ] Admins can optionally enable automatic session cancellation if the minimum participant count is unmet at an admin-configured cutoff.
- [ ] Both confirmed and active pending-payment participant places count toward the minimum; expired and cancelled bookings do not. Each place in a group booking counts as one participant.
- [ ] Cancelled paid bookings or sessions can have refunds tracked as due or completed, while admins handle the actual money manually.
- [ ] Admins can manage classes, individual sessions, recurring schedules, coaches, venues, class levels, prices, and capacity.
- [ ] Essential customer and admin workflows work fully on mobile, and tablet and desktop layouts expand the same experience.
- [ ] Customers and administrators can use the application in Indonesian and English.
- [ ] Customers unfamiliar with technology can follow the booking flow through clear instructions, visible next actions, and understandable status explanations.

### Out of Scope

- Automated payment gateway integration for the initial version — static QRIS, bank transfer, uploaded proof, and admin review are intentional first-release payment methods.
- Automated refund transfers for the initial version — the application tracks refund obligations and completion while admins transfer money manually.
- Customer self-service booking cancellation or rescheduling — booking changes are handled by administrators.
- Native mobile applications for the initial version — the requested product is a web application with a mobile experience approaching a polished native app.

## Context

### Current workflow

Customers check a shared online spreadsheet for class schedules and availability, then contact an admin through WhatsApp to reserve places. The admin manually records schedules, bookings, and payments in spreadsheets. Pending-payment participants remain listed with their names shown in red, and customers currently have approximately five hours to pay.

One customer can reserve several places. The existing spreadsheet uses names such as Andy, Andy 2, and Andy 3 for a group; the application should preserve that convenience while allowing individual participant names to be entered.

### Customer direction

Primary flow: Discover → Schedule → Select Session → Book → Pay → Confirmation.

Browsing stays public. Authentication appears when needed to complete or manage a booking. Phone OTP and automatic account creation are a low-friction entry path, rather than a requirement to complete a separate signup form before viewing schedules. The exact primary sign-in mechanism and whether WhatsApp, SMS, or both will deliver OTP are to be defined separately.

Group booking, participant names, customer details, payment instructions, proof upload, and status should form a short, understandable phone workflow. Customers should always know whether their places are temporarily reserved, awaiting review, confirmed, expired, or cancelled. Rejected proof must clearly show any remaining time to correct it.

### Admin direction

Primary flow: Today → Sessions → Bookings → Payment Verification → Manage.

Today's sessions, participant lists, and payment verification are frequent operational tasks and should require little navigation. Admins must be able to inspect uploaded proof, approve or reject it, check customer information, and handle incoming bookings on a phone. More complex management can use additional desktop space without making a laptop necessary for daily operations.

### Session operation

Sessions have a venue, a minimum to run, a maximum capacity, and multiple coaches when needed. Minimum-participant checks include confirmed bookings and active pending-payment bookings, matching the current red-name spreadsheet convention. Automatic cancellation is optional and uses a cutoff configured by the admin; manual cancellation remains available.

Details such as cutoff configuration scope, recurring-series edit behavior, booking deadlines near session start, and cancellation communications remain to be specified during requirements and phase planning. They must preserve the agreed reservation, capacity, payment, and minimum-participant rules.

### Existing workspace

The workspace is `E:\Code\TApp`. It contains a React, TypeScript, and Vite starter with a package name of `mybooking`; the current screen is the framework starter and has no tennis booking functionality. A Git repository has been initialized here. The user chose to skip codebase mapping and define the product first. This project's planning files belong in `E:\Code\TApp\.planning`, independently of planning files in the parent directory.

The confirmed club name is Lawu Fun Tennis Club, abbreviated Lafu. The application supports Indonesian and English. Logo assets and a final visual identity have not yet been supplied or selected. Impeccable supplied UI brainstorming before implementation, and the user selected building directly from an agreed design brief instead of generating a mockup first. The user confirmed Antislop for UI validation during planning and building on 2026-10-08; apply its core, UI, and mobile-layout checks alongside functional, browser, and accessibility verification.

The user wants booking to feel easy and guided even for people unfamiliar with technology, and likes the AYO Android application's presentation. The reference is its Google Play listing and app screenshots at https://play.google.com/store/apps/details?id=coid.ayo.ayo_mobile_app&hl=en, specifically not the AYO website. This is inspiration for mobile presentation; no AYO features or visual identity are automatically adopted.

The user selected Community matchday on the Impeccable direction page: a familiar sports-app presentation with date-led session summaries and guided booking/payment tasks. The detailed UI brief in `.planning/UI-BRIEF.md` was confirmed on 2026-10-07 and will inform subsequent UI planning. GSD planning and implementation gates still apply.

## Constraints

- **Mobile-first design**: Both customers and admins primarily use phones. Information architecture, navigation, touch targets, forms, schedule views, booking steps, and verification workflows must be designed around small screens and comfortable one-handed use.
- **Cross-device support**: Tablet and desktop experiences are required and should expand the mobile experience.
- **Public access**: Club discovery and schedule browsing must not require login.
- **Capacity integrity**: Temporary reservations, group bookings, proof submission, admin bookings, expiry, and cancellations must maintain accurate availability and prevent overbooking.
- **Reservation deadline**: The original unpaid reservation window is five hours; rejected proof does not reset it.
- **Payment**: Initial payments and refunds use manual handling. The architecture must allow future payment providers without requiring gateway integration now.
- **Product identity**: The application should feel like a focused tennis club product, with clear booking states and simple daily operations.
- **Language**: Both the customer experience and the admin portal support Indonesian and English; interface labels and booking/payment messages must retain their meaning in both languages.
- **Persistence**: Start with SQLite and use Prisma as the ORM, as selected during Phase 1 planning on 2026-10-08. Supabase is excluded. Database access stays server-side; hosting needs durable local storage and backups.
- **Architecture decisions**: Framework selection, API design, infrastructure, and remaining implementation details will be defined separately. The existing starter is context, not a finalized architecture decision.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Design customer and admin experiences mobile-first | Both audiences mostly perform quick tasks from their phones | Pending |
| Keep discovery and schedule browsing public | Avoid signup friction before a customer chooses a session | Pending |
| Support phone OTP followed by automatic account creation and name entry | Allow customers to start with a phone number while retaining access to upcoming bookings | Pending |
| Support multi-place bookings with editable numbered guest names | Match current group booking habits and keep input fast | Pending |
| Reserve unpaid places for five hours | Preserve the club's payment window while returning abandoned places to availability | Pending |
| Hold places while submitted proof awaits review | Admin review latency should not cause a customer to lose a submitted booking | Pending |
| Use the original deadline after proof rejection | Corrections must not indefinitely renew reservations | Pending |
| Use static QRIS and bank transfer with manual proof review | Match the intended initial payment operation | Pending |
| Allow admins to create bookings and record outside payments | Support WhatsApp requests and in-person operations | Pending |
| Restrict booking changes and cancellations to admins | The user excludes customer booking changes in the first version | Pending |
| Support a session venue, participant minimum and maximum, and multiple coaches | These define whether a real club session can run | Pending |
| Support optional automatic cancellation at an admin-configured cutoff plus manual cancellation | The club needs both scheduled enforcement and operational discretion | Pending |
| Count confirmed and active pending-payment places toward session minimums | Match the current spreadsheet's confirmed and red-name participants | Pending |
| Track refunds while moving money manually | Handle paid cancellations within the initial manual-payment scope | Pending |
| Defer technical architecture decisions | Product rules should be established before selecting implementation details | Pending |
| Start with SQLite and Prisma; exclude Supabase | User selected a simple initial database and ORM during Phase 1 planning | Selected 2026-10-08; implementation pending |
| Use Lawu Fun Tennis Club / Lafu as the product's club identity | The user confirmed the actual club name | Pending |
| Support Indonesian and English in customer and admin workflows | The user confirmed both application languages | Pending |
| Select Community matchday as the UI presentation direction | It matches the user's AYO app reference while keeping Lafu booking and payment states understandable | Pending |
| Use Impeccable for UI brainstorming and Antislop for validation during planning/building | User confirmed this workflow; the agreed direction informs evidence-based UI checks | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

After each phase transition:
1. Move invalidated requirements to Out of Scope with a reason.
2. Move verified requirements to Validated with the phase reference.
3. Add newly discovered requirements to Active.
4. Record decisions and update their outcomes when evidence exists.
5. Update What This Is if the product has changed.

After each milestone:
1. Review every section.
2. Check whether Core Value remains the right priority.
3. Review Business Context and replace provisional success measures with agreed targets when available.
4. Revisit Out of Scope reasons.
5. Update Context with users, feedback, and current operations.

---
*Last updated: 2026-10-08 after roadmap approval and UI validation preference confirmation*
