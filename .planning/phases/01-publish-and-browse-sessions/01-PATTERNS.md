# Phase 1: Publish and Browse Sessions - Pattern Map

**Mapped:** 2026-10-08
**Files classified:** 36 proposed file slots
**Qualified analogs found:** 0 / 36

## Scope and Evidence

Read AGENTS.md, 01-CONTEXT.md, 01-RESEARCH.md, and 01-UI-SPEC.md. This is a planning-workflow artifact; application files were not changed. No project-local `.agents/skills/` or `.codex/skills/` entries were found. Antislop core, UI, and mobile-layout skill instructions were consulted under the existing during-mode session choice.

Upstream names only the starter and Prisma configuration explicitly. Most implementation paths below are **proposed planner file slots**, inferred from required responsibilities; they do not lock a framework, router, auth library, directory convention, or exact filenames. Split/group slots when writing plans, retaining responsibility coverage. Express, Vitest, Playwright, and Prisma 7 are research recommendations requiring compatibility selection.

`git ls-files` returned no application, server, Prisma, configuration, or test source. The React/Vite starter and initialized Tailwind/shadcn setup exist on disk but are untracked. The only tracked CSS is a temporary setup baseline, which is not a suitable implementation analog. Under the tracked-source gate, no starter path qualifies as a copy-from assignment. No concrete application excerpt can honestly be supplied. Do not interpret missing excerpts as permission to invent existing conventions or to copy an install/runtime mirror.

## File Classification

All match qualities are **NEW**: no tracked source with the required role/data flow exists.

| New/Modified File Slot | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `package.json` | config | batch | None | NEW |
| `vite.config.ts` | config | request-response | None | NEW |
| `tsconfig*.json` | config | transform | None | NEW |
| `components.json` | config | batch | None | NEW |
| `src/main.tsx` | provider | event-driven | None | NEW |
| `src/App.tsx` | route | event-driven | None | NEW |
| `src/index.css` | config | transform | None | NEW |
| `src/lib/utils.ts` | utility | transform | None | NEW |
| `src/components/ui/*` | component | event-driven | None | NEW |
| `src/components/PublicLayout.tsx` | component | event-driven | None | NEW |
| `src/components/AdminLayout.tsx` | component | event-driven | None | NEW |
| `src/pages/SchedulePage.tsx` | component | request-response | None | NEW |
| `src/components/SessionSummary.tsx` | component | transform | None | NEW |
| `src/components/SessionDetailSheet.tsx` | component | request-response | None | NEW |
| `src/pages/ClubPage.tsx` | component | request-response | None | NEW |
| `src/pages/admin/SignInPage.tsx` | component | request-response | None | NEW |
| `src/pages/admin/SessionsPage.tsx` | component | CRUD | None | NEW |
| `src/pages/admin/SessionFormPage.tsx` | component | CRUD, event-driven | None | NEW |
| `src/pages/admin/ClassesPage.tsx` | component | CRUD | None | NEW |
| `src/pages/admin/ManagePage.tsx` | component | event-driven | None | NEW |
| `src/pages/admin/ReferencePage.tsx` | component | CRUD | None | NEW |
| `src/lib/api.ts` | service | request-response | None | NEW |
| `src/i18n/*` | provider, utility | transform, event-driven | None | NEW |
| `shared/session.ts` | model, utility | transform | None | NEW |
| `server/index.ts` | controller | request-response, file-I/O | None | NEW |
| `server/db.ts` | service | CRUD | None | NEW |
| `server/auth/*` | middleware, service | request-response, CRUD | None | NEW |
| `server/routes/*` | route | request-response | None | NEW |
| `server/services/*` | service | CRUD | None | NEW |
| `server/validation/*` | utility | transform | None | NEW |
| `prisma/schema.prisma` | model | CRUD | None | NEW |
| `prisma.config.ts` | config | file-I/O | None | NEW |
| `prisma/migrations/*` | migration | batch | None | NEW |
| `scripts/*` | utility | batch, file-I/O | None | NEW |
| `tests/unit/*`, `tests/integration/*` | test | transform, CRUD | None | NEW |
| `playwright.config.ts`, `tests/e2e/*` | config, test | request-response, event-driven | None | NEW |

`ReferencePage.tsx` represents separate coach, venue, and level destinations/forms, not inline reference creation. `ClassesPage.tsx` includes class list/create/edit responsibility; planner may split it. `server/routes/*` includes public club/schedule/detail endpoints and protected sessions/classes/reference endpoints. `server/services/*` includes DTO mapping, publication, defaults, reference operations, and concurrency validation. `scripts/*` includes trusted admin provisioning/recovery, development seed, and backup/restore. Test/config globs are responsibility groups rather than a claim that only one physical file is needed.

## Pattern Assignments

### Build, entry, and foundation slots

**Applies to:** package/build/TypeScript/components configuration, entry/root, CSS, class-name utility, and UI wrappers.

**Analog:** None. Preserve the existing React/TypeScript/Vite and initialized shadcn/Tailwind foundation where compatible, but inspect and adopt its untracked files explicitly during execution. Establish tracked source before later phases use it as an analog. Do not copy setup colors, starter illustration/counter, or temporary baselines into the product.

**Reference:** CONTEXT D-23/D-24; RESEARCH Existing Workspace; UI-SPEC component inventory, tokens, and registry safety. Install only needed official primitives and customize every used wrapper. UI-SPEC proposes button/input/select/checkbox/dialog/alert-dialog/field behavior; zero installed components is the current baseline.

### Public presentation slots

**Applies to:** PublicLayout, SchedulePage, SessionSummary, SessionDetailSheet, ClubPage.

**Analog:** None. Establish semantic list/button/dialog patterns from UI-SPEC Interaction and Data-State Behavior. Schedule-first `/`, club `/club`, today in WIB, explicit seven-date controls/date picker, chronological summaries, and exact text statuses are required. Row activation opens a context-preserving accessible bottom sheet; no detail-route substitution. Full and cancelled records remain readable.

**Validation/error pattern to establish:** Distinct initial loading, selected-date loading, truly empty, and failed loads. Discard stale date responses. Missing detail facts remain unavailable rather than zero or fabricated. Close/retry remains usable during failures. Public DTO supplies only approved facts. Genuine club content is a prerequisite, not invented fixture copy.

### Admin presentation slots

**Applies to:** AdminLayout, SignInPage, SessionsPage, SessionFormPage, ClassesPage, ManagePage, ReferencePage.

**Analog:** None. Establish server-backed auth state and phone navigation with Sessions, Classes, Manage only. Separate coach/venue/level destinations must work before session creation.

**Core pattern to establish:** Four guided session groups: class/time; venue/coaches; price/limits; review. Retain values through steps, language changes, and same-tab reference management. Class selection preloads editable defaults; replacing overrides requires confirmation. Final save alone publishes. Review allows contextual edits and shows all coaches. Classes own defaults; sessions own immutable-by-default snapshots.

**Validation/error pattern to establish:** Focus first invalid field, associate textual errors, retain failed/stale form entries, prevent duplicate submission, reconcile ambiguous create outcomes before retry, and reauthenticate recoverably. Success requires server confirmation and a separate public-view check. A client route guard is presentation only and cannot authorize API access.

### Browser services, localization, and shared domain slots

**Applies to:** api service, i18n provider/dictionaries, shared session model/formatting utilities.

**Analog:** None. Define typed public/private contracts and one explicit request/error mapping after selecting the API stack. Keep schema validation and Prisma imports out of browser code. Shared domain files must be safe to import into the browser.

**Core pattern to establish:** First-visit Indonesian; remembered English switch; stable date/open sheet/form state across language changes. Format calendar dates and 24-hour time with `Asia/Jakarta`, integer IDR prices, and readable units. Status precedence is cancelled, then zero remaining/full, then positive remaining/max <= .25/nearly full, then available. Minimum participants is a separate factual count. Do not round the threshold or invent bookings to exercise it.

### Server, persistence, auth, and validation slots

**Applies to:** server entry, db client, auth, public/protected routes, services, validation, Prisma schema/config/migrations.

**Analog:** None. Select and pin the actual server/auth/Prisma versions before copying upstream documentation examples. RESEARCH sections Prisma Setup and Version Boundary, Application and Data Boundaries, and Initial relational model are authoritative planning guidance, not existing implementation.

**Imports/guard pattern to establish:** Server-only Prisma client with selected SQLite adapter; shared request/response types permitted without leaking server imports. Require a valid persisted server session and admin authority on every admin read/write. Fixed accounts come from trusted setup, hashed passwords, session revocation/logout, CSRF protection for mutations, login throttling, and production HTTPS.

**Core persistence pattern to establish:** Proposed AdminAccount/auth-session, Coach, Venue, Level, Class/ClassCoach, Session/SessionCoach models. One required venue, at least one unique coach, editable copied class defaults, stable session IDs, and optimistic stale-edit handling. Validate references and save a complete session plus coach assignments atomically. Keep database transactions short and use only the transaction client inside them. Preserve existing session values when class defaults change.

**Validation/error pattern to establish:** Validate date/time/duration, integer IDR bounds, min/max, referenced records, and unique nonempty coaches on the server. Enforce referential integrity and safe capacity edits. Distinguish denied access, malformed input, stale edit, missing record, and operational failure. Do not log secrets or return private ORM objects. API/error shapes and exact operating ranges remain planner decisions.

**Migration pattern to establish:** Matching pinned Prisma CLI/client/adapter; one resolved database file for CLI/runtime; real committed migrations; tested date-storage round trips. Align all commands/examples with the selected Prisma major. Do not mix Prisma 7 `$transaction`/migrate examples with Prisma 8 APIs.

### Setup and verification slots

**Applies to:** scripts, unit/integration tests, browser tests and runner configuration.

**Analog:** None. No test infrastructure exists. RESEARCH Validation Architecture and 01-VALIDATION.md provide the strategy; establish executable scripts only after compatibility selection.

**Testing pattern to establish:** Pure tests for WIB boundaries, status precedence and odd-capacity .25 thresholds, formatting and validation. Integration tests use a temporary file-backed SQLite database, real migrations, the selected adapter, and provisioned test admin. Verify auth directly at API, atomic saves, stale edits, class-snapshot behavior, denied unsafe reference changes, and restart durability. Browser tests cover the admin-create-to-signed-out-public tracer, both languages, accessible sheet dismissal/focus, and distinct empty/loading/error states. Fixtures are isolated and labeled; do not seed fake production occupancy.

**Operations pattern to establish:** Trusted repeat-safe account provisioning/recovery without shipped default passwords. Resolve database/backup locations explicitly; keep secrets/databases/backups outside public assets. Verify restore against the real schema. Clean up only resolved test-owned paths. Persistent disk and one initial application instance are research recommendations to settle in plans.

## Shared Patterns

### Public/private boundary

No code source available. Apply explicit public DTO allowlisting to public routes, API types, summaries, and sheets. Admin/customer/participant/payment data stays private. Public browsing has no auth barrier; admin route visibility never substitutes for server authorization.

### Atomicity and later capacity seam

No code source available. Apply transactional validation/publication and future-only class snapshots to services/schema/tests. Phase 1 must retain space for later occupied-place counts without implementing reservation/payment/OTP/recurrence/cancellation commands. Preserve five-hour original holds, proof-review protection, original-deadline correction, atomic groups, and pending-inclusive minimum policy.

### Bilingual state and mobile accessibility

No code source available. Apply UI-SPEC copy/tokens and state contracts across every public/admin destination. Brand palette is `#164D45`, `#FFFFFF`, `#1D252C`, `#EDF4F1`. Use textual statuses, 48px controls, safe-area reservation, wrapped long names, visible focus, and reduced motion. Bottom navigation must not cover final fields/actions; modal background is inert and focus returns to its triggering row. Existing UI-SPEC dials and design read govern implementation rather than new mapper aesthetic decisions.

### Evidence boundary

This artifact validates pattern provenance and scope coverage only. No business UI, authentication, persistence, migration, or end-to-end workflow pass is claimed. Executor must run build/lint, real database/API/browser acceptance, and personally run Antislop Delivery Gate plus UI/mobile checklists with concrete evidence before UI delivery.

## No Analog Found

All 36 classified slots have no qualified analog. The classification table is the complete no-analog inventory. Reason: no application/config/test source is git-tracked; tracked documents and a temporary CSS baseline cannot establish business code conventions. Use phase research and UI-SPEC to establish NEW patterns, then make the selected implementation tracked so later mapping can cite real paths and excerpts.

## Metadata

**Analog search scope:** repository-wide git index; working-tree file inventory excluding dependencies; phase context/research/UI contract; project skills directories.
**Files scanned:** complete tracked index at mapping time; working-tree source/config inventory; four phase/project inputs and three installed Antislop skill indexes. The shared index may change during parallel planning.
**Exact analogs:** 0. **Role-match analogs:** 0. **No analog:** 36 proposed slots.
**Pattern extraction date:** 2026-10-08.
**Tool boundary:** dedicated Read/Write tools are unavailable in this environment; read-only shell inventory and the available patch file tool were used. Only this PATTERNS.md was written.
