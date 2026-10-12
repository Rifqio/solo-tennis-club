# Phase 4 decisions: Adjust Bookings and Settle Cancellations

Status: **confirmed by the user on 2026-10-12.** Every item below is the agreed rule; the six open questions were answered with the recommended defaults (see the end). Requirements: BOOK-10, OPER-09, OPER-10, OPER-11, CANC-01, CANC-07, CANC-08, CANC-09.

Fixed by the requirements and not reopened here:
- Capacity is never exceeded implicitly. Admins raise a session's capacity in the session editor first if they want more places.
- Customers keep asking for changes through the admins (WhatsApp). The member app gets no edit, move or cancel controls.
- Refunds are manual: the club returns the money outside the app and only records it. STC is a portfolio demo, so no real money moves, but the records behave as they would for a real club.
- The five-hour hold, proof-review protection and the pending-inclusive minimum counts stay as they are.

What exists today (grounding for the options below):
- Booking statuses: `awaiting_payment`, `awaiting_verification`, `needs_correction`, `confirmed`, `expired` (`shared/booking-rules.ts`). Which of them hold places is decided in one place (`server/features/capacity/occupancy.ts`).
- Each booking freezes its price (`unitPriceIdr`, `totalPriceIdr`) and its `originalDeadline`. Participants are rows (`BookingParticipant`), one per place.
- Money is recorded as an approved proof (the booking total) or as `PaymentRecord` rows (method, amount, date). `Booking.paymentNote` already holds notes such as an overpayment.
- Sessions have `status: scheduled | cancelled`, but no admin action cancels one today; only sample data does. A cancelled session's bookings keep their own status, and the member app shows "Sesi dibatalkan" from the session.

## 1. A cancelled booking

| Decision | Recommended default |
|---|---|
| How it is stored | A new booking status **`cancelled`**, with `cancelledAt`, `cancelledById` and a reason: **`session_cancelled` · `club` · `customer_request`**. It holds no places. |
| Session cancellation | Cancelling a session cancels every active booking on it in the **same transaction** (reason `session_cancelled`). Expired bookings stay expired. |
| Why stored, not derived | Rosters, Rekap, the member app and refunds all read the booking directly. Deriving "cancelled" from the session would scatter the rule; one status keeps occupancy in one place. |

Implies: a migration (new columns, existing sample bookings on cancelled sessions backfilled to `cancelled`), `cancelled` added to `BOOKING_STATUSES` and left out of both holding lists.

## 2. Editing booking information (OPER-09)

| Field | Recommended default |
|---|---|
| Booker name and contact phone | Editable by admins at any time. A verified member's own account name and number are not changed. Only this booking's copy is. |
| Participant names | Editable at any time, including after payment. |
| Number of places, down | Treated as a **partial cancellation** (item 5). |
| Number of places, up | **Not an edit.** The admin records a second booking from the same session (the existing "Catat booking dari WA"). That booking takes a new place through the normal capacity check and has its own deadline and payment. |
| Price and deadline | Never edited directly. They change only through a move (items 4 and 6). |
| After the session starts | Names only. Moves and cancellations end at the session start. |

## 3. Who changes what, and where

| Decision | Recommended default |
|---|---|
| Where | On the booking detail (phone page and desktop drawer): **Ubah** (edit), **Pindah sesi** (move), **Batalkan** (cancel). On the session: **Batalkan sesi**. |
| Members | The booking detail gets one line, "Mau ganti jadwal atau batal? Chat admin", with a WhatsApp link to the club. No controls. |
| Audit | Every change writes a `BookingChangeEvent` (kind, before, after, admin, time), like `BookingOwnershipEvent`. Admins see it as "Riwayat perubahan" on the booking. |
| Stale views | Every change carries the booking's `version`. If someone else changed it first, the admin sees the latest booking and nothing is applied (as in proof review). |

## 4. Moving a booking (OPER-10)

| Decision | Recommended default |
|---|---|
| Whole or part | **The whole booking** moves. To move part of a group, the admin reduces this booking (item 5) and records a new one in the other session. |
| Destination rules | A scheduled session that has not started, with enough places, checked by the same capacity rule. Same booking cutoff as an admin-recorded booking. |
| Atomic | Releasing the old places and taking the new ones happen in **one transaction** with the capacity check. If the destination is full or changed, nothing moves and the original booking stays exactly as it was ("Slot di sesi tujuan nggak cukup. Booking tetap di sesi lama."). |
| Status | Keeps its payment status: a paid booking stays Lunas, a proof under review stays under review. |
| Members | The booking simply shows its new session. The admin gets a ready WhatsApp message ("Booking kamu dipindah ke ..."). |

## 5. Cancelling a booking, whole or in part (OPER-11)

| Decision | Recommended default |
|---|---|
| Whole booking | Status `cancelled` (reason `club` or `customer_request`), places released at once. |
| Part of a group | **Allowed:** the admin picks which participants to remove. Those places are released, the booking's quantity and total go down, and the remaining players keep the booking and its status. The last participant cannot be removed this way; that is a whole cancellation. |
| Unpaid booking | Nothing is owed; no refund item. |
| Paid or under review | A refund item is created (items 8 and 9). |
| Confirmation | One confirm dialog naming the places and any refund: "Batalkan 2 slot? Refund Rp 300.000 dicatat sebagai harus dikembalikan." |

## 6. Price and deadline when moving

| Case | Recommended default |
|---|---|
| Unpaid booking | Takes the **destination's price**; nothing has been paid. It **keeps its original deadline**: a move never restarts the five-hour window, the same rule as rejection. |
| Paid or under review, destination cheaper | Keeps what was paid; the difference becomes a **refund item** ("Selisih harga"). |
| Paid or under review, destination dearer | Moves at the price already paid; the admin is shown the difference and can record it as owed in the payment note. The booking stays Lunas. |
| Deadline nearly gone | No extension (item 12). The admin can record a payment or re-book. |

## 7. Cancelling a session (CANC-01, CANC-07)

| Decision | Recommended default |
|---|---|
| Where | **Batalkan sesi** on the session (roster screen and desktop roster panel), any time before it starts, including for low participation. |
| Reason | Chips, shown to members: **Peserta kurang · Cuaca · Lapangan tidak tersedia · Lainnya** (free text for Lainnya). |
| Confirmation | The dialog states the effect: "8 slot dari 4 booking dibatalkan. 2 booking sudah bayar: refund Rp 600.000." |
| Effect | Session `cancelled`; every active booking `cancelled` (item 1); paid ones get refund items; the session takes no more bookings; public schedule and albums treat it as cancelled (as today). |
| Undo | **None in the app.** A mistaken cancellation is fixed by publishing the session again and re-booking. Undoing would have to un-cancel bookings whose places may already be taken. |

## 8. Refunds: who is owed what (CANC-08)

| Case | Recommended default |
|---|---|
| The club cancels (a session, or a booking for its own reason) | **Full refund** of what was paid. |
| The member asks to cancel | **Full refund by default; the admin may lower the amount**, with a note, at the moment of cancelling. The club's policy lives with the club, not in code. |
| Price difference after a move | The difference (item 6). |
| Overpayment | The excess already noted in Phase 3 can be turned into a refund item from the booking. |
| Amount paid | An approved proof counts as the booking total; recorded payments count as their amounts. The refund default is the sum. |

## 9. Refund records and completion (CANC-09)

| Decision | Recommended default |
|---|---|
| Data | A `Refund` row: booking, amount, reason (`cancelled` · `price_difference` · `overpayment` · `late_payment`), status **`due` · `completed` · `waived`**, created by and when; on completion: method (Transfer · Tunai · QRIS), date, optional note, completed by. |
| Where admins see them | A **"Refund"** filter in Booking masuk with the count due, and a "Refund belum dikembalikan" row in Rekap. |
| Marking done | "Tandai sudah dikembalikan" on the refund: method, date (today by default), note. One tap undo for a few seconds (G1), then it is a record. |
| Waiving | An admin can close a due refund as **"Tidak jadi" (waived)** with a required note, e.g. the member chose a credit instead. |
| Rekap | Revenue counts what was paid minus completed refunds, in the session's month; refunds due are shown separately. |

## 10. Cancellation while a proof is under review

| Decision | Recommended default |
|---|---|
| Allowed? | **Yes.** The proof is closed as not reviewed. |
| Refund | A refund item is created for the booking total but marked **"Cek dulu"**: the admin confirms whether the money arrived before returning it. If it never arrived, the admin waives it ("Uang belum masuk"). |
| The member | Sees the booking cancelled; no new proof can be sent. |

## 11. Payments that arrive late

| Case | Recommended default |
|---|---|
| Money arrives after the booking expired or was cancelled | On the expired or cancelled booking, **"Catat uang masuk"** records the money and creates a refund item (reason `late_payment`). |
| The member still wants to play and places remain | The admin records a new booking for them and records the payment there instead (no refund item). The expired booking stays expired. |
| Never | Reviving an expired or cancelled booking. (Phase 3: a review cannot revive a cancelled booking.) |

## 12. Administrative exceptions

| Exception | Recommended default |
|---|---|
| Going over capacity | **Never implicit.** Raise the session's capacity in the session editor first; the move or booking then fits normally. |
| Extending a payment deadline | **Not in Phase 4.** Admins record the payment or re-book. Revisit if the club asks. |
| Changing past sessions | Names only; no moves or cancellations after the session start. |

## 13. Telling people (no messaging provider yet)

| Decision | Recommended default |
|---|---|
| In the app | The member's booking shows the change at once: new session, reduced places, or **Dibatalkan** with the reason and the refund line. |
| Manual fallback | After any change, the admin gets a one-tap WhatsApp chat with a ready message. After a session cancellation, a checklist of every affected booker, each with its WhatsApp button and a tick when contacted ("Sudah dihubungi"). |
| Refund updates | The member sees "Refund Rp X sedang diproses" while due and "Refund Rp X sudah dikembalikan (Sen, 12 Okt)" once completed. |

## 14. What members see (BOOK-10)

| Status | Words and next action |
|---|---|
| Belum bayar | Time left; **Bayar sekarang**. |
| Menunggu dicek | "Admin lagi cek bukti kamu." No action. |
| Perlu diperbaiki | The reason and time left; **Kirim bukti baru**. |
| Lunas | The session; album link afterwards. |
| Kedaluwarsa | "Batas bayar lewat, slot dilepas." **Chat admin** if they already paid. |
| Dibatalkan | The reason (session cancelled, by the club, at your request) and the refund line if any; **Chat admin**. |

Phase 3 already covers the first five; Phase 4 adds Dibatalkan, the refund lines and the "Chat admin" line on every booking.

## Answers (2026-10-12)

The user chose the recommended default for all six:

1. **Member-requested cancellations:** full refund by default; the admin may lower it with a note.
2. **Paid booking moved to a dearer session:** moves at the price already paid; the difference is noted.
3. **Partial-group cancellation:** allowed.
4. **Session cancellation:** no undo; a mistake is fixed by republishing.
5. **Payment deadline extensions:** none in Phase 4.
6. **Unpaid booking moved:** keeps its original deadline.
