# Phase 3 architecture: payment states, private evidence and review

Decisions: [03-DECISIONS.md](03-DECISIONS.md). Conventions: [BACKEND-CONVENTIONS.md](../../BACKEND-CONVENTIONS.md) (router → controller → service → repository; one transaction handle per service operation). Builds on Phase 2's shared admission service, booking snapshots and occupancy projection.

## 1. Booking states

| Status | Meaning | Holds places? | Member sees | Admin sees |
|---|---|---|---|---|
| `awaiting_payment` | Reserved, no proof yet | Until `originalDeadline` | Belum bayar + countdown + Bayar | Belum bayar |
| `awaiting_verification` | Proof submitted, not reviewed | **Yes, past the deadline** (PAY-04) | Menunggu dicek | Perlu dicek |
| `needs_correction` | Proof rejected before the deadline | Until `originalDeadline` (PAY-07) | Perlu diperbaiki + reason + countdown | Ditolak · menunggu bukti baru |
| `confirmed` | Approved proof or recorded payment | Yes | Lunas | Lunas |
| `expired` | Deadline passed without accepted proof, or rejected after the deadline (PAY-08) | No | Batal · lewat batas bayar | Lewat batas |

Transitions. Each is one service operation in one transaction, versioned with `version`:
- **submit proof:** `awaiting_payment` or `needs_correction` → `awaiting_verification`. Only while `now < originalDeadline` at the moment the server has the complete upload.
- **approve:** `awaiting_verification` → `confirmed`.
- **reject:** `awaiting_verification` → `needs_correction` if `now < originalDeadline`, otherwise `expired` (places released, correction no longer offered).
- **record outside payment:** `awaiting_payment`, `awaiting_verification`, `needs_correction`, or `expired` with capacity still available → `confirmed`. Reviving an expired booking re-checks capacity through the admission service's capacity check. It is refused if the places are gone, so the admin re-books instead.
- **expiry worker:** `awaiting_payment` and `needs_correction` past the deadline → `expired`. It never touches `awaiting_verification`.
- **Cancelled sessions:** no review revives a booking on a cancelled session (Phase 4 owns cancellation flows; Phase 3 refuses approve and record on them).

## 2. Occupancy: one rule, changed in one place

`server/features/capacity/occupancy.ts` `activeBookingWhere(now)` becomes:

```
OR: [
  { status: { in: ['awaiting_payment', 'needs_correction'] }, originalDeadline: { gt: now } },
  { status: { in: ['awaiting_verification', 'confirmed'] } },
]
```

The public schedule, session detail, rosters, admission and players all already read this function, so they follow automatically. The `my-bookings` effective-expiry filter and `roster.service` expiry display get the same two-status treatment. Tests prove that a proof under review keeps places after the deadline and that a rejection after the deadline releases them.

## 3. Data model (one migration, after `npm run db:backup`)

- **`Booking`:** the new status values (string column, no schema change), plus:
  - `confirmedAt DateTime?`
  - `confirmedBy String?` (admin id)
  - `paymentNote String?` (overpayment and similar notes)
- **`PaymentProof`:** one submission.
  - `id`, `bookingId`, `submissionId` (client-generated, unique per booking: a retry never makes two)
  - `submittedAt`, `customerId`
  - `status` (`pending` | `approved` | `rejected`)
  - `reviewedAt`, `reviewedBy`, `rejectionReason` (`amount_mismatch` | `unreadable` | `not_received` | `other`), `rejectionNote`
- **`PaymentProofFile`:** `id`, `proofId`, `position`, `fileName` (stored random name), `originalName`, `contentType`, `byteSize`. At most 3 per proof.
- **`PaymentRecord`** (outside payments, OPER-08):
  - `id`, `bookingId`, `method` (`cash` | `transfer` | `qris`)
  - `amountIdr`, `paidOn` (club date), `note`
  - `recordedBy`, `recordedAt`, `requestId` (unique: retry-safe)
- **Audit:** every approve, reject and record writes its actor and time on the row itself. No separate audit table is needed beyond `BookingOwnershipEvent`'s pattern.

## 4. Private evidence storage

- **Files:** `data/private/proofs/<bookingId>/<random>.<ext>`, outside `data/uploads` (which is served statically) and outside `dist`. They are written to a temp name and then renamed, so a half-written file is never visible. A proof row is committed only after its files are on disk; on a failed commit the files are removed.
- **Accepted types:** JPEG, PNG, PDF, detected from content (magic bytes), not the file name. 5 MB each, 3 files. Upload as `multipart/form-data` through the existing mutation guards (origin, CSRF). A body limit sized for 3 × 5 MB applies on this route only.
- **Retrieval:** `GET /api/customer/bookings/:id/proofs/:proofId/files/:fileId` (booking owner only) and `GET /api/admin/proofs/:proofId/files/:fileId` (any admin).
  - Both send `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: inline` for images and `attachment` for PDF.
  - They never go through `express.static`, and a non-owner gets 404, not 403 (AUTH-05).
- **Backups:** `npm run db:backup` copies `data/private` with the database and `data/uploads`.
- **Retention:** rows and files are kept. A cleanup job after 12 months is recorded as later work, not built in Phase 3.

## 5. API (OpenAPI files per slice, as in Phase 2)

Member:
- `GET /api/customer/bookings/:id/payment` returns the amount, the deadline, payment instructions (QRIS sample, bank placeholders from club content), the latest proof with its status and rejection reason, and `canSubmit`.
- `POST /api/customer/bookings/:id/proofs` (multipart: `submissionId`, `files[]`) returns the booking with its new status, or one of:
  - `PAYMENT_DEADLINE_PASSED`
  - `PROOF_FILE_INVALID` (with a field per file)
  - `BOOKING_NOT_PAYABLE`
  - a replay of the same `submissionId`, which returns the original result

Admin:
- `GET /api/admin/bookings?status=review` adds the "Perlu dicek" filter, oldest submission first. `unpaidCount` gains a sibling, `reviewCount`.
- `GET /api/admin/bookings/:id` includes the proofs (latest first), their files, and the payment records.
- `POST /api/admin/bookings/:id/proofs/:proofId/approve` (with `version`) and `POST …/reject` (`version`, `reason`, `note?`). They return the updated detail and the `outcome` (`confirmed` | `needs_correction` | `expired`).
- `POST /api/admin/bookings/:id/payments` (`version`, `requestId`, `method`, `amountIdr`, `paidOn`, `note?`).
- `GET /api/admin/recap?month=YYYY-MM` and `GET /api/admin/recap/export?month=YYYY-MM` (xlsx).

## 6. Rekap (OPER-12, OPER-13)

**Month basis:** revenue for a month is the sum of `totalPriceIdr` of **`confirmed` bookings whose session date falls in that month** (club time). That matches "what this month's classes earned". This is a planning default; the user can switch it to payment date during 03-05 review.

**Contents (board D7):**
- Revenue, and the change against the previous month.
- Pending: bookings in `awaiting_payment`, `awaiting_verification` or `needs_correction` for that month's sessions, as a count and a sum.
- Fill rate: confirmed places ÷ capacity of scheduled sessions.
- Sessions held: scheduled sessions whose start has passed.
- A six-month revenue bar list.
- A per-class table: sessions, fill and revenue.

**Export:** an xlsx generated on the server (library chosen in 03-05: `exceljs`, maintained, MIT, no native dependencies). Sheets: Ringkasan (the KPIs), Per kelas, and Booking (one row per confirmed booking: date, class, booker, places, total, confirmed at, method). The filename is `rekap-STC-YYYY-MM.xlsx`. Admin only.

## 7. Feedback (G1) per outcome

| Outcome | Feedback |
|---|---|
| Member submits proof | The dedicated "Bukti terkirim" screen (board), no toast |
| Upload fails or is interrupted | Notice on the pay screen with Coba lagi; the files stay chosen |
| Deadline passed | Notice with a WhatsApp link |
| Admin approves | Toast "Pembayaran {name} dikonfirmasi."; the booking leaves Perlu dicek |
| Admin rejects | Toast "Bukti ditolak." plus the "Chat {name}" action in the detail. On a rejection after the deadline: toast "Bukti ditolak, slot dilepas." |
| Admin records a payment | Toast "Pembayaran tercatat." |
| Version conflicts | One FormFeedback-style panel |
| Rekap export | The browser's download is the result; no toast |
