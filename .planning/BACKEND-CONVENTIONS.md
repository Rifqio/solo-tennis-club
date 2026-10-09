# Backend conventions

User-selected standard, 2026-10-09. Applied with best-practices and nodejs-backend-patterns, without GSD.

Keep related files inside their feature. Follow router → controller → service → repository.

| Layer | Responsibility |
| --- | --- |
| Router | Paths, methods, middleware order and controller wiring |
| Controller | Strict input parsing, trusted actor extraction, cookies, headers and HTTP responses |
| Service | Business validation, authorization, transaction orchestration and safe output mapping |
| Repository | Explicit Prisma queries, selections, ordering and conditional writes |
| Database infrastructure | Connections, lifecycle and transaction execution |

Controllers do not query persistence or decide booking/auth policies. Services and repositories do not depend on Express or HTTP handlers. Repositories do not commit an independent part of a business operation. Seed/backup/bootstrap utilities remain infrastructure and may access persistence directly.

Examples: `server/features/admin/classes/classes.router.ts`, `class.controller.ts`, `class.service.ts`, `class.repository.ts`. Sessions have focused create/update/read/reference-validation services and a mapper. Authentication has controller/service/repository files plus focused session/throttle services retaining existing filenames.

Use named TypeScript functions and explicit repository factories. Classes, a generic base repository and a dependency-injection container are unnecessary for this application. Existing services retain injected database handles for caller compatibility and transaction/failure tests, then use feature repositories. They execute no Prisma queries. New service interfaces may inject repositories and a transaction runner when that reduces coupling; do not add wrappers just to change syntax.

The service defines an operation with `inTransaction(database, work)` from `server/database/transaction.ts`. Construct every participating repository with the same callback `transaction`, including reference validation and coach writes. Never use a root-client repository inside that callback or start a nested independent transaction. Existing failure tests prove parent/coach changes roll back together. Phase 2 admission extends this boundary with first-write ownership and bounded whole-transaction retries before reading capacity, as specified in its architecture plan.

Customer OTP uses `inWriteTransaction` from the same infrastructure module: three bounded whole-operation attempts for SQLite P1008/P2034 conflicts, then a typed DatabaseBusyError mapped centrally to 503. First-write ownership and fresh business-time reads remain the service's responsibility. Never retry only a middle repository call.

Use names such as `occupiedPlaces`, `findByRequestId` and `updateIfVersionMatches`. Expand multi-step branches and response mappings into readable blocks. Prefer guard clauses and explicit switches over nested ternaries. Keep inputs and outputs typed, whitelist persistence fields, avoid `any` and reflection-driven updates. Prisma write types stay in repositories. Comments explain non-obvious constraints rather than narrating code.

Preserve strict Zod schemas, stable error codes, centralized error responses, origin/CSRF guards, hashed sessions, password timing protection, throttling, no-store and private/public DTO separation. Retry headers belong to the error handler. Never log passwords, OTP codes, cookies or CSRF tokens. The approved mock OTP API `debugCode` is development-only; production rejects mock configuration.

ESLint prevents repository imports in HTTP handlers, HTTP dependencies in services/repositories, and common direct database calls in handlers/services. These rules supplement review; aliases can evade the query check. Before closing backend work, run build, lint and relevant SQLite/HTTP regressions. Browser automation remains disabled by user instruction.
