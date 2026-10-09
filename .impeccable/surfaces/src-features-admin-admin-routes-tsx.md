---
version: 1
slug: "src-features-admin-admin-routes-tsx"
primary_target: "src/features/admin/admin-routes.tsx"
related_targets: ["src/features/admin/auth/SignInPage.tsx", "src/features/admin/shell/AdminLayout.tsx", "src/features/admin/sessions/AdminSessionsPage.tsx", "src/features/admin/sessions/SessionEditorPage.tsx", "src/features/admin/references/ReferenceFormPage.tsx", "src/features/admin/classes/ClassFormPage.tsx"]
---

# Lafu admin publishing and catalog management

Mode: Operate. Audience: designated club administrators on phones, maintaining the public timetable. Current job: sign in, manage reference records and class defaults, publish or safely edit a dated session, review its public facts, and sign out. Surfaces inherit the confirmed Phase 1 blueprint.

Visual authority: root DESIGN.md, Jalur Lawu. Green LAFU signboard, system reading type, Barlow Condensed time numerals, tonal sage plates, mist/night-forest surfaces, text-based states, 48px controls. ENERGY 2 / RHYTHM 2 / MOTION 2. Indonesian first with remembered English; light/dark follow the phone.

First viewport: access form when signed out; date selection, Add session and time-led factual rows in Sessions. Classes and Manage are working destinations. Forms focus on one record or one guided step, ending with a full session review. Bottom navigation below 640px, rail above. Bookings and payments retain later-phase ownership.

Behavior: server-backed auth, in-memory CSRF, expiry explanation and same-admin reauthentication on the same route, guarded sign-out/navigation, named empty/loading/error/saving states and sample disclosure. Creates retain request IDs for safe retry. Stale edits preserve input and offer explicit latest-value replacement. Class defaults affect future sessions only; capacity writes recheck occupied places transactionally. Allowlisted creation drafts are owner-scoped and cleared after save/discard/sign-out. Return paths stay within admin routes.

Evidence: all ten implementation summaries exist. 01-PHASE1-REVIEW.md records fresh build/lint, 137 automated tests, running-server smoke and source review. Browser, keyboard/focus, both themes, responsive runtime and physical-phone acceptance remain manual pending. No finish PASS is awarded from code alone.

Interaction polish: custom calendar and Radix hour/minute picker replace native date/time controls; direct formatted text entry remains. Parent Sessions return sits above the editor, with Back and Continue/Save paired below. Motion gives step changes directional feedback, admin content a short entrance and checkbox changes a drawn mark; dropdown chevrons and overlay entrances/exits echo state. Reduced motion removes feedback. 01-UI-POLISH-REVIEW.md records the itemized source assessment and manual checklist.

Acceptance update 2026-10-09: user confirmed all listed manual workflows. Phase 1 accepted; earlier source-only pending notes are historical. No browser automation or measured screenshot audit claimed. Temporary sign-in shortcut removed.
