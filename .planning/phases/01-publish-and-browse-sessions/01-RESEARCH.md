# Phase 1: Publish and Browse Sessions - Research

**Researched:** 2026-10-08
**Scope:** 14 approved Phase 1 requirements; all D-01 through D-22 in `01-CONTEXT.md` apply.
**Confidence:** MEDIUM. Primary documentation and the starter were inspected; this architecture has not been implemented or deployed.

## Selected Constraints and Recommendation

The user selected **SQLite with Prisma** and excluded Supabase. This supersedes the earlier PostgreSQL/Supabase advice. Preserve the React/TypeScript/Vite starter unless a concrete requirement justifies replacement. Recommend a small Node application API serving the built frontend and handling database access on the same server. Express is a reasonable minimal server candidate, not a user-approved dependency. Framework and hosting selection remain planning choices. [Express API](https://expressjs.com/en/5x/api/).

SQLite's official guidance supports small web applications behind an application-owned server. This is a fit inference for one club, not a measured traffic guarantee. Use one initial application instance, persistent local disk, migrations, and backups. Avoid ephemeral function filesystems and a shared SQLite file across hosts. WAL requires processes on the same host and permits readers alongside a single writer. [Appropriate uses](https://www.sqlite.org/whentouse.html), [WAL](https://www.sqlite.org/wal.html).

SQLite handles one write transaction at a time. Keep writes short, make related changes atomic, and handle contention with a bounded retry strategy verified against the actual adapter. An ORM does not establish availability correctness. [SQLite transactions](https://www.sqlite.org/lang_transaction.html).

## Existing Workspace

- `src/App.tsx` is a starter counter, with no tennis routes, persistence, auth, translations, or business components.
- Existing scripts are `dev`, `build`, `lint`, and `preview`; no test or migration scripts exist.
- Manifest ranges include React `^19.2.8`, Vite `^8.3.0`, TypeScript `~6.0.2`. Researcher inventory reported installed React/DOM 19.3.0, Vite 8.3.3, TypeScript 6.0.3, and Node 24.14.1; recheck during setup rather than assuming manifest ranges are installed versions.
- No database schema or Prisma installation exists. SQLite does not require the unavailable local Docker daemon. No hosted credentials are needed for local database tests.
- UI-phase update, 2026-10-08: the user selected heavily customized shadcn/ui with Tailwind and delegated the setup preset. Official preset `b2YOAa` was initialized (Radix/Nova, Inter, green baseline). Installed shadcn 4.21.4, Tailwind 4.3.3, radix-ui 1.7.0, lucide-react 1.52.0, Inter 5.3.0 and cn 0.4.0; CLI info reports zero installed shadcn UI components. Build/lint passed after setup. This changes the earlier absence of a component foundation, not the absence of business routes/auth/database. The final component treatment is governed by UI-SPEC, not preset defaults.
- The foreground researcher was interrupted before producing a file after the database change; the orchestrator completed this bounded synthesis from primary sources and recorded local findings. No independent research-completion verdict is claimed.

## Prisma Setup and Version Boundary

Use a **pinned, compatible Prisma release**, with matching CLI/client packages and its documented SQLite driver adapter. Recommend evaluating the Prisma 7 line for the initial setup because the opened versioned SQLite documentation explicitly covers local files and `@prisma/adapter-better-sqlite3`. This is a version recommendation, not an installation or a locked patch version. Verify package engines, peer dependencies, adapter support, native Windows binaries, and repository provenance before installing. [Prisma 7 SQLite](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite), [system requirements](https://www.prisma.io/docs/orm/v7/reference/system-requirements).

Important documentation trap: unversioned transaction/migration URLs now redirect to Prisma 8 APIs. Do not mix their `db.transaction` / migration commands with Prisma 7's `$transaction` / `migrate` workflow. Keep examples and commands aligned with the exact selected major. The opened Prisma 8 migration page labels SQLite migration support experimental. [Prisma 8 migration page](https://www.prisma.io/docs/orm/migrations/applying-a-migration).

For Prisma 7, configure the SQLite provider in the schema, the datasource URL in `prisma.config.ts`, and the documented adapter when constructing the server-only client. Keep CLI and runtime URLs pointing to the same resolved database file; make working-directory/path behavior explicit. Choose one DateTime storage format and verify round trips rather than mixing native-driver and adapter formats. [SQLite configuration](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite).

Commit schema and migration history. Apply migrations to a real local SQLite file, generate the client, seed explicit development fixtures, and demonstrate write/read persistence across server restart. For Prisma 7, development uses `prisma migrate dev`; production applies committed migrations with `prisma migrate deploy`. Generating types or running `db push` alone does not verify the migration path. [Prisma 7 migration workflow](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production).

## Application and Data Boundaries

- Browser owns presentation, date selection, translation preference, and the admin guided-form state. Prisma and database credentials/paths remain server-only.
- Public API returns an explicit session DTO and club information; it excludes admin account details and all later customer, roster, and proof data.
- Every admin read/write requires a valid server-authenticated session and admin authority; hiding navigation is insufficient.
- Persistence modules expose small session/reference-data operations. Business services own validation, publication, defaults, capacity, and later reservations. Keep SQL/Prisma calls out of components.
- Recommend server cookie sessions, fixed setup-provisioned email/password admin accounts, login throttling, logout/revocation, CSRF protection for mutations, and production HTTPS. Select a maintained authentication/session implementation during planning; customer OTP and public signup are later and must not grant admin access.
- Provisioning/recovery should be a trusted setup command, with no shipped default password or in-app invitation feature. Passwords require a modern password hash, not encryption/plaintext; use a documented implementation and avoid exposing secrets in logs. [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

### Initial relational model

Suggested entities: `AdminAccount`, server auth sessions, `Coach`, `Venue`, `Level`, `Class`, `ClassCoach`, `Session`, and `SessionCoach`. Stable session IDs are later booking references. These are proposed names, not a delivered schema.

Class defaults include duration, level, IDR price per place, min/max, venue, and one or more coaches. Creating a dated session snapshots defaults into session-owned values and permits overrides. Changing class defaults must not mutate existing sessions. Session save atomically writes scalar fields and coach links after full validation, then becomes publicly visible immediately. No draft state.

Validate positive duration, valid date/time, integer IDR prices within supported bounds, min/max consistency, valid referenced entities, and at least one unique coach. Use foreign keys and database constraints where possible, plus transactional checks for multi-row rules. Reject malformed input and missing references without partially published sessions. Prevent reference deletion from damaging existing sessions; archival/restrict behavior is a planning choice, not an invitation to add a new product workflow.

Add a version field or equivalent optimistic concurrency check for edits, so concurrent administrators cannot silently overwrite changes. Later occupied-place counts must be checked atomically with capacity edits. In Phase 1 no actual bookings exist: genuine sessions initially expose their full capacity, while full/nearly-full/cancelled presentation can be verified with clearly isolated test fixtures. Do not add manual public attendance counters or fake production bookings.

### Availability, dates, and localization

Use stable status codes plus localized labels. Apply cancelled precedence; zero remaining means full; positive remaining/max at most 0.25 means nearly full. Test odd capacities and exact boundaries. Do not round into a different policy.

Use `Asia/Jakarta` / WIB (UTC+7) for club-day boundaries and display, regardless of browser/server timezone. Persist unambiguous instants and query a half-open club-day interval. Price is integer IDR; Indonesian is the first-visit language, with an explicit remembered English switch. Language selection must not alter the timezone or database state.

### Future reservation seam

Later booking commands must check current session state, occupied places, and requested group size inside one short transaction, then insert all participant places or none. Prisma 7 supports nested writes and interactive `$transaction`; every query inside the callback must use its transaction client. Do not blindly issue a raw `BEGIN IMMEDIATE` inside an already-open Prisma transaction. Verify adapter behavior with multiple independent connections, retries, and atomic conditional writes when implementing Phase 2. [Prisma 7 transactions](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions), [SQLite transactions](https://www.sqlite.org/lang_transaction.html).

Keep the five-hour original deadline, submitted-proof protection, rejection correction window, and pending-inclusive minimum policy intact. Do not implement booking/OTP/payment/recurrence/cancellation commands in Phase 1. A later move to PostgreSQL would require reviewed schema/data migrations and concurrency tests; Prisma does not make it a connection-string-only change.

## UI Contract and Common Pitfalls

Read `01-CONTEXT.md`, `.planning/UI-BRIEF.md`, and `PRODUCT.md`. Preserve schedule-first entry, today default with next-date shortcut, compact rows, context-preserving detail bottom sheet, and separate reference management. Guided admin creation ends with review and a complete valid save. Bottom navigation contains working destinations only.

Impeccable's Community matchday brief remains the direction; Antislop core/UI/mobile rules apply during planning/building. A formal `01-UI-SPEC.md` is still required by the active manual planning gate. No UI/browser validation pass has occurred. Do not recreate the AYO marketplace or generate a mockup against the code-led preference.

Main failure modes: browser-only admin checks; client-controlled roles; ephemeral database storage; mismatched migration/runtime database paths; partial coach writes; propagated class defaults; device-local dates; rounded nearly-full thresholds; mixed Prisma major APIs; and memory-only authentication sessions that lose predictable revocation on restart.

Use SQLite's backup API or another documented consistent backup method, and prove restore to a fresh database. Copying only the live main file in WAL mode can omit committed data. Real club content is still missing; test fixtures must be labeled and excluded from production claims. [SQLite backup API](https://www.sqlite.org/backup.html).

## Validation Architecture

There is no existing test infrastructure. Establish Vitest (pure logic plus API/database integration) and Playwright (browser workflows) after verifying compatible package releases. Use a temporary **file-backed SQLite database with the selected Prisma adapter** for integration tests, apply the real migrations, provision a test admin, and clean up only resolved test-owned paths. Do not substitute a mock/in-memory repository for persistence acceptance.

Proposed scripts, to be created during setup: `npm run test -- --run` for logic/API/database checks; `npm run test:e2e` for Playwright. Existing checks: `npm run lint` and `npm run build`. These proposed scripts do not run yet. Test startup must resolve absolute database paths and start API plus frontend against the same disposable database. No hosted provider/Docker prerequisite.

| Requirement | Meaningful verification |
|-------------|-------------------------|
| DISC-01 | Signed-out visitor opens genuine club-info route without auth redirect. |
| DISC-02 | Admin-published session appears to a separate signed-out browser; persists after API restart. |
| DISC-03 | Date strip/picker and empty-date shortcut query correct WIB date and preserve selection. |
| DISC-04 | Details display every required field and all coaches; closing sheet preserves schedule context. |
| DISC-05 | Available, nearly-full boundary/odd-capacity, full, and cancelled precedence fixtures; text labels in both languages. |
| AUTH-06 | Valid fixed admin can manage; anonymous/non-admin requests denied directly at API; logout/revocation denies reuse. |
| SCHED-01 | Class create/edit persists defaults; editing defaults changes only future sessions. |
| SCHED-02 | Guided valid save creates one public dated session; invalid/stale edit rejected without partial changes. |
| SCHED-04 | Coach management persists; referenced-session integrity survives denied unsafe deletion. |
| SCHED-05 | Venue management persists and is visible in public session details. |
| SCHED-06 | Level management persists and is selectable in class/session forms. |
| SCHED-07 | Integer IDR price saves/round-trips and displays correctly; malformed/negative/out-of-range values rejected. |
| SCHED-08 | Min/max validation is server-enforced; invalid reductions fail atomically. Future booking-aware case belongs to Phase 2. |
| SCHED-09 | Required venue and multiple unique coaches save atomically; missing/invalid references leave no partial session. |

Also test migrations on a clean file, repeat-safe fixtures/provisioning, restart durability, backup/restore, no private fields in public responses, and malicious strings rendered as text. Browser coverage includes Indonesian/English, mobile/intermediate/desktop widths, keyboard/focus/scroll for the sheet, loading/error/empty states, and the create-to-public-view tracer. Antislop design judgments and comfortable one-handed use need manual review on a phone in addition to automated browser checks.

No tests, schema migration, application build, or live admin login have been run for this research. `01-VALIDATION.md` is a draft strategy until executable plans supply task IDs and test files.
