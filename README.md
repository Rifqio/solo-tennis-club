# Lafu: Lawu Fun Tennis Club

A phone-first web app where visitors browse the club's tennis sessions without signing in, and designated administrators publish and manage them. One Node process serves the app and its API, and stores everything in a single SQLite file on local disk.

Design system: [`DESIGN.md`](DESIGN.md). Planning: [`.planning/`](.planning/).

## Requirements

- Node.js 24
- A persistent local disk for the database file and its backups

## Install and run locally

```sh
npm install
npm run db:migrate:deploy          # create or update data/lafu.db
npm run admin:provision -- --email admin@example.com --name "Club Admin"
npm run db:seed:sample             # optional: labeled sample sessions for development
npm run dev                        # http://127.0.0.1:3000 with hot reload
```

`npm run dev` serves through Vite. To reach it from a phone through a tunnel (for example ngrok), add the tunnel host to `server.allowedHosts` in `vite.config.ts`.

## Build and start

```sh
npm run build    # Prisma client, type check, production bundle in dist/
npm run start    # serves dist/ and the API on LAFU_HOST:LAFU_PORT
```

## Administrators

There is no public sign-up for administrators; accounts are set up by whoever runs the server.

| Task | Command |
|---|---|
| Add an administrator | `npm run admin:provision -- --email <email> --name "<display name>"` (prompts for the password twice) |
| Non-interactive password | `printf '%s' "$PASSWORD" \| npm run admin:provision -- --email <email> --name "<name>" --password-stdin` |
| Recover a lost password | Run the add command again for the same email. It sets the new password and signs out every existing session for that account. |
| Remove access | `npm run admin:provision -- --email <email> --deactivate` |

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `LAFU_DATABASE_FILE` | `data/lafu.db` | SQLite file. Keep it on persistent disk, outside `dist/` and `public/`. |
| `LAFU_PORT` | `3000` | Listening port. |
| `LAFU_HOST` | `127.0.0.1` | Listening address. Keep loopback behind a reverse proxy. |
| `LAFU_BACKUP_DIR` | `backups/` | Where `db:backup` writes snapshots. Refused inside `dist/` or `public/`. |
| `LAFU_PUBLIC_ORIGIN` | unset | The public HTTPS origin (for example `https://jadwal.example.id`), used to check where admin requests come from. Must be an origin, without a path. |
| `LAFU_TRUST_PROXY` | unset | Set to `1` when a reverse proxy forwards requests, so client addresses come from the proxy headers. |
| `LAFU_COOKIE_SECURE` | secure in production | Set to `false` only for local production-mode testing on a loopback host without HTTPS. |

## Backup and restore

SQLite keeps recent writes in a write-ahead log beside the database file, so copying the live file can miss committed data. Use the backup command instead: it asks SQLite for a consistent snapshot (`VACUUM INTO`) while the server keeps running.

```sh
npm run db:backup
# Backup written: backups/lafu-20261008-213000-WIB.db
```

Run it on a schedule (for example nightly through cron or a systemd timer) and copy the `backups/` folder off the machine regularly.

To restore:

```sh
# 1. Stop the server.
# 2. Restore. The backup is checked first (SQLite integrity and every migration recorded).
npm run db:restore -- --from backups/lafu-20261008-213000-WIB.db --to data/lafu.db --force
# 3. Start the server again.
```

Without `--to`, restore targets `LAFU_DATABASE_FILE`. It refuses to replace an existing file unless `--force` is given, refuses a backup that fails verification, and never writes inside `dist/` or `public/`.

## Deployment notes

- Run exactly one Node process per database file. SQLite is owned by that process; do not point two servers at the same file.
- Put an HTTPS reverse proxy (Caddy, nginx) in front and forward to `127.0.0.1:LAFU_PORT`. Set `LAFU_PUBLIC_ORIGIN` to the public HTTPS origin and `LAFU_TRUST_PROXY=1`.
- Keep the database file and backups on persistent disk, outside `dist/` and `public/`.
- Apply migrations with `npm run db:migrate:deploy` before starting a new version.

## Sample data (development only)

```sh
npm run db:seed:sample             # creates the sample catalog and two weeks of sessions
npm run db:seed:sample -- --refresh  # re-dates the sample sessions from today
```

Every sample record is flagged as sample data and named "Contoh ..." (Indonesian for "example"), and the schedule shows "Data contoh untuk pengujian, bukan jadwal klub." beside them. The command refuses to run when `NODE_ENV=production`. Phase 1 has no bookings, so sample sessions show as available or cancelled; nearly-full and full states appear once bookings exist.

## Testing

```sh
npm test            # unit and integration tests against real SQLite files
npm run lint
npm run test:e2e    # Playwright browser tests (needs a Playwright browser installed)
```

## Before launch

Real club content is a launch prerequisite and must come from the club: the bilingual club description, contact, and address; the logo (the app currently shows a text "LAFU" placeholder); and the real coaches, venues, levels, classes, prices, and sessions entered by an administrator. Sample data must not be present in a production database.
