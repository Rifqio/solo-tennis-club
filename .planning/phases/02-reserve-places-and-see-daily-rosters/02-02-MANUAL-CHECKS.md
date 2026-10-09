# 02-02 manual acceptance

Run against the local development app at `http://127.0.0.1:3000`. Use the development-only mock OTP returned by the API/UI; no real SMS/WhatsApp delivery is part of this acceptance.

- [ ] From the public schedule, open a session and choose places without signing in first.
- [ ] Select a group quantity, continue to phone sign-in, complete OTP and verify the session/date/quantity remain selected.
- [ ] Confirm access alone did not create a booking or reduce public places.
- [ ] Check the booker name default, edit names, review the full participant list and verify unit price × quantity equals the displayed total in Indonesian and English.
- [ ] Navigate back between quantity, name and review steps; confirm values remain intact. For groups over ten, page through names without losing edits.
- [ ] Confirm once. Verify the success screen shows the committed quantity, total and original deadline five hours after final confirmation.
- [ ] Refresh or retry after a simulated lost response using the same untouched request. Confirm one booking/deadline is returned and places are counted once.
- [ ] With two customer accounts, attempt a group larger than remaining capacity. Confirm no partial reservation and the entered names remain available after the conflict.
- [ ] Check the same reservation's places are reflected in the public schedule, with no customer/participant data exposed there.
- [ ] At 320px and a typical phone width, test keyboard reach, focus after step changes, validation, loading/error states and paired actions. Also inspect tablet/desktop expansion and both languages.
- [ ] Verify booking admission closes five hours before session start. Exact cutoff and expiry boundaries still require controlled-clock automated verification before phase acceptance.

Phase 2 requirement acceptance remains pending. Admin/customer race and capacity-edit race need independent-connection proof; no payment or proof workflow exists in this slice.
