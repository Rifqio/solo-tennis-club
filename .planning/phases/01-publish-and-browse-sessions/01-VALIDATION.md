---
phase: "01"
slug: "publish-and-browse-sessions"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-08"
updated: "2026-10-09"
---

# Phase 1 - Validation Strategy

Evidence reconciled on 2026-10-09. All ten plans have implementation summaries. Source implementation is complete; fresh build, lint and 137 tests pass. The current execution ledger and manual acceptance checklist are in [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). User manual workflow acceptance is confirmed; browser automation remains unrun. Detailed measured audit evidence is not supplied.

## Latest manual and regression evidence

- [x] User confirmed the temporary development shortcut opens admin after the tunnel fix (2026-10-09).
- [x] Actual running-server request using the configured HTTPS tunnel origin returned 200 with the labeled test admin; before the fix it returned ORIGIN_REJECTED.
- [x] Final full regression: 26 files, 137 tests passed in 18.91 seconds, including authentication, references, classes, safe editing, public details, persistence and backup. Production build and lint passed.
- [x] Running-server smoke: development sign-in 200; admin/public read routes 200; sign-out 204. No business records created.
- [x] User confirmed all listed manual workflow checks on 2026-10-09.
- [x] User reported manual phone/accessibility/interaction checks complete; exact devices/widths/screenshots not supplied.

The user's confirmation covers shortcut entry only. It does not close plan or phase acceptance.

## Current UI Validation Inputs

- D-23 requires custom treatment for every used shadcn component; the initialized preset is provenance, not the delivered styling contract.
- D-24 locks club colors to #164D45, #FFFFFF, #1D252C, and #EDF4F1. DESIGN.md owns the later Jalur Lawu tonal roles, typography, shapes, and responsive behavior; compatible UI-SPEC copy/state rules remain applicable.
- The final state-probe JSON records 78 applicable considerations, all explicitly resolved, zero unresolved or unclassified. The earlier 70 unresolved figure belongs to the initial probe. Resolved design checks are not runtime tests or browser acceptance.
- Setup build/lint evidence does not prove application UI, authentication, database behavior, or Antislop Delivery Gate acceptance. Implementation must provide fresh browser and operational evidence.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Installed Vitest for logic/API/Prisma integration; Playwright specs for browser flows |
| Config file | vitest.config.ts and playwright.config.ts; scripts exist in package.json |
| Quick run command | `npm run test` (Vitest run, no watch mode); target relevant files during implementation |
| Full suite command | `npm run lint`, `npm run build`, `npm run test`; browser specs remain unrun under the user's standing instruction |
| Estimated runtime | Latest full Vitest run: 18.91 seconds; browser duration unmeasured |
| Database | Disposable file-backed SQLite, selected Prisma adapter, actual migrations and test-only fixed admin |

## Sampling Rate

- After each implementation task commit: relevant automated checks; after setup, run the quick suite.
- After each implementation group: run relevant database/API checks; add browser evidence only if actually performed. Do not launch browser automation under the standing instruction disabling it.
- Before Phase 1 acceptance: automated checks must pass, plus recorded manual mobile/browser interaction and Antislop review. No GSD command is required for the user-authorized direct workflow.
- Feedback latency target: 60 seconds for quick checks; record measured browser-suite duration rather than claiming an estimate as evidence.

## Historical Initial Verification Map

This table preserves the initial pre-plan grouping, not the current execution ledger. Exact tasks, threat registers, and planned tests now live in the ten PLAN files; completed-plan SUMMARY files own historical results. The old setup-required cells below are not a current file inventory.

Existing integration evidence paths include tests/integration/public-schedule.test.ts, public-schedule-range.test.ts, persistence.test.ts, bundle-boundary.test.ts, admin-auth.test.ts, admin-provision-cli.test.ts, admin-publish-restart.test.ts, session-create.test.ts, backup-restore.test.ts, and seed-sample.test.ts. Existing browser specs cover public layout, club language, schedule tracer, and publication tracer; execution remains pending. Reference/class/update/detail integration tests now pass. Guided-flow and responsive browser specifications are authored and type checked; browser execution remains manual pending.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Pending | Pending | Pending | DISC-01, DISC-02 | Pending | Public access contains only safe session/club data | API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | DISC-03, DISC-04 | Pending | Correct WIB dates; all facts; safe text rendering | Logic + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | DISC-05 | Pending | Exact availability thresholds; cancelled precedence | Logic + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | AUTH-06 | Pending | Direct anonymous/non-admin API denial, valid fixed admin, revocation | API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-01, SCHED-02 | Pending | Atomic valid publication and session-owned defaults | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-04, SCHED-05, SCHED-06 | Pending | Protected writes preserve referenced session integrity | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |
| Pending | Pending | Pending | SCHED-07, SCHED-08, SCHED-09 | Pending | Server validation, bounded prices, valid min/max, complete coach links | Prisma/API + browser | Proposed quick suite + E2E | No; setup required | Pending |

## Historical Setup Checklist

Preserved for provenance. Migrations, runtime configuration, Vitest, provisioning, backup/restore, and initial Playwright infrastructure are delivered in completed plans. Versioned edits and integrated browser/phone evidence remain required; this design pass does not backfill acceptance ticks.

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

**Phase acceptance:** Accepted by user on 2026-10-09 after the manual workflow checklist. Agent browser automation remains unrun. Formal validation metadata remains false: user acceptance does not establish a separate Nyquist audit or measured visual/accessibility evidence. Real club content and production-launch checks remain open.

## Acceptance record

User confirmed "All tested manually" on 2026-10-09 after the seven-item workflow checklist. This is user-reported manual acceptance; no agent browser run, screenshots, device inventory or exact viewport measurements were supplied. Real club content/production launch checks remain separate.
Temporary sign-in shortcut removed after testing; normal credentials are required and legacy mock cookies are rejected.

Fresh cleanup evidence: production build and lint PASS; 26 test files and 137 tests PASS in 19.96 seconds. Authentication tests now cover removed shortcut denial, blank/partial credential denial, legacy mock-cookie rejection in both modes and normal-credential tunnel sign-in/sign-out.
