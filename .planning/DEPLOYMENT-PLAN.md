# Deployment plan: free on Vercel (portfolio demo)

Date: 2026-10-11, updated 2026-10-12. Status: **live at https://solo-tennis-club.vercel.app since 2026-10-12** (Turso `stc` and both Blob stores in Mumbai, function in bom1). A live run passed member sign-up with the on-screen code, booking, a 4.8 MB proof through Blob, the admin demo button, proof access (admin 200, other member 404), an album photo, and two members racing for the last place on Turso (one 201, one CAPACITY_UNAVAILABLE). Still open on the checklist: the cron run, a Turso restore, foreign keys on Turso, 404/500 pages and tablet/desktop checks. The user asked for R1 ahead of Phase 3 acceptance; payment screens reach the live demo as they land. What remains is account setup (section 6) and the go-live checklist (section 7). Repository: `github.com/Rifqio/solo-tennis-club`.

## 1. Context that decides this plan

STC is a personal portfolio project that mocks a real client (the user, 2026-10-11). There is no real business, no real payments and no budget. That means:
- **Vercel's free Hobby plan is allowed.** It is for personal, non-commercial use; collecting payments would make a site commercial ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan](https://vercel.com/docs/plans/hobby)). STC collects none.
- **Real WhatsApp/SMS OTP and real payment details are no longer release prerequisites.** The mock OTP and the sample QR stay, inside a clearly labelled demo mode (section 3).
- **Every service used must have a free tier with no card charge.**

## 2. Target setup (all free)

| Part | Today (one server) | On Vercel |
|---|---|---|
| React app | Served by Express from `dist` | Vercel static hosting and CDN |
| API | Express process | The same Express app as one Vercel Function, bundled from `server/vercel.ts` by `npm run vercel-build` |
| Database | SQLite file through `better-sqlite3` (unchanged) | **Turso** (hosted SQLite, libSQL) through `@prisma/adapter-libsql`'s web client ([Prisma + Turso](https://www.prisma.io/docs/guides/database/turso)). Free plan: 5 GB, 500M rows read and 10M rows written a month, 1-day point-in-time restore ([Turso pricing](https://turso.tech/pricing.md)) |
| Coach and session photos | `data/uploads` folder | **Vercel Blob**, public store |
| Payment proofs | `data/private` folder | **Vercel Blob**, private store, served only through the API to the owner and admins |
| Expiry worker | `setInterval` | **Vercel Cron**, daily on Hobby ([cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)). This is enough: capacity already ignores an unpaid booking the moment its deadline passes (`activeBookingWhere`), so the job only tidies statuses |
| Backups | `npm run db:backup` | Turso's 1-day restore, plus a weekly database dump from a free GitHub Action, kept as a workflow artifact |

Free-tier limits to watch:
- **Vercel Blob on Hobby:** 1 GB storage, 10,000 simple and 2,000 advanced operations, 10 GB transfer a month. Going over locks Blob for 30 days rather than billing ([Blob usage](https://vercel.com/docs/vercel-blob/usage-and-pricing)). Photos are shrunk on the device before upload.
- **Vercel Function request bodies are capped at 4.5 MB.** Proofs (up to 3 × 5 MB), portraits and photos therefore upload **directly from the browser to Blob** with a short-lived token the API issues. The API then reads the file back, checks its bytes as it always has, and stores it in place. Nothing large is sent *to* the Function.

## 3. Demo mode (`LAFU_DEMO=1`)

A visitor, recruiter or interviewer should be able to try every role in a minute without a real phone number or money. The app stays immersive: **no site-wide demo banner** (the user's choice, 2026-10-11). The demo only shows where a visitor needs it to carry on:
- **Member sign-in:** the mock OTP stays on. The code appears quietly on the code step, like the development hint today, so a visitor can continue.
- **Admin sign-in:** a "Masuk sebagai admin demo" button signs in a seeded demo admin. This replaces the dev-only empty-form shortcut, which is removed.
- **Payments:** the sample QR (already captioned "Contoh QR") and placeholder bank details stay. Proofs can be uploaded and reviewed as normal.
- **Context lives outside the app:** the GitHub README and the portfolio page explain that STC is a mock client with sample data.
- **Nightly reset:** the daily cron also restores the sample club data. Members' and visitors' bookings, proofs and photos are cleared, so the demo always starts clean and Blob stays under its limit.
- **Production safety:** the server refuses the mock OTP driver unless `LAFU_DEMO=1`, so demo behaviour can never switch on silently.

## 4. What was built (release slice R1, 2026-10-12)

1. **Database.** `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`) selects Turso through `@prisma/adapter-libsql`; without it the local SQLite file is used as before (`server/db.ts`, `resolveDatabaseTarget`).
   - *Deviation:* local files stay on `better-sqlite3`. libSQL's native driver keeps database files open after `close()` on Windows, which broke test clean-up, backups and restores. The function bundle uses libSQL's web client (plain HTTP, no native driver).
   - **Capacity on libSQL:** `tests/integration/libsql-admission.test.ts` races ten admissions from two libSQL clients and checks capacity and foreign keys hold. A race against real Turso is still on the go-live checklist.
   - **Migrations:** `npm run db:migrate:turso` applies `prisma/migrations/*/migration.sql` in order and records each in `_prisma_migrations` with Prisma's checksum. `tests/integration/turso-migrate.test.ts` proves it builds exactly the schema `prisma migrate deploy` builds, and is repeat-safe.
2. **File storage** behind one `FileStore` interface (`server/storage/file-store.ts`): folders beside the database locally, Vercel Blob when both tokens are set. Public store: coach portraits and session photos (`/uploads/...` redirects there). Private store: payment proofs, read back only through the API (AUTH-05 unchanged).
3. **Direct uploads** (`server/storage/staged-upload.ts`, `src/lib/direct-upload.ts`): `POST /api/admin/uploads` or `/api/customer/uploads` issues a ticket for one key under `incoming/<purpose>/` in the private store, limited to that purpose's size and types for ten minutes. The browser puts the file there and sends the key; the API takes it back, checks its bytes, stores it in place and removes the incoming copy. Locally the ticket says direct uploads are off and files go in the request as before.
4. **Serverless build** (`scripts/vercel-build.ts`, Vercel's [Build Output API](https://vercel.com/docs/build-output-api)) instead of `api/index.ts` plus `vercel.json` routes: the Vite client goes to the CDN; Express is bundled with esbuild into one Node 22 function that gets `/api/*` and `/uploads/*`; every other path falls back to `index.html`. The function refuses to start without Turso and both Blob tokens.
5. **Cron:** `GET /api/cron/daily` (Vercel Cron sends GET; POST works for a manual run), `Authorization: Bearer $CRON_SECRET`, 404 without a secret. Runs daily at 20:00 UTC (03:00 WIB). It expires lapsed bookings and, on the demo, runs the reset.
6. **Demo mode** (`LAFU_DEMO=1`): the mock OTP runs in production only with it, and the code shows on the code step. "Masuk sebagai admin demo" signs in `admin.demo@stc.example`, created on first use; on development servers the same button signs in the first admin, replacing the empty-form shortcut. `GET /api/public/app-config` tells the sign-in page when to show it. The nightly reset clears members, bookings, proofs, payments, sessions, the catalog and every uploaded file, then seeds the sample club from today. Admin accounts stay. Tests: `tests/integration/demo-mode.test.ts`, `tests/integration/direct-uploads.test.ts`.
7. **Still open from release cleanup** (STATE.md): `ONBOARDING_ALWAYS`, photo licences for a public portfolio, and the `lafu*` identifiers.

## 5. Environment (Vercel → Project → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | From Turso (the Turso integration on the Vercel Marketplace sets both). Optionally a separate `stc-preview` database for the Preview environment |
| `BLOB_READ_WRITE_TOKEN` | Set when the **public** Blob store is connected (default prefix `BLOB`) |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | Set when the **private** Blob store is connected with the environment variable prefix `PRIVATE_BLOB` |
| `LAFU_DEMO` | `1` |
| `LAFU_TRUST_PROXY` | `1` (HTTPS and client IPs come from Vercel's proxy headers) |
| `CRON_SECRET` | A long random string; Vercel sends it with each cron call |

Not needed: `LAFU_OTP_DRIVER` (mock is the default with `LAFU_DEMO=1`) and `LAFU_COOKIE_SECURE` (cookies are always Secure in production). Leave `LAFU_PUBLIC_ORIGIN` unset so preview links pass the same-origin check; set it only for a custom domain.

A free `*.vercel.app` address costs nothing. A custom domain is optional.

## 6. Setup steps (dashboard, about 20 minutes)
1. **Turso** (free account at turso.tech): create a database `stc` and a token for it.
2. **Migrate and seed it once**, from this machine:
   `TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate:turso`, then the same two variables with `npm run db:seed:sample`. Seeding can be skipped: the first cron run seeds the demo.
3. **Vercel:** Add New → Project → import `Rifqio/solo-tennis-club`. Framework preset **Other**; `vercel.json` already sets the build command (`npm run vercel-build`). Production branch: `gsd/phase-01-publish-and-browse-sessions`, the repository's default branch (GitHub has no `main` yet; switch the production branch if one is created later).
4. **Storage → Blob:** create a **public** store and connect it to the project (prefix `BLOB`). Create a second store with **private** access and connect it with the prefix `PRIVATE_BLOB`.
5. **Environment variables** from section 5, then **Redeploy**.
6. **Deploy:** the import builds the production branch straight away. Every later push to it redeploys; other branches and pull requests get preview links.
7. **Seed through the cron once** (optional): `curl -H "Authorization: Bearer $CRON_SECRET" https://<project>.vercel.app/api/cron/daily`.

## 7. Go-live checklist
1. No demo banner anywhere. Member sign-in with the on-screen code works. "Masuk sebagai admin demo" works.
2. Booking, pay, and uploading 3 proof files (one over 4.5 MB) work, and admin review works. Sessions survive a reload.
3. A coach photo uploads and shows. A proof opens only for its owner and admins (others get 404).
4. The daily cron runs: lapsed bookings are tidied and demo data resets.
5. The 404, 401 and 500 pages show. The 500 report code appears in the Vercel Function log.
6. Phone (390), tablet (1024) and desktop (1440) checks. A full e2e run against the preview link.
7. A Turso point-in-time restore is tried once on `stc-preview`.
8. Turso keeps foreign keys on: `PRAGMA foreign_keys` answers 1, and deleting a session with photos removes them.
9. Two phones booking the last place at once: one wins, the other sees the full-session message (capacity on real Turso).

## 8. Rollback
- **Vercel:** "Promote" the previous deployment (instant).
- **Database:** Turso point-in-time restore (1 day on the free plan), or the latest weekly dump. Migrations stay additive by convention.

## 9. When
Originally after Phase 3 acceptance. On 2026-10-12 the user chose to build R1 now; the live demo can go up as soon as section 6 is done, and Phases 3-5 ship to it as they land.

## Note: the paid alternative (if this ever becomes a real club)
Keep the current single-server design: Vercel (Pro, since a real club is commercial) or any static host for the app, plus one small always-on server with a disk for Express and SQLite, joined by rewrites ([Vercel as a reverse proxy](https://vercel.com/kb/guide/vercel-reverse-proxy-rewrites-external)). Real OTP delivery and real payment details then return as prerequisites.
