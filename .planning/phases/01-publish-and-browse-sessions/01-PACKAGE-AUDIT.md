# Phase 1 Package Legitimacy Audit

**Checked:** 2026-10-08
**Method:** npm registry metadata (`npm view`) plus official project documentation. Exact patches are re-queried and pinned by the executor because registry state can change.

| Package | Intended role | Registry/repository evidence | Status |
|---|---|---|---|
| `express` | Application-owned Node HTTP server | npm `express`; `expressjs/express`; MIT; Node >=18 | VERIFIED |
| `@types/express` | Express TypeScript declarations | npm `@types/express`; DefinitelyTyped `types/express`; MIT | VERIFIED |
| `react-router-dom` | Browser route ownership | npm `react-router-dom`; `remix-run/react-router`; MIT; React >=18; Node >=20 | VERIFIED |
| `zod` | Runtime request/DTO boundary validation | npm `zod`; `colinhacks/zod`; MIT | VERIFIED |
| `prisma@7` | Prisma 7 migration/generation CLI | npm `prisma`; official Prisma repository; Apache-2.0. Unqualified `latest` is Prisma 8 RC on the audit date, so the executor must select the stable v7 line explicitly. | VERIFIED |
| `@prisma/client@7` | Generated Prisma 7 client runtime | npm `@prisma/client`; `prisma/prisma`; Apache-2.0; Node supports the workspace's Node 24 line | VERIFIED |
| `@prisma/adapter-better-sqlite3@7` | Prisma 7 SQLite driver adapter | npm official `@prisma` scope; `prisma/prisma`; Apache-2.0 | VERIFIED |
| `@types/better-sqlite3` | SQLite adapter driver declarations | npm `@types/better-sqlite3`; DefinitelyTyped; MIT | VERIFIED |
| `tsx` | Run TypeScript server and trusted setup scripts | npm `tsx`; `privatenumber/tsx`; MIT; Node >=18 | VERIFIED |
| `vitest` | Unit/API/file-backed database integration tests | npm `vitest`; `vitest-dev/vitest`; MIT; current line declares Vite 8 and Node 24 compatibility | VERIFIED |
| `@playwright/test` | Browser workflow and viewport checks | npm `@playwright/test`; `microsoft/playwright`; Apache-2.0; Node >=20 | VERIFIED |

## Installation Contract

- Query `npm view` again immediately before installation; record the exact versions, engines, peers, repository, and license in the execution summary.
- Pin exact compatible patches in `package.json` and `package-lock.json`; do not use floating `latest` or mix Prisma 7 and Prisma 8 packages, config names, generators, clients, or migration commands.
- Use `prisma7.config.ts`, the Prisma 7 `prisma-client` generator, `migrate dev` for the committed development migration, and `migrate deploy` for clean test/production-mode files.
- Abort installation and return a blocking package-legitimacy checkpoint if registry ownership/repository metadata differs from this audit or a package resolves to a prerelease/suspect source.

