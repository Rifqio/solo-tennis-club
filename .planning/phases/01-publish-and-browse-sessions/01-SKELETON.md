# Walking Skeleton — Lafu

**Phase:** 1
**Generated:** 2026-10-08 (draft); reconciled during plan-phase on 2026-10-08
**Status:** Approved. The user selected `express-spa` verbatim at Plan 01-01 Task 1 during execution on 2026-10-08. The framework, API, fixed-admin authentication, persistent single-host baseline and persisted data contract below are confirmed.

## Capability Proven End-to-End

A provisioned administrator signs in and publishes one dated tennis session through the authenticated application API into a file-backed SQLite database built from committed Prisma migrations, and a separate signed-out visitor sees that session on the public phone schedule in Indonesian, including after the application server restarts.

Delivery: the read path (migrations, server, public API, schedule page, Playwright) is the tracer of plan 01-01; the authenticated write path, provisioning, and restart durability complete the skeleton in plan 01-02. Every later Phase 1 plan expands from these two proven slices.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite 8 single-page app with React Router (`createBrowserRouter` data router) and one Express 5 Node process | Adopts the authorized starter and the initialized Tailwind/shadcn foundation. Express owns `/api/*`; in development it mounts Vite in middleware mode (one origin, one port); in production it serves the built `dist/` with an SPA fallback. The data router is required for unsaved-change blocking in admin forms. |
| Data layer | Prisma ORM 7.10.x (`prisma-client` generator, output `server/generated/prisma`, gitignored) with `@prisma/adapter-better-sqlite3` 7.10.x and one server-owned SQLite file | Implements D-21/D-22. `prisma.config.ts` and the runtime client resolve the same absolute file through `server/config/database-file.ts` (default `data/lafu.db`, override `LAFU_DATABASE_FILE`). WAL journal mode and a 5000 ms busy timeout. Committed migrations; `migrate dev` in development, `migrate deploy` for clean test and production files. No Prisma 8 APIs. |
| Persisted data contract | String `cuid` IDs; UTC instants stored by the adapter's default ISO 8601 format; integer IDR amounts; `version` integers for optimistic edits; nullable unique `createRequestId` for idempotent creates | Stable session IDs become the Phase 2 booking reference. Changing ID or timestamp format after production data exists requires a data migration, so this is the one-way door the plan 01-01 checkpoint confirms. |
| Dated-session history | Sessions own copied values (level, venue, duration, price, minimum, maximum, ordered coaches) referencing reference records by ID; class default edits never touch existing sessions; reference names are identity facts shown at their current value | Reconciled from the draft's name-string snapshots: D-06/D-07 lock default values, not reference names, and a corrected coach or venue name should appear everywhere. References have no delete operation in Phase 1 and foreign keys restrict deletion. Booking-time price snapshots belong to Phase 2. |
| Auth | Fixed admin accounts created only by the trusted `npm run admin:provision` command; Node `crypto.scrypt` hashes (N=2^17, r=8, p=1); persisted opaque cookie sessions (token stored as SHA-256 hash, HttpOnly, SameSite=Lax, Secure in production, 14-day absolute lifetime); session-bound CSRF token sent as `X-CSRF-Token`; same-origin and JSON-only mutation checks; database-backed sign-in throttling | Implements D-14/D-15/AUTH-06 without public signup, invitations, a shipped default password, or a hosted identity dependency. Re-running provisioning rotates the password and revokes sessions (recovery path). |
| API | Same-origin internal JSON API: `/api/public/*` unauthenticated with allowlisted DTOs; `/api/admin/*` behind server session + CSRF. Contracts are TypeScript types in `shared/api/*`; Zod validates request boundaries on the server only; shared pure rule functions validate the same limits in the browser | Keeps public reads open, protects every management read and write on the server, keeps Zod and Prisma out of the browser bundle, and gives later phases typed seams. Error responses carry stable codes that the browser localizes. |
| Capacity seam | `server/features/capacity/occupancy.ts` exposes `getOccupiedPlaceCounts(db, sessionIds)`; Phase 1 has no booking records so every count is 0; capacity edits call it inside the save transaction | Remaining places = maximum minus occupied. Phase 2 counts booking places here, inside the same short transaction, without changing callers. |
| i18n | In-house typed message modules per feature (`{ id, en }`), `I18nProvider` with Indonesian default and remembered choice in `localStorage` key `lafu.language`; `Intl` formatting fixed to `Asia/Jakarta` and IDR | Implements D-11/D-12/D-13 without a new dependency; per-feature modules let parallel plans add copy without shared-file conflicts. |
| UI foundation | shadcn/Radix primitives wrapped in `src/components/ui/*`, each customized to the UI-SPEC tokens; Tailwind 4 with the locked Community matchday palette | Implements D-23/D-24. Antislop Delivery Gate evidence is required before each UI plan delivers. |
| Testing | Vitest 5 (node environment) for unit, API, and file-backed SQLite integration tests through real migrations; Playwright 1.64 against the production build served by a disposable-database e2e server | No mocks stand in for persistence acceptance; route-mocked fixtures are used only for UI states that cannot exist without later-phase bookings. |
| Deployment target | One Node process behind HTTPS on a host with persistent local disk; Phase 1 proves `npm run dev`, `npm run build`, `npm run start`, backup, and restore locally | No hosted deployment was requested. A single process matches SQLite's one-host ownership model; the database and backups live outside `dist/` and public assets. |
| Directory layout | `src/features/*` browser slices, `src/components/ui/*` wrappers, `src/i18n/*`, `server/features/*` API/service slices, `server/config`, `server/http`, `shared/*` browser-safe contracts and rules, `prisma/*`, `scripts/*` trusted operations, `tests/{unit,integration,e2e,support}` | Feature folders let parallel plans own disjoint files while keeping database and auth code server-only. |
| Date and money representation | UTC instants in persistence, `Asia/Jakarta` (fixed UTC+7) half-open club-day intervals for queries and display, server-supplied `today`, integer IDR | Implements D-11/D-12 and prevents browser or server timezone drift and decimal currency loss. |

## Stack Touched in Phase 1

- [ ] Project scaffold: adopt and track the React/Vite/Tailwind/shadcn setup; add Express, pinned Prisma 7, scripts for dev/build/start/lint/test/test:e2e/db (plan 01-01).
- [ ] Routing: signed-out `/` (plan 01-01) and `/club` (plan 01-03); `/admin/sign-in` and protected admin destinations (plans 01-04, 01-08, 01-09, 01-10).
- [ ] Database: real migration applied to a file-backed SQLite database; signed-out read (plan 01-01); authenticated write (plan 01-02); restart durability (plans 01-01, 01-02); backup and restore (plan 01-06).
- [ ] UI: public schedule interaction wired to the API (plan 01-01), expanded through plans 01-03, 01-05, 01-07; guided admin publication through the API (plan 01-10).
- [ ] Deployment: documented local development and production-mode commands, restart durability, backup and restore proof (plans 01-02, 01-06).

## Out of Scope (Deferred to Later Slices)

- Customer accounts, OTP, reservations, participant rosters, group names, and the five-hour hold are Phase 2.
- Payment instructions, proof upload and review, outside-payment recording, and payment states are Phase 3.
- Booking and session cancellation commands and refund records are Phase 4. Phase 1 only renders the cancelled state for records whose status is already cancelled (sample data and route-mocked fixtures).
- Recurring schedule generation and automatic minimum-participant cutoff checks are Phase 5.
- Reference record deletion or archival is not offered in Phase 1; records persist and foreign keys restrict deletion.
- A hosted deployment is not requested; a compatible host must provide persistent disk, backups, one SQLite owner process, and HTTPS.
- Real club descriptions, logo, photos, contact details, coach/venue/level records, prices, and sessions remain operator-supplied content. Production starts empty except for the confirmed text identity "Lawu Fun Tennis Club (Lafu)".

## Subsequent Slice Plan

Each later phase adds its vertical slice behind the application API and reuses stable session IDs, the occupancy seam, and the public/private boundary without altering these decisions:

- Phase 2: atomic customer/admin place reservations (counted through `getOccupiedPlaceCounts` inside the save transaction) and daily rosters.
- Phase 3: private payment instructions, evidence upload, and manual verification.
- Phase 4: admin booking adjustments, cancellations, and manual refund obligations.
- Phase 5: recurring session generation, minimum-cutoff automation, and integrated device/language acceptance.
