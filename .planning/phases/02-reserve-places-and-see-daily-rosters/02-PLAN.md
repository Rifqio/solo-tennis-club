# Phase 2 execution plan

Date: 2026-10-09. Status: 02-00 backend foundation and 02-01 customer access source verified; 02-01 manual UI acceptance pending; 02-02 reservation implementation next. Scope: 19 approved Phase 2 requirements. User-approved operating decisions: [02-CONTEXT.md](02-CONTEXT.md). Mock OTP is authorized for this development milestone; real delivery is a full-phase release gate.

## Execution checklist and dependency order

| Slice | Requirement acceptance owners | Depends on | Vertical outcome |
| --- | --- | --- | --- |
| [02-00](02-00-PLAN.md) | Structural prerequisite; no requirement acceptance | Accepted Phase 1 | Existing backend follows readable controller/service/repository layers |
| [02-01](02-01-PLAN.md) | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 02-00 | Customer enters phone, receives development code, verifies it, completes name, signs in/out and resumes booking intent |
| [02-02](02-02-PLAN.md) | BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-08 | 02-01 | Individual/group booking from public details to review and a durable, capacity-safe reservation |
| [02-03](02-03-PLAN.md) | BOOK-06, BOOK-07, BOOK-09 | 02-02 | Private booking list/details with original deadline, restart-safe expiry and accurate availability |
| [02-04](02-04-PLAN.md) | OPER-01, OPER-02, OPER-03, OPER-04, OPER-06 | 02-03 | Admin opens dated sessions, participant rosters, incoming bookings and private customer details |
| [02-05](02-05-PLAN.md) | OPER-07 | 02-04 | Admin records a WhatsApp/walk-in booking, links it to the verified customer and completes integrated acceptance |

- [x] 02-00 backend foundation; build/lint and 137 tests passed.
- [x] 02-01 customer access and development OTP source; build/lint and 161 tests passed.
- [ ] 02-01 user manual UI acceptance; see [manual checks](02-01-MANUAL-CHECKS.md).
- [x] 02-02 atomic group reservation and guided customer flow source implemented; build/lint pass, manual/concurrency acceptance pending.
- [ ] 02-03 private booking lookup and durable expiry.
- [ ] 02-04 daily admin rosters and booking visibility.
- [ ] 02-05 admin admission, explicit account linking and integrated development acceptance.
- [ ] Real OTP provider/channel selection and integration; actual AUTH-02 delivery acceptance before Phase 2 release completion.

The five capability slices execute serially after the completed 02-00 structural prerequisite. Each owns server contracts, migrations where needed, UI, localization, tests and documentation for its vertical outcome. Structural cleanup establishes no product requirement acceptance. Capacity and basic effective expiry are enforced from 02-02's first delivery; 02-03 adds the worker and full deadline/recovery experience.

## Shared implementation contract

Follow [backend conventions](../../BACKEND-CONVENTIONS.md) for layer boundaries, readable functions and transaction scoping. Use [02-ARCHITECTURE.md](02-ARCHITECTURE.md) for identity separation, typed endpoint shapes, booking snapshots, transactional admission, retry and account-linking behavior. Use [02-UI-BRIEF.md](02-UI-BRIEF.md) for paths, labels, grouped fields, action hierarchy, motion and recovery. Use [02-VALIDATION.md](02-VALIDATION.md) for falsifiable acceptance scenarios.

Preserve Phase 1 admin/public APIs and the customized calendar/time fields. New customer APIs and cookies are separate from admin identity. Customer booking writes and admin writes call the same reservation service. Public schedule/detail and admin capacity edits must use the same real occupancy projection. Never return private booking/customer data through public DTOs.

## Definition of development milestone complete

All six source plans are implemented, each relevant check passes, the full build/lint/test suite passes, and the user confirms the phone-complete ID/EN customer/admin workflows. Browser specifications are authored/type checked; no browser automation runs while the standing opt-out remains active. Record user evidence accurately. No production OTP, payment approval or final Phase 2 release acceptance is implied.

## Planning review completed

Reviewed against all 19 requirement IDs, existing schema/routes/occupancy/auth seams and the user's policy answers. Cold-read questions resolved: what starts a hold, what happens at the cutoff, what retries return, who can see a booking, how admin contact becomes verified ownership, and how mock OTP differs from release acceptance. 02-00 applies the user-requested backend refactor; feature implementation and provider calls remain separate.
