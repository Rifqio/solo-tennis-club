# Stack Research: Lawu Fun Tennis Club (Lafu)

**Domain:** Mobile-first tennis class booking and club operations  
**Researched:** 2026-10-07  
**Confidence:** MEDIUM  
**Decision status:** Historical advisory comparison. On 2026-10-08 the user selected SQLite with Prisma and excluded Supabase. The earlier PostgreSQL/Supabase shortlist below is superseded for initial persistence. Use Phase 1 context and research for the current direction; framework/API/hosting and exact dependency versions remain open.

## Scope and evidence

The user-confirmed requirements are public browsing, customer and admin workflows on phones, group bookings, five-hour unpaid capacity holds, manual QRIS/bank transfer, private payment-proof uploads, admin verification, WhatsApp or SMS OTP, recurring sessions, multiple coaches, attendance minimums/maximums, and manual refund tracking. Both customer and admin interfaces must support Indonesian and English. The club name is Lawu Fun Tennis Club, also called Lafu. These are product inputs, not conclusions from vendor documentation.

This document recommends evaluation priorities and identifies realistic implementation candidates. It does not select a stack, authorize migrations, install dependencies, or settle an API design. Recommendations are engineering judgments applied to the requirements; linked capability claims come from current official documentation. The research seam returned MEDIUM for `websearch --verified`, which is the conservative confidence tier used throughout. Production delivery, hosting behavior, and compatibility still need project-specific verification.

## What the product requires from a stack

| Product rule | Capability to evaluate | Why it affects selection |
|-------------|------------------------|--------------------------|
| Several customers and admins can book the last places concurrently | Short database transactions, a deliberate concurrency strategy, and duplicate-command protection | A group reservation must either acquire all requested places or fail without a partial booking |
| Unpaid holds expire after five hours | Persisted original deadline, authoritative server time, scheduled reconciliation | Browser timers and process memory cannot preserve the deadline when clients disconnect or servers restart |
| Submitted proof keeps places reserved during review | Explicit booking/payment transitions with transactional checks | A blanket expiry job must distinguish unpaid bookings from proof awaiting review |
| Rejected proof uses the original deadline | Same original deadline across submissions; release if already past it | Rejection and upload cannot renew the hold accidentally |
| Mobile proof upload and admin review | Private object storage, limited access, upload size/type rules, phone-friendly previews | Payment screenshots can contain customer financial information |
| Optional minimum-attendance cancellation | Durable scheduled execution and an auditable, repeatable decision | Group places count individually; confirmed and active pending places count toward the minimum |
| Phone OTP and automatic account creation | Managed verification, abuse controls, persistent application identity | Choosing an OTP transport alone does not provide customer sessions, roles, or account recovery |
| Indonesian and English throughout | Translation resources, fallback handling, localized validation/status messages | Admin screens and server-driven failures need the same coverage as customer pages |
| Public discovery and schedules | A conscious rendering and cache strategy | Marketing content and live remaining capacity have different freshness needs |

These are evaluation criteria, not a proposed schema. PostgreSQL's documented row locks and transactions establish one credible way to meet the concurrency criteria. An implementation must still prove its complete booking transaction under concurrent requests. [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html), [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

## Existing starter and version policy

The current `package.json` declares the following ranges. They describe the workspace, not externally verified newest releases or a production version decision.

| Technology | Declared locally | Meaning for later evaluation |
|------------|------------------|------------------------------|
| React / React DOM | `^19.2.8` | A React interface already exists; reuse is a reasonable baseline |
| TypeScript | `~6.0.2` | Preserve types where useful; confirm candidate library/compiler compatibility |
| Vite | `^8.3.0` | Existing build tooling; retaining it avoids an otherwise unnecessary build migration |
| `@vitejs/plugin-react` | `^6.1.1` | Check route-framework and compiler plugin combinations before adding them |
| ESLint | `^10.10.0` | Existing lint tooling; ecosystem integrations must match its supported version range |

The official Vite 8 announcement confirms the Vite 8 family and React plugin v6, including explicit React Compiler configuration. It lists Node.js minimums of 20.19+ or 22.12+. Those minimums do not settle a deployment runtime: choose a supported Node release after the backend and test tooling are known. [Vite 8 announcement](https://vite.dev/blog/announcing-vite8.html), [Node release lifecycle](https://nodejs.org/en/about/previous-releases).

Record exact versions and lockfile decisions during stack selection. For hosted services, record the offered database version, SDK/API version, region, and service configuration rather than assigning an invented platform version. No package installation list belongs in this advisory document.

## Frontend and rendering shortlist

| Candidate | Fit for Lafu | Additional responsibility | Selection trigger |
|-----------|--------------|---------------------------|-------------------|
| Retain React/TypeScript/Vite with a router in library/data mode | Most direct continuation of the starter; supports interactive customer and admin screens | Select the API/auth layer and decide how public content is rendered and indexed | Favor this when the booking application and operational workflow matter most and the team wants independent frontend/backend boundaries |
| React Router framework mode on Vite | Reuses React and Vite while adding route modules and framework-managed loading/rendering options | Adopt framework conventions and validate plugins; SPA mode still performs build-time rendering | Evaluate this when route-level data conventions or prerendered/SSR public pages are useful without replacing Vite |
| Next.js App Router | Credible React framework candidate when public rendering and colocated server request handlers are priorities | Replace Vite conventions; evaluate server/client boundaries, caching, deployment, and background-job hosting | Evaluate this when the team explicitly wants its full application model and public content strategy justifies migration |

React Router documents three additive modes and SPA, SSR, and static rendering strategies. Its framework SPA mode disables runtime SSR but renders the root at build time, so browser-only APIs need care during initial render. [React Router modes](https://reactrouter.com/start/modes), [SPA mode](https://reactrouter.com/how-to/spa).

Next.js documents HTTP Route Handlers, with request handlers uncached by default and optional GET caching. If evaluated, verify the chosen version's complete data-cache behavior against live availability. [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Next.js installation](https://nextjs.org/docs/app/getting-started/installation).

Research recommendation: use the existing starter as the first comparison baseline. Public browsing alone does not decide SPA versus SSR. Decide whether search visibility, social sharing, first-load performance, and content editing require a different rendering model before migrating. Mobile usability depends on the interface and network behavior across all three candidates; none removes the booking correctness work.

## Backend and persistence shortlist

### Integrated services versus an application-owned backend

| Candidate | Documented capabilities | Advantages for this product | Work still owned by the application |
|-----------|-------------------------|-----------------------------|-------------------------------------|
| Supabase-managed PostgreSQL, Auth, Storage, and Cron, with trusted booking commands | Full PostgreSQL database; phone authentication; private file access; scheduled SQL/functions/HTTP execution | A small team can evaluate several required services together while retaining relational data | Capacity transactions, role policies, proof lifecycle, admin authority, provider onboarding, observability, restore procedures |
| TypeScript backend such as Fastify, managed PostgreSQL, private object storage, managed OTP, and hosted scheduled execution | Fastify documents schema-based route validation/response serialization; PostgreSQL supplies concurrency primitives | Explicit control over booking commands and provider adapters; familiar TypeScript across frontend/backend | More service integration, deployment, auth/session design, scheduling, secrets, monitoring, backup ownership |

Supabase is a real PostgreSQL service rather than a separate document-database model; its database also supports functions and access policies. Its Cron service uses `pg_cron`, can execute SQL or invoke HTTP endpoints, and records job runs. Those capabilities make it a candidate, not proof that its default configuration satisfies Lafu's rules. [Supabase database](https://supabase.com/docs/guides/database/overview), [Supabase Cron](https://supabase.com/docs/guides/cron).

Fastify provides request and response schemas. That supports clear public/admin API boundaries if a separate service is chosen; route validation still needs application-level authorization and business checks. [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

Research recommendation: compare these two ownership models before comparing numerous hosting vendors. The deciding factors are the team's SQL and access-policy skills, desired control over identity/providers, and willingness to operate independent services. Next.js or React Router server handlers could host application-owned commands too; a frontend framework choice does not itself decide persistence or jobs.

### Database and access tooling

PostgreSQL is the strongest initial database candidate to evaluate because sessions, bookings, group participants, coaches, venues, proofs, and refund records have explicit relationships, and the product requires coordinated concurrent changes. This is a fit recommendation, not a database selection or a claim that other databases cannot implement the product.

The upstream current documentation opened on the research date resolves to PostgreSQL 18. Upstream support lasts five years per major version. Select a supported version offered by the eventual host; recheck support and extensions then. [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/).

| Access option | Useful when | Required evaluation |
|---------------|-------------|---------------------|
| SQL migrations and database functions | The team is comfortable enforcing the booking transaction close to data, including an integrated-service approach | Function permissions, migration reproducibility, transaction behavior, local testing |
| Drizzle | The team wants TypeScript with a relatively direct SQL model in an application-owned service | Selected driver, transaction/isolation behavior, migrations, escape hatches for locking |
| Prisma | The team prefers an ORM and generated data access | Selected release/API, driver/runtime compatibility, locking approach, retry and migration behavior |

Both Drizzle and Prisma document transactions. Neither choice replaces the application's concurrency design. Their current documentation should be checked against the exact selected release before using examples; do not assume an old API or error-code example remains applicable. [Drizzle transactions](https://orm.drizzle.team/docs/transactions), [Prisma transactions](https://www.prisma.io/docs/orm/fundamentals/transactions).

Keep capacity transactions short. A five-hour hold should be persisted application state, not a database transaction left open for five hours. PostgreSQL explicitly warns against holding transactions while waiting for user input. [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## Authentication and OTP options

| Candidate | Verified fit | Choice left open |
|-----------|--------------|------------------|
| Supabase Auth with a supported delivery provider | Phone OTP sign-in supports SMS and WhatsApp; the current guide limits WhatsApp transport to Twilio/Twilio Verify integrations | Primary sign-in mechanism, chosen channel, provider setup, customer profile completion, admin authentication and account recovery |
| Application identity/session layer with managed verification such as Twilio Verify | Verify documents WhatsApp and SMS verification | Identity/session implementation, role management, linking/recovery, fallback UX, and provider operation |

Do not conclude that integrated auth forces SMS. The official Supabase guide explicitly supports WhatsApp through particular providers. [Supabase phone login](https://supabase.com/docs/guides/auth/phone-login).

Twilio's current WhatsApp Verify documentation requires a business sender. It also labels automatic WhatsApp-to-SMS optimal channel selection as a limited pilot. Therefore evaluate sender onboarding and the selected fallback mechanism explicitly; ordinary WhatsApp support does not guarantee that automatic routing feature. [Twilio Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp).

Research recommendation: evaluate managed verification before considering self-generated OTP infrastructure. Test actual club-country delivery, phone formatting, resend/attempt limits, interrupted mobile flows, and the account-creation path before committing to a provider. The club's existing WhatsApp booking habit is a reason to test WhatsApp OTP, not evidence of production readiness. OTP proves access to a phone number; the application must separately grant admin permissions. The exact main sign-in method remains open.

## Private payment proof and future payment providers

| Candidate | Verified capability | Product evaluation |
|-----------|---------------------|--------------------|
| Supabase private buckets | RLS-controlled access with authenticated download or time-limited signed URLs; bucket size/content restrictions | Ensure customers access their own proof and reviewers access authorized bookings; test upload and preview on phones |
| Amazon S3 or a separately evaluated object-storage service | S3 documents presigned uploads/downloads without giving the browser permanent credentials | Define per-booking access, allowed upload properties, limited URL lifetime, ownership checks, and object retention |

Public storage is unsuitable for payment evidence: Supabase explicitly states that public bucket retrieval bypasses access control. Signed links should be treated as access credentials for their lifetime. [Supabase buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).

Research recommendation: accept proof into durable private storage, then let a trusted command mark the booking as awaiting review. Define how interrupted uploads, duplicate submissions, and unused files are reconciled. The stack must support this sequence without pretending an object upload and database update are one atomic operation. File acceptance, size limits, and retention policy remain to be specified.

V1 needs payment instructions, proof submissions, admin decisions, outside-payment recording, and refund obligations. It does not need a payment gateway SDK. Keep a future provider boundary around recording payment evidence/results and reconciliation, while the booking service retains authority over capacity and cancellation. A later gateway can contribute verified provider results through that boundary. Manual approval must not be represented as provider settlement; marking a manual refund completed must not imply the application transferred money. This is an architecture evaluation criterion, not a chosen adapter contract.

## Localization and supporting library candidates

| Candidate | Purpose | Use condition and version policy |
|-----------|---------|-----------------------------------|
| `react-i18next` / i18next | Indonesian and English interface strings, translation keys, language fallback | Strong candidate for React; select exact versions after framework choice and define fallback language explicitly |
| Zod | Runtime validation for participant arrays, phone input, admin forms, and command payloads | Candidate if TypeScript schemas are useful; official docs confirm stable Zod 4, TypeScript 5.5+ support, and strict mode requirements; choose a tested exact release |
| TanStack Query | Client server-state cache, pending/error handling, refetch and invalidation | Useful with an independent API; decide ownership with router loaders before adding another cache layer |
| Vitest | State-transition and deadline tests, database-facing command tests | Fits a Vite-based candidate; exact release must match runtime/Vite requirements |
| Playwright | Mobile viewport customer/admin flows, language switching, upload/review flows | Evaluate browser automation plus real-device acceptance; emulator success alone does not verify phone camera/file behavior |

i18next documents React integration and configurable language fallback. Keep stable booking/payment state codes separate from translated labels; localize validations and admin workflows as well as navigation. Indonesian/English UI support does not decide venue timezone, transaction currency, or whether admin-authored class descriptions require translation. Those remain open product choices. [React i18next](https://react.i18next.com/), [i18next fallback](https://www.i18next.com/principles/fallback).

Zod validates runtime input; it does not establish capacity availability or user authority. [Zod documentation](https://zod.dev/). TanStack Query supports stale-time configuration, background refetch, and invalidation. Recheck capacity on reservation and refresh affected views after changes regardless of client cache choice. [TanStack Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).

Vitest's current guide lists Vite >=6.4.0 and Node >=22.12.0, which is stricter than Vite's lowest stated Node minimum. Check the selected versions together before pinning a runtime. Playwright documents device/browser emulation. [Vitest guide](https://vitest.dev/guide/), [Playwright emulation](https://playwright.dev/docs/emulation).

Date/recurrence library selection should follow decisions about venue timezone, series-edit semantics, exceptions, and booking cutoffs. A weekly recurrence generator cannot decide what happens to already booked sessions when an admin edits a series. No recurrence dependency is recommended before those rules are clear.

## Infrastructure selection criteria

Prefer a small deployment model with clearly owned booking commands and durable data over a broad service collection. The eventual host must support the selected runtime, private secrets, scheduled execution independent of browser activity, database connectivity/pooling, production logs, migrations, and an actual restore process. Static frontend hosting is a candidate only when another service owns those backend capabilities. This is operational guidance; no hosting vendor is selected here.

Scheduled execution should reconcile deadlines from persisted state and make repeated runs safe. It must preserve submitted-proof holds and evaluate optional minimum cancellation under the same booking rules as interactive commands. Record when a job ran and what it changed; neither a delayed worker nor a retry should decide capacity from an obsolete browser count.

Check database and object-storage restoration separately. Supabase's database documentation explicitly excludes Storage objects from database backups, so an integrated service does not remove the need to plan proof-object recovery. [Supabase database and backup scope](https://supabase.com/docs/guides/database/overview).

## Decisions to resolve during technical planning

1. Confirm public content/search/share needs and choose the frontend/rendering model against the retained starter.
2. Compare integrated services with an application-owned backend; decide database and command ownership, deployment runtime, and scheduled execution together.
3. Prove a candidate booking transaction under concurrent group/customer/admin requests before relying on it for the five-hour hold workflow.
4. Test selected OTP channels and sender onboarding; specify the main sign-in method, admin authentication, recovery, and account linking.
5. Define proof formats, upload completion, authorized review, storage retention, and recovery; keep gateway integration out of v1.
6. Confirm timezone, currency display, default language, translation ownership, and recurring-series/cutoff semantics.
7. Pin and smoke-test exact library/runtime versions only after the above decisions. Validate build, migrations, authorization, concurrency, mobile workflows, and both interface languages.

## Confidence and research limits

| Area | Confidence | Evidence and limit |
|------|------------|--------------------|
| Starter inventory | User/local evidence | Manifest ranges inspected; installed versions and full compatibility were not audited |
| Framework/service capabilities | MEDIUM | Current official docs and Vite release notes checked; no candidate assembled or deployed |
| PostgreSQL fit | MEDIUM | Concurrency docs and support policy checked; recommendation derives from product rules |
| OTP transport | MEDIUM | Supabase and Twilio sources cross-checked; actual sender eligibility and deliverability remain untested |
| Private storage | MEDIUM | Provider access/upload docs checked; product permission/retention policy remains open |
| Localization and libraries | MEDIUM | Official capability/support docs checked; full bilingual coverage and exact release compatibility remain untested |
| Final stack choice | Open | User explicitly deferred selection; this document supplies criteria for that decision |

The research plan requested Context7 first, but no Context7 tools or `ctx7` command were available. Official-source web search/fetch served as the fallback. Source digests were stored with the research seam under this project's planning cache. Official pages without publication dates are recorded as accessed on 2026-10-07; version-specific assertions are limited to the local manifest, explicit release documentation, and support information visible on that date. No vendor pricing, production compatibility guarantee, or legal conclusion is included.
