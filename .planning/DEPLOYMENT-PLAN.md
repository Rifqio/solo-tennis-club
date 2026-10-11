# Deployment plan: free on Vercel (portfolio demo)

Date: 2026-10-11. Status: plan; nothing deployed yet. Repository: `github.com/Rifqio/solo-tennis-club` (connected to GitHub).

## 1. Context that decides this plan

STC is a personal portfolio project that mocks a real client (the user, 2026-10-11). There is no real business, no real payments and no budget. That means:
- **Vercel's free Hobby plan is allowed.** It is for personal, non-commercial use; collecting payments would make a site commercial ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan](https://vercel.com/docs/plans/hobby)). STC collects none.
- **Real WhatsApp/SMS OTP and real payment details are no longer release prerequisites.** The mock OTP and the sample QR stay, inside a clearly labelled demo mode (section 3).
- **Every service used must have a free tier with no card charge.**

## 2. Target setup (all free)

| Part | Today (one server) | On Vercel |
|---|---|---|
| React app | Served by Express from `dist` | Vercel static hosting and CDN |
| API | Express process | The same Express app as one Vercel Function (`api/index.ts`) |
| Database | SQLite file through `better-sqlite3` | **Turso** (hosted SQLite, libSQL) through `@prisma/adapter-libsql` ([Prisma + Turso](https://www.prisma.io/docs/guides/database/turso)). Free plan: 5 GB, 500M rows read and 10M rows written a month, 1-day point-in-time restore ([Turso pricing](https://turso.tech/pricing.md)) |
| Coach and session photos | `data/uploads` folder | **Vercel Blob**, public store |
| Payment proofs | `data/private` folder | **Vercel Blob**, private store, served only through the API to the owner and admins |
| Expiry worker | `setInterval` | **Vercel Cron**, daily on Hobby ([cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)). This is enough: capacity already ignores an unpaid booking the moment its deadline passes (`activeBookingWhere`), so the job only tidies statuses |
| Backups | `npm run db:backup` | Turso's 1-day restore, plus a weekly database dump from a free GitHub Action, kept as a workflow artifact |

Free-tier limits to watch:
- **Vercel Blob on Hobby:** 1 GB storage, 10,000 simple and 2,000 advanced operations, 10 GB transfer a month. Going over locks Blob for 30 days rather than billing ([Blob usage](https://vercel.com/docs/vercel-blob/usage-and-pricing)). Photos are shrunk on the device before upload.
- **Vercel Function request bodies are capped at 4.5 MB.** Proofs (up to 5 × 5 MB) and photos therefore upload **directly from the browser to Blob** with a short-lived token the API issues. The API then records the file. Nothing large passes through the Function.

## 3. Demo mode (`LAFU_DEMO=1`)

A visitor, recruiter or interviewer should be able to try every role in a minute without a real phone number or money. The app stays immersive: **no site-wide demo banner** (the user's choice, 2026-10-11). The demo only shows where a visitor needs it to carry on:
- **Member sign-in:** the mock OTP stays on. The code appears quietly on the code step, like the development hint today, so a visitor can continue.
- **Admin sign-in:** a "Masuk sebagai admin demo" button signs in a seeded demo admin. This replaces the dev-only empty-form shortcut, which is removed.
- **Payments:** the sample QR (already captioned "Contoh QR") and placeholder bank details stay. Proofs can be uploaded and reviewed as normal.
- **Context lives outside the app:** the GitHub README and the portfolio page explain that STC is a mock client with sample data.
- **Nightly reset:** the daily cron also restores the sample club data. Members' and visitors' bookings, proofs and photos are cleared, so the demo always starts clean and Blob stays under its limit.
- **Production safety:** the server refuses the mock OTP driver unless `LAFU_DEMO=1`, so demo behaviour can never switch on silently.

## 4. Work to do (one release slice, R1)

1. **Database adapter.** Move from `@prisma/adapter-better-sqlite3` to `@prisma/adapter-libsql`. It reads a local `file:` database for development and tests, and the Turso URL plus token in production, so one code path covers both.
   - **Migrations:** Prisma Migrate does not apply migrations to Turso directly. A small script applies the committed `prisma/migrations/*/migration.sql` files in order and records which ran.
   - **Re-prove capacity integrity:** run the full unit and integration suite on libSQL, plus a concurrency check against a real Turso database. Admission relies on SQLite's write lock (`acquireSessionCapacityWrite`).
2. **File storage behind one interface:** `put` / `get` / `delete` with two implementations, the local disk (development, tests) and Vercel Blob (production). Applies to coach photos, session photos and payment proofs. The private-proof rules (AUTH-05: other people's proofs answer 404) are unchanged.
3. **Direct browser uploads to Blob** for proofs and photos, using a token issued by the API.
4. **Serverless entry:**
   - `api/index.ts` exports the Express app without `listen`;
   - `vercel.json` sends `/api/*` and `/uploads/*` to it, sends every other path to `index.html` (the React router and the 404 page take over), and declares the cron.
5. **Cron endpoint:** `POST /api/cron/daily`, protected by Vercel's `CRON_SECRET`. It expires lapsed bookings and runs the demo reset.
6. **Demo mode:** section 3, with its tests.
7. **Release cleanup** carried in STATE.md: remove `ONBOARDING_ALWAYS` and the dev sign-in shortcut, settle photo licences (use only free-licence or own photos in a public portfolio), and rename the `lafu*` identifiers or keep them on purpose.

## 5. Environment

| Variable | Where | Value |
|---|---|---|
| `DATABASE_URL` / `TURSO_AUTH_TOKEN` | Vercel (Production, Preview) | Turso database URL and token; a separate `stc-preview` database for preview deploys |
| `BLOB_READ_WRITE_TOKEN` | Vercel | Set automatically when a Blob store is connected |
| `LAFU_PUBLIC_ORIGIN` | Vercel | `https://<project>.vercel.app` or a custom domain |
| `LAFU_COOKIE_SECURE` | Vercel | `1` |
| `LAFU_TRUST_PROXY` | Vercel | `1` |
| `LAFU_DEMO` | Vercel | `1` |
| `LAFU_OTP_DRIVER` | Vercel | `mock` (allowed only with `LAFU_DEMO=1`) |
| `CRON_SECRET` | Vercel | A random string; Vercel sends it with cron calls |

A free `*.vercel.app` address costs nothing. A custom domain is optional.

## 6. Setup steps (dashboard, about 20 minutes)
1. **Turso** (free account): create `stc` and `stc-preview`, create a token for each, run the migration script once, and seed the sample club data.
2. **Vercel:** Add New → Project → import `Rifqio/solo-tennis-club`.
   - Framework preset: Vite. Production branch: `main`.
   - Connect a Blob store (public) and a second Blob store (private).
   - Add the environment variables.
3. **Merge to `main`** (the working branch carries Phases 1-3). Vercel deploys every push, and every pull request gets a preview link.

## 7. Go-live checklist
1. No demo banner anywhere. Member sign-in with the on-screen code works. "Masuk sebagai admin demo" works.
2. Booking, pay, and uploading 5 proof files work, and admin review works. Sessions survive a reload.
3. A coach photo uploads and shows. A proof opens only for its owner and admins (others get 404).
4. The daily cron runs: lapsed bookings are tidied and demo data resets.
5. The 404, 401 and 500 pages show. The 500 report code appears in the Vercel Function log.
6. Phone (390), tablet (1024) and desktop (1440) checks. A full e2e run against the preview link.
7. A Turso point-in-time restore is tried once on `stc-preview`.

## 8. Rollback
- **Vercel:** "Promote" the previous deployment (instant).
- **Database:** Turso point-in-time restore (1 day on the free plan), or the latest weekly dump. Migrations stay additive by convention.

## 9. When
After Phase 3 acceptance, so the public demo includes paying and reviewing. Phases 4 and 5 then ship to the live demo as they land.

## Note: the paid alternative (if this ever becomes a real club)
Keep the current single-server design: Vercel (Pro, since a real club is commercial) or any static host for the app, plus one small always-on server with a disk for Express and SQLite, joined by rewrites ([Vercel as a reverse proxy](https://vercel.com/kb/guide/vercel-reverse-proxy-rewrites-external)). Real OTP delivery and real payment details then return as prerequisites.
