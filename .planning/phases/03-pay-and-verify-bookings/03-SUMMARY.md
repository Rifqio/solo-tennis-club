# Phase 3 Summary: pay and verify bookings

Date: 2026-10-12. Status: **accepted by the user** (manual checks on phone and desktop, 2026-10-12). Requirements: AUTH-05, PAY-01..08, OPER-05, OPER-08, OPER-12, OPER-13, UX-01, UX-02, UX-06, UX-08, UX-09.

## Slices
- 03-01 payment states, one holding rule, private proof storage ([summary](03-01-SUMMARY.md)).
- 03-02 members pay (sample QRIS, bank transfer) and send up to three proof files ([summary](03-02-SUMMARY.md)).
- 03-03 admins review proofs from Booking masuk: approve, reject with a reason ([summary](03-03-SUMMARY.md)).
- 03-04 admins record payments received outside the app ([summary](03-04-SUMMARY.md)).
- 03-05 Rekap with Excel export ([summary](03-05-SUMMARY.md)).
- 03-06 integrated acceptance (this file).

## 03-06 acceptance
- **Browser spec** `tests/e2e/payments.spec.ts`, at 390 and 1280 against a real e2e server:
  - a member books, pays and loses the connection mid-upload; the files stay and the retry goes through;
  - the admin rejects ("Bukti tidak terbaca"); the member sees the reason and the same deadline, and sends a new proof;
  - the admin approves; Booking kamu shows Lunas (and Paid in English);
  - a second booking is paid in cash and recorded by the admin;
  - Rekap for the session's month downloads `rekap-STC-<month>.xlsx`.
- **The e2e server runs in demo mode** (`LAFU_DEMO=1` in `playwright.config.ts`) so members sign in with the code shown on screen.
- **Privacy:** covered by integration tests. A proof file reaches only its booker and admins; everyone else gets 404 or 401 (`payment-states.test.ts`); proof submission requires the owner's session, same origin and CSRF (`customer-payments.test.ts`).
- **Fixes made during acceptance:**
  - Booking masuk rows no longer read the raw status code (`awaiting_verification`) to screen readers.
  - The desktop schedule specs step days with the date tiles (the desktop band has week arrows since a3a5479); `tests/e2e/support/schedule-nav.ts`.
  - The schedule specs follow the new error and "no upcoming sessions" copy from the G3 states.
- **Results:** 274 unit and integration tests pass. Full browser suite: 199 of 200 passed; the one failure was Chromium failing to capture a full-page screenshot in `public-layout` at 1440 (English), which passed on rerun.

## Carried forward
- Real club payment details replace the sample QRIS and bank placeholders if STC ever becomes a real club (not needed for the portfolio demo).
