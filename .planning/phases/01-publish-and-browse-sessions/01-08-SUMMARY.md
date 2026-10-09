---
phase: 01-publish-and-browse-sessions
plan: 08
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
browser_acceptance: manual-pending
---

# Plan 01-08: Reference management

Manage links to Coaches, Venues and Levels. Each has alphabetical list, Add, and Edit routes. Forms use visible bilingual labels; venues accept an optional address. Empty lists name the missing record and offer Add, with only one filled primary action. Lists disclose samples and show persistent saved feedback beside the affected row. Manage remains selected while editing a reference.

Protected GET/POST/PUT APIs normalize name keys, enforce 120-character names and 300-character addresses, reject case/whitespace duplicates, replay create request IDs, and reject stale versions with the latest record. Updates are transactional and increment the version. No delete routes are provided. Venue renames appear in existing public sessions.

Forms preserve values after validation, duplicate, network and save failures. Stale edits retain local values and show latest/yours until explicit replacement. Save prevents double submission. Unsaved in-app navigation and sign-out use a Radix discard confirmation with Keep editing initially focused; native unload warning protects reload/close. Navigation during an in-flight save cannot discard it before the result arrives.

Added `admin-references.test.ts`, `admin-references.spec.ts` and `admin-references-layout.spec.ts`. Non-browser verification covers authorization/CSRF, normalized duplicates, replay, create/read/update, version conflicts, bounds, no delete and public rename propagation. Browser specs are typechecked, not executed.

Final evidence and Antislop source/runtime checklist: [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). E7/E8/E11 runtime behavior, keyboard, widths, themes and physical-phone form comfort remain pending.
