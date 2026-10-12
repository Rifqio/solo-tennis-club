# Phase 4 architecture: changes, cancellations and refunds

Decisions: [04-DECISIONS.md](04-DECISIONS.md) (confirmed 2026-10-12). Conventions: [BACKEND-CONVENTIONS.md](../../BACKEND-CONVENTIONS.md): router → controller → service → repository, one transaction handle per service operation, `version` checks, client request ids replayed. Builds on Phase 3's booking states ([03-ARCHITECTURE.md](../03-pay-and-verify-bookings/03-ARCHITECTURE.md)).

## 1. Booking states

One new stored status. The five Phase 3 statuses are unchanged.

| Status | Meaning | Holds places? | Member sees | Admin sees |
|---|---|---|---|---|
| `cancelled` | Cancelled by the club, at the member's request, or with its session | No | Dibatalkan + reason + refund line + Chat admin | Dibatalkan + reason + refund state |

- `shared/booking-rules.ts`: add `cancelled` to `BOOKING_STATUSES`; it stays out of `DEADLINE_BOUND_STATUSES` and `STANDING_STATUSES`, so `activeBookingWhere` releases its places with **no change to `occupancy.ts`**.
- `effectiveBookingStatus` returns `cancelled` for a cancelled booking (today any unknown status falls through to `expired`, so this must be explicit).
- Cancel reasons: `session_cancelled` · `club` · `customer_request`.

### Transitions (each one service, one transaction, versioned)

| Operation | From | To | Owner service |
|---|---|---|---|
| Cancel booking (whole) | any active status | `cancelled` | `booking-cancel.service.ts` |
| Remove participants (partial) | any active status, quantity > removed | same status, fewer places | `booking-cancel.service.ts` |
| Cancel session | session `scheduled`, not started | session `cancelled`; every active booking `cancelled` (`session_cancelled`) | `session-cancel.service.ts` |
| Edit info | any status before session start (names only after start) | same | `booking-edit.service.ts` |
| Move booking | any active status, session not started | same status, new `sessionId` | `booking-move.service.ts` |
| Complete or waive refund | refund `due` | `completed` or `waived` | `refund.service.ts` |
| Record late money | `cancelled`, or `expired` with its places gone | unchanged; a `PaymentRecord` and a `late_payment` refund | `refund.service.ts` |

Rules shared by all:
- Before the session's `startsAt` only, except name edits.
- A `cancelled` booking is never revived. Phase 3's "record outside payment revives an expired booking if capacity remains" **stays** (the user, 2026-10-12); when the places are gone, the detail offers "Catat uang masuk" instead (decision 11).
- A pending proof on a booking that is cancelled is closed with `status: 'closed'` (new `PaymentProof` value, "not reviewed").
- Capacity is checked only through the admission capacity check (`booking-admission`), never computed locally.

## 2. Data model (one migration per slice that needs it, after `npm run db:backup`)

All additive.

**`Booking`**
- `cancelledAt DateTime?`, `cancelledById String?` (relation `CancelledBy` to `AdminAccount`, `SetNull`), `cancelReason String?`, `cancelNote String?`.

**`ClassSession`**
- `cancelledAt DateTime?`, `cancelledById String?`, `cancelReason String?` (`low_participation` · `weather` · `court_unavailable` · `other`), `cancelNote String?`.

**`BookingParticipant`**: no change. A partial cancel deletes the removed rows inside the transaction and records their names in the change event.

**`BookingChangeEvent`** (audit, like `BookingOwnershipEvent`)
- `id`, `bookingId` (cascade), `kind` (`edit` · `move` · `cancel` · `remove_participants` · `session_cancel`), `before Json`, `after Json`, `adminId?`, `bookingVersion`, `requestId @unique`, `createdAt`; `@@index([bookingId, createdAt])`.

**`Refund`**
- `id`, `bookingId` (cascade), `amountIdr Int`, `reason` (`cancelled` · `price_difference` · `overpayment` · `late_payment`), `status` (`due` · `completed` · `waived`), `needsCheck Boolean @default(false)` (cancelled while a proof was under review, decision 10), `createdById?`, `createdAt`, `requestId @unique`.
- Completion: `method?` (`transfer` · `cash` · `qris`), `completedOn String?` (club date), `completedById?`, `completedAt?`, `note?`. Waive: `note` required.
- `@@index([status, createdAt])`, `@@index([bookingId])`.

**`SessionContact`** (session-cancel checklist, decision 13)
- `id`, `sessionId`, `bookingId`, `contactedAt?`, `contactedById?`; `@@unique([sessionId, bookingId])`.

**`PaymentProof.status`** gains `closed`.

**Backfill** (in the 04-01 migration): sample bookings on already-cancelled sample sessions become `cancelled` with `cancelReason = 'session_cancelled'`, `cancelledAt = session.updatedAt`. No refunds are created for sample data.

## 3. Money rules (one helper)

`server/features/payments/amount-paid.ts` `amountPaid(booking)`: `totalPriceIdr` if an approved proof exists, else the sum of `PaymentRecord.amountIdr`. Used by cancel, partial cancel, move and late money so every refund default comes from one place.

- Whole cancel: default refund = `amountPaid`; customer request may be lowered (`amountIdr ≤ amountPaid`, note required when lowered).
- Partial cancel: unit price × removed places, capped at `amountPaid`; the booking's `quantity` and `totalPriceIdr` drop by the same places.
- Move, unpaid: takes destination `priceIdr`, new `unitPriceIdr`/`totalPriceIdr`; keeps `originalDeadline`.
- Move, paid, cheaper: keeps totals; refund `price_difference` = (old unit − new unit) × quantity.
- Move, paid, dearer: keeps totals; the response carries `owedDifferenceIdr`; the admin may write it into `paymentNote`. No refund, no state change.
- Under review at cancel: refund for `totalPriceIdr` with `needsCheck = true`.

## 4. API contracts (admin; all writes need CSRF, `version` and `requestId`)

| Method and path | Body | Result |
|---|---|---|
| `POST /api/admin/bookings/:id/cancel` | `{ version, requestId, reason: 'club' \| 'customer_request', refundIdr?, note? }` | `200 { booking, refund? }` |
| `POST /api/admin/bookings/:id/remove-participants` | `{ version, requestId, participantIds: string[], reason, refundIdr?, note? }` | `200 { booking, refund? }` |
| `PUT /api/admin/bookings/:id` | `{ version, requestId, bookerName?, bookerPhone?, participants?: { id, name }[] }` | `200 { booking }` |
| `POST /api/admin/bookings/:id/move` | `{ version, requestId, sessionId }` | `200 { booking, refund?, owedDifferenceIdr? }` |
| `GET /api/admin/bookings/:id/move-options` | | `200 { sessions: [{ id, startsAt, className, priceIdr, remainingPlaces, fits }] }` |
| `POST /api/admin/sessions/:id/cancel` | `{ version, requestId, reason, note? }` | `200 { session, cancelledBookings, refundsDueIdr }` |
| `GET /api/admin/sessions/:id/cancel-preview` | | `200 { places, bookings, paidBookings, refundsDueIdr }` |
| `PUT /api/admin/sessions/:id/contacts/:bookingId` | `{ contacted: boolean }` | `200 { contactedAt }` |
| `GET /api/admin/bookings?status=refund` | | refunds due, oldest first; `refundCount` beside `reviewCount` |
| `POST /api/admin/refunds/:id/complete` | `{ requestId, method, completedOn, note? }` | `200 { refund }` |
| `POST /api/admin/refunds/:id/waive` | `{ requestId, note }` | `200 { refund }` |
| `POST /api/admin/bookings/:id/late-payments` | `{ requestId, method, amountIdr, paidOn, note? }` | `201 { payment, refund }` |
| `GET /api/admin/bookings/:id` | | adds `cancel`, `refunds[]`, `changes[]` (Riwayat perubahan) |

Member side: `GET /api/customer/bookings[/:id]` adds `cancel: { reason, at, sessionReason? }` and `refunds: [{ amountIdr, status, completedOn? }]`; status `cancelled` appears in the History view.

Error codes (added to `api-error-messages`): `BOOKING_CHANGED` (version, 409, answers with the latest booking), `SESSION_STARTED` (409), `SESSION_CANCELLED` (409), `CAPACITY_UNAVAILABLE` (existing, move destination full), `SAME_SESSION` (400), `NOTHING_TO_REMOVE` / `LAST_PARTICIPANT` (400), `REFUND_TOO_HIGH` (400), `REFUND_NOT_DUE` (409), `NOTE_REQUIRED` (400). A replayed `requestId` returns the first result.

OpenAPI per slice: `04-0N-OPENAPI.yaml`, as in Phase 3.

## 5. Occupancy, roster and Rekap

- Occupancy: unchanged code; `cancelled` simply is not in either holding list. Tests prove a cancelled or reduced booking frees places at once and that a move frees the old session and fills the new one in one transaction.
- Roster: cancelled bookings leave the active list and appear under a collapsed "Dibatalkan" group with their refund state.
- Rekap (`recap.service.ts`): revenue = paid amounts minus completed refunds, in the session's month; a new "Refund belum dikembalikan" tile (sum and count of `due`); cancelled sessions counted as today. The Excel export gets a Refund sheet.
- Booking masuk: a "Refund" filter (refunds due, oldest first) after Perlu dicek; the dock/rail badge order stays review → unpaid.

## 6. UI surfaces

- Booking detail (phone page, desktop drawer): actions row Ubah · Pindah sesi · Batalkan; Riwayat perubahan collapsed; Refund card with Tandai sudah dikembalikan / Tidak jadi.
- Roster screen and desktop roster panel: Batalkan sesi; after cancel, the contact checklist with WhatsApp buttons and Sudah dihubungi ticks.
- Member booking detail and Booking kamu: Dibatalkan row and detail, refund line, "Mau ganti jadwal atau batal? Chat admin" on every booking.
- G1 feedback: success toasts for admin actions; confirmations as dialogs (desktop) or sheets (phone); conflicts as one notice panel with the latest state. Motion vocabulary only (`src/lib/motion.ts`).

## 7. Out of scope for Phase 4

Customer-side edit, move or cancel controls; automatic WhatsApp/SMS; payment gateway refunds; deadline extensions; recurring sessions and minimum cutoffs (Phase 5).
