# Phase 1 picker, form and interaction polish

Date: 2026-10-09. Source implemented; user confirmed the listed manual workflows on 2026-10-09. No GSD skill or browser automation used, following the user's standing preferences.

Skills applied: Antislop core, UI and mobile layout; UI UX Pro Max; verification before completion. Existing during-mode session choice retained. Design read: phone-first club administration in Jalur Lawu's Material 3 language, Operate mode, ENERGY 2 / RHYTHM 2 / MOTION 2. Existing green signboard, tonal surfaces, reading type and routed numerals provide identity. No raster assets or navigation destinations added.

## Changes and reasons

- Date: replaces the native date input with a labeled text field and the existing lazy-loaded `react-day-picker` club calendar. Phone bottom sheet and desktop popover retain locale, floating calendar-day handling, Escape and focus restoration. Direct YYYY-MM-DD entry remains available. Editing keeps a saved past date selectable; new dates follow the server's existing validation.
- Time: replaces the native time input with a labeled HH:mm text field and a Radix-based hour/minute dialog. All 24 hours and 60 minutes are available, including off-grid values such as 23:07. Use time commits the choice; Cancel/Escape preserves the existing value. No new dependency needed.
- Form actions: returning to the Sessions list moves to a lower-emphasis link above the editor. Previous step and Continue/Save share a two-column phone row, with one primary action on the right; wider layouts align the pair to the right. Reference/class forms use the same secondary-left/primary-right order. Footer stays in document flow to avoid covering fields or the phone keyboard.
- Form steps: Motion gives forward and backward changes a short directional entrance. Draft values remain in the parent state. The step heading receives focus; validation moves to the affected step and field. Contextual review actions disable during save.
- Route changes: the admin content enters with a subtle fade and 8px offset while app bar/navigation persist. Changing language or query parameters does not remount the form. Navigation/discard guards remain intact.
- Dropdowns: menus open from the trigger's origin in 180ms and leave in 120ms; chevron rotation echoes expanded state. Selected indicators confirm one change.
- Coaches: native checkbox semantics retained with club styling, a 180ms drawn checkmark, selected row tone and a label-sized target. Selected IDs retain their order.
- Sheets and discard dialogs: short entering/exiting feedback. Disabled buttons have explicit dimming and cursor feedback. Reduced motion makes CSS and new Motion feedback immediate.

UI UX Pro Max informed the single primary action, paired form controls, short motion, touch sizes and reduced-motion support. Root DESIGN.md continues to own product identity. Motion implementation follows its [reduced-motion guidance](https://motion.dev/docs/react-accessibility); existing Radix primitives preserve modal/select semantics.

## Verification

Fresh final verification after the last source edits: `npm run build` PASS (TypeScript and Vite, 464.81 KB main bundle), `npm run lint` PASS, `npm run test` PASS (26 files, 137 tests, 20.02 seconds), `git diff --check` PASS. Source scan found no native date/time inputs. No dependencies or database schemas changed.

`tests/e2e/admin-ui-polish.spec.ts` adds calendar selection, time apply/cancel, minute precision, focus return, paired actions, retained values, language change and reduced-motion paths at 320/640/1024px. These specifications are type checked by the production build and remain unrun under the user's browser-automation opt-out.

## Historical Antislop Delivery Gate source assessment before user acceptance

PASS below describes the changed source only. Runtime questions remain PENDING until manual review; no full Delivery Gate PASS is awarded.

| Item | Assessment and evidence |
| --- | --- |
| R-02 text | PASS: new labels/helpers contain no em dash |
| R-03 overflow | PENDING runtime: min-width-zero fields, clipped step entrance, two-column action row and responsive calendar source; authored width checks unrun |
| R-17 statistics | PASS: no statistics introduced |
| R-18 testimonials | PASS: none introduced |
| R-23 assets/navigation | PASS: existing destinations and relevant UI glyphs; no fabricated assets |
| R-24 destinations | PASS source: parent link routes to Sessions; existing reference/class destinations retained |
| R-25 contrast | PENDING runtime: existing semantic foreground/background roles retained; both themes need inspection |
| R-26 controls | PASS source: calendar selection, apply/cancel, coach toggling, step and save handlers are connected; click-through pending |
| R-27 states | PASS source: existing loading/empty/error/retry states retained; field errors remain associated; incomplete time choices disable Apply |
| R-28 FAQ | PASS: none added |
| R-32 keyboard | PENDING runtime: labeled inputs, native checkbox, Radix primitives, return refs and error focus in source |
| R-33 source edits | PASS: changes written directly into source |
| R-34 themes | PENDING runtime: inherited light/dark tokens; no hardcoded color overrides |
| R-35 build/click-through | Build PASS; click-through PENDING under user opt-out |
| R-36 claims | PASS: no security/customer/performance claims added to the product |
| R-37 direction | PASS: established Jalur Lawu direction and explicit 2/2/2 dials |
| R-38 data | PASS: real API options; input examples identify formats rather than business records |
| R-01 gradients | PASS: none introduced |
| R-04 icons | PASS: calendar opens dates, clock opens time, check confirms selection, left arrow returns to the parent list; existing Lucide family fits Material controls |
| R-06 type | PASS: existing reading/display hierarchy retained; time entry uses reading text with tabular numerals |
| R-07 textures | PASS: none added |
| R-08 arrows | PASS: single parent-return arrow carries hierarchy meaning |
| R-09 badges | PASS: none added |
| R-10 glass | PASS: none added |
| R-12 shadows | PASS: existing menu/sheet shadows identify overlays; fields/rows remain flat |
| R-13 glow | PASS: none added |
| R-14 feature cards | PASS: no feature-card structure added |
| R-19 motion | PASS source: purposeful step/route/selection feedback; short transform/opacity/path transitions; no loops; reduced-motion hooks/CSS |
| R-22 illustrations | PASS: none added |
| Liveliness dials | PASS source: 2/2/2; focused field groups, one primary action and club signboard/tonal roles retained |
| Liveliness rhythm/focal point | PASS source: parent return separated from step actions; date/time paired only where space allows; review remains the final decision |
| Liveliness whitespace/accent/motif | PASS source: 24px groups and 8px action gap; one filled action; Jalur Lawu typography and surfaces retained |
| Design read | PASS: stated above before source assessment, continuing the already confirmed direction |
| R-05 composition | PASS source: form task determines grouping; phone and wider action layouts defined |
| R-11 shapes | PASS: existing field/menu/button/sheet scale; compact square checkbox distinguishes selection from action |
| R-15 actions | PASS: Continue, Save session changes, Use time and Back to sessions name concrete actions |
| R-16 copy | PASS: no marketing/buzzword additions |
| R-20 identity | PASS source: existing club signboard, palette and hierarchy; runtime visual review pending |
| R-21 theme | PASS source: existing device-following themes retained |
| R-29 palette | PASS: semantic club roles only |
| R-30 imitation | PASS source: existing confirmed direction continues |
| R-31 reasons | PASS: every changed visual/interaction decision has a reason above |
| C-1 intentionality | PASS source: explicit reasons above |
| C-2 completeness | PASS source: all new controls wired; manual interaction still pending |
| C-3 composition | PASS source: navigation, fields and submission are distinct task regions |
| C-4 resilience | PENDING runtime: widths/themes/languages/keyboard/zoom/phone require inspection |
| C-5 evidence | PASS: automated evidence separated from manual acceptance; no visual PASS invented |

## UI and mobile checklist supplement

Source PASS: brand palette/accent, no decorative emoji or template cards, meaningful icons, concrete actions, no perpetual motion, flat surfaces with overlay shadows, no invented data, honest field examples and retained recovery states.

Source PASS: phone-first single-column fields, paired date/time from 640px, constrained desktop forms, wrapping action labels, min-width-zero containers, 48px fields/actions, existing 44px-wide/48px-tall narrow calendar exception, label-sized checkbox targets, tap alternatives, inherited bottom-nav/rail and safe-area padding.

PENDING: runtime UI checklist final item and mobile checklist overflow, target spacing, fixed navigation coexistence and verified breakpoints. Source inspection is insufficient to close them.

## Manual checks

User confirmed "All tested manually" on 2026-10-09 after the seven-item workflow checklist. This is user-reported manual acceptance; no agent browser run, screenshots, device inventory or exact viewport measurements were supplied. Real club content/production launch checks remain separate.

Ticks record the user's overall confirmation, not separately observed measurements.

- [x] At 320/390/640/820/1024/1440px check both themes and ID/EN; verify Back and Continue/Save share a row without clipping.
- [x] Open date/calendar, select a future day, type a date, close with Escape and check focus return.
- [x] Open time, select 00:00 and 23:07, apply, reopen/change/cancel and verify the original value remains.
- [x] Tab through nested hour/minute menus and the dialog; confirm Escape and screen-reader labels.
- [x] Navigate Continue/Back/contextual Edit rapidly; confirm directional feedback, focused heading/errors and unchanged values.
- [x] Check/uncheck coaches with pointer, label and Space; confirm order and visible mark.
- [x] Toggle reduced motion, language and phone keyboard; check reachable final actions and safe areas.
- [x] Check route changes, dirty-form discard, pending saves and expired-auth recovery before closing acceptance.
