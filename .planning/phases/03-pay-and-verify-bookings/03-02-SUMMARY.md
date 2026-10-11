# 03-02 Summary: member payment and proof upload

Date: 2026-10-11. Status: implemented. Owners: PAY-01, PAY-02, PAY-03, PAY-07 (member side), UX-01, UX-06, UX-08, UX-09.

## What changed
- **Server** (`server/features/payments/`): `GET /api/customer/bookings/:id/payment` and `POST /api/customer/bookings/:id/proofs`; see `03-02-OPENAPI.yaml`.
  - The multipart body is read with Node's own parser, after a Content-Length cap. Files are checked by their bytes, stored first, then the booking moves to `awaiting_verification` in one guarded transaction. On failure the files are removed.
  - A retry with the same `submissionId` replays the first result.
  - New error codes: `PAYMENT_DEADLINE_PASSED`, `BOOKING_NOT_PAYABLE`.
- **Pay screen** `/bookings/:id/pay` (board D8; phones stack total, method, then steps and upload):
  - The band shows "Bayar sebelum … · sisa h:mm".
  - A QRIS / Transfer bank switch with a sliding marker. The sample QR (a pattern, labelled "Contoh QR, belum bisa dipakai bayar") has Simpan QR. Bank rows have Salin; the button itself says "Tersalin", with no toast.
  - The exact total has Salin, then the three steps.
  - Upload: up to 3 files, previews, remove, add, drag-and-drop on desktop. Type, size and count are checked on the spot as field errors.
  - Sending shows the percentage. Success is the "Bukti terkirim" block, with no toast. The steps then advance and the countdown disappears.
  - Failures:
    - a dropped connection keeps the files and the same submission;
    - a late upload shows the release message, with a WhatsApp link when the club has one;
    - an ended login goes to sign-in and returns here.
  - A warning appears under 10 minutes left.
  - When there is nothing to pay, one notice: under review (with the files sent), paid, past the deadline, or cancelled.
  - After a rejection, the reason (word for word) and the unchanged deadline come first.
- **Payment details:** `src/features/customer/payments/payment-details.ts` holds the sample QRIS and bank values (decision: the sample QR is enough). Changing those values is the only step needed when the club sends its real ones.
- **Entry points:**
  - Booking kamu cards: "Bayar sekarang" or "Kirim bukti baru".
  - The booking detail page and desktop panel: a pay button replaces the old "paying in the app isn't available yet" text; proof under review shows "Bukti kamu sedang dicek".
  - The booking confirmation: "Bayar sekarang" is the primary action.
- **Dock:** stays out of the way on the pay screen, as it does in the booking flow.

## Evidence
- `tests/integration/customer-payments.test.ts`: 7 tests.
  - The happy path, with places held past the deadline and the deadline unchanged.
  - Replay, file checks (including a disguised file), and refusals for late, under review and paid.
  - Resubmission after a rejection keeps the deadline.
  - Owner, CSRF and origin checks.
  - The deadline passing mid-save keeps nothing.
- Browser run at 390 and 1440: book, then "Bayar sekarang", then switch method, then send empty (field error), attach, send ("Bukti terkirim"), then Booking kamu shows "Menunggu dicek". No sideways scroll and no page errors.
- 226 tests pass; type check and lint are clean.
