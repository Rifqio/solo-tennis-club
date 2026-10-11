# Phase 2 architecture and API contract

Status: existing backend layers implemented in 02-00; customer identity/booking architecture below remains planned. Policies are confirmed in [02-CONTEXT.md](02-CONTEXT.md). This document uses the current Prisma 7 application as its implementation baseline.

## Current code evidence and integration

The database contains admins, cookie sessions, reference records, classes and dated sessions; no customer, booking or OTP models exist. `server/features/capacity/occupancy.ts` currently returns zero for every session. `session-update.service.ts` checks occupancy before editing maximum capacity inside a Prisma transaction. `server/db.ts` configures WAL, a 5000ms busy timeout and foreign keys. Existing public DTOs expose only safe session facts.

The installed `@prisma/adapter-better-sqlite3` 7.10.0 starts transactions with `BEGIN` and holds a per-adapter mutex. Across independent clients/connections this does not justify a read-then-insert capacity algorithm: SQLite deferred reads can fail when upgraded to writes. Keep the Prisma 7 `$transaction` API, acquire write ownership before capacity reads, and retry the entire transaction after bounded transient busy/conflict failures. SQLite's [transaction documentation](https://www.sqlite.org/lang_transaction.html) explains deferred upgrades and write conflicts. Do not copy Prisma 8 `db.transaction` APIs into this project.

## Backend layers

Follow [backend conventions](../../BACKEND-CONVENTIONS.md). The 02-00 prerequisite has separated existing HTTP controllers, business services and feature repositories. New OTP and booking features use these same boundaries. Services orchestrate one transaction; all repositories participating in admission, occupancy, admin capacity edits and linking bind to that transaction. Controllers never pass unvalidated bodies or client-supplied identity into persistence. Provider calls stay outside database transactions. Avoid broad generic repositories or dense inline handlers.

## Persistence additions

| Entity | Planned fields and constraints |
| --- | --- |
| Customer | Stable cuid ID, required display name, unique normalized verified phone, verified timestamp, active flag and timestamps; only OTP completion can establish verified phone |
| CustomerSession | Customer ID, hashed opaque token, CSRF token, expires/revoked timestamps; separate `lafu_customer` cookie; 14-day absolute lifetime matching existing session convention |
| OtpChallenge | Opaque challenge ID, normalized phone, keyed code digest, flow-cookie binding, expiry, attempt count, consumed/superseded status and timestamps; provider reference nullable; no persisted plaintext code |
| OtpAttempt | Hashed phone/IP rate keys, request/check result and timestamps; bounded retention and cleanup |
| Booking | Stable ID, dated session ID, nullable customer owner, actor/source, private booker name/phone snapshots, authoritative unit price/quantity/total, reservation creation and immutable original deadline, stored status/version, scoped request ID and request fingerprint |
| BookingParticipant | Booking ID, ordered position and required name; unique booking/position; exactly quantity rows committed together |
| BookingOwnershipEvent | Booking, authorized linking admin, old/new owner IDs, timestamp and version; no participant or payment mutation |
| ClassSession addition | `capacityRevision` separate from the existing editable-session `version`; used as the first transactional write for booking and capacity-changing operations |

Index bookings by `(sessionId, status, deadline)`, `(customerId, createdAt, id)` and `(status, deadline)`; index OTP expiry/phone throttles. Scope booking request uniqueness by authenticated actor kind + actor ID + UUID. Integer IDR and safe-integer totals only. Customer price and participant snapshots are immutable in Phase 2. Current reference names follow Phase 1 semantics; copying class defaults still never rewrites sessions.

Apply committed migrations to a disposable database and existing Phase 1 fixtures. Verify restart, foreign-key constraints and backup/restore with new entities. Do not seed mock customers into the real local database without an explicit development seed command.

## Development OTP and identity

Technical defaults: six-digit code, five-minute challenge, five verification attempts per challenge, 30-second resend cooldown and bounded phone/IP request budgets (initial phone limit five requests/hour). Persist limits server-side; use server time, stable localized errors and `Retry-After`. Rate failures must not reveal whether an account exists. A resend supersedes the previous challenge; delivery retry does not reserve any place.

Use an adapter with request/check operations. The mock generates a code and uses the same verification/consumption rules as production. **The user explicitly authorized returning `debugCode` in the development API response.** Keep mock plaintext only in a TTL-limited server-memory test-adapter store; persist a keyed digest. A server restart invalidates unrecoverable mock challenges and allows a fresh request. Production startup rejects mock OTP configuration, production DTOs omit `debugCode`, and the browser does not accept a typed debug field from an unapproved mode. No universal code, automatic code verification or blank sign-in bypass.

OTP requests bind the challenge to an opaque HttpOnly flow cookie; request/verify mutations enforce same origin and JSON. Successful checks atomically consume the challenge. A known customer receives a customer cookie session. A new phone receives a short-lived, one-use profile-completion proof, then name completion atomically creates the unique phone identity and a session. Concurrent new-account completion cannot create duplicate identities. Never trust a customer ID or verified flag supplied by the browser.

Normalize phone input with a pinned, implementation-time-verified `libphonenumber-js` release, default country Indonesia, then store E.164. Browser/server use the same normalization rules; validation does not substitute for OTP verification. The library's [primary documentation](https://github.com/catamphetamine/libphonenumber-js) covers parsing/validation and metadata variants. Load the parser with relevant forms rather than public schedule startup.

Real delivery remains future provider work. [Twilio Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp) is one researched candidate and requires sender setup; no provider or fallback is selected. Operator cost/coverage and actual recipient tests precede release enablement.

## Reservation transaction

1. Authenticate customer/admin and validate names, positive integer quantity, UUID and expected editable-session version. Ownership comes from the server session.
2. Begin a short Prisma transaction. Its first database statement updates the target session's capacity revision to acquire SQLite write ownership. Capacity-changing session edits adopt the same first-write discipline.
3. Check the scoped idempotency record. Identical fingerprint returns the existing booking, including its original price/deadline and current effective state, even when expired. Reusing a key with different content returns 409 `IDEMPOTENCY_CONFLICT`.
4. Read current session facts. Require scheduled state and server time strictly before `startsAt - 5 hours`. Compare expected editable-session version; changes return 409 `SESSION_CHANGED` with safe latest facts for explicit review.
5. Read occupied places through the transaction client. Ignore effectively expired unpaid records without review protection. Include all confirmed/active pending/review-protected places. Never count booking rows as participant places.
6. Require the entire requested group to fit. Calculate authoritative price and safe-integer total. Recheck time eligibility at admission, create booking with `originalDeadline = admittedAt + 5 hours`, and insert exactly quantity ordered participants. Commit all or none.
7. On transient database lock/conflict, roll back and retry the complete operation with bounded backoff and fresh authoritative time. Preserve the request UUID. After exhaustion return 503 `TEMPORARILY_UNAVAILABLE` with retry guidance; never pretend capacity was reserved.

No OTP/provider network operation inside a database transaction. No manual nested `BEGIN IMMEDIATE` inside Prisma `$transaction`. No browser-calculated price, count or deadline is authoritative. Fresh review after a 409 uses a new request ID only when the intended payload changes; lost-response retry reuses the original request.

## Occupancy and expiry

`awaiting_payment` counts only before the original deadline. At `now >= deadline`, absent submitted proof/review protection, the effective state is expired and contributes zero. Status presentation and occupancy use the same predicate and clock. Returned occupied/remaining counts use a consistent transaction snapshot.

A repeat-safe worker runs at startup and every 30 seconds, in bounded batches, persisting due unpaid expiry through short write transactions. Logical expiry on reads/writes keeps counts correct even if the worker is late or the server was stopped. Expiry never extends a deadline or reopens review-protected bookings. Future `awaiting_verification`, `confirmed` and protected correction rules are tested through server fixtures; Phase 2 has no endpoints to fake payment success. The supplied clock must let tests reach exact boundaries without wall-clock sleeps.

## Planned endpoints

Same-origin internal JSON API, additive to Phase 1; no `/v1` migration. Browser-safe types in shared contracts, Zod at server boundaries, feature-local ID/EN messages. Private responses use `Cache-Control: no-store`. New list APIs use opaque `(createdAt,id)` cursors, default limit 20, maximum 50; session rosters are bounded by session capacity with paginated booking groups when necessary. Full OpenAPI definitions accompany implementation, using these names and shapes.

| Method and path | Request/query | Success and access |
| --- | --- | --- |
| POST `/api/customer/auth/otp-challenges` | `{phone}` | 201 `{challengeId, maskedPhone, expiresAt, resendAt, development?, debugCode?}` + flow cookie; same-origin/rate limited; debug fields mock-development only |
| POST `/api/customer/auth/otp-verifications` | `{challengeId, code}` | 200 `{next:'name'|'complete', csrfToken, ...sessionInfo}`; consumed challenge and bound flow; new-account proof cookie or full customer cookie |
| POST `/api/customer/auth/profile` | `{name}` | 201 customer/session DTO; one-use profile proof + CSRF; cannot set another phone |
| GET `/api/customer/auth/session` | none | 200 own customer/CSRF/session info; valid customer cookie |
| POST `/api/customer/auth/sign-out` | `{}` | 204 revocation + clear cookie; customer CSRF |
| GET `/api/customer/booking-options/:sessionId` | none | 200 safe session quote/version, availability, cutoff and booker defaults; customer auth |
| POST `/api/customer/bookings` | `{sessionId, quantity, participantNames, expectedSessionVersion, createRequestId}` | 201 first create + Location; 200 identical replay; own customer + CSRF |
| GET `/api/customer/bookings` | upcoming/history, cursor, limit | 200 `{items,nextCursor,serverNow}`; only own bookings |
| GET `/api/customer/bookings/:id` | none | 200 own snapshot/status/deadline/serverNow; foreign/unknown returns 404 |
| GET `/api/admin/sessions/:id/roster` | cursor, limit | 200 ordered booking groups, occupied/remaining place counts and serverNow; admin only |
| GET `/api/admin/bookings` | date/status, cursor, limit | 200 incoming booking summaries with deterministic ordering; admin only |
| GET `/api/admin/bookings/:id` | none | 200 booking, participants, customer/contact verification and ownership facts; admin only |
| POST `/api/admin/bookings` | customer payload plus `{bookerName,bookerPhone}` | Same first/replay semantics; admin + CSRF; initially no customer owner |
| GET `/api/admin/verified-customers` | exact normalized phone | 200 bounded identity match for explicit linking; admin only; no public account enumeration |
| PUT `/api/admin/bookings/:id/customer-link` | `{customerId,version}` | 200 linked booking; admin + CSRF; exact verified phone match, owner unset and version match; audit event |

Booking create response: `{booking:{id,sessionId,status,quantity,unitPriceIdr,totalPriceIdr,createdAt,originalDeadline,participants},replayed,serverNow}`. OTP development fields never appear on production/customer booking DTOs. Admin contact phone is not a verified customer identity.

Errors retain the existing `{error:{code,fields?,latest?,retryAfterSeconds?}}` convention. Shape/field failures use existing 400 semantics; missing/expired auth 401; origin/CSRF 403; foreign booking 404; capacity/cutoff/session/version/idempotency conflicts 409; throttling 429; temporary database/provider failure 503. New stable codes: `OTP_INVALID`, `OTP_EXPIRED`, `OTP_CONSUMED`, `OTP_THROTTLED`, `CAPACITY_UNAVAILABLE`, `BOOKING_CLOSED`, `SESSION_CHANGED`, `IDEMPOTENCY_CONFLICT`, `IDENTITY_MISMATCH`, `TEMPORARILY_UNAVAILABLE`. Never put private latest-booking facts in customer conflicts for a foreign ID.

## Explicit linking and recovery

An admin-entered contact remains unverified and cannot sign in as a customer. After independent OTP/name completion, admin linking requires the customer's verified phone to equal the immutable booking contact phone. Linking changes ownership/audit/version only, not names, quantity, price, deadline or availability. Already-owned bookings cannot transfer owners through this endpoint. A customer cannot list or claim unowned bookings by phone. Same-number sign-in recovers access. Lost-number cases show club-assistance guidance; no automatic reassignment is implemented. Superseded in part on 2026-10-11 (03-DECISIONS, Akun): a signed-in member can move their own account to a new number after confirming an OTP sent to it.
