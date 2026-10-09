---
phase: 01-publish-and-browse-sessions
plan: 10
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
browser_acceptance: manual-pending
---

# Plan 01-10: Guided publication and safe editing

Sessions now offers Add session and Edit session. The four-step editor covers class/date/start/duration; level/venue/coaches; integer price/minimum/maximum; and review of every fact, coach and calculated end date/time. Class defaults are editable. Changing class after overrides requires explicit confirmation. Edits load saved session values rather than current class defaults. Contextual review actions return to a step without loss. No intermediate step writes to the server; the final save explains immediate publication and returns to the saved date with persistent row feedback.

Create drafts retain only allowlisted form values, owning admin, step and repeat-safe request ID in sessionStorage. Malformed drafts are ignored. Other admins cannot resume them; identity changes reset the mounted private outlet, and explicit sign-out clears the draft. Successful save and deliberate discard clear it. A missing-reference detour preserves the create draft. Edit drafts stay in memory, including same-admin reauthentication, without claiming reload durability. Credentials and CSRF tokens never enter the draft. Unsaved navigation/sign-out is guarded; in-flight saves cannot be discarded while pending.

Protected GET/PUT session APIs version-match and atomically replace coaches in submitted order. Occupancy is rechecked with the transaction client before a capacity edit. Maximum below occupied places, invalid minimum/maximum and missing references are rejected without mutation. Stale edits return latest facts and preserve local input until explicit replacement. Unchanged past date/time can be edited; moving it to a past time is rejected. Session status is preserved. Create retries retain the original request ID and use the existing repeat-safe publication service.

Added draft and safe-update tests, editor browser specs, and `phase1-acceptance.spec.ts` for UI-only setup of references/classes, publication, editing and signed-out bilingual details. Integration tests exercise competing writes, occupancy 5 rejecting maximum 4 and accepting 5, transactional rollback, reference validation, coach order and unchanged status. Browser specifications are typechecked but unrun.

Final evidence, Antislop checklist and the remaining phone acceptance steps: [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). Phase 1 has all implementation summaries, but its integrated UI/phone acceptance is not complete. No booking, OTP, payment, cancellation, refund, recurrence or minimum-cutoff behavior was added.

Follow-up on 2026-10-09: user-requested Antislop UI/UI UX Pro Max polish replaced native date/time controls, paired Back/Continue actions, moved the parent return above the form and added reduced-motion-aware interaction feedback. Fresh build, lint and 137 tests pass; the source gate and remaining manual review are in [01-UI-POLISH-REVIEW.md](01-UI-POLISH-REVIEW.md).
