# Phase 2: Reserve Places and See Daily Rosters

Date: 2026-10-09. Status: policies confirmed; planned for development implementation. No Phase 2 source, migration or browser work has started. Prepared directly, without GSD skills.

Reader: the engineer implementing Phase 2 and the club owner reviewing behavior. After reading, implement the five ordered slices without changing the approved reservation policies. [02-PLAN.md](02-PLAN.md) is the execution checklist; [02-ARCHITECTURE.md](02-ARCHITECTURE.md), [02-UI-BRIEF.md](02-UI-BRIEF.md) and [02-VALIDATION.md](02-VALIDATION.md) define its contracts and acceptance.

## Confirmed policies

| ID | Decision confirmed by user | Consequence |
| --- | --- | --- |
| P2-01 | Development-only OTP adapter first; real delivery remains a release prerequisite | A development milestone can pass; AUTH-02 real WhatsApp/SMS delivery cannot be marked accepted yet |
| P2-02 | Mock OTP may be returned through the API response for current testing | Return `debugCode` only in explicit development mode with the mock adapter; no empty-code bypass; production rejects mock configuration |
| P2-03 | Require customer name and verified phone only | No mandatory email, address or birth date; phone entry plus OTP creates a customer account after name completion |
| P2-04 | Groups can use up to the session's remaining capacity | Count places, not booking records; retain numbered defaults and editable participant names; reject insufficient capacity atomically |
| P2-05 | Five-hour hold starts only after final reservation confirmation | No hold while selecting places, entering OTP or reviewing; deadline uses authoritative server time at successful admission |
| P2-06 | Close new reservations five hours before session start | Reject new customer and admin reservations at or after `startsAt - 5 hours`; never shorten the five-hour window |
| P2-07 | Admin records name + phone without creating a verified login | Store private contact snapshots and leave customer ownership unset until explicit authorized linking |
| P2-08 | After customer verifies the same phone, admin explicitly links the booking | Exact normalized verified-phone match and version check; audit the link; no automatic merge or public claim search |
| P2-09 | Same-number recovery uses OTP; lost-number recovery requires club assistance | No self-service phone replacement or automatic account merge; assistance guidance is delivered, transfer tooling is a separately controlled future task |

P2-03 through P2-06 were approved in the user's planning answers. P2-07 through P2-09 were approved together. P2-02 is the subsequent explicit instruction: "at the moment we mock otp or sending via api response".

## Invariants inherited from the approved release

- Public discovery stays open. Customer identity, contact details, participants and bookings are private from their first delivery.
- Hold is exactly five hours from successful admission; retries, account linking and later proof rejection never change the original deadline.
- An active awaiting-payment group occupies all its places. Expired unpaid groups without proof occupy none. No partial group admission.
- Future submitted-proof review and confirmed bookings continue occupying places beyond the original deadline. Phase 2 expiry must already preserve these states; Phase 3 supplies their actual workflow.
- Minimum-participant counting includes confirmed and active pending places, one count per participant. No minimum-cancellation automation is added here.
- Since new admission closes five hours before start, unpaid reservations are due before start. Overdue unpaid records appear effectively expired even if the worker is delayed. Awaiting-review records stay protected at start.
- Admin-created reservations follow the same hold, cutoff, capacity and retry rules. Admin identity does not waive them. Paid recording, booking edits/moves/cancellations, proof upload, refunds and recurrence keep their later-phase ownership.
- Keep SQLite/Prisma 7, Express/React, WIB and integer IDR. No Supabase, provider purchase, hosted deployment or production-data manipulation is part of planning.

## Development milestone versus full Phase 2 acceptance

Development completion means mock OTP plus functional booking/expiry/roster/linking flows, passing automated checks and user manual review. It is not fulfillment of real WhatsApp/SMS OTP delivery. Keep AUTH-02 and the overall Phase 2 completion box open until a real provider is selected, configured and tested with a real recipient. Production customer booking/auth must remain unavailable when only the mock adapter is configured; existing public discovery/admin catalog can still operate.

## Release decisions deferred by the user

Real OTP channel/provider, sender setup, delivery coverage, credentials and operating cost will be decided before release integration. Provider switching must not reset existing holds or alter booking ownership. Do not enable an unapproved fallback channel automatically.
