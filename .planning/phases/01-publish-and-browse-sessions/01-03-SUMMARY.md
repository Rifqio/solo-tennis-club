---
phase: 01-publish-and-browse-sessions
plan: 03
subsystem: public-ui
tags: [react, tailwind, i18n, shadcn, antislop, impeccable]
requires:
  - phase: 01-01
    provides: "Public schedule API, shared WIB helpers, ApiResult client"
provides:
  - "Indonesian-first I18nProvider with remembered English (lafu.language)"
  - "WIB date/time, IDR, and pluralized remaining-place formatters"
  - "Localized messages for every ApiErrorCode and FieldErrorCode"
  - "Community matchday token system with a test guard against off-system styling"
  - "Button, StatusPanel, LanguageSwitch wrappers; PublicLayout; About Lafu at /club"
  - "Reusable Playwright layout checks (widths, overflow, 48px targets)"
affects: [01-04, 01-05, 01-07, 01-08, 01-09, 01-10]
tech-stack:
  added: []
  patterns: [React 19 context via use(), Tailwind theme reset to locked tokens, page-gutter utility, Record-keyed error catalog]
key-files:
  created:
    - src/i18n/types.ts
    - src/i18n/i18n-context.ts
    - src/i18n/I18nProvider.tsx
    - src/i18n/use-i18n.ts
    - src/i18n/format.ts
    - src/i18n/common.messages.ts
    - src/i18n/api-error-messages.ts
    - src/components/ui/button.tsx
    - src/components/ui/status-panel.tsx
    - src/components/ui/language-switch.tsx
    - src/features/public/layout/PublicLayout.tsx
    - src/features/public/layout/public.messages.ts
    - src/features/public/club/ClubPage.tsx
    - src/features/public/club/club-content.ts
    - src/features/public/club/club.messages.ts
    - src/features/public/schedule/schedule.messages.ts
    - tests/unit/i18n-format.test.ts
    - tests/unit/api-error-messages.test.ts
    - tests/unit/design-tokens.test.ts
    - tests/e2e/support/layout-checks.ts
    - tests/e2e/club-language.spec.ts
    - tests/e2e/public-layout.spec.ts
  modified: [src/index.css, src/App.tsx, src/main.tsx, src/features/public/schedule/SchedulePage.tsx]
key-decisions:
  - "Executed by hand from this PLAN.md at the user's request, without GSD skills or subagents."
  - "Antislop DURING with Impeccable, by explicit session choice (2026-10-08)."
  - "Browser/e2e execution remains manual pending under the user's standing override; specs are written and typechecked, not run."
  - "English prices use en-GB with the narrow Rp symbol (Rp 150,000); en-ID groups digits the Indonesian way."
  - "INVALID_INTEGER is generic; the UI-SPEC rupiah sentence applies to priceIdr through fieldErrorMessage()."
  - "Tailwind's default colors, sizes, weights, radii, and shadows are reset in @theme so only Lafu tokens exist as utilities."
requirements-completed: [DISC-01]
coverage:
  - id: D1
    description: "Formatting: whole IDR in both languages, WIB time/date independent of process TZ, plural remaining places, placeholder translation."
    requirement: DISC-01
    verification:
      - kind: unit
        ref: tests/unit/i18n-format.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Every API and field error code has distinct Indonesian and English copy; UI-SPEC copy used where defined."
    verification:
      - kind: unit
        ref: tests/unit/api-error-messages.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "Token guard: four sizes, two weights, no gradients/glow/blur/ad-hoc shadows, hex only in index.css, no raw HTML, locked palette, solid 2px focus, no dark theme."
    verification:
      - kind: unit
        ref: tests/unit/design-tokens.test.ts
        status: pass
    human_judgment: false
  - id: D4
    description: "About Lafu reachable from the header, language switch persists across reload, tampered storage falls back to Indonesian."
    requirement: DISC-01
    verification:
      - kind: e2e
        ref: tests/e2e/club-language.spec.ts
        status: pending-manual
    human_judgment: true
  - id: D5
    description: "No horizontal scroll and 48px targets at 320/390/640/820/1024/1440 in both languages, 200% zoom, visible focus, schedule error retry."
    verification:
      - kind: e2e
        ref: tests/e2e/public-layout.spec.ts
        status: pending-manual
    human_judgment: true
---

# Plan 01-03 Summary: Bilingual public shell, tokens, and About Lafu

## Outcome

Visitors land on the schedule under a Lafu header with two working destinations (Jadwal, Tentang Lafu) and a two-option language control. The first visit is Indonesian; choosing English applies immediately, is stored in `lafu.language`, and survives reload. The browser language is never read. About Lafu publishes only the confirmed club name and shows "Belum tersedia / Not available" for every fact the club has not supplied.

The design system is now real code: locked palette and semantic colors as CSS variables, Tailwind's defaults reset so only the four text sizes, two weights, three radii, and the one sheet shadow exist, a solid 2px club-green focus outline, themed text selection and caret, and reduced-motion handling. `tests/unit/design-tokens.test.ts` keeps later plans inside that system.

## Verification run

| Check | Result |
|---|---|
| `npm test` (unit + integration) | 13 files, 87 tests passed |
| `npx tsc -b` (app, node, server incl. e2e specs) | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | built; CSS 21.6 kB, JS 358 kB (116.7 kB gzip) |
| Compiled CSS check | every custom utility used in source exists in `dist/assets/index-*.css` (text-label/body/heading/display, bg-error-surface, page-gutter, etc.) |
| Server-render smoke (temporary, removed) | `/club` renders "Belum tersedia" and `aria-current="page"`; `/` renders the "Memuat jadwal..." status |
| `grep "—" src` / `grep navigator.language src` | no matches |
| `npm run test:e2e` | **not run**: browser execution is manual pending by user override |

## Antislop Delivery Gate

Design read: mobile tennis-club app for novice customers and club admins, Community matchday language, dial ENERGY 2 / RHYTHM 2 / MOTION 2 (UI-SPEC). Mode: DURING, with Impeccable, by explicit session choice.

R-35 requires a recorded click-through in a running browser. That has not happened, so this gate is **not a PASS for delivery**; the browser rows are PENDING and must be completed during the manual review.

### Block 1: Hard Gate

| Rule | Status | Evidence |
|---|---|---|
| R-02 em dash | PASS | `grep -rn "—" src` returns nothing; error catalog test also asserts it. |
| R-03 mobile | PENDING (browser) | By construction: `page-gutter` 16/24/32px plus safe-area insets, header and nav `flex-wrap`, `min-w-0`, `break-words` on names and messages, no fixed widths. Spec at six widths written, not run. |
| R-17 numbers | PASS | Only API values render (price, remaining places); the seeded row carries the sample-data disclosure. |
| R-18 testimonials | PASS | None. |
| R-23 assets | PASS | Text identity "Lafu / Lawu Fun Tennis Club"; `logoSrc` null; no images, avatars, or photos. |
| R-24 navigation | PASS | Two links, both routed in `src/App.tsx` (`/`, `/club`); no sign-in, booking, or account links. |
| R-25 contrast | PASS (tokens), PENDING (runtime) | Pairs used: ink/white 15.52, muted/white 6.99, muted/pale 6.27, green/pale 8.62, warning 6.25, error 5.75 (UI-SPEC computed). Runtime measurement pending. |
| R-26 interactive | PASS (code inspection) | Language buttons call `setLanguage`; nav and back links route; Retry re-requests via `attempt`. Click-through pending. |
| R-27 states | PASS with note | Schedule: loading StatusPanel, error StatusPanel with Retry, empty heading. Club: unavailable panel and per-fact text. The next-date shortcut belongs to 01-05. |
| R-28 FAQ | PASS | None. |
| R-32 keyboard | PASS (code), PENDING (browser) | Native buttons and links only; `:focus-visible` 2px solid green, offset 2px; DOM order matches visual order. Focus spec written. |
| R-33 patch scripts | PASS | All styling written in source. |
| R-34 themes | N/A | One fixed light theme; no toggle shipped. |
| R-35 verify | PENDING | Build, tests, typecheck, lint, and SSR smoke ran. No browser click-through (user override). |
| R-36 claims | PASS | None. |
| R-37 direction | PASS | `.planning/UI-BRIEF.md`, `01-UI-SPEC.md`, locked palette D-24. |
| R-38 real content | PASS | Club facts null until supplied. |

### Block 2: Purpose-Gate

| Rule | Status | Reason recorded |
|---|---|---|
| R-01 gradients | PASS | None; guarded by test. |
| R-04 icons | PASS | No icons used yet. |
| R-06 type | PASS | Inter for legible bilingual facts and clear numerals; bold tabular time numerals are the identity motif; no uppercase tracking or monospace. |
| R-07 background | PASS | None. |
| R-08 arrows | PASS | None. |
| R-09 badges | PASS | Only availability labels, which mark real session state in words. |
| R-10 / R-12 / R-13 | PASS | No glass or glow; the one shadow token is reserved for the 01-07 detail sheet. |
| R-14 cards | PASS | No cards; flat divided rows and a definition list. |
| R-19 motion | PASS | Only 150ms color transitions on hover; reduced-motion removes them. |
| R-22 illustrations | PASS | None. |

### Block 3: Liveliness

| Item | Status | Evidence |
|---|---|---|
| Dials declared | PASS | ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Output matches dials | PASS (code), PENDING (visual) | Bold wordmark, pale-green navigation band, green active-destination underline; no ornamental motion. |
| Focal point | PASS | One h1 per page; the schedule date heading and rows lead. |
| Structural whitespace | PASS | 24px between groups, 16px within rows, 4px between related facts. |
| One accent | PASS | Club green only on the active destination, focus, Available text, and future primary actions. |
| Identity motif | PASS | Bold tabular time numerals with a small WIB marker; the pale-green band will carry the date strip in 01-05. |
| Design read declared | PASS | Above and in UI-SPEC. |

### Block 4: Craftsmanship and Quality Locks

All PASS by inspection: no template sections (C-3), states handled (C-4, browser pending), no fabricated claims (C-5), no AI template layout (R-05), radius 4/8px by role (R-11), no generic CTAs (R-15), no buzzwords (R-16), fixed light theme chosen for outdoor phone use at the club (R-21), palette is the locked four plus semantic statuses (R-29), not a clone (R-30), reasons recorded (R-31).

### UI and mobile checklists

The palette comes from the confirmed direction, the accent appears only at key moments, and there are no emoji, eyebrow badges or decorative dots. Navigation has only real destinations. States name their cause and next action, apart from the 01-05 shortcut. Grids: none yet. Tap targets: every control has `min-h-12`; language buttons keep 48px when their labels wrap. Hover color changes are cosmetic, so touch loses nothing. Nothing is fixed to the screen yet, so nothing can cover content. Verification at each breakpoint is PENDING (browser).

## Manual review to complete (human_judgment)

1. `npm run test:e2e -- tests/e2e/club-language.spec.ts tests/e2e/public-layout.spec.ts` when browser runs are allowed; screenshots land in `test-results/antislop-01-03/`.
2. On a phone (or 390px emulation), check `/` and `/club` in both languages: header height and wrapping at 320px, language switch labels, focus visibility, comfortable one-handed use.

## Prerequisite recorded

Club description, contact, address, logo, and photography are null in `club-content.ts`. The club must supply bilingual text and media before launch; until then About Lafu shows the unavailable text by design.

## Deviations

1. **English IDR locale:** the plan named `en-ID`, which formats `Rp 150.000`; the plan's own test expects `150,000`, so English uses `en-GB` with `narrowSymbol`.
2. **INVALID_INTEGER copy:** the server emits it for duration and participant counts too, so the UI-SPEC price sentence moved to a `priceIdr` override.
3. **E2E typing:** `tsconfig.server.json` has no DOM lib; the three new e2e files add `/// <reference lib="dom" />` for their `page.evaluate` callbacks instead of widening the server config.
4. **Context file split:** the context object lives in `i18n-context.ts` so `I18nProvider.tsx` exports only the component (react-refresh lint rule).
