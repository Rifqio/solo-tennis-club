# 02-00 Backend foundation evidence

Date: 2026-10-09. Implemented with the user-requested skills, without GSD.

Authentication, public schedule/details, admin sessions, classes and reference management follow router → controller → service → repository. Queries live in repositories; services retain validation and operation ordering. Auth session/throttle/provisioning helpers use the auth repository. All repositories inside an operation share its transaction handle through `server/database/transaction.ts`.

API paths, status/replay behavior, validation codes, stale-version payloads, cookies, no-store, origin/CSRF checks, password timing protection and reserved development-admin rejection are preserved. Retry-After moved from the sign-in route to the centralized error handler for the same 429 response.

Fresh verification after the final source changes:

- `npm run build`: passed, including Prisma 7.10 generation, TypeScript and Vite.
- `npm run lint`: passed with the new layer rules.
- `npm run test`: 26 files / 137 tests passed in 22.39 seconds. Existing integration tests cover authentication, strict inputs, replay, duplicate names, stale edits, ordered coaches, rollback, capacity guards and persistence.
- Layer rule smoke check: a direct `database.adminAccount.findMany()` passed to ESLint via stdin as a service was rejected by `no-restricted-syntax`, exit 1 as expected. No source file was written.
- `git diff --check`: passed.

No browser automation, migration, new package, provider call, real local database change or deployment was performed. This backend evidence does not establish new UI acceptance. Phase 2 customer/booking requirements remain unaccepted.
