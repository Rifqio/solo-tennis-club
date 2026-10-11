# 03-05 Summary: Rekap and Excel export

Date: 2026-10-11. Status: implemented. Owners: OPER-12, OPER-13.

## What changed
- **Server** (`server/features/admin/recap/`):
  - `GET /api/admin/recap?month=YYYY-MM` returns the month in numbers. A booking counts in its session's month (03-DECISIONS).
    - **Revenue:** paid bookings of the month's sessions that are not cancelled, including sessions later in a running month.
    - **Pending:** unpaid or awaiting a corrected proof, still before the deadline.
    - **Places:** places held by active bookings (the same rule as capacity) against places offered.
    - **Sessions:** held, upcoming and cancelled.
    - **Six months of paid revenue**, and a per-class breakdown sorted by revenue.
  - **Comparison:**
    - a finished month compares with the whole month before;
    - a running month compares with what the month before had been paid by the same day (`confirmedAt`). This is a fair "ahead or behind" while money still comes in.
  - Months after the current one are refused (`DATE_OUT_OF_RANGE`).
  - `GET /api/admin/recap/export` returns `rekap-STC-YYYY-MM.xlsx` with three sheets: Ringkasan, Per kelas, and Booking (every booking of the month, so the totals can be checked line by line).
  - `reference-counts` now carries `classes`.
- **Screens** (`src/features/admin/recap/AdminRecapPage.tsx`):
  - **Phone (board 19):**
    - the band holds a full-width month switch;
    - "Pendapatan · Lunas" is one large number, with the change as a pill ("↑ 8% · 1-11 Sep"; the full sentence for screen readers);
    - "Menunggu pembayaran" opens Booking masuk;
    - places filled and sessions held sit side by side;
    - six bars switch the month when tapped (the chosen one is lime);
    - a per-class list, and Ekspor ke Excel at the end.
  - **Desktop (D7):** four tiles, the chart beside a per-class table, and Ekspor ke Excel in the band.
  - **Motion:** numbers slide in from the direction moved; bars and fill bars grow; reduced motion makes it instant.
  - **States:** an empty month says "Belum ada sesi pada {bulan}."; loading placeholders wait 150 ms; a failed load gets an error panel with Coba lagi. There is no sample-data notice (the user's call).
- **Navigation:**
  - the rail reads Sesi, Booking, Rekap, Kelas, Kelola;
  - the phone dock reads Sesi, Booking, (+), Rekap, Kelola;
  - on phones Kelas is a tab inside Kelola: four tabs in two rows, and the Kelas list shows the Kelola band with Kelas chosen;
  - the admin sign-in page lists Rekap.
- **Canvas:** board 19 added, D7's sample pill removed, and the phone admin boards' docks and Kelola tabs updated to match.

## Deviation from the plan
- **Excel library:** `write-excel-file` 4.1.1 replaces exceljs. Both are MIT-licensed, but exceljs was last published in 2024 with nine dependencies, while write-excel-file is maintained (June 2026), has one dependency (fflate), and only writing is needed. `npm audit` shows nothing new; the existing findings are in prisma and shadcn tooling.
- **Revenue for a running month:** the first build counted only sessions already played. The dev data showed Rp 0 next to Lunas bookings for later October sessions, so revenue now counts the whole month and the comparison uses pay dates instead.

## Evidence
- `tests/integration/admin-recap.test.ts`: 4 tests.
  - A running month: revenue, comparison +100% (by pay date), pending, places, sessions, six bars, per class.
  - A finished month with no comparison.
  - The comparison clamps to a shorter month.
  - Over HTTP: admins read the recap and download a workbook with the three sheets; months ahead, malformed months and signed-out requests are refused.
- Browser on the dev data:
  - 390: Oktober reads Rp 1.425.000, pending Rp 295.000 (2 bookings), 8% filled (13 of 156), 6 held, 2 cancelled; September shows the empty state.
  - 1440 matches D7.
  - The Kelola tabs on phones (Kelas 4, Coach, Lokasi, Level) render.
  - No sideways scroll.
- Full unit and integration suite: 247 tests pass; type check, lint and the design-token guard are clean.
