# STC: Solo Tennis Club

A phone-first booking app for a small tennis club. Visitors browse the schedule without signing in. Members book places, pay by QRIS or bank transfer and upload proof of payment from their phones. Admins publish sessions, check payments and run the day from the same app. Everything works in Indonesian and English.

**Live demo: [solo-tennis-club.vercel.app](https://solo-tennis-club.vercel.app)**

STC is a personal portfolio project. The club, its coaches, sessions and prices are sample data, and no real payment is ever collected. It replaces the shared spreadsheet and WhatsApp threads a club like this usually runs on.

## Try the demo

| Role | How |
|---|---|
| Visitor | Open the site. Jadwal (the schedule) and the club page need no account. |
| Member | Akun → enter any phone number. The demo shows the sign-in code on screen; no SMS or WhatsApp is sent. |
| Admin | Go to `/admin/sign-in` and tap **Masuk sebagai admin demo**. |

The demo resets every night at 03:00 WIB: sample sessions are dated from that day, and bookings, proofs and photos added during the day are cleared.

## What it does

**Members**
- Browse sessions by day, filter by level or open places, and see who is playing.
- Book one or several places. An unpaid booking holds its places for five hours; capacity never oversells, even when two people take the last place at once.
- Pay by QRIS or bank transfer and upload up to three proof images. A rejected proof can be replaced; the original deadline stays.
- Follow each booking (Aktif and Riwayat) and open the session's photo album afterwards.

**Admins**
- Sessions by day with a live roster per session: who has paid, who still owes, who is past the deadline.
- Booking masuk: proofs to check, unpaid bookings by deadline, and the full history with search.
- Record bookings that arrive on WhatsApp, and payments made outside the app.
- Rekap: the month's places, revenue and pending payments, with an Excel export.
- Manage classes, coaches, venues and levels; upload session photos.

**Throughout:** phone first, with tablet and desktop layouts; Indonesian and English; illustrated empty, error and offline states; and loading placeholders shaped like the content.

## Stack

- **Client:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion.
- **Server:** Express 5 with Prisma 7. Each feature is split into router, controller, service and repository ([conventions](.planning/BACKEND-CONVENTIONS.md)).
- **Data:** SQLite locally (one file); Turso (hosted SQLite) on the demo.
- **Files:** folders beside the database locally; Vercel Blob on the demo (a public store for photos, a private one for payment proofs, which only the owner and admins can open).
- **Hosting:** Vercel. The client is served from the CDN and the API runs as one Vercel Function.
- **Tests:** Vitest (unit and integration, against real SQLite files) and Playwright (browser).

Design system: [`DESIGN.md`](DESIGN.md). Product brief: [`PRODUCT.md`](PRODUCT.md). Planning, requirements and the roadmap: [`.planning/`](.planning/).

## Status

Built in five phases ([roadmap](.planning/ROADMAP.md)):

1. Publish and browse sessions: accepted.
2. Reserve places and see daily rosters: accepted.
3. Pay and verify bookings: built and on the demo; acceptance in progress.
4. Adjust bookings and settle cancellations: next.
5. Recurring sessions and minimum cutoffs: planned.

## Run it locally

Requires Node.js 24.

```sh
npm install
npm run db:migrate:deploy          # create or update data/stc.db
npm run db:seed:sample             # optional: a sample club with two weeks of sessions
npm run dev                        # http://127.0.0.1:3000 with hot reload
```

On a development server, **Masuk sebagai admin demo** signs in the first admin account. Add one with:

```sh
npm run admin:provision -- --email admin@example.com --name "Club Admin"
```

Member sign-in uses a development code shown on screen (`STC_OTP_DRIVER=mock`, the development default).

To reach the dev server from a phone through a tunnel (for example ngrok), add the exact tunnel host to `server.allowedHosts` in `vite.config.ts`. Admin requests from that host's HTTPS origin are then accepted; wildcard hosts are not.

## Tests

```sh
npm test            # unit and integration tests
npm run lint
npm run test:e2e    # Playwright browser tests; builds first and runs on a throwaway database
```

## Build and run in production mode

```sh
npm run build    # Prisma client, type check, production bundle in dist/
npm run start    # serves dist/ and the API on STC_HOST:STC_PORT
```

## Deploying to Vercel

`npm run vercel-build` (set in `vercel.json`) bundles the client for the CDN and the Express app as one function. The full setup and go-live checklist are in [`.planning/DEPLOYMENT-PLAN.md`](.planning/DEPLOYMENT-PLAN.md). In short:

1. Create a Turso database and apply the migrations: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate:turso`.
2. Import the repository in Vercel (framework preset **Other**).
3. Connect two Blob stores: a public one (prefix `BLOB`) and a private one (prefix `PRIVATE_BLOB`).
4. Set the environment variables below and redeploy. Every push to the production branch redeploys.

A daily Vercel Cron (`/api/cron/daily`, 03:00 WIB) tidies lapsed bookings and, in demo mode, resets the demo.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `STC_DATABASE_FILE` | `data/stc.db` | Local SQLite file. Keep it on persistent disk, outside `dist/` and `public/`. |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | unset | Use Turso instead of the local file. Required on Vercel. |
| `BLOB_READ_WRITE_TOKEN` | unset | Public Vercel Blob store (photos). Required on Vercel. |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | unset | Private Vercel Blob store (payment proofs). Required on Vercel. |
| `STC_DEMO` | unset | `1` turns on demo mode: on-screen member codes in production, the admin demo button and the nightly reset. |
| `CRON_SECRET` | unset | Bearer token Vercel Cron sends to `/api/cron/daily`. Without it the route answers 404. |
| `STC_OTP_DRIVER` | `mock` in development, `disabled` in production | Member sign-in codes. Production accepts `mock` only with `STC_DEMO=1`. |
| `STC_PORT` | `3000` | Listening port. |
| `STC_HOST` | `127.0.0.1` | Listening address. Keep loopback behind a reverse proxy. |
| `STC_PUBLIC_ORIGIN` | unset | The public HTTPS origin, used to check where admin requests come from. Leave unset on Vercel unless you use a custom domain. |
| `STC_TRUST_PROXY` | unset | `1` behind a reverse proxy or on Vercel, so client addresses and HTTPS come from the proxy headers. |
| `STC_COOKIE_SECURE` | secure in production | `false` only for local production-mode testing on a loopback host without HTTPS. |
| `STC_BACKUP_DIR` | `backups/` | Where `db:backup` writes snapshots. Refused inside `dist/` or `public/`. |

## Administrators

There is no public sign-up for administrators.

| Task | Command |
|---|---|
| Add an administrator | `npm run admin:provision -- --email <email> --name "<display name>"` (asks for the password twice) |
| Non-interactive password | `printf '%s' "$PASSWORD" \| npm run admin:provision -- --email <email> --name "<name>" --password-stdin` |
| Recover a lost password | Run the add command again for the same email. It sets the new password and signs out every session for that account. |
| Remove access | `npm run admin:provision -- --email <email> --deactivate` |

## Backup and restore (self-hosted SQLite)

On the demo, Turso keeps a one-day point-in-time restore. On a self-hosted server, use the backup command rather than copying the live file: SQLite keeps recent writes in a log beside the database, so a plain copy can miss committed data. The command takes a consistent snapshot (`VACUUM INTO`) while the server keeps running.

```sh
npm run db:backup
# Backup written: backups/stc-20261008-213000-WIB.db
```

Run it on a schedule and copy `backups/` off the machine. To restore, stop the server, then:

```sh
npm run db:restore -- --from backups/stc-20261008-213000-WIB.db --to data/stc.db --force
```

The backup is verified first (SQLite integrity and every migration recorded). Without `--to`, restore targets `STC_DATABASE_FILE`; it refuses to replace an existing file without `--force` and never writes inside `dist/` or `public/`.

Self-hosting notes: run exactly one Node process per database file; put an HTTPS reverse proxy (Caddy, nginx) in front with `STC_PUBLIC_ORIGIN` and `STC_TRUST_PROXY=1`; apply migrations with `npm run db:migrate:deploy` before starting a new version.

## Sample data

```sh
npm run db:seed:sample               # the sample club and two weeks of sessions
npm run db:seed:sample -- --refresh  # re-date the sample sessions from today
```

Sample records are flagged as sample data, and the app labels them ("Data contoh untuk pengujian, bukan jadwal klub."). The command refuses to run with `NODE_ENV=production`. With `TURSO_DATABASE_URL` set it seeds the hosted database instead of the local file.

## Credits

The empty, error and offline illustrations were generated for STC with Gemini, in a style inspired by Mijke Coebergh's "The Alphabet of tennis" ([prompts](.planning/STATE-ART-PROMPTS.md)).

The project was first called Lafu (Lawu Fun Tennis Club); every identifier now uses STC. A deployment set up before the rename needs its `LAFU_*` settings renamed to `STC_*`.
