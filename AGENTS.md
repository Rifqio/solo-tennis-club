## Planning References

- `.planning/PROJECT.md`: product context and constraints.
- `.planning/REQUIREMENTS.md`: all 67 approved first-release requirements and phase traceability.
- `.planning/ROADMAP.md`: approved five-phase vertical MVP roadmap.
- `.planning/STATE.md`: current workflow position; Phase 1 accepted, Phase 2 customer-access source verified and manual UI acceptance pending.
- `.planning/UI-BRIEF.md` and `PRODUCT.md`: confirmed Community matchday direction, novice-friendly phone workflows, and code-led build preference.

Mobile-first, Indonesian/English, text-based states, and private booking/payment access apply from each relevant workflow's first delivery. Later acceptance phases verify the integrated experience. Resolve listed operating policies before their dependent implementation; do not silently change the five-hour hold, proof-review protection, or pending-inclusive minimum counts.
<!-- GSD:project-start source:PROJECT.md -->

## Project

**STC — Solo Tennis Club** (formerly Lawu Fun Tennis Club / Lafu; renamed 2026-10-10)

A mobile-first web application for Solo Tennis Club (STC), replacing a shared schedule spreadsheet and WhatsApp booking workflow with customer self-service and an operational admin portal. Visitors can explore the club and browse schedules without signing in, then reserve places, pay by static QRIS or bank transfer, and submit payment proof from their phones. Customers and administrators can use the application in Indonesian or English, with expanded layouts on tablets and desktops.

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
- **Persistence**: SQLite with Prisma is selected for the initial version. Supabase is excluded. Access the database only from server code and plan persistent local storage and backups.
- **Architecture decisions**: Framework selection, API design, infrastructure, and remaining implementation details will be defined separately. The existing starter is context, not a finalized architecture decision.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

The selected stack is React/TypeScript/Vite, Express 5 and Prisma 7.10 with SQLite; Supabase is excluded. Phase 1 public/admin workflows and Phase 2 development customer access are implemented. Customer bookings remain 02-02 work; real OTP delivery and hosted deployment are release prerequisites. Phase 1's 01-SKELETON.md supersedes earlier advisory stack research.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Backend code follows router → controller → service → repository within each feature. Use readable named functions, explicit inputs and small focused modules. Controllers handle HTTP; services own business decisions; repositories own Prisma queries. All repositories inside a service operation use the same transaction handle. Follow `.planning/BACKEND-CONVENTIONS.md`; ESLint enforces the main boundaries. The user requested best-practices and nodejs-backend-patterns on 2026-10-09.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Backend architecture follows feature-local controller/service/repository layers in `.planning/BACKEND-CONVENTIONS.md`. Phase 2 identity/booking contracts are in `.planning/phases/02-reserve-places-and-see-daily-rosters/02-ARCHITECTURE.md`; customer mock OTP is implemented, capacity-safe admission is next. Preserve the approved reservation, capacity, payment-review and minimum-participant rules.
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

Impeccable supplied STC's UI brainstorming and confirmed Community matchday brief. Use `.planning/UI-BRIEF.md` and `PRODUCT.md` as direction for later UI planning and implementation. The user selected Antislop during planning and building in this project conversation.

For UI planning, building, or validation, read the installed skills:

- Core: `C:/Users/MSI KATANA/.agents/skills/antislop/SKILL.md`
- Visual/interface checks: `C:/Users/MSI KATANA/.agents/skills/antislop-ui/SKILL.md`
- Mobile layout checks: `C:/Users/MSI KATANA/.agents/skills/antislop-layoutmobile/SKILL.md`

Follow the core's mode-resolution rules; retain the explicit during-mode session choice when available and do not change global preferences. Use the confirmed direction in the design read and declare dials during detailed UI planning. Before delivering implemented UI, run the core Delivery Gate and applicable UI/mobile checklists with concrete evidence. Include working interactions, empty/loading/error states, mobile and intermediate widths, comfortable touch targets, safe areas, keyboard/focus, and readable text-based states. Browser/build checks and complete customer/admin workflow verification remain necessary. No implemented STC UI has passed validation yet.
<!-- antislop:end -->
