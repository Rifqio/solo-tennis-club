# Phase 2 validation and release gates

Status: planned; all checks below are unrun. Phase 1's 137 passing tests are a baseline, not Phase 2 evidence. Use real migrated file-backed SQLite and an injected clock/mock OTP adapter. No browser automation while the standing user opt-out remains active.

## Automated acceptance scenarios

| Area | Required evidence |
| --- | --- |
| OTP mock contract | Development returns a generated debug code; verify requires the correct code; wrong/expired/consumed code fails; blank code fails; production rejects the mock adapter and never returns debug code |
| OTP abuse/recovery | Attempt limits, phone/IP throttling, cooldown, resend supersession, flow binding, uniform account-existence responses, restart of mock challenges and provider timeout/error seam |
| Account uniqueness/access | Normalized `08...` and `+62...` map to one identity; concurrent new profiles create one customer; completing profile needs verified one-use proof; sign-in/out/revocation/expiry and no admin-cookie interchange |
| Participant defaults | One and many places; numbered defaults in order; edited names retained; required fields, duplicate names allowed as real names, positive quantities and safe integer totals |
| Admission boundary | At cutoff minus 1ms accept; at cutoff and later reject; cancelled/started/ended sessions reject; customer/admin policies identical; no OTP/review hold |
| Group capacity | Two customers race for the last places; customer versus admin race; groups larger than remaining leave no booking/participant rows; participant counts never exceed maximum |
| Database concurrency | Independent Prisma clients and separate worker/process connections use the same real file; first-write locking and bounded full-transaction retries; no Promise.all on one mutex accepted as sole race proof |
| Session edit race | Admission versus capacity reduction/price/date edit; maximum cannot fall below occupied; changed quote requires review; no stale snapshot admission |
| Atomicity | Inject failure after booking creation/during participant insert; no partial group or occupied orphan remains; all statements use the transaction client |
| Idempotency | Same actor/key/payload returns one booking and original deadline/price; lost committed response retries safely; changed payload/key conflict; other actor cannot replay another booking; expired replay creates no new hold |
| Deadline/expiry | Exactly five hours from admission, before/at/after deadline; all-or-none group expiry; delayed worker/server restart cannot retain expired places; repeated worker batches are safe; original deadline never changes |
| Future proof protection | Seed only test records representing review/confirmed states; they remain occupied after original deadline and at session start; expiry cannot remove them |
| Ownership/privacy | Foreign/unknown customer detail returns indistinguishable 404; list filters cannot select another owner; public schedule/details contain no names/contact/booking IDs; private responses no-store |
| Admin outside booking/link | Contact initially unverified; only authorized admin can link an exact verified phone match; stale/mismatched/already-owned requests fail without mutation; audit written atomically; deadline/quantity/price unchanged |
| Rosters/lists | One booking of four yields four occupied places; pending/confirmed texts correctly distinct; deterministic cursor pagination/filtering; expired rows excluded from active counts but retained in appropriate history |
| Durability | Migrate a Phase 1 fixture and clean file, booking/identity read after restart, backup/restore with new data; original public/admin CRUD/security/bundle-boundary checks remain passing |

Suggested test inventory: unit phone/OTP/booking/cutoff/expiry/draft rules; integration customer-auth, booking-admission, booking-concurrency, booking-expiry, booking-privacy, admin-rosters and admin-booking-link; browser specs for complete customer/admin flows and recovery. Files are created by their owning slice, not treated as existing verification evidence now.

## Manual workflow checklist

- [ ] Signed-out public discovery stays open; choose a session, enter mock OTP from the development API, finish name and resume the same group.
- [ ] Back/Continue/language/reload/reauth retain valid draft input without creating a hold or exposing another account's private state.
- [ ] Reserve a group, inspect the absolute WIB deadline and exact integer-IDR total, then see the same participants on admin roster and public place count.
- [ ] Retry a lost response and a capacity/changed-session conflict; confirm truthful results and no partial or duplicate booking.
- [ ] Test awaiting-payment expiry and a server restart with a controlled clock; confirm released places and understandable expired details.
- [ ] Admin enters an outside booking, customer independently verifies the same phone, admin links it explicitly, customer sees it; mismatches remain unlinked.
- [ ] Customer/admin sign-out and expired-session recovery, ID/EN, light/dark, keyboard/focus, zoom, reduced motion, 320/390/640/820/1024/1440 widths and a physical phone.
- [ ] Record Antislop core/UI/mobile source and runtime evidence accurately; user testing is attributed to the user, automated browser checks remain unrun unless authorized.

## Completion checklist

- [ ] Relevant per-slice checks pass after the last source edits.
- [ ] Full `npm run lint`, `npm run build`, `npm run test` pass with measured results and no Phase 1 regression.
- [ ] Browser specs authored and type checked; user manual acceptance recorded.
- [ ] Development milestone complete; mock-only status clearly documented.
- [ ] Real WhatsApp/SMS channel/provider configured, no debug code in production, real recipient OTP sign-in/recovery tested.
- [ ] AUTH-02 and full Phase 2 release acceptance closed only after that real-delivery gate passes.

Reader-test: the admission, cutoff, expiry and linking rules each have an exact positive and negative scenario. Mock identity is explicitly distinct from actual delivery acceptance. No current test count, visual PASS or provider integration is fabricated.
