## Planning References

- `.planning/PROJECT.md`: product context and constraints.
- `.planning/REQUIREMENTS.md`: all 67 approved first-release requirements and phase traceability.
- `.planning/ROADMAP.md`: approved five-phase vertical MVP roadmap.
- `.planning/STATE.md`: current workflow position; no implementation has started.
- `.planning/UI-BRIEF.md` and `PRODUCT.md`: confirmed Community matchday direction, novice-friendly phone workflows, and code-led build preference.

Mobile-first, Indonesian/English, text-based states, and private booking/payment access apply from each relevant workflow's first delivery. Later acceptance phases verify the integrated experience. Resolve listed operating policies before their dependent implementation; do not silently change the five-hour hold, proof-review protection, or pending-inclusive minimum counts.
<!-- GSD:project-start source:PROJECT.md -->

## Project

**Lafu — Lawu Fun Tennis Club**

A mobile-first web application for Lawu Fun Tennis Club (Lafu), replacing a shared schedule spreadsheet and WhatsApp booking workflow with customer self-service and an operational admin portal. Visitors can explore the club and browse schedules without signing in, then reserve places, pay by static QRIS or bank transfer, and submit payment proof from their phones. Customers and administrators can use the application in Indonesian or English, with expanded layouts on tablets and desktops.

**Core Value:** Customers can book tennis classes from their phones with clear, reliable availability, while club admins can manage those bookings and payments without spreadsheets.

### Constraints

- **Mobile-first design**: Both customers and admins primarily use phones. Information architecture, navigation, touch targets, forms, schedule views, booking steps, and verification workflows must be designed around small screens and comfortable one-handed use.
- **Cross-device support**: Tablet and desktop experiences are required and should expand the mobile experience.
- **Public access**: Club discovery and schedule browsing must not require login.
- **Capacity integrity**: Temporary reservations, group bookings, proof submission, admin bookings, expiry, and cancellations must maintain accurate availability and prevent overbooking.
- **Reservation deadline**: The original unpaid reservation window is five hours; rejected proof does not reset it.
- **Payment**: Initial payments and refunds use manual handling. The architecture must allow future payment providers without requiring gateway integration now.
- **Product identity**: The application should feel like a focused tennis club product, with clear booking states and simple daily operations.
- **Language**: Both the customer experience and the admin portal support Indonesian and English; interface labels and booking/payment messages must retain their meaning in both languages.
- **Architecture decisions**: Framework selection, database and API design, infrastructure, and implementation details will be defined separately. The existing starter is context, not a finalized architecture decision.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

No implementation stack has been selected. The workspace contains a React, TypeScript, and Vite starter; it has no tennis booking capabilities. Evaluate the advisory candidates in `.planning/research/STACK.md` during phase discussion/planning. Research candidates are not approved dependencies or architectural decisions.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Tennis booking architecture is not yet defined. Select and record it during phase discussion/planning, preserving the approved reservation, capacity, payment-review, and minimum-participant rules.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `$gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `$gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- antislop:start -->
## UI Design and Validation

Impeccable supplied Lafu's UI brainstorming and confirmed Community matchday brief. Use `.planning/UI-BRIEF.md` and `PRODUCT.md` as direction for later UI planning and implementation. The user selected Antislop during planning and building in this project conversation.

For UI planning, building, or validation, read the installed skills:

- Core: `C:/Users/MSI KATANA/.agents/skills/antislop/SKILL.md`
- Visual/interface checks: `C:/Users/MSI KATANA/.agents/skills/antislop-ui/SKILL.md`
- Mobile layout checks: `C:/Users/MSI KATANA/.agents/skills/antislop-layoutmobile/SKILL.md`

Follow the core's mode-resolution rules; retain the explicit during-mode session choice when available and do not change global preferences. Use the confirmed direction in the design read and declare dials during detailed UI planning. Before delivering implemented UI, run the core Delivery Gate and applicable UI/mobile checklists with concrete evidence. Include working interactions, empty/loading/error states, mobile and intermediate widths, comfortable touch targets, safe areas, keyboard/focus, and readable text-based states. Browser/build checks and complete customer/admin workflow verification remain necessary. No implemented Lafu UI has passed validation yet.
<!-- antislop:end -->
