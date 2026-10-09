---
phase: 01-publish-and-browse-sessions
plan: 05
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
browser_acceptance: manual-pending
---

# Plan 01-05: Schedule dates and states

The existing schedule implementation is closed out at source level: WIB today, bounded seven-date navigation, server-provided next date, URL selection, abortable date loading, static placeholders, truthful empty/error states, localized exact prices and availability, and labeled sample data. The approved react-day-picker Club Calendar supersedes the original native-input proposal. The phone calendar now has a named Close action and fluid day tiles; its minimum day width is 44px at the narrowest supported width, with 48px height, to fit seven days without sideways page overflow. Larger widths retain 48px tiles.

Added `tests/e2e/schedule-dates.spec.ts` and `schedule-states.spec.ts` for date consistency, rapid changes, server next-date navigation, loading/error/retry, zero/one/many, missing facts, long text, widths, and both languages. Browser specs are typechecked and remain unrun under the user's standing instruction.

Non-browser date/window/range, formatting, availability and persistence checks run in the final full suite. Final evidence and shared Antislop source/runtime checklist: [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). No browser, keyboard, physical-phone or visual PASS is claimed. Requirement acceptance remains pending.
