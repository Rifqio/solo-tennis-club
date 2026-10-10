# 02-03 Private bookings and five-hour expiry

Date: 2026-10-10. Source implemented and tested (commit 1d059b3). User manual acceptance pending.

Customers now have a Booking tab in the member dock. "Booking kamu" has two views. **Aktif** lists bookings for sessions still ahead that have not lapsed, nearest session first; unpaid ones show the deadline ("Batas 11:00", with the weekday when it is not today) and a "Cara bayar" action. **Riwayat** lists past and lapsed bookings by month, newest first, with "Muat lagi" paging. The detail shows a live countdown in WIB tiles, the absolute deadline with "Nggak diperpanjang", truthful payment guidance (paying in the app is not available yet; chat the admin), players, level, venue with its Maps link, total and booking time. There are no payment or cancellation controls. The booked screen now links to its booking.

API (customer session required, `Cache-Control: no-store`):

- `GET /api/customer/bookings?view=upcoming|history&cursor=&limit=` returns `{view, items, nextCursor, serverNow}`. Upcoming is not paginated (capped at 50, nearest session first). History pages by an opaque `(createdAt, id)` cursor, default 20, maximum 50. Invalid view, limit or cursor returns 400.
- `GET /api/customer/bookings/:id` returns the customer's own booking; another customer's or an unknown id returns 404.

Expiry: `effectiveBookingStatus` (shared/booking-rules.ts) makes an unpaid booking expired from its original deadline on. Screens and occupancy use the same rule, so places are reusable at the deadline even when nothing has been written. A worker (server/features/booking-expiry) runs at startup and every 30 seconds in bounded batches of 100 (up to 20 per round), writes `expired` only where the status is still `awaiting_payment` and the deadline has passed, never changes the deadline or confirmed bookings, does not overlap its own rounds, and stops with the server.

Deviation from the plan text: upcoming bookings are ordered by session time without a cursor, because a customer's active bookings are few and nearest-first is what they need. History uses the planned `(createdAt, id)` cursor.

Validation: `tests/integration/customer-my-bookings.test.ts` covers own-only access and 404 for others, ordering, the exact deadline boundary (one millisecond before vs. at the deadline, for status and occupancy) without the worker, worker idempotency and untouched deadline/confirmed rows, and history cursor paging. Full suite 188/188, lint and build pass. Phone screenshots of signed-out, active, detail and history states checked at 390px with no horizontal overflow.

Not done here: server restart and delayed-worker scenarios are covered by the logical-expiry rule rather than separate tests; browser e2e specs for these screens are not yet written.
