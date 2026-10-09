# 02-01 Customer access evidence

Date: 2026-10-09. Source implemented and non-browser verified. Manual UI acceptance pending; real AUTH-02 delivery remains a release prerequisite.

Customer access is available under Account at `/customer/sign-in`. Phone entry covers sign-in and account creation through one code flow. New numbers require name completion; existing numbers retain their identity/name. Customer sessions are isolated from admins. Access alone creates no booking or capacity hold.

Backend files follow controller/service/repository conventions in `server/features/customer/auth`. The committed `20261009130000_customer_otp` migration adds Customer, CustomerSession, OtpChallenge and OtpAttempt. `libphonenumber-js` 1.13.15 is pinned; shared normalization defaults to Indonesia and stores E.164. The [official parser documentation](https://github.com/catamphetamine/libphonenumber-js) was checked before installation. The parser and customer access page are lazy-loaded with the customer route; public schedule startup does not import the parser.

The development API returns `development: true` and `debugCode`, as explicitly authorized. Codes have keyed digests in SQLite and an expiring memory-only mock store. Six digits, five-minute expiry, five checks, 30-second resend, five phone requests/hour, twenty IP requests/hour and one hundred IP checks/hour are enforced. Invalid checks commit their counter before returning an error. No universal code or automatic verification exists. Production rejects an explicit mock driver; the default production/disabled customer routes return 503 without a code. Real provider delivery is not implemented.

HttpOnly flow cookies bind challenges and short-lived one-use name proofs. Customer session tokens are hashed and expire after fourteen days. Verification and proof completion are atomic; unique-phone upsert preserves the winning identity. Origin/JSON guards apply to mutations, profile/sign-out use CSRF, and private responses use no-store. Write ownership precedes throttle/claim reads; bounded whole-transaction retries handle SQLite P1008/P2034, with a safe 503 on exhaustion. Fresh server time keeps client countdowns honest after delayed operations.

The browser can recover code/name steps through flow-bound GET endpoints. It stores no OTP, customer identity, token or CSRF in localStorage/sessionStorage. Resend can use a bound challenge ID without redisclosing the raw phone. Public session details can open access and return to the selected date/session. Quantity and participant-name preservation becomes an integration requirement when 02-02 adds that draft. Customer success is not represented as reservation success.

ID/EN screens reuse Jalur Lawu fields, buttons, signboard, device themes and reduced-motion behavior. Step feedback lasts 200ms; focus moves to the heading and validation focuses the affected input. Actions remain in document flow. Error/network responses retain inputs; failed sign-out keeps the session visible. See [UI review](02-01-UI-REVIEW.md) and [manual checks](02-01-MANUAL-CHECKS.md).

Fresh verification after the final semantic source change:

- `npm run build`: passed, including Prisma generation, TypeScript and production Vite. Customer route is a separate lazy chunk; its parser metadata stays off the main startup path.
- `npm run lint`: passed, including controller/service/repository boundary checks.
- `npm run test`: 28 files / 161 tests passed in 20.67 seconds. New cases cover normalization, safe return intent, new/known access, strict boundaries, challenge/proof recovery, role isolation, production rejection, exact expiry, persisted attempts, resend, budgets, one-use races, independent SQLite clients, inactive identities, restart, backup/restore and delayed server-clock responses.
- Browser specs authored in `tests/e2e/customer-access.spec.ts` and type checked with the build; never executed under the standing browser opt-out.
- Local pre-migration backup saved to `backups/lafu-20261009-144158-WIB.db`. The identified dev server was briefly stopped to release SQLite, the additive migration applied, then the server restarted on port 3000. `prisma migrate status` reports up to date.
- Read-only comparison against the backup confirmed existing admin IDs, catalog records, session fields and ordered coach links were preserved. No mock customer was seeded into the real local database (zero customer rows at the verification point).
- Local HTTP smoke: customer page 200, signed-out customer session 401, missing flow challenge 404.
- `git diff --check`: passed.

The [OpenAPI contract](02-01-OPENAPI.yaml) records the implemented endpoints, including flow-bound reload recovery and resend-by-challenge. Requirement checkboxes remain unaccepted until their manual/release evidence exists. Next implementation: 02-02 capacity-safe reservations.
