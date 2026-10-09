# Phase 1: Publish and Browse Sessions - Context

**Gathered:** 2026-10-08
**Status:** Discussion record retained; Phase 1 now executing. Confirmed architecture is in 01-SKELETON.md; DESIGN.md owns the later Jalur Lawu visual system. Proposed continuation: 01-DESIGN-BLUEPRINT.md (2026-10-09). Earlier open-architecture statements below describe the discussion-time position.

<domain>
## Phase Boundary

Visitors can explore Lafu and browse complete dated session information without signing in. Authorized administrators can manage classes, dated sessions, coaches, venues, levels, prices, participant minimum/maximum, venue assignment, and multiple coaches. This is a mobile-first, bilingual vertical slice.

The approved Phase 1 requirements are DISC-01 through DISC-05, AUTH-06, SCHED-01 through SCHED-02, and SCHED-04 through SCHED-09 (14 requirements). Customer identity/reservations and rosters belong to Phase 2; payment review to Phase 3; booking/session cancellation and refunds to Phase 4; recurrence and minimum-cutoff automation to Phase 5. Public cancelled-state presentation is defined here without moving cancellation operations into this phase.

No phase-specific SPEC.md exists. The approved roadmap and requirements remain the scope authority. The discussion clarified behavior; the later planning clarification selects SQLite and Prisma. Framework, API, and hosting choices remain for technical planning.
</domain>

<decisions>
## Implementation Decisions

### Customer starting screen and session details

- **D-01:** Open directly on schedules, with a compact Lafu header, date navigation, and upcoming sessions. Club information remains easy to reach; do not require an introductory page before browsing.
- **D-02:** Select today by default in the club timezone. If today has no sessions, explain that clearly and offer a shortcut to the next scheduled date. Quick date navigation and a date picker remain required.
- **D-03:** Use compact schedule summaries: time, class/level, venue, price, remaining places, and availability state. Full session details include date/time, all coaches, level, venue, price per place, minimum participants, maximum capacity, and remaining places.
- **D-04:** Tapping a session opens a bottom sheet over the schedule. Longer detail content scrolls within the sheet. Preserve the selected schedule date and context when closing it; a dedicated detail page was considered and not selected.

### Creating and publishing sessions

- **D-05:** Saving a complete, valid session publishes it immediately. Do not add a draft/publication workflow.
- **D-06:** New sessions prefill editable class defaults for level, duration, price, minimum/maximum participants, venue, and coaches. Admins can override those values for the individual session.
- **D-07:** Later changes to class defaults affect newly created sessions only. Existing sessions retain their values and are edited individually; do not propagate default changes automatically, even to unbooked sessions.
- **D-08:** Manage coaches, venues, and levels in their separate management screens. Do not embed new-item creation forms within session creation.

### Availability labels and schedule settings

- **D-09:** Nearly full means a positive remaining-place count that is at most 25% of maximum capacity. Show the exact count too. Zero remaining places means fully booked; cancelled status takes precedence over availability labels. Use the ratio directly rather than inventing a different rounding threshold.
- **D-10:** Keep cancelled sessions visible in the public schedule, clearly labeled Cancelled and unavailable for booking. Do not silently remove them from that date's schedule.
- **D-11:** Session dates and times use WIB (UTC+7), the club timezone.
- **D-12:** Prices use Indonesian rupiah (IDR).
- **D-13:** Start in Indonesian on the first visit, provide an easy English switch, and remember the selected language. Do not default to browser language or English.

### Admin access and phone navigation

- **D-14:** Configure a fixed set of designated admin accounts during setup. Adding admins later is handled through setup; no in-app invitation flow is requested. Public customer signup must not grant admin access.
- **D-15:** Admins sign in with email and password. This does not change the approved customer phone-OTP booking flow in Phase 2.
- **D-16:** Create and edit sessions through short guided steps, one group of fields at a time, ending with review and save. Prefill class defaults. Publication occurs on the final valid save, not during intermediate steps.
- **D-17:** Use visible bottom navigation on phones to move between available admin destinations. Show only destinations that have working functionality in the current phase; do not add dead Bookings or Payments destinations ahead of their implementation.

### Carried-forward product and validation decisions

- **D-18:** Both customer and admin workflows are mobile-first and usable on phones, with tablet/desktop layouts expanding the same actions. Both surfaces support Indonesian and English from their first delivery. Text accompanies status colors, and touch targets, safe areas, keyboard/focus, contrast, and empty/loading/error states need validation.
- **D-19:** Impeccable supplied the confirmed Community matchday brainstorm and UI brief; the build preference is code-led, without generating a mockup first. Use Antislop core, UI, and mobile-layout skills during planning and building. Declare the design read and dials during detailed UI planning and run the Delivery Gate/checklists with evidence before delivering implemented UI. No UI pass is claimed by this context.
- **D-20:** Keep public browsing unauthenticated and private participant/customer/payment data out of it. Preserve capacity integrity, including safe capacity edits. Later phases retain the agreed five-hour unpaid hold, submitted-proof review protection, original-deadline correction, atomic group reservations, and pending-inclusive minimum counting.

### Implementation choices remaining for research and planning

- **D-21 (planning clarification, 2026-10-08):** Start with SQLite as the database. The user excludes Supabase; earlier service recommendations are superseded. Keep the SQLite file server-side behind the application API.
- **D-22 (planning clarification, 2026-10-08):** Use Prisma as the ORM. Choose a compatible release and SQLite adapter during setup, apply actual migrations, and verify real persistence. ORM use does not replace transactional capacity checks or server authorization.
- **D-23 (UI-phase clarification, 2026-10-08):** Initialize shadcn/ui with Tailwind CSS as the component foundation. Heavily customize each used component for Lafu rather than shipping default shadcn styling or a generic dashboard. Preserve accessible behavior while tailoring composition, type, spacing, shapes, states, and phone interactions to the confirmed brief. The user authorized initialization and then delegated the preset choice. The agent selected official preset `b2YOAa` with Radix, Nova, neutral base, green baseline theme, Inter, Lucide, and default radius. Setup defaults do not replace Lafu's final design contract.
- **D-24 (UI-phase clarification, 2026-10-08):** Match the Community matchday palette the user referred back to: club green `#164D45`, white `#FFFFFF`, ink `#1D252C`, and pale green `#EDF4F1`, from `.impeccable/decisions/lafu-direction.json` option `model-pick`. Use these as brand colors; contrast-tested semantic/status colors and roles are detailed in UI-SPEC. Do not allow a setup preset to replace the agreed palette.

Select the remaining technical implementation through research/planning rather than treating the starter or advisory research as an approved stack. Open implementation choices include admin authentication/provisioning and recovery mechanics, API ownership, deployment, exact navigation labels/routes, bottom-sheet accessibility and larger-screen adaptation, field validation, and final design tokens/components. SQLite and Prisma are selected; no hosted database provider or final framework has been selected.

Club descriptions, actual coaches/venues/levels, prices, session data, logo, and photos have not been supplied. Use honest labeled fixtures/placeholders when necessary; do not invent production content, promotional claims, or attendance. Snapshot the selected class defaults into stable dated-session values so later booking/recurrence work can preserve existing sessions.
</decisions>

<canonical_refs>
## Canonical References

Downstream agents must read the relevant references before research, planning, or implementation. Paths are relative to the project root.

### Approved product and phase scope

- `.planning/ROADMAP.md`: Phase 1 boundary, acceptance criteria, sequencing, and delivery rules.
- `.planning/REQUIREMENTS.md`: Approved requirements and the 14 Phase 1 IDs; exclusions and still-open policies.
- `.planning/PROJECT.md`: Club context, mobile/bilingual principles, capacity and payment rules, and deferred architecture choices.
- `AGENTS.md`: GSD workflow guidance and installed Antislop skill pointers.

### UI direction and evidence

- `.planning/UI-BRIEF.md`: Confirmed Community matchday direction, customer/admin hierarchy, and validation expectations. The specific choices above settle its open Phase 1 presentation questions.
- `PRODUCT.md`: Audience, novice-friendly booking goals, club identity, language, and AYO Android reference.
- `.planning/research/UI.md`: Publisher-screenshot analysis and limitations; the complete AYO checkout/admin flows were not verified.

### Advisory technical research

- `.planning/research/SUMMARY.md`: Domain findings, cross-phase dependencies, and risks; suggested topics are not a replacement roadmap.
- `.planning/research/STACK.md`: Candidate evaluation criteria, not selected dependencies.
- `.planning/research/ARCHITECTURE.md`: Advisory session/capacity/payment boundaries and stable occurrence considerations.

No external phase-specific spec or ADR was supplied during this discussion.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/main.tsx`: React root/StrictMode wiring is an integration point if the starter is retained.
- `package.json`: Existing Vite development/build scripts and TypeScript/ESLint toolchain provide a comparison baseline, not a locked architecture.
- Current React/Vite logos, framework hero image, and starter icons are framework-demo assets, not Lafu club assets.

### Established Patterns

- `src/App.tsx` contains only a local-state counter and framework links. No tennis components, route structure, customer/admin auth, session API, database, or translation layer exists.
- `src/App.css` and `src/index.css` use plain CSS, custom properties, nested selectors, and responsive rules. Their purple framework styling and starter layout are not an approved product design.
- No reusable session list, date picker, detail sheet, guided admin form, or admin navigation was found in the lightweight scout.

### Integration Points

- Replace or route the starter `src/App.tsx` with public schedules and authenticated admin surfaces after architecture selection.
- Establish shared dated-session data, authorization, and public-read/admin-write boundaries that later reservations can extend.
- Integrate bilingual resources and mobile-first layout conventions from the first relevant screen; do not postpone them to final acceptance.
</code_context>

<specifics>
## Specific Ideas

- Customer schedule summaries expose the decision-making facts quickly; the bottom sheet carries full coach and participant-limit information.
- Admin session forms use guided steps and a final review, while reference-data management stays separate.
- AYO Android publisher screenshots remain a mobile presentation reference. Do not copy its identity, marketplace, leagues, ratings, or public participant profiles.
- Later booking group names retain the approved Andy, Andy 2, Andy 3 convenience; this phase must not accidentally impose one participant per account in its session model.
</specifics>

<deferred>
## Deferred Ideas

No new feature ideas were introduced. Discussion stayed within Phase 1.

Already-roadmapped booking, OTP, payments, rosters, operational cancellation/refunds, recurrence, and automatic minimum checks remain in their approved later phases. Their unresolved policies are not silently settled here.
</deferred>

---
*Phase: 01-publish-and-browse-sessions*
*Context gathered: 2026-10-08; user approved saving after all four areas were summarized.*
