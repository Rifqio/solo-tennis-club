---
phase: 01-publish-and-browse-sessions
plan: 02
subsystem: admin-api
tags: [sqlite, prisma, express, scrypt, csrf, vitest]
requires:
  - phase: 01-01
    provides: "Migrated SQLite, public schedule API, and real-file test infrastructure"
provides:
  - "Trusted provisioning and persisted, revocable administrator sessions"
  - "Protected session options and atomic, idempotent session publication"
  - "Browser-safe session rules with stable field errors"
affects: [01-04, 01-08, 01-09, 01-10, booking]
tech-stack:
  added: []
  patterns: [opaque hashed cookie tokens, server-bound CSRF, transaction-local reference checks, request UUID replay]
key-files:
  created:
    - scripts/admin-provision.ts
    - server/auth/password.ts
    - server/auth/session-store.ts
    - server/auth/throttle.ts
    - server/features/admin/admin.router.ts
    - server/features/admin/sessions/session-create.service.ts
    - shared/session-rules.ts
    - shared/api/admin-auth.ts
    - shared/api/admin-sessions.ts
    - tests/integration/admin-auth.test.ts
    - tests/integration/admin-publish-restart.test.ts
    - tests/integration/session-create.test.ts
  modified: [package.json, server/app.ts, src/features/public/schedule/SchedulePage.tsx, tests/e2e/support/e2e-server.ts]
key-decisions:
  - "All admin authorization and mutation guards run before JSON parsing."
  - "Browser and visual acceptance remain manual pending under the user's explicit override."
  - "No schema, migration, lockfile, or dependency changes were required."
requirements-completed: [AUTH-06, SCHED-02, SCHED-07, SCHED-08, SCHED-09, DISC-02]
coverage:
  - id: D1
    description: "Trusted provisioning creates or rotates scrypt accounts without printing passwords or hashes; deactivation revokes access."
    requirement: AUTH-06
    verification:
      - kind: integration
        ref: tests/integration/admin-provision-cli.test.ts
        status: pass
      - kind: unit
        ref: tests/unit/password.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Private known and unknown admin routes reject anonymous, forged, revoked, expired and deactivated sessions; mutation guard matrix and production cookie flags pass."
    requirement: AUTH-06
    verification:
      - kind: integration
        ref: tests/integration/admin-auth.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "Email and client address throttling, uniform failure bodies, normalization and old-attempt cleanup."
    requirement: AUTH-06
    verification:
      - kind: integration
        ref: tests/integration/admin-auth.test.ts
        status: pass
    human_judgment: false
  - id: D4
    description: "Admin publication is returned by separate signed-out API requests and persists with the admin login through a real process restart."
    requirement: DISC-02
    verification:
      - kind: integration
        ref: tests/integration/admin-publish-restart.test.ts
        status: pass
    human_judgment: false
  - id: D5
    description: "Safe integer IDR, participant/duration boundaries, minimum adjacency, real WIB dates and future horizon return all field errors."
    requirement: SCHED-08
    verification:
      - kind: unit
        ref: tests/unit/session-rules.test.ts
        status: pass
      - kind: integration
        ref: tests/integration/session-create.test.ts
        status: pass
    human_judgment: false
  - id: D6
    description: "Exact IDR reaches public reads; unique ordered coaches and all reference checks are transactional."
    requirement: SCHED-07
    verification:
      - kind: integration
        ref: tests/integration/session-create.test.ts
        status: pass
    human_judgment: false
  - id: D7
    description: "Concurrent request UUID retries publish one session; an injected coach-write failure rolls back the session insert."
    requirement: SCHED-02
    verification:
      - kind: integration
        ref: tests/integration/session-create.test.ts
        status: pass
    human_judgment: false
  - id: D8
    description: "Duplicate or absent coaches are refused and coach order is stored and returned."
    requirement: SCHED-09
    verification:
      - kind: unit
        ref: tests/unit/session-rules.test.ts
        status: pass
      - kind: integration
        ref: tests/integration/session-create.test.ts
        status: pass
    human_judgment: false
  - id: D9
    description: "Signed-out dated schedule UI, phone widths, keyboard interactions and Antislop visual delivery acceptance."
    verification: []
    human_judgment: true
    rationale: "User explicitly disabled browser installation/execution and will assess manually; no browser PASS is claimed."
  - id: D10
    description: "Interactive hidden password prompt never echoes either password entry."
    verification: []
    human_judgment: true
    rationale: "Automated stdin provisioning and output secrecy passed; real terminal echo behavior remains manual pending."
duration: 25min
completed: 2026-10-08
status: complete
actuals:
  tokens: 19767
  tasks: 3
  commits: 6
plan_head_before: 8a1e9d97f4ef81df799b9b73a46b921a7051f41c
plan_head_after: bed9038b49406a1a8988387ba953e4688f878f68
---

# Phase 1 Plan 02: Protected Session Publication Summary

**Provisioned admins publish validated sessions through a CSRF-protected API, with SQLite-backed access, atomic coach links and repeat-safe creation.**

## Accomplishments

- Added trusted host provisioning, hidden or stdin password input, scrypt hashes, rotation/deactivation and session revocation. No default production account or password is shipped.
- Added 32-byte opaque cookies stored as SHA-256 hashes, persisted CSRF secrets, a 14-day absolute expiry, periodic last-seen updates and secure production defaults.
- Enforced authorization on every admin route before feature routing, including unknown paths and malformed anonymous bodies. Authenticated mutations require same origin, JSON and the session's CSRF token before parsing.
- Added database-backed sign-in throttling: five email failures or twenty address failures in fifteen minutes, with retry timing and cleanup.
- Published copied session values with admin audit IDs, exact integer IDR and ordered coach links. Field rules report all errors; transaction-local references, coach writes and occupancy reads use only the transaction client.
- Added request UUID replay, including simultaneous creates and rollback after a forced coach-write failure. Dated public page links now select the corresponding schedule API date.

## Task Commits

| Task | Commit | Outcome |
| ---- | ------ | ------- |
| 1 | ef169bb | Provisioning, persistent login, guarded session options/publication, restart tracer and optional browser spec |
| 2 RED | 6374d30 | Authentication, password and CLI tests expose missing throttling |
| 2 GREEN | 2a9baf5 | Database-backed sign-in attempt limits and cleanup |
| 3 RED | 4870cf4 | Session validation, concurrency, replay and rollback tests |
| 3 RED evidence | d5a3e15 | Supported isolated replay failure evidence accepted by the runtime classifier |
| 3 GREEN | bed9038 | Shared field rules, atomic/idempotent creation, guard ordering and dated read seam |

## Verification

Fresh final checks after the last source change:

- `npm run test -- --maxWorkers=1`: **10 files, 45 tests passed**, exit 0, 33.36 seconds.
- `npm run lint`: exit 0.
- `npm run build`: exit 0, TypeScript compilation and production Vite bundle completed.
- `git diff --check`: clean for changed source.
- Schema, migrations and package-lock diff: empty; dependencies are unchanged. The sole package script addition is `admin:provision`.
- Real-file migration and process restart are exercised by the integration suite. The publication tracer was also rerun successfully before expansion.
- Optional Playwright spec is retained and typechecked. No Chromium installation, browser MCP call, browser run or visual acceptance result is claimed.

## TDD Gate Compliance

Task 2's complete TAP report records 15 tests, twelve passing and three planned throttling failures. The named sixth-email-attempt test executed and expected 429 while receiving 200. `check tdd-red-evidence` returned `RED_EVIDENCE_OK` before production hardening.

Task 3's full report exposed four intended gaps. The classifier could not parse Vitest's multiline object diagnostics, so the replay assertion was rerun alone with the supported TAP reporter. Its complete report records one executed assertion failing on expected 200 versus actual 400 and six test-selection skips, with no fixture or collection failure. The runtime returned `RED_EVIDENCE_OK` before implementation; all seven integration tests run and pass in GREEN. Evidence is preserved in `tests/support/evidence/01-02-{auth,session}-red.json`. No production refactor was needed.

An initial CLI test syntax error was corrected before collecting the accepted Task 2 RED report. An early Task 3 test commit contained the rejected report; the follow-up RED evidence commit contains the accepted report. Neither invalid report authorized production changes.

## Deviations from Plan

1. **User override:** Browser/e2e execution and visual acceptance are manual pending. This does not block the authorized implementation; coverage D9 records `human_judgment: true`.
2. **[Rule 2 - Missing critical functionality] Authorization before body parsing:** Global JSON parsing could return 400/413 to anonymous admin mutations before authorization. Moved admin parsing behind authentication and mutation guards; added malformed/oversized anonymous and malformed-CSRF denial assertions. Files: `server/app.ts`, `server/auth/auth.router.ts`, `server/features/admin/admin.router.ts`, `tests/integration/admin-auth.test.ts`. Commit: bed9038.
3. **[Rule 3 - Blocking dependency] Dated schedule read seam:** The inherited page ignored `?date=`, preventing the future-date publication tracer from displaying its session. With orchestration ownership explicitly extended, connected `useSearchParams` to an encoded API date query and the abortable effect's dependency. File: `src/features/public/schedule/SchedulePage.tsx`. Commit: bed9038. Browser acceptance remains pending.
4. **Execution tooling:** Sandbox process/Git restrictions required scoped escalation. Sequential execution stayed on `gsd/phase-01-publish-and-browse-sessions`; each commit asserted the pinned root/branch and used explicit paths with `--only`. The unrelated staged baseline CSS was preserved.
5. **Evidence format:** Added persisted RED evidence files and one supplementary test commit to satisfy the canonical TDD evidence gate.
6. **Metadata ownership:** The orchestrator owns STATE, ROADMAP and REQUIREMENTS updates; this executor writes and commits its SUMMARY only. Required defect-register calls recorded the two manual verification items in WINDOWS for orchestration follow-through.

## Manual Acceptance Pending

- Assess the signed-out schedule at the published date, including phone/intermediate widths, visible text states, keyboard/focus and the Antislop Delivery Gate. Read-side API and production bundle checks passed; UI acceptance has not.
- Assess the hidden interactive provisioning prompt on the actual operator terminal. Stdin account creation, update, deactivation and password/hash output secrecy passed the CLI tests.

These items are recorded in the cross-phase WINDOWS register. There are no skipped source tests or known implementation stubs in this plan. The existing Phase 1 zero-booking occupancy seam remains intentionally reserved for Phase 2.

## Decisions Made

All admin guards precede body parsing. Shared rules remain browser-safe while Zod and Prisma remain server-only. Existing SQLite tables and pinned dependencies support the complete implementation.

## Issues Encountered

An existing npm user configuration warning for `msvs_version` appeared during commands; it does not affect passing verification and was outside this plan. No authentication gate occurred. No threat surface beyond the plan's registered admin API, CLI and SQLite boundaries was introduced.

## Metrics

The persisted pre-plan HEAD ledger measures six commits through bed9038. The realized UTF-8 diff contains 79,067 characters, producing `ceil(chars / 4) = 19,767` estimated tokens across 34 changed files. This uses the plan estimate's character scale, excluding the subsequent summary metadata commit.

## Next Plan Readiness

Admin browser plans can use sign-in/session/sign-out, session options and publication contracts. Guided forms can reuse the shared limits and field codes. Reference/class management routers must mount after the existing admin guards.

## Self-Check: PASSED

All 34 changed artifacts and the SUMMARY exist. Every recorded task/TDD commit is an ancestor of HEAD. STATE, ROADMAP and REQUIREMENTS have no executor changes.
