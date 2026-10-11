# 03-04 Summary: payments received outside the app

Date: 2026-10-11. Status: implemented. Owner: OPER-08.

## What changed
- **Server:**
  - `POST /api/admin/bookings/:id/payments` (`payment-record.service.ts`) records cash, transfer or QRIS paid outside the app, in one write transaction, and confirms the booking. Who recorded it and when are kept.
  - Unpaid, needs-correction or under-review bookings are confirmed straight away. A proof waiting for review is marked reviewed by the same admin.
  - A booking past its deadline comes back only if its places are still free. This is checked under the same session write lock as a new booking, so a revival can never overbook; otherwise `CAPACITY_UNAVAILABLE`.
  - Already-paid bookings and cancelled sessions are refused (`BOOKING_NOT_PAYABLE`). Stale versions return `STALE_VERSION` with the latest detail. A future `paidOn` is refused.
  - `requestId` makes a retry after a lost reply safe: the same payment again returns the first result; a different payment under the same id is `IDEMPOTENCY_CONFLICT`. See `03-04-OPENAPI.yaml`.
- **Booking masuk** (phone page and desktop drawer):
  - A Pembayaran section lists recorded payments (method, amount, date, who recorded it, note).
  - "Catat pembayaran" opens a sheet: method chips, amount (prefilled with the total, a "Kurang" or "Lebih" line when it differs), date, note. A lapsed booking shows a warning that it comes back only if places are free.
  - Saving shows a toast and the booking turns Lunas. A full session or a stale booking is explained in the sheet.
  - "Bukti bayar" only appears when the booking has proofs. The desktop table refreshes after the drawer changes a booking.

## Evidence
- `tests/integration/admin-payment-record.test.ts`: 5 tests. They cover confirming an unpaid booking with who recorded it, settling a pending proof, a retry kept once and a reused id refused, reviving a lapsed booking only while places are free, and refusals for paid bookings, cancelled sessions, stale versions, future dates and unknown methods.
- Browser at 1440 and 390: the sheet, the Kurang line, the toast and Lunas, and the table refresh.
- Full unit and integration suite: 243 tests pass; type check and lint are clean.

## Note on test data
The browser checks recorded cash payments on two of the user's own test bookings: Rp 155.000 on Drill Forehand (13 Okt) and Rp 280.000 on Kelas Pagi Pagi Hepi (14 Okt, 3 slots). Both now read Lunas. Earlier 03-03 checks also rejected the proof on Drill Forehand (12 Okt) and approved or rejected several "Uji Bayar" bookings.
