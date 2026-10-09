---
phase: 01-publish-and-browse-sessions
plan: 09
status: implementation-complete-manual-acceptance-pending
completed: 2026-10-09
browser_acceptance: manual-pending
---

# Plan 01-09: Class defaults

Classes lists each class's level, venue, duration, exact IDR price, participant limits and every default coach. Add/Edit forms use labeled Radix selects, integer text inputs with numeric keyboards and a vertical native-checkbox coach checklist. Label hit areas are at least 48px high; unavailable selections remain visible for correction. Loading/error states retain selection and do not falsely call an unfinished options request empty. The future-only explanation appears before save.

Strict authenticated/CSRF-protected APIs validate defaults using the shared session limits, enforce reference existence and ordered distinct coaches, normalize unique names, replay create request IDs and version-match updates. Field updates and coach replacement commit together. Class service never reads/writes session or session-coach delegates: changing defaults cannot propagate to already published sessions. Save/discard/conflict behavior reuses the reference form patterns. Navigation now has Sessions, Classes, Manage, with no future-operation tabs.

Added `class-rules.test.ts`, `admin-classes.test.ts` and `admin-classes.spec.ts`. Integration evidence includes unchanged session and coach rows after a class-default edit, same-version competing writers, injected rollback, duplicate names and invalid references/limits/coaches. Browser specs include persistence, zero/one/many/long coaches, loading/error preservation, unavailable saved selections and responsive forms; these are typechecked, not run.

Final evidence and Antislop source/runtime checklist: [01-PHASE1-REVIEW.md](01-PHASE1-REVIEW.md). Runtime E7/E8/E9/E11 checks, both languages/themes, keyboard and phone comfort remain pending.
