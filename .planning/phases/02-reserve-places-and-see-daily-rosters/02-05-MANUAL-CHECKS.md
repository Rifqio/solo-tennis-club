# 02-05 manual acceptance

Run against the local development app after `npm run db:backup` and `npm run db:migrate:deploy`. Mock OTP codes come from the development API/UI; real delivery is not part of this acceptance.

- [ ] From a scheduled session's Peserta screen, tap "Catat booking". Leave the booker fields empty and continue: the first field is focused with an error. Enter a name and a local number (08...).
- [ ] Add players with the stepper; check the default names, edit one, review, and confirm the total equals price × players in Indonesian and English.
- [ ] Save. The booking detail shows "Booking tercatat" with a deadline five hours after saving; the roster and public schedule lose the same number of places; the booking shows "Dari WA" in Booking masuk.
- [ ] Turn the connection off before saving (or kill the server), save, see the "belum pasti tersimpan" message, reconnect and save again: only one booking exists.
- [ ] Start a booking, type a name, tap back: the discard dialog appears; "Tetap mengedit" keeps the entry.
- [ ] Fill a session nearly full from a customer phone, then try to record a larger admin group: the form reports the new remaining count and saves nothing.
- [ ] Open a cancelled session, a full one and one starting within five hours: each explains why it cannot be booked.
- [ ] On the new booking's detail, "Akun pemesan" says no account uses the number. On a phone, sign up as a customer with that exact number: "Booking kamu" does not show the booking.
- [ ] Tap "Cek lagi", then "Hubungkan ke akun ...": the confirmation explains what changes. Cancel with Escape or the button, then confirm. The detail shows "Dihubungkan ... oleh ..." and the section disappears.
- [ ] The customer now sees the booking with the same players, total and deadline.
- [ ] Sign up with a different number and confirm it is never offered for that booking. A customer-made booking never shows the link section.
- [ ] At 320px, a typical phone and tablet/desktop widths: no horizontal scroll, 48px targets, focus moves to each step heading, keyboard reaches every control.

Phase 2 release remains gated on real OTP delivery (AUTH-02).
