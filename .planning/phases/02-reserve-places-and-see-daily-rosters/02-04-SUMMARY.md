# 02-04 Daily rosters and incoming bookings

Date: 2026-10-10. Source implemented and tested (commits 9290ef7 roster restyle, 0729dda incoming bookings). User manual acceptance pending.

Roster (Peserta): bookings are grouped by booker with a slot badge, WhatsApp link, deadline or "lewat batas" state and players as chips. It opens on unpaid bookings, with lapsed ones one tap away. The band shows the WIB date and time and taken/max slots against the minimum. The session list shows each session's fill as one bar (booked, empty, minimum tick) with a single colour key per day.

Incoming bookings (dock tab "Booking"):

- `GET /api/admin/bookings?status=unpaid|confirmed|all&cursor=&limit=` returns `{filter, items, nextCursor, unpaidCount, serverNow}`. Unpaid means still holding places (shared `activeBookingWhere`), nearest deadline first, paged by `(deadline, id)`. Confirmed and all are newest first, paged by `(createdAt, id)`. Admin only, no-store.
- `GET /api/admin/bookings/:id` returns players, the owning app account (name, verified phone) or none for admin-recorded bookings, session facts and source.
- Screen: filters on the band with an unpaid badge, groups "Batas hari ini / besok / <date>", deadline chips, a "Dari WA" tag for admin-recorded bookings. Detail: status and deadline tiles, chat on WhatsApp, players, a link to the session's players, total and source, and a plain note that payment confirmation arrives with the payments phase.

No payment controls or contact data reach public responses. The payment-proof preview drawn on the design canvas belongs to Phase 3 and is not built.

Validation: `tests/integration/admin-bookings.test.ts` covers ordering, cursor paging, lapsed bookings dropping out of unpaid, the unpaid count, source, admin-only access, detail contents, 404 and invalid filter. Full suite 188/188, lint and build pass. Admin list, filter and detail screenshots at 390px with no horizontal overflow.
