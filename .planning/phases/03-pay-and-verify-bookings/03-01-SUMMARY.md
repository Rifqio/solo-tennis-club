# 03-01 Summary: payment states, holding rule and private evidence storage

Date: 2026-10-11. Status: implemented; no user-facing flow yet (03-02 builds it).

## What changed
- **Migration `20261011074955_payment_proofs`** (after a backup: `backups/lafu-20261011-144952-WIB.db`):
  - `Booking.confirmedAt`, `confirmedById`, `paymentNote`.
  - New tables `PaymentProof`, `PaymentProofFile`, `PaymentRecord`. Existing bookings and participants were kept (SQLite table rebuild with foreign keys off).
- **Five booking states** in `shared/booking-rules.ts` (`BOOKING_STATUSES`, `DEADLINE_BOUND_STATUSES`, `STANDING_STATUSES`). `effectiveBookingStatus` expires only deadline-bound states.
- **One holding rule** (`activeBookingWhere`): unpaid or needs-correction bookings hold places until the deadline; proofs under review and paid bookings hold them whatever the time. A new `awaitingPaymentWhere` keeps Booking masuk's "Belum bayar" list and count to bookings that still owe payment.
  - The roster's active-place count now uses the shared rule.
  - The expiry worker and the my-bookings "over" filter treat needs-correction like unpaid.
- **Private evidence:**
  - Storage lives in `server/features/payments/evidence-storage.ts`. Files are recognised by their content (JPEG, PNG, PDF), written to a temporary name and then renamed, under `data/private/proofs/<bookingId>/`. Names are validated, so a path cannot escape the folder.
  - Retrieval: `GET /api/customer/bookings/:id/proofs/:proofId/files/:fileId` (owner only; anyone else gets 404) and `GET /api/admin/proofs/:proofId/files/:fileId`. Both send `private, no-store` and `nosniff`; images open inline and PDFs download.
  - `db:backup` copies `data/private` as `<backup>-private`.
- **Labels for the new states:**
  - Booking masuk chip (shared `BookingStatusChip`): "Bukti baru · time", "Perlu dicek".
  - Rosters: owes / review / paid / over. Belum bayar = owes, Lewat batas = over.
  - Booking kamu: "Menunggu dicek", "Perlu diperbaiki".

## Evidence
- `tests/integration/payment-states.test.ts`: 7 tests. They cover holding in each state, effective status, expiry leaving review alone, the unpaid list, file recognition and path safety, privacy for owner / other member / signed out / admin, and backup.
- The full suite has 217 tests passing; type check and lint are clean; the dev server was restarted; admin and member pages load without errors at 390 and 1440.
