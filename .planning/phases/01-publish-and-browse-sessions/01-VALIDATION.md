---
phase: "01"
slug: "publish-and-browse-sessions"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-08"
---

# Phase 1 - Validation Strategy

Draft contract seeded from SQLite/Prisma research. No executable plans or test files exist yet. Task IDs, threat IDs, timings, and commands must be reconciled with the plans after the UI contract gate.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Proposed Vitest for logic/API/Prisma integration; Playwright for browser flows; releases unselected |
| Config file | None; setup must create configs and scripts |
| Quick run command | Proposed `npm run test -- --run` (not yet available) |
| Full suite command | Quick run, then proposed `npm run test:e2e`, plus existing `npm run lint` and `npm run build` |
| Estimated runtime | Unmeasured; target quick feedback below 60 seconds, measure during setup |
| Database | Disposable file-backed SQLite, selected Prisma adapter, actual migrations and test-only fixed admin |

## Sampling Rate

- After each implementation task commit: relevant automated checks; after setup, run the quick suite.
- After each plan wave: run database/API suite and browser flow suite.
- Before `$gsd-verify-work`: all full-suite checks must pass, plus required manual mobile/Antislop review.
- Feedback latency target: 60 seconds for quick checks; record measured browser-suite duration rather than claiming an estimate as evidence.

## Per-Task Verification Map

Plan/wave/task assignments and threat IDs are pending planning. These requirement groups do not claim delivered tests.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Pending | Pending | Pending | DISC-01, DISC-02 | Pending | Public access contains only safe session/club data | API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | DISC-03, DISC-04 | Pending | Correct WIB dates; all facts; safe text rendering | Logic + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | DISC-05 | Pending | Exact availability thresholds; cancelled precedence | Logic + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | AUTH-06 | Pending | Direct anonymous/non-admin API denial, valid fixed admin, revocation | API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-01, SCHED-02 | Pending | Atomic valid publication and session-owned defaults | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-04, SCHED-05, SCHED-06 | Pending | Protected writes preserve referenced session integrity | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-07, SCHED-08, SCHED-09 | Pending | Server validation, bounded prices, valid min/max, complete coach links | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |

## Wave 0 Requirements

- [ ] Pin compatible Prisma CLI/client/SQLite adapter and test packages; verify Windows/runtime support.
- [ ] Configure schema, server-only client, migrations, absolute database path, test fixtures, and trusted test-admin provisioning.
- [ ] Apply migrations to a fresh real SQLite file and verify a write/read after API restart. Client generation alone is insufficient.
- [ ] Establish Vitest configs/scripts and tests for availability/date logic, defaults snapshots, validation, API authorization, and Prisma persistence.
- [ ] Establish Playwright config/script and the real create-session-to-signed-out-public-view flow in both languages.
- [ ] Verify repeat-safe fixtures/provisioning and consistent SQLite backup/restore on a separate disposable file.
- [ ] Test simultaneous edits with independent requests/connections; preserve a concurrency-test seam for Phase 2 reservations.
- [ ] Resolve exact task/threat/test-path mapping during planning; prohibit unresolved template paths in executable verification commands.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Antislop delivery/UI/mobile checklists | DISC-01 through DISC-05; AUTH-06; SCHED-01 through SCHED-02 and SCHED-04 through SCHED-09 | Design judgment is not fully automated | Use confirmed brief and future UI-SPEC; attach concrete screenshots/interaction evidence; record failures honestly. |
| Comfortable guided use on a physical phone | Same Phase 1 workflows | Viewport emulation cannot establish one-handed comfort or real keyboard behavior | Browse dates, open/close long details, sign in, create/edit a session, manage references; verify readable labels, safe areas, focus and keyboard reachability. |
| Real club content review | DISC-01, DISC-04 | Club owns names, prices, venues and factual claims | Confirm supplied content; label development fixtures and exclude them from production data. |

## Validation Sign-Off

- [ ] All tasks have automated verification or an explicit setup dependency.
- [ ] No three consecutive tasks lack automated verification.
- [ ] Setup covers all missing commands, configs, and test files.
- [ ] No watch-mode verification commands.
- [ ] Quick feedback latency measured below 60 seconds.
- [ ] Manual phone and Antislop checks have evidence.
- [ ] `nyquist_compliant: true` set only after validation establishes it.

**Approval:** Pending. This draft records intended checks; none have passed yet.
