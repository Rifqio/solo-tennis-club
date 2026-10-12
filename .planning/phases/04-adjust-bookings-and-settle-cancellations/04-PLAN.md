# Phase 4 execution plan: adjust bookings and settle cancellations

Date: 2026-10-12. Status: planned; 04-01 next. Scope: 8 requirements (BOOK-10, OPER-09, OPER-10, OPER-11, CANC-01, CANC-07, CANC-08, CANC-09). Decisions: [04-DECISIONS.md](04-DECISIONS.md), confirmed by the user. Architecture: [04-ARCHITECTURE.md](04-ARCHITECTURE.md). UI follows the existing patterns: Booking masuk (phone page, desktop drawer D6), the roster screen and desktop roster panel (D5), G1 status and feedback, the motion vocabulary. Copy in Indonesian and English, English tech words kept (refund, upload).

## Slices and order

| Slice | Requirement owners | Depends on | Vertical outcome |
| --- | --- | --- | --- |
| [04-01](04-01-PLAN.md) | OPER-11, CANC-08 (refund due), BOOK-10 (Dibatalkan) | Accepted Phase 3 | `cancelled` status; admin cancels a booking whole or in part; a refund due is recorded; the member sees Dibatalkan with the refund line |
| [04-02](04-02-PLAN.md) | CANC-01, CANC-07 | 04-01 | Admin cancels a session from the roster; all its bookings cancel in one go with refunds due; the contact checklist |
| [04-03](04-03-PLAN.md) | OPER-09, OPER-10 | 04-01 | Admin edits booker and player names; moves a whole booking to another session with price and deadline rules; Riwayat perubahan |
| [04-04](04-04-PLAN.md) | CANC-09, CANC-08 (late money), BOOK-10 (refund lines) | 04-02, 04-03 | Refund filter in Booking masuk; mark completed or waived; late money; Rekap and export count refunds |
| [04-05](04-05-PLAN.md) | Integrated acceptance of all 8 | 04-04 | Browser specs, manual checks, validation, Phase 4 acceptance |

- [ ] 04-01 cancelled status, booking cancel (whole and partial), refunds due
- [ ] 04-02 session cancellation and contact checklist
- [ ] 04-03 edit info and move booking
- [ ] 04-04 refund completion, late money, Rekap
- [ ] 04-05 integrated acceptance (user manual checks)

Each slice owns its migration (always after `npm run db:backup`), its OpenAPI file, UI in ID/EN at 390, 1024 and 1440, G1 feedback, tests and a SUMMARY. Unit and integration tests run per slice; the full browser suite runs once in 04-05, as in Phase 3.

## Shared rules

- Every state change is one service in one transaction with a `version` check; retries carry `requestId` and replay the first result. Each writes a `BookingChangeEvent`.
- Occupancy changes only through `server/features/capacity/occupancy.ts` and the admission capacity check; no feature counts places on its own. Capacity is never exceeded implicitly.
- Nothing revives a `cancelled` booking. An `expired` one comes back only through Phase 3's record-payment when its places are still free.
- Refund amounts come from one helper (`amountPaid`); refunds are records only, the money moves outside the app.
- Moves and cancellations stop at the session start; name edits do not.
- Members get no edit, move or cancel controls, only the "Chat admin" line.
- Confirmations name the effect before it happens (places, bookings, refund amount). Success toasts for admin actions; conflicts as one notice panel with the latest state (G1).

## Out of scope for Phase 4

Customer self-service changes, automatic messages, gateway refunds, deadline extensions, undo of a session cancellation, recurring sessions and minimum cutoffs (Phase 5).
