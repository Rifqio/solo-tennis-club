# 02-05 Admin-created bookings and explicit customer linking

Date: 2026-10-10. Source implemented and tested on branch `gsd/02-05-admin-bookings`. User manual acceptance pending. Requirement owner OPER-07.

## Shared admission

Customer and admin bookings now go through one service, `server/features/booking-admission/`. It takes the session capacity write first (a `capacityRevision` bump), replays by request ID scoped to actor kind and ID, then checks the five-hour cutoff, the expected session version and whether the whole group fits. It creates the booking with `originalDeadline = admittedAt + 5h` and exactly `quantity` participants in one write transaction, with bounded retries. The customer booking service is now a thin caller, and its repository moved into the shared module. Customer request fingerprints are byte-identical to before, so an in-flight customer retry still replays. Admin fingerprints also include the typed contact.

## Admin endpoints

- `GET /api/admin/booking-options/:sessionId`: the shared quote plus session facts for the form.
- `POST /api/admin/bookings`: the customer payload plus `{bookerName, bookerPhone}`. The phone is normalized to E.164 with the same rules as customer sign-in. The booking is unowned (`customerId` null, `actorKind` admin). 201 on first save, 200 `replayed` on retry, 409 `IDEMPOTENCY_CONFLICT`, `CAPACITY_UNAVAILABLE`, `SESSION_CHANGED` or `BOOKING_CLOSED`, 400 field errors.
- `GET /api/admin/verified-customers?phone=`: exact match on a normalized phone of an active verified customer. Never a search.
- `PUT /api/admin/bookings/:id/customer-link` `{customerId, version}`: only for an unowned booking, at the version the admin saw, to a customer whose verified phone equals the booking contact. Ownership and version change; quantity, names, price, contact snapshot, status and original deadline do not. A `BookingOwnershipEvent` (admin, previous owner null, new owner, resulting version) is written in the same transaction. A retry of the same link returns 200. Errors: 409 `STALE_VERSION` with the latest detail, `BOOKING_ALREADY_LINKED` with the latest detail, `CUSTOMER_MISMATCH`, 404.
- `GET /api/admin/bookings/:id` now also returns `version` and `linked {at, by}`.

Migration `20261010090000_booking_ownership_event` adds the audit table only. Customers still cannot list or claim unowned bookings by phone. Lost-number cases get club-assistance guidance; there is no automatic merge or transfer.

## Screens

- Roster: a "Catat booking" button on scheduled sessions.
- `/admin/sessions/:id/book`: three steps (booker name and phone, then quantity stepper and player names defaulting to "Rina", "Rina 2", then review with the 5-hour hold note and an unlinked note). It shows a reason instead of the form for cancelled, closed or full sessions. Validation focuses the first invalid field. Leaving with entries asks before discarding. A dropped connection says the save is uncertain and that saving again is safe: the same request ID is reused until the payload changes. Capacity and session-change conflicts reload the quote and say what changed.
- Booking detail: a "Booking tercatat" confirmation after saving. For unowned bookings, an "Akun pemesan" section looks up the exact number and shows either "no account yet" with check-again guidance, or the verified account with a link button behind a confirmation dialog. It also carries lost-number guidance. Linked bookings show "Dihubungkan {date} oleh {admin}".

## Verification

- `tests/integration/booking-admission.test.ts` (8 tests): admin quote and admission parity, normalized unowned contact, replay and conflict, capacity, session change, contact validation and cutoff, auth and CSRF. Customer and admin HTTP racing over 4 rounds never exceeds capacity or splits a group. Ten admissions over two independent Prisma connections admit exactly 3 groups of 2 into 6 places, with every refusal a capacity refusal or a busy error. A refused admission rolls back its capacity lock write. Linking covers lookup, mismatch, stale version, unknown customer, CSRF, success with unchanged booking facts, the audit row, retry, the owned-booking refusal, and customer access 404 before and 200 after (still 404 for another customer).
- Full suite 198/198, `npm run build` and `npm run lint` pass.
- HTTP smoke on a backup copy of the live local database (`backups/lafu-20261010-132240-WIB.db`, migrated in the worktree only): admin create 201, replay 200, places reduced, lookup null then matched after mock-OTP sign-up, customer 404 then 200 after the link, deadline unchanged, owner and audit event persisted across a restart.
- `tests/e2e/admin-booking-record.spec.ts` is authored (phone form with validation and lost-response retry reusing the request ID, discard guard, full-session state, link confirmation with Escape across all layout widths, English). It typechecks and Playwright lists 6 tests, but it was **not run**: browser automation stays disabled by user instruction.

The user's live local database was not migrated from this unmerged branch. Run `npm run db:backup` then `npm run db:migrate:deploy` after merging.

Not added: payment proof or confirmation, booking move or cancellation, refunds, recurrence, minimum automation, real OTP delivery.
