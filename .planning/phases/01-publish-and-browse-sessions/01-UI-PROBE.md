# Phase 1 UI State Review

**Status:** Confirmed by the user on 2026-10-08; 78/78 considerations resolved (explicit) and written to 01-UI-SPEC.md UI Considerations.
**Date:** 2026-10-08
**Contract check:** Seven dimensions passed after contextual bilingual action-label changes. No implemented Lafu UI acceptance is claimed.

The compiled `ui-consideration-probe.cjs` ran over 12 surfaces described in `01-UI-SPEC.md`. It returned 70 applicable unresolved checks and zero unclassified surfaces. Its keyword matching can both miss types and mistake prose verbs for form elements; the proposed classifications below correct those cases before resolution.

## Surface Classification Proposal

| ID / Surface | Engine-detected kinds | Proposed actual kinds |
|--------------|-----------------------|-----------------------|
| E1 Public schedule | Form, list, control, text | List, control, text; “form a list” is a prose verb, not a data-entry form. |
| E2 Date strip and picker | Form, list, control, text | Keep all four: date input, button collection, actions, weekday/date labels. |
| E3 Session detail sheet | Control | Add list and text: multiple coaches and grouped facts must also handle missing/long content. |
| E4 Navigation and language | Form, navigation, text | Navigation, control, text: language switching preserves form values but is not itself a form. |
| E5 Admin sign-in | Form, control | Add text for labels, hints, and error messages. |
| E6 Guided session editor | Form, navigation, text | Form, list, control, text: selected coach/review collections and next/back actions; links to separate references do not turn the whole form into navigation. |
| E7 Class/reference editor | Form | Add control and text for save/back, labels, and validation. |
| E8 Admin record lists | List | Add control and text for add/edit actions and long names/statuses. |
| E9 Coach selection | Form, list, control | Add text for readable full names and review labels. |
| E10 Club information/media fallback | Text | Add media: missing logo/photography must have an honest text fallback; this does not authorize fabricating or adding media. |
| E11 Discard confirmation | Form, text | Control and text: a confirmation has actions and an explanation, not a data-entry form. |
| E12 Validation/status panel | Form, text | Control and text: messages/retry and availability labels describe the owning form, not another form. |

“List” means the probe's `list-collection`; “control” means `interactive-control`; “text” means `static-content`. Exact input descriptions are copied from the contract into the probe's JSON input. These proposed kinds are not confirmed yet.

## Recommended State Rules

These are proposed explicit acceptance rules for each applicable surface/category. They preserve the existing contract and add no Phase 2-5 workflow.

| State category | Recommended rule |
|----------------|------------------|
| Empty | Empty schedule dates explain the absence and offer the next scheduled date only when one exists; empty admin lists name the relevant Add action; unfilled forms retain labels/hints; no coach choices links to separate management; missing club assets use text identity. |
| Loading | Name the operation, prevent duplicate submission, retain selected date and safe entered values, and show static row placeholders where relevant. Navigation retains its label/current task. Fixed local labels/icons render immediately; any future supplied media load keeps text facts usable. |
| Error | Name the failed load/save and provide retry or admin sign-in recovery. Keep safe input and date context. Never show an API failure as an empty list, invent success, or invent absent club facts. Failed supplied media retains text identity/facts. |
| Populated | Chronological full-width sessions, complete factual sheet, readable admin records and selected coaches, and only supplied club facts/assets. Min/max and remaining places remain distinct facts. |
| Partial | Missing session facts read as unavailable rather than zero; preserve valid facts and show the documented incomplete-data message. Partial forms keep values, errors, and editable defaults; review requires all fields/coaches before final save. |
| Overflow | Contain date-strip scrolling locally, scroll long sheets/lists vertically, wrap required names/facts, and reserve fixed-navigation/action space and safe areas. No page-wide sideways scrolling or clipped required controls. |
| Zero / one / many | Zero uses the documented empty state, one remains one full-width record or an explicitly selected coach option, many use chronological/vertical lists; pluralized place counts retain their units. Fixed seven-date choices stay deterministic. |
| Long text | Both languages, long names, labels, prices, and error explanations wrap and grow their controls/panels. Keep readable body text and at least 48px targets; do not shrink mandatory text or silently ellipsize required facts. |

Apply each rule only where the confirmed element kind makes it relevant. Use the Copywriting Contract for the exact bilingual empty/error wording. Confirmation/status panels with fixed local content do not invent server-loading operations; pending/loading and errors belong to their owning operation and remain visible in context.

No consideration is currently dismissed, marked resolved, or claimed tested. After user confirmation, run the engine again with the corrected kinds and concrete per-surface resolutions, replace the UI-SPEC's UI Considerations placeholder, and record the final coverage counts. Any requested change remains open until answered.

## Evidence and Boundaries

- Actual probe result: applicable 70, resolved 0, unresolved 70, unclassified 0.
- Original preset `b2YOAa` initialized; current CLI may reconstruct a different code from customized tokens. The original code is provenance, not a command to restore default styling.
- shadcn 4.21.4 reports zero installed assembled UI components; Radix 1.7.0 exports 35 namespaces including two unstable namespaces excluded from use. The earlier parent progress statement of 36 was corrected by direct enumeration and the independent checker.
- Build/lint passed after the last setup source changes. Business UI, admin auth, Prisma/database, and runtime interaction validation remain unimplemented.
