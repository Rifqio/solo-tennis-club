# Deployment plan: Vercel

Date: 2026-10-11. Status: draft for the user's decision; nothing is deployed yet. Repository: `github.com/Rifqio/solo-tennis-club` (connected). This is the release step after Phase 5; it closes the "hosted deployment" prerequisite in STATE.md.

## 1. What the app needs from a host

The approved architecture (PROJECT.md, 01-SKELETON.md) is one Express 5 server with SQLite on local disk:

| Need | Where it lives today |
|---|---|
| A long-running Node process | `npm start` (`server/index.ts`): Express serves `/api/*`, `/uploads/*` and the built React app |
| A database file that persists | SQLite through `better-sqlite3` (native module), `data/lafu.db` (`LAFU_DATABASE_FILE`) |
| Files that persist | Coach photos in `data/uploads`; payment proofs in `data/private` (never public) |
| A job every few minutes | The booking-expiry worker (`setInterval` in `server/start.ts`) |
| Backups | `npm run db:backup` copies the database and both folders |

**Vercel cannot run that part as it is.** Vercel Functions are short-lived, their disk is wiped between requests, and they cannot hold a native SQLite file or a background timer. On the Hobby plan, Vercel Cron also runs at most once a day ([Vercel cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)), which is too slow for the five-hour payment deadline.

Vercel is a very good fit for the React app itself: a global CDN, HTTPS, a custom domain, and a preview link for every pull request from GitHub.

## 2. Two ways to use Vercel

### Option A (recommended): Vercel for the app, a small server for the API

- **Vercel:** builds and serves the React app (`vite build` → `dist`).
- **API host:** one small always-on server with a persistent disk runs the Express API exactly as today, including SQLite, the photo and proof folders, the expiry worker and backups. Pick one close to Indonesia (Singapore region), for example Railway or Fly.io with a volume, Render with a disk, or a local VPS.
- **Glue:** Vercel *rewrites* `/api/*` and `/uploads/*` to the API host ([Vercel as a reverse proxy](https://vercel.com/kb/guide/vercel-reverse-proxy-rewrites-external), [rewrites](https://vercel.com/docs/routing/rewrites)). The browser only ever talks to the Vercel domain, so login cookies, CSRF tokens and the same-origin checks keep working with no code change.

Why: no change to the approved architecture, the capacity rules (admission relies on SQLite's write lock), or the private-proof storage. Only configuration is added.

To verify in the first preview deploy:
- **Proof uploads through the rewrite.** A member can send up to 5 files of 5 MB. Vercel documents a 4.5 MB request limit for Functions; no limit is documented for rewrites to an outside server. If the rewrite refuses large bodies, the fallback is to shrink photos on the phone before upload, which the session-photo design already assumes.
- **Proxy timeout.** Vercel's limits page says 30 seconds, and a newer changelog says 120 seconds ([limits](https://vercel.com/docs/limits/overview), [changelog](https://vercel.com/changelog/cdn-origin-timeout-increased-to-two-minutes)). Every STC request is far shorter, but uploads on slow mobile data need a real check.

### Option B: everything on Vercel

This replaces the parts Vercel cannot hold:
- SQLite file → a hosted SQLite-compatible database (Turso/libSQL, through Prisma's libSQL adapter);
- photo and proof folders → Vercel Blob, with proofs kept private and served only through the API;
- expiry worker → Vercel Cron, which needs the **Pro plan** for a per-minute schedule;
- Express → wrapped as a Vercel Function.

Cost and risk: this changes an approved architecture decision (single-host SQLite) and touches the most sensitive code: capacity locking, private proofs and backups. The full test suite and the e2e run would have to prove capacity integrity again on the new database. It is a phase of work, not a configuration step. Only choose it if one platform matters more than keeping the current design.

## 3. Steps for Option A

### Before the first real deploy (release gates, already listed in STATE.md)
1. Real WhatsApp/SMS OTP provider (`LAFU_OTP_DRIVER`); the mock driver must not reach production.
2. Remove the dev admin sign-in shortcut and `ONBOARDING_ALWAYS`.
3. Photo licences settled; the `lafu*` identifiers renamed (cookies, env names, database file) or consciously kept.
4. Merge the working branch into `main`. Vercel and the API host deploy from `main`.

### Repository changes (one small slice)
1. **`vercel.json`:**
   - build `npm run build`, output `dist`;
   - rewrites: `/api/:path*` and `/uploads/:path*` → `https://<api-host>/...`;
   - every other path → `/index.html`, so the React router (and the new 404 page) handles it.
2. **API start for production:** a `Dockerfile` (or the host's Node buildpack) that:
   - installs dependencies;
   - runs `npx prisma migrate deploy` before start;
   - starts `npm start`;
   - mounts the persistent volume at `/data`.
3. **Health check:** a `GET /api/health` (database reachable) for the host's restart checks.
4. **Documentation:** a short `docs/deploy.md` covering the env vars and the backup schedule.

### Environment (API host)
| Variable | Value |
|---|---|
| `LAFU_DATABASE_FILE` | `/data/lafu.db` (photos and proofs follow it into `/data`) |
| `LAFU_PUBLIC_ORIGIN` | the public Vercel or custom domain, e.g. `https://app.<club-domain>`; same-origin checks compare against it |
| `LAFU_TRUST_PROXY` | `1` (requests arrive through Vercel) |
| `LAFU_COOKIE_SECURE` | `1` |
| `LAFU_OTP_DRIVER` | the real provider, plus its credentials |
| `LAFU_BACKUP_DIR` | a folder on the volume, copied off-site daily |
| `LAFU_HOST` / `LAFU_PORT` | as the host requires |

### Vercel setup (in the dashboard, about 15 minutes)
1. **Import the project:** Add New → Project → import `Rifqio/solo-tennis-club`. Framework preset: Vite. Production branch: `main`.
2. **Custom domain and DNS:** add the domain; HTTPS is automatic.
3. **Preview deploys:** keep them on for pull requests. They need a preview API (a second small instance with a throwaway database) or must be limited to UI review.

### Backups
- Run `npm run db:backup` nightly on the API host.
- Copy the result off the host (object storage or a second machine).
- Do one restore drill before go-live, using the existing `backup-restore` test procedure on real data.

### Go-live checklist
1. Signing in by phone delivers a real code; admin sign-in works.
2. Booking, pay, proof upload (5 files) and admin review work. The cookie session survives a reload.
3. A coach photo uploads and shows; a payment proof opens only for the owner and admins.
4. An unpaid booking expires on time (the worker is running).
5. The 404, 401 and 500 pages show, and the 500 report code appears in the API host's log.
6. Phone (390), tablet (1024) and desktop (1440) checks; a full e2e run against the preview.
7. A backup is taken and a restore is tested.

### Rollback
- **Vercel:** "Promote" the previous deployment (instant).
- **API:** redeploy the previous image. Migrations are additive by convention, so the previous code still reads the database. If a migration is not additive, take a backup before deploying and restore it to roll back.

## 4. Decision needed from the user
1. **Option A (Vercel + small API server)** or **Option B (all on Vercel, with Turso, Blob and Pro-plan cron)**.
2. If Option A, which API host: Railway, Fly.io, Render, or a VPS you already have.
3. The domain to use.
