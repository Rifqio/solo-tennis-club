---
phase: 01-publish-and-browse-sessions
plan: 06
subsystem: operations
tags: [sqlite, backup, restore, sample-data, readme]
requires:
  - phase: 01-02
    provides: "Admin provisioning, protected session publication, child-process test patterns"
provides:
  - "Consistent live backups (VACUUM INTO) and verified, atomic restore"
  - "Repeat-safe, labeled development sample seed with --refresh"
  - "Operations README replacing the Vite starter text"
affects: [all later phases (operations), local UI review]
tech-stack:
  added: []
  patterns: [VACUUM INTO snapshot, verify-then-rename restore, location guard for dist/ and public/]
key-files:
  created:
    - server/ops/backup.ts
    - server/ops/sample-data.ts
    - scripts/db-backup.ts
    - scripts/db-restore.ts
    - scripts/seed-sample.ts
    - tests/integration/backup-restore.test.ts
    - tests/integration/seed-sample.test.ts
  modified: [package.json, README.md]
key-decisions:
  - "Executed by hand from this PLAN.md (no GSD skills), per the user's standing preference."
  - "Sample data is richer than the plan's minimum at the user's request for browsable placeholders: 3 sample classes, 2 levels, 2 venues, 3 coaches, 23 sessions over 14 days, empty days 3/7/10 for the next-date shortcut, 2 cancelled sessions, a 7-place class with two coaches, and one long class name for wrap review."
  - "Repeat safety keys on the three named sample classes rather than any sample Level, because test fixtures also create isSample levels."
  - "Added --refresh (re-dates sample sessions from today, keeps the catalog) so a long-lived development database never runs out of upcoming samples. Not in the plan; development-only, covered by a test."
  - "db:restore defaults --to to LAFU_DATABASE_FILE when omitted and prints a stop-the-server reminder."
  - "Phase 1 occupancy is always zero, so sample sessions can only show Available or Cancelled; no booking-like occupancy is created (plan prohibition)."
requirements-completed: [DISC-02]
coverage:
  - id: D1
    description: "Backup taken while a child server holds the file restores to a fresh file whose server returns the same published session; overwrite needs --force; truncated backup fails verification; dist/ and public/ refused."
    requirement: DISC-02
    verification:
      - kind: integration
        ref: tests/integration/backup-restore.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Seed creates only isSample 'Contoh' records, second run skips with identical counts, refresh re-dates without duplicating, public schedule marks them isSample, production NODE_ENV exits 1 and writes nothing."
    verification:
      - kind: integration
        ref: tests/integration/seed-sample.test.ts
        status: pass
    human_judgment: false
---

# Plan 01-06 Summary: Backup, restore, sample seed, operations README

## Outcome

`npm run db:backup` writes `backups/lafu-YYYYMMDD-HHmmss-WIB.db` through SQLite's `VACUUM INTO` while the server runs. `npm run db:restore -- --from <file> [--to <file>] [--force]` verifies integrity and migrations, then copies beside the target and renames over it, clearing stale WAL/SHM files. `npm run db:seed:sample [-- --refresh]` fills a development database with clearly labeled "Contoh" sample data. README.md is now the Lafu operations guide.

## Verification run

| Check | Result |
|---|---|
| `npm test` | 17 files, 105 tests passed |
| `npx tsc -b`, `npm run lint` | clean |
| README key check (plan command) | `readme ok` |
| Local seed of `data/lafu.db` | created; running server on :3000 returned today's 3 sample sessions |

## Notes

- `prisma migrate deploy` reports "database is locked" while a server holds the file; run migrations before starting the server (README order).
- No dependencies added.
