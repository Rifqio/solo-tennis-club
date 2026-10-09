---
phase: 01-publish-and-browse-sessions
plan: 07
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
browser_acceptance: manual-pending
---

# Plan 01-07: Public session details

Schedule rows open a Radix modal sheet over the existing date and scroll position. Phones use a bottom sheet; wider screens use a centered dialog capped at 40rem. Its named Close action stays above internally scrolling facts. Escape/overlay dismissal and focus trapping come from Radix; close returns focus to the row, with a selected-date heading fallback if the row disappeared. Existing global reduced-motion rules apply to the short opening transition. Language can change inside the sheet without changing the session.

`GET /api/public/sessions/:id` validates IDs and returns an explicit public allowlist: summary facts, all coaches in saved order, duration, minimum, maximum, and optional venue address. The address extends the original plan DTO to match the confirmed blueprint. No admin/audit/idempotency/version/private-booking fields are returned. API results disable caching. Missing/partial facts read as unavailable, never fabricated zeroes; malformed date/time facts do not crash rendering. Cancelled sessions explain their state without advertising remaining places. Sample disclosure also follows sample references used by a newly published session.

Added public-detail integration and exact availability boundary tests, plus `session-detail.spec.ts` and `availability-states.spec.ts`. Tests cover the DTO allowlist, malformed/unknown IDs, coach order, sample derivation and quarter-capacity boundary. Browser specifications cover complete/partial/loading/error/retry, Close/focus, long lists, language changes and responsive widths; they remain unrun.

Final evidence and shared Antislop source/runtime checklist: [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). Runtime sheet comfort, keyboard, focus, themes and screen-reader behavior remain manual pending.
