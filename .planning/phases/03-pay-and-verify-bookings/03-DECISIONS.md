# Phase 3 decisions: Pay and Verify Bookings

Status: **confirmed by the user on 2026-10-11.** Rekap was added to Phase 3 with its Excel export (item 7b, OPER-12 and OPER-13); every other item uses its recommended default. Each item has a recommended default. Items marked *board* are already settled by the approved pay board (D8, `DeskPay`). Requirements: AUTH-05, PAY-01..08, OPER-05, OPER-08, UX-01, UX-02, UX-06, UX-08, UX-09.

Fixed by the requirements and not reopened here:
- Proof under review keeps the places past the 5-hour deadline.
- Rejection never restarts the deadline.
- Rejection after the deadline releases the places.
- A review cannot revive a cancelled booking.
- Payment is manual; there is no gateway.

## 1. How the club takes payment

| Decision | Recommended default |
|---|---|
| Methods | Static QRIS **and** one bank account. *Board* |
| Amount | The member types the exact total; the static QRIS does not fill it in. The total has a copy button. *Board* |
| Same phone | A large QR plus **"Simpan QR"**, which saves the image so the member can open it from the gallery in their banking or e-wallet app. Bank details have copy buttons. *Board* |
| Unique code digits (e.g. Rp 200.037) | **No.** Admins match by booker name, time and proof. Unique digits confuse members and complicate refunds. |
| Until the club's real details arrive | The board's placeholder, clearly labelled "Contoh QR, belum bisa dipakai bayar", which the app already does for sample data. |

**Club details (decided 2026-10-11):** the sample QR is enough for now. Phase 3 ships with the board's labelled sample QRIS ("Contoh QR, belum bisa dipakai bayar") and placeholder bank details, and no step waits on the club. The real QRIS image and the bank name, account number and account holder go into club content whenever the club supplies them; nothing else changes.

## 2. Proof files and privacy

| Decision | Recommended default |
|---|---|
| Formats and size | JPG, PNG or PDF, up to 5 MB each. *Board* iPhone photos arrive as JPG through the browser's picker. |
| Files per submission | **Up to 3.** One payment usually has one file; a top-up after a short payment needs a second. |
| Storage | **On the server's disk, outside the public folder** (like coach photos, but private). Served only to the booking's own member and to admins, through signed-in requests. Included in `db:backup`. |
| History | Every submission is kept. Admins see the latest by default and older ones on request; members see their latest and its review result. |
| Retention | **12 months after the session**, then removed by a later cleanup job. No automatic deletion in Phase 3. |

## 3. Amounts that do not match

| Case | Recommended default |
|---|---|
| Paid too little | Admin rejects with the reason "Nominal kurang". The member pays the difference and resubmits, with both files if wanted, within the original deadline. |
| Paid too much | Admin approves and adds a note: "Kelebihan Rp X". Refunding the difference is tracked in Phase 4 (refunds) and handled manually until then. |
| Paid twice or the same proof sent twice | Admin approves once. A second payment is noted as excess, as above. |
| Paid the wrong club or account | Rejected with the reason "Pembayaran belum masuk". |

## 4. Rejection

| Decision | Recommended default |
|---|---|
| Reasons | A fixed list, so members always understand it: **Nominal tidak sesuai · Bukti tidak terbaca · Pembayaran belum masuk · Lainnya** (free text required for Lainnya). Shown to the member word for word. |
| How the member hears | **In the app:** the booking shows "Perlu diperbaiki" with the reason and the time left. **Manual fallback:** the admin gets a one-tap WhatsApp chat with a ready message, because there is no automatic messaging provider. |
| Review time | No promise in the app ("Admin bakal cek"). Target for the club: within 2 hours during opening hours. Not enforced. |
| Approve | One tap. The booking becomes **Lunas**. The admin gets a toast (G1); the member sees the new status the next time they open it. |

## 5. Payments received outside the app (OPER-08)

| Decision | Recommended default |
|---|---|
| Where | "Catat pembayaran" on the booking (phone page and desktop drawer). |
| What is recorded | Method (Tunai · Transfer · QRIS), amount, date and an optional note. An optional photo is allowed but not required. |
| Effect | The booking becomes **Lunas**, the same as an approved proof. The audit records who recorded it and when. |
| Amount differs from the total | Allowed, with the difference shown, as in item 3. |

## 6. Deadline edges and interrupted uploads

| Case | Recommended default |
|---|---|
| When a proof counts as on time | When the **server receives the complete upload** before the deadline. |
| Last minutes | Under 10 minutes left, the pay screen shows a warning tone ("Sisa 8 menit. Upload buktinya sekarang."). |
| Upload interrupted or connection lost | No success is shown until the server confirms. The chosen file stays selected with "Coba lagi". Every submission carries an id, so a retry never creates two submissions. |
| Deadline passes mid-upload | The upload is refused: "Batas bayar sudah lewat, slotnya dilepas. Chat admin kalau kamu sudah bayar." with a WhatsApp link. The admin can still record the payment (item 5) and, if places remain, re-book. |
| Leaving and coming back | The pay screen is reachable from Booking kamu while the booking is unpaid or needs correction (UX-08). Nothing typed is lost because nothing is typed except the file choice. |
| Submission result | The board's dedicated result, "Bukti terkirim. Slot kamu aman…", with **no toast** (G1: the screen is the result). |

## 7. Scope question: Rekap (board D7)

The Rekap board covers monthly revenue (Lunas only), pending payments, fill rate, a 6-month chart, a per-class breakdown and an Excel export. **It is not in the approved requirements**, and REQUIREMENTS.md lists exports as not approved. Options:
- (a) Leave it out of Phase 3 and decide later.
- **(b) Chosen: add it to Phase 3**, with the Excel export: OPER-12 (recap) and OPER-13 (export).

## 8. Admin review queue (OPER-05, UX-02)

| Decision | Recommended default |
|---|---|
| Where | A new **"Perlu dicek"** filter, first in Booking masuk, with a count badge on the rail and dock Booking tab (which counts unpaid today). |
| What a proof row shows | Booker, participants, expected total, submission time, original deadline, state and the proof image. Desktop opens it in the drawer beside the table; phones get a full screen with the image zoomable. |
| Actions | Setujui (approve) · Tolak (reject, choose a reason) · Chat (WhatsApp). |

## Rekap (03-05), confirmed by the user 2026-10-11
- **Month basis:** a booking counts in the month of its session date. Revenue counts paid (Lunas) bookings only.
- **Phone design:** board 19 "Admin: Rekap (HP)". It shows one large revenue number with the change from last month, "Menunggu pembayaran" as the one tappable row (it opens Booking masuk on Belum bayar), slot fill and sessions held side by side, a six-month bar chart where tapping a bar switches month, a per-class list instead of a table, and Ekspor ke Excel at the end. Desktop follows D7.
- **Phone dock:** Sesi, Booking, (+), Rekap, Kelola. Kelas moves into Kelola as a tab beside Coach, Lokasi and Level. The desktop rail keeps all five (Sesi, Booking, Rekap, Kelas, Kelola), as in D7.
- **Revenue and comparison (build, 2026-10-11):** revenue counts every paid booking of the month's sessions, later sessions of a running month included. A running month compares with what the month before had been paid by the same day; a finished month with the whole month before.
