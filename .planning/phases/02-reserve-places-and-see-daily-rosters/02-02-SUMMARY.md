# 02-02 Capacity-safe customer reservations

Date: 2026-10-09. Source implemented. User manual acceptance and concurrency/rollback proof remain pending.

The public session detail now leads to a customer booking route. The mobile-first, bilingual flow selects a group size, preserves the selected session and quantity through phone sign-in, collects names in pages of ten, normalizes them before review, and confirms one reservation. Owner-scoped name drafts use `sessionStorage`; no OTP, session token or phone is persisted there. A capacity conflict keeps the entered names available for correction. No place is held before final confirmation.

Bookings snapshot the verified booker's name/phone, participants, quantity, unit and group price, original five-hour deadline, session and customer references, actor scope, and a payload fingerprint. Request IDs are unique per actor. Identical retries return the original booking and deadline; reusing a key with different content returns a conflict. Customer responses expose only the booking DTO and ordered participants, not database ownership or fingerprint fields.

Availability now counts active `awaiting_payment` booking participants and stops counting them at their original deadline. Proof-review/confirmed states are not created in this slice; the dependent payment phase must extend this shared predicate so protected places remain occupied. Customer reservation creation acquires a write on `ClassSession.capacityRevision` before reading capacity, then validates scheduled state, the five-hour admission cutoff, quoted session version, whole-group fit and safe total inside one retryable write transaction. Admin session edits take the same write lock before reading occupancy, preventing a capacity reduction from racing customer admission.

The local database was backed up before each schema migration. Migrations `20261009081455_booking_reservations` and `20261009081934_optional_booking_customer` add bookings, participants, capacity revision and nullable customer ownership for later admin-entered bookings. The development server is running at `http://127.0.0.1:3000`.

Validation: `npm run build` and `npm run lint` passed after implementation. No tests or browser automation were run. Customer/customer and edit/customer races, rollback, identical replay, changed-payload idempotency, cutoff/expiry boundaries, mobile/browser UI, and end-to-end customer acceptance remain to be verified before BOOK requirements are accepted.

Next plan: 02-03 private customer bookings and durable expiry, after completing the 02-01/02-02 manual acceptance items.
