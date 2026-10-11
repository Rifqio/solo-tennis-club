# Phase 3 execution plan: Pay and Verify Bookings

Date: 2026-10-11. Status: 03-01 implemented; 03-02 next. Scope: 18 requirements (AUTH-05, PAY-01..08, OPER-05, OPER-08, OPER-12, OPER-13, UX-01, UX-02, UX-06, UX-08, UX-09). Decisions: [03-DECISIONS.md](03-DECISIONS.md), confirmed by the user. Architecture: [03-ARCHITECTURE.md](03-ARCHITECTURE.md). Boards: D8 `DeskPay` (pay screen), D7 `DeskAdminRecap` (Rekap); phone pay/review screens follow the phone boards' patterns where no board exists, as the desktop session editor did. Status and feedback: G1 (`.planning/G1-FEEDBACK-PLAN.md`).

## Slices and order

| Slice | Requirement owners | Depends on | Vertical outcome |
| --- | --- | --- | --- |
| [03-01](03-01-PLAN.md) | PAY-04 (holding rule), AUTH-05 (evidence access) | Accepted Phase 2 | New booking states, one occupancy rule, expiry that spares proofs under review, private evidence storage and authorized retrieval |
| [03-02](03-02-PLAN.md) | PAY-01, PAY-02, PAY-03, PAY-07 (member side), UX-01, UX-06, UX-08, UX-09 | 03-01 | Member pays (sample QRIS, bank, copy), uploads up to 3 files and gets a truthful result; Booking kamu shows Menunggu dicek / Perlu diperbaiki / Lunas |
| [03-03](03-03-PLAN.md) | OPER-05, PAY-05, PAY-06, PAY-08, UX-02 | 03-02 | Admin "Perlu dicek" queue, proof viewer, approve, reject with reasons, WhatsApp follow-up; rejection after the deadline releases places |
| [03-04](03-04-PLAN.md) | OPER-08 | 03-03 | Admin records cash/transfer/QRIS payments received outside the app |
| [03-05](03-05-PLAN.md) | OPER-12, OPER-13 | 03-04 | Rekap (board D7) and its Excel export |
| [03-06](03-06-PLAN.md) | Integrated acceptance of all 18 | 03-05 | e2e specs, manual checks, validation, Phase 3 acceptance |

- [x] 03-01 states, occupancy, expiry, private storage (see 03-01-SUMMARY.md)
- [ ] 03-02 member payment and proof upload
- [ ] 03-03 admin review
- [ ] 03-04 outside payments
- [ ] 03-05 Rekap and export
- [ ] 03-06 integrated acceptance (user manual checks)

Each slice owns its migration (if any, always after `npm run db:backup`), contracts (OpenAPI file), UI in ID/EN at 390/1024/1440, G1 feedback, motion vocabulary, tests and a SUMMARY. Unit and integration tests run per slice; the full browser suite runs once at the end (03-06), per the user's standing preference.

## Shared rules

- Every write that changes a booking's state goes through one service per transition, in one transaction with `version` checks; retries carry a client id (`submissionId`, `requestId`) and replay the first result.
- The occupancy rule changes only in `server/features/capacity/occupancy.ts`; no feature computes holding on its own.
- Evidence files never pass through `express.static`; only the owner and admins can read them, and non-owners get 404.
- No toasts where a screen is the result (proof submitted). Success toasts for admin actions; failures as field errors or notice panels (G1).
- Sample QRIS and placeholder bank details until the club supplies real ones (decision 1); nothing waits on them.

## Out of scope for Phase 3

Refunds and overpayment settlement (Phase 4), booking moves/cancellation (Phase 4), automatic WhatsApp/SMS messages, payment gateway, evidence retention cleanup job, real OTP provider.
