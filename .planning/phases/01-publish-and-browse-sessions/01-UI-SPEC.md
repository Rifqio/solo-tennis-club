---
phase: "1"
slug: "publish-and-browse-sessions"
status: draft
checker_status: approved
reviewed_at: "2026-10-08T04:16:56Z"
shadcn_initialized: true
preset: "b2YOAa"
created: "2026-10-08"
---

# Phase 1 - UI Design Contract

> **Superseded visual system (2026-10-08).** The user asked for a full redesign as a native-feeling Material 3 app and chose the "Jalur Lawu" direction. Visual decisions now live in the root `DESIGN.md` (tokens, type, shapes, components, rules) and `.impeccable/design.json`; the direction contract is in `.impeccable/surfaces/src-app-tsx.md`. Where this document's Design System, Spacing, Typography, Color, component treatments, navigation, or responsive layout disagree with `DESIGN.md`, `DESIGN.md` wins. Still authoritative here: the Copywriting Contract (except the language control, now a compact ID/EN menu, and the public nav labels Jadwal/Klub), Data-State Behavior, UI Considerations (E1 to E12 state rules), scope traceability, and the locked decisions D-01 to D-24 except D-23's per-component styling and D-24's palette roles, which DESIGN.md expands (club palette kept).
>
> Recorded changes from this contract: Material 3 shell with bottom navigation bar and rail; light and dark follow the phone; system UI font for reading text with Barlow Condensed only for sign numerals; five type roles (adds the 2rem post numeral); availability shown as a fixed state cell (phone adaptation: one unit under the facts); Full shows the word without "0 places"; today's sessions show next, in progress, and ended; installable web app manifest.

Visual and interaction contract for Publish and Browse Sessions. The checker approved all seven dimensions after contextual bilingual action-label updates. Final workflow completion awaits the manual state-probe review in `01-UI-PROBE.md`. This document specifies future implementation; it does not claim a working Lafu UI or browser validation.

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui with Tailwind CSS; selected by user, D-23 |
| Preset | Original initialization: `b2YOAa`, Radix/Nova, neutral base, green baseline, Inter, Lucide, default radius. Brand tokens below override setup styling. |
| Component library | `radix-ui@1.7.0`; stable primitives only |
| Icon library | `lucide-react@1.52.0`; calendar, previous/next chevrons, close, check, and management navigation glyphs only where they explain a real control |
| Font | Local `@fontsource-variable/inter@5.3.0`, CSS family `Inter Variable`, system-ui, sans-serif |
| Styling | Tailwind CSS 4.3.3; shadcn CLI 4.21.4; CSS variables and `@` import alias |
| Theme | Fixed light theme for the confirmed white/pale-green Community matchday surfaces and quick phone use at the club; no theme control in this phase. Imported unused dark tokens are setup residue, not a shipped theme. |
| Existing product UI | None. Only setup tokens and `src/lib/utils.ts` exist; starter counter/layout is not approved Lafu UI. |

Evidence: `node node_modules/shadcn/dist/index.js info`, `components.json`, resolved package versions, and source inventory, checked 2026-10-08. CLI reconstructs preset `b0` with a neutral theme from the current customized configuration; this is not a new user selection. `components.json` still confirms `radix-nova`, neutral base, Lucide, no RTL, and no third-party registries.

### Design read and purpose

Reading this as: a mobile tennis-club application for novice customers and club administrators, in the confirmed Community matchday language, dial ENERGY 2 / RHYTHM 2 / MOTION 2. Antislop is active DURING planning and building by explicit session choice.

| Decision | Purpose |
|----------|---------|
| Club green with white and pale-green surfaces | Carry the approved club identity while making schedule facts and current actions easy to find. |
| Inter at two weights | Keep bilingual facts legible on phones; bold class headings and time numerals provide a familiar sports schedule voice. |
| Chronological summaries with prominent time | Help visitors compare the session facts that determine their choice. |
| Detail bottom sheet | Show complete facts without losing the selected date or list position, D-04. |
| Guided admin form | Reduce the number of decisions on each phone screen and permit checking values before immediate publication. |
| 8-point spacing with 48px controls | Separate facts into readable groups while making one-handed input comfortable. |
| Flat list rows and restrained surface boundaries | Give real session data the hierarchy; metrics, charts, promotional blocks, and generic dashboard cards have no Phase 1 job. |
| Limited modal elevation | One shadow distinguishes the sheet from the schedule; rows and fields remain flat. |
| Purposeful sheet/step transitions | Explain opening context and advancing a task without competing with the schedule. |
| Text Lafu identity | Use the real club name until supplied logo assets exist; do not fabricate a logo, coach photos, or club photography. |

Repeated identity motif: bold time numerals beside compact tennis class facts, with green reserved for the selected date/current action. ENERGY 2 comes from this hierarchy and club identity; RHYTHM 2 combines date controls, a chronological list, factual detail groups, and guided forms. Repeated schedule rows may share composition because they are comparable records.

Defaults in this document resolve visual/interaction details that upstream leaves open. They do not select framework/API/hosting, establish business operating policies, or replace D-01 through D-24.

## Component Inventory

Enumerated by `node -p "Object.keys(require('radix-ui')).join(', ')"` — 35 components (exported namespaces; 33 stable, 2 unstable) — radix-ui@1.7.0 — 2026-10-08.

Count verified with `node -p "Object.keys(require('radix-ui')).length"`; version verified with `node -p "require('./node_modules/radix-ui/package.json').version"`. This is a non-exhaustive table of installed primitives, not a closed allowlist and not a count of assembled shadcn UI files. Verify any additional primitive before use.

| Component | Import path | Notes |
|-----------|-------------|-------|
| Dialog | `import { Dialog } from 'radix-ui'` | Installed; accessible behavior foundation for the customized detail bottom sheet. |
| AlertDialog | `import { AlertDialog } from 'radix-ui'` | Installed; discard-unsaved-changes confirmation. |
| Form, Label | `import { Form, Label } from 'radix-ui'` | Installed; labeled fields and validation composition. |
| Select | `import { Select } from 'radix-ui'` | Installed; venue, level, and class choice with full readable labels. |
| Checkbox | `import { Checkbox } from 'radix-ui'` | Installed; select one or more coaches in a vertical list. |
| Popover | `import { Popover } from 'radix-ui'` | Installed; optional containing primitive for desktop control disclosure, not an installed calendar. |
| RadioGroup | `import { RadioGroup } from 'radix-ui'` | Installed; applicable single-choice controls when needed. |
| Tabs, NavigationMenu | `import { Tabs, NavigationMenu } from 'radix-ui'` | Installed; use only for implemented destinations or genuine tab panels. |
| ScrollArea | `import { ScrollArea } from 'radix-ui'` | Installed; optional scrolling enhancement; native scrolling remains usable. |
| Separator, VisuallyHidden, Slot | `import { Separator, VisuallyHidden, Slot } from 'radix-ui'` | Installed composition utilities; retain semantics and visible labels. |
| Other stable namespaces | `radix-ui` | AccessibleIcon, Accordion, AspectRatio, Avatar, Collapsible, ContextMenu, Direction, DropdownMenu, HoverCard, Menubar, Portal, Progress, Slider, Switch, Toast, Toggle, ToggleGroup, Toolbar, Tooltip are installed but not required by this contract. |
| Unstable namespaces | `radix-ui` | unstable_OneTimePasswordField and unstable_PasswordToggleField are detected; not selected for Phase 1. Customer OTP is later scope. |

`node node_modules/shadcn/dist/index.js info` reports **0 installed shadcn UI components**. `src/components/ui` does not exist at inventory time. Button, input, select, checkbox, dialog, alert-dialog, form/field wrappers, and all domain compositions below are **proposed implementation work**, not existing imports. No Calendar, Drawer, or Vaul package is assumed. Use a labeled native date input for the date picker; this requires no new calendar dependency. Planned wrapper paths such as `@/components/ui/button` become valid only after those files are created and checked.

### Mandatory customization of every used component

Use shadcn/Radix behavior with Lafu-specific tokens, dimensions, composition, states, and bilingual labels. A renamed stock dashboard or unchanged stock component treatment does not satisfy D-23.

| Proposed component | Lafu treatment and required interaction |
|--------------------|------------------------------------------|
| Button/action | 48px minimum height, 16px bold label, 8px radius, 16px horizontal padding. One main filled green action per task; secondary actions use ink text and white/pale-green surfaces. Wrap long labels and grow height. Waiting action names the operation; double submission is prevented. |
| Input/field | 16px body text, persistent 14px bold label, 48px minimum height, 8px radius, 16px internal horizontal space, solid accessible boundary. Hint and field error directly underneath; labels never disappear into placeholders. |
| Select/class chooser | Same field treatment; long option labels wrap, selected value is fully recoverable, 48px option targets. Class choice names the source of prefilled defaults. |
| Coach multi-select | Vertical labeled checkbox rows with 48px targets and 8px gaps; show all selected coach names in review. A checklist replaces a dense tag-only control on phones. |
| Date strip | Locally scrolling row of 48px-minimum-width date buttons, 8px gaps, weekday label and 20px bold day. Current selection has green fill/white text and accessible selected state. Visible previous/next date controls and a labeled date picker also work without swipe. |
| Native date picker | Labeled native `input type=date`, 48px height, full-width phone field, shared field colors and focus treatment. The selected date appears in a localized readable heading; picker value is a WIB calendar date. |
| Schedule summary | Full-width chronological list row, white surface, 16px padding, 16px fact gaps, subtle bottom divider. Time leads; class/level follows, then venue, price per place, remaining-place count, and textual status. No ornamental left stripe, fake avatars, or large promotional card. Entire row opens details with a meaningful accessible name. |
| Availability label | 14px bold text, 4px vertical/8px horizontal padding, 4px radius, no glow/dot. Text and exact remaining count always accompany color. |
| Detail sheet/Dialog | White, 16px top-corner radius, 24px inner spacing, ink overlay at 40% opacity, one elevation shadow `0 -8px 24px rgba(29,37,44,.16)`. Name/time header, labeled close control, grouped facts, internal scrolling. Preserve Radix focus/keyboard behavior. |
| Guided form | Full-page phone flow, 20px section heading, labeled step position, one group of fields at a time, 24px between groups. Back/Continue in a visible bottom action region; the final review has the only publication action. No modal nested form stack. |
| Bottom navigation | Three working admin destinations, labels visible at 14px bold, each target at least 48px high. Pale-green surface, ink inactive text, green selected indicator/text, `aria-current`. No unlabeled icon rail. |
| Reference-management list | Name and relevant class defaults/venue facts lead; explicit Edit action at least 48px. Add action is specific to that record type. Zero items explain which reference must be created. |
| AlertDialog | 20px title, 16px explanation, 16px padding/gaps; stacked phone actions. Destructive discard is red; Keep editing is the safe default and initial focus. |
| Validation/status panel | Inline, 16px readable body, named operation, text recovery action. Errors are announced and associated with the affected fields; successful save is visible text near the returned record, not a transient toast alone. |

For each wrapper added later, the executor must record its applied treatment and click-through evidence. Preserve accessible primitives; substantial customization must not remove titles, labels, focus management, or keyboard controls. Dialog behavior is grounded in the [official Radix Dialog documentation](https://www.radix-ui.com/primitives/docs/components/dialog); button composition is grounded in the [official shadcn Button documentation](https://ui.shadcn.com/docs/components/radix/button).

## Spacing Scale

Declared values are multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline status padding and tightly related fact gaps |
| sm | 8px | Adjacent control gaps and related labels/hints |
| md | 16px | Phone page padding, row padding, normal field/fact gaps |
| lg | 24px | Detail-sheet padding and grouped-form separation |
| xl | 32px | Tablet gutters and section separation |
| 2xl | 48px | Comfortable control height and desktop section separation |
| 3xl | 64px | Maximum large-screen page spacing; not phone empty padding |

Exceptions: borders 1px and focus outline 2px are rendering strokes, not layout spacing; dynamic viewport and safe-area insets follow the device. Minimum touch target is 48x48px, exceeding the 44px skill minimum. Adjacent independent targets have at least 8px gap; bottom-navigation items have distinct equal-width hit areas. Calendar browser popup internals are platform-controlled, not product spacing tokens.

## Typography

Exactly four font sizes and two font weights are used: **14, 16, 20, 28px; 400 and 700**. Express sizes in rem for text scaling. Inter's readable numerals suit time, price, and counts; bold headings express the confirmed sports-app direction without extreme tracking.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 700 | 1.5 |
| Heading | 20px | 700 | 1.2 |
| Display | 28px | 700 | 1.2 |

Hints/supporting text may use 14px/400/1.5; primary action labels use 16px/700/1.5. These reuse the same sizes/weights. Phone page titles use Heading; at the expanded layout breakpoint they use Display. Session-detail class title may use Display when space permits. Time numerals use Heading with tabular numerals. No other size or weight from the starter/Nova defaults is retained. Body remains 16px across widths; text wraps rather than shrinking.

## Color

The 60/30/10 allocation describes visual emphasis, not a quota that forces colored decoration. All four brand colors are locked by D-24.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #FFFFFF | Page canvas, sheet, form fields, schedule rows |
| Secondary (30%) | #EDF4F1 | Date/navigation region, review grouping, supporting sections |
| Accent (10%) | #164D45 | Current date, main task action, selected admin destination, keyboard focus |
| Ink | #1D252C | Headings, session facts, body, inactive navigation |
| Muted text / interactive boundary | #4B5D57 | Supporting facts and solid input boundaries on white/pale green |
| Destructive action | #B42318 | Confirmed discard action only; no session-cancellation/delete action is authorized here |
| Error semantic | #B42318 on #FEECE8 | Validation/load failure text and explanatory panel; a status role, not a general brand accent |
| Warning semantic | #805000 on #FFF4D6 | Nearly-full state only, always with exact remaining count and localized text |

Accent reserved for: selected date button, the current screen's principal task action, active admin destination, visible focus outlines, and Available status text using the same green token. Ordinary links and unselected icons use ink with an underline or clear button boundary. Cancelled and Full use ink on pale green, distinguished by words; red is not used to imply an unimplemented cancellation action.

CSS mappings: background/card/popover = white; foreground = ink; primary/ring = club green; primary-foreground = white; secondary/muted = pale green; secondary-foreground = ink; muted-foreground = #4B5D57. shadcn's CSS variable named `accent` remains pale green for a subtle hover surface; the visual accent in this contract is club green. Replace default translucent focus rings with a solid 2px club-green outline offset 2px from the control. Decorative dividers may be pale green; input boundaries use #4B5D57, not the low-contrast setup input border.

### Computed contrast evidence

Checked 2026-10-08 with a local Node calculation of sRGB relative luminance: linear channel = c/12.92 when c <= .04045, otherwise ((c + .055)/1.055)^2.4; luminance = .2126R + .7152G + .0722B; contrast = (lighter + .05)/(darker + .05). These are token calculations, not evidence of implemented browser contrast.

| Foreground / background | Ratio | Contract use |
|-------------------------|-------|--------------|
| #164D45 / #FFFFFF | 9.63:1 | Green text/focus and reversed white primary-button text |
| #164D45 / #EDF4F1 | 8.62:1 | Selected navigation/status text |
| #1D252C / #FFFFFF | 15.52:1 | Main facts |
| #1D252C / #EDF4F1 | 13.90:1 | Secondary surfaces |
| #4B5D57 / #FFFFFF | 6.99:1 | Supporting facts/input boundary |
| #4B5D57 / #EDF4F1 | 6.27:1 | Supporting facts/input boundary |
| #805000 / #FFF4D6 | 6.25:1 | Nearly-full label |
| #805000 / #FFFFFF | 6.85:1 | Warning text |
| #B42318 / #FEECE8 | 5.75:1 | Error panel |
| #B42318 / #FFFFFF | 6.57:1 | Error text and reversed discard-button text |
| #1D252C / #FFF4D6 | 14.16:1 | Warning explanation |
| #1D252C / #FEECE8 | 13.58:1 | Error explanation |

Text must retain at least 4.5:1 and control boundaries/focus at least 3:1 in the actual implementation. Disabled/pending labels remain readable; do not reduce whole controls to a low-opacity wash. No gradients, glass, glows, or decorated charts are prescribed.

## Copywriting Contract

Indonesian is the first-visit language; a visible `Bahasa: Indonesia / Language: English` control switches immediately and persists the preference. Translate interface/resource labels, instructions, validation, statuses, and feedback. Keep actual names as supplied; do not invent translations of coach/venue names or factual club content.

| Element | Indonesian | English |
|---------|------------|---------|
| Primary CTA, public session row | Lihat detail sesi | View session details |
| Primary CTA, final new-session review | Simpan dan tampilkan sesi | Save and publish session |
| Final session edit | Simpan perubahan sesi | Save session changes |
| Add session | Tambah sesi | Add session |
| Guided progression | Lanjut ke lokasi dan pelatih / Lanjut ke harga dan batas peserta / Periksa sesi; Kembali ke kelas dan waktu / Kembali ke lokasi dan pelatih / Kembali ke harga dan batas peserta | Continue to venue and coaches / Continue to price and participant limits / Review session; Back to class and time / Back to venue and coaches / Back to price and participant limits |
| Public navigation | Jadwal / Tentang Lafu | Schedule / About Lafu |
| Admin navigation | Sesi / Kelas / Kelola | Sessions / Classes / Manage |
| Date controls | Hari ini / Tanggal sebelumnya / Tanggal berikutnya / Pilih tanggal | Today / Previous date / Next date / Choose date |
| Empty state heading, selected date | Tidak ada sesi pada tanggal ini | No sessions on this date |
| Empty state body, next date exists | Pilih tanggal lain atau lihat jadwal berikutnya. | Choose another date or view the next scheduled date. |
| Empty date shortcut | Lihat jadwal berikutnya | View next scheduled date |
| Empty state body, no future sessions | Belum ada sesi mendatang. Coba lagi nanti. | No upcoming sessions have been published. Check again later. |
| Schedule loading | Memuat jadwal... | Loading schedule... |
| Error state, schedule | Jadwal belum dapat dimuat. Coba lagi. | The schedule could not be loaded. Try again. |
| Error recovery | Coba lagi | Try again |
| Detail loading / error | Memuat detail sesi... / Detail sesi belum dapat dimuat. Coba lagi. | Loading session details... / Session details could not be loaded. Try again. |
| Incomplete detail / unknown field | Informasi sesi belum lengkap. Coba muat ulang. / Belum tersedia | Session information is incomplete. Try reloading. / Not available |
| Available | Tersedia | Available |
| Nearly full | Hampir penuh | Nearly full |
| Full | Penuh | Full |
| Cancelled | Dibatalkan | Cancelled |
| Remaining places | Tersisa {count} tempat | {count} place remaining / {count} places remaining |
| Price / minimum / maximum | Harga per tempat / Minimum peserta / Kapasitas maksimum | Price per place / Minimum participants / Maximum capacity |
| Cancelled explanation | Sesi ini dibatalkan. Lihat sesi lain pada jadwal. | This session is cancelled. View another session on the schedule. |
| Detail close | Tutup detail sesi | Close session details |
| Admin sign-in | Masuk admin | Admin sign in |
| Sign-in fields | Email / Kata sandi / Tampilkan kata sandi / Sembunyikan kata sandi | Email / Password / Show password / Hide password |
| Invalid sign-in | Email atau kata sandi tidak cocok. Periksa lalu coba lagi. | Email or password does not match. Check and try again. |
| Sign-in request failure | Belum dapat masuk. Coba lagi. | Could not sign in. Try again. |
| Restricted access | Akses admin diperlukan. Masuk dengan akun admin yang ditetapkan. | Admin access is required. Sign in with a designated admin account. |
| Session expired | Sesi admin berakhir. Masuk lagi untuk melanjutkan. | Your admin session has ended. Sign in again to continue. |
| Sign out | Keluar | Sign out |
| Empty admin sessions | Belum ada sesi. Tambahkan sesi setelah kelas dan data pendukung tersedia. | No sessions yet. Add a session after classes and supporting records are ready. |
| Reference empty state | Belum ada {jenis}. Tambah {jenis} untuk digunakan dalam kelas dan sesi. | No {type} yet. Add a {type} to use in classes and sessions. |
| Reference types/actions | Kelas / Pelatih / Lokasi / Level; Tambah kelas / Tambah pelatih / Tambah lokasi / Tambah level; Ubah kelas / Ubah pelatih / Ubah lokasi / Ubah level | Classes / Coaches / Venues / Levels; Add class / Add coach / Add venue / Add level; Edit class / Edit coach / Edit venue / Edit level |
| Review edit links | Ubah kelas dan waktu / Ubah lokasi dan pelatih / Ubah harga dan batas peserta | Edit class and time / Edit venue and coaches / Edit price and participant limits |
| Missing required references | Data kelas, pelatih, lokasi, atau level belum lengkap. Lengkapi melalui Kelola, lalu kembali ke sesi ini. | Class, coach, venue, or level records are missing. Complete them in Manage, then return to this session. |
| Class defaults explanation | Nilai awal berasal dari kelas dan dapat diubah untuk sesi ini. | Starting values come from the class and can be changed for this session. |
| Guided step names | Kelas dan waktu / Lokasi dan pelatih / Harga dan batas peserta / Periksa sesi | Class and time / Venue and coaches / Price and participant limits / Review session |
| Session field labels | Kelas / Tanggal / Waktu mulai (WIB) / Durasi (menit) / Level / Lokasi / Pelatih | Class / Date / Start time (WIB) / Duration (minutes) / Level / Venue / Coaches |
| Replace edited defaults confirmation | Ganti kelas? Nilai yang telah Anda ubah akan diganti dengan nilai awal kelas baru. | Change class? Values you have edited will be replaced with the new class defaults. |
| Replace edited defaults actions | Pertahankan kelas / Ganti kelas | Keep class / Change class |
| Class edit explanation | Perubahan nilai awal hanya berlaku untuk sesi baru. Sesi yang sudah ada tetap sama. | Default changes apply only to new sessions. Existing sessions keep their values. |
| Review publication explanation | Sesi akan tampil di jadwal setelah disimpan. | This session will appear on the schedule after saving. |
| Required field | Isi {nama kolom}. | Enter {field name}. |
| Coach validation | Pilih setidaknya satu pelatih. | Select at least one coach. |
| Participant-limit validation | Minimum peserta tidak boleh melebihi kapasitas maksimum. | Minimum participants cannot exceed maximum capacity. |
| Capacity edit rejected | Kapasitas lebih kecil dari tempat yang sudah terpakai. Tambahkan kapasitas lalu simpan lagi. | Capacity is below the places already occupied. Increase capacity and save again. |
| Price validation | Masukkan harga rupiah berupa angka bulat yang valid. | Enter a valid whole-number rupiah price. |
| Unsaved session loading/save error | Menyimpan sesi... / Sesi belum tersimpan. Isian tetap tersedia. Coba simpan lagi. | Saving session... / The session was not saved. Your entries are still available. Try saving again. |
| Conflicting edit | Sesi ini telah diubah oleh admin lain. Muat versi terbaru lalu periksa perubahan Anda. | Another admin changed this session. Load the latest version and review your changes. |
| Conflicting edit action | Muat versi terbaru | Load latest version |
| Save success | Sesi tersimpan dan tampil di jadwal. | Session saved and published on the schedule. |
| Destructive confirmation, discard | Buang perubahan? Perubahan yang belum disimpan akan hilang. | Discard changes? Unsaved changes will be lost. |
| Discard actions | Tetap mengedit / Buang perubahan | Keep editing / Discard changes |
| Fixture disclosure | Data contoh untuk pengujian, bukan jadwal klub. | Sample data for testing, not the club schedule. |

Reference messages interpolate localized singular/plural nouns, not a raw backend code. Field names are localized. Login never reveals whether a designated email exists. No password-recovery link is shown until the planning-selected setup recovery mechanism has a real destination; no in-app invitations or customer signup controls are added.

Format prices as whole IDR amounts with localized grouping and the visible rupiah currency marker; show the translated per-place unit. Changing language never changes currency, values, or the WIB timezone. Field inputs and review preserve the exact integer amount without a decimal-price conversion.

Destructive actions in Phase 1: **discard unsaved form changes only**. Trigger an AlertDialog when leaving a changed form, preserve input when declined, and clear it only after explicit discard. No reference deletion, session cancellation, booking cancellation, refunds, or destructive bulk controls are required or authorized by this contract. Reference create/edit management must preserve referenced-session integrity. Any later deletion proposal requires the planner to specify semantics and matching confirmation before implementation.

## Information Architecture and Interaction Contract

Routes below are contract defaults for implementation, not existing pages. Route mechanics remain the planner's framework choice.

| Surface | Default destination | Entry and focal task |
|---------|---------------------|----------------------|
| Public schedule | `/` | Signed-out entry; today in WIB, date controls, chronological sessions. |
| Club information | `/club` | Header link from schedule, real club facts, back to schedule, subdued Admin sign in link. |
| Session detail | Dialog over `/` | Tapped session, no dedicated detail page; schedule selection and scroll position persist. |
| Admin sign-in | `/admin/sign-in` | Fixed-account email/password form, language control, public schedule return. |
| Admin sessions | `/admin/sessions` | Default authenticated destination; today/upcoming dated-session management and Add session. |
| Session create/edit | `/admin/sessions/new`, `/admin/sessions/:id/edit` | Guided fields and review, eventual valid save. |
| Class management | `/admin/classes` | Create/edit class defaults with future-session-only explanation. |
| Management hub | `/admin/manage` | Coaches, Venues, Levels links; language setting and Sign out. |
| Reference screens | `/admin/coaches`, `/admin/venues`, `/admin/levels` | Separate phone-usable create/edit screens; return to Manage. |

Public header: text Lafu, Schedule/About Lafu links, visible language control; fit narrow widths by wrapping onto a second row. No public login barrier or bookings/account navigation. Admin bottom navigation contains Sessions, Classes, Manage only. Create/edit actions are not destinations. Navigation disappears beneath a modal sheet's inert overlay. On larger widths use the same labeled destinations in a compact top navigation, with no KPI sidebar or analytics dashboard.

### Public schedule and details

1. Initialize today using `Asia/Jakarta` even when device/server timezone differs. Keep selected date while changing language or closing details. A visible localized full-date heading includes WIB; session times use 24-hour time with WIB, and dates are never ambiguous numeric month/day strings.
2. Show seven consecutive quick-date choices starting from the selected week's visible window; previous/next controls adjust the calendar date, not merely scroll a strip. Native date selection can reach any supported schedule date. Strip overflow is local and keyboard-accessible; the page never scrolls sideways.
3. Sort summaries by start time. Each summary shows time range, class/level, venue, IDR price per place, exact remaining count and localized status. Class/venue names wrap. Full and cancelled summaries still open their complete facts.
4. Detail fact order: class/level, localized date/time and WIB, venue, all coaches as separate readable names, price per place, remaining places, minimum participants, maximum capacity. Use real server data, not locally invented attendance or percentages.
5. Status order: cancelled first; otherwise remaining = 0 means Full; positive remaining/max <= .25 means Nearly full; otherwise Available. Do not round the ratio. Minimum participant number is a distinct fact; it never implies that a minimum has been met or that booking exists.
6. Empty selected date uses the documented copy and next scheduled date shortcut if that date exists; otherwise omit that shortcut and show the no-future-sessions copy. Do not navigate away from today automatically.
7. Row activation opens a modal Dialog styled as a bottom sheet. It has an accessible title/description, focus trap, background scroll lock, Escape and labeled Close actions. Opening focuses its title/close region; closing returns focus to its row. Dismissal preserves schedule date and position. Drag/swipe is never the sole dismissal method.
8. Sheet content uses `max-height: calc(100dvh - 16px)` with an internally scrolling fact region and safe bottom padding. Tablet/desktop center a maximum-640px-wide bottom sheet over the same schedule; preserve the selected sheet interaction rather than introducing a detail route.
9. Phase 1 offers no Book, OTP, Pay, roster, proof, recurrence, or cancellation controls. Available/full/cancelled state presentation remains factual; isolated test fixtures verify unreachable production status examples until later workflows exist.

### Guided admin session creation/edit

Use four short steps by default: **Class and time**, **Venue and coaches**, **Price and participant limits**, **Review**. Show localized `Langkah {n} dari 4 / Step {n} of 4`, current step name, and editable summary on review.

- Step 1: required class selection, WIB date/start time, and duration. A class preloads editable level, duration, price, min/max, venue, and all default coaches. Selecting a different class after overrides requires confirming replacement of those overrides; declining retains the current class and entries. This is an unsaved-change decision, not publication.
- Step 2: level, one venue, and one or more coaches. Coaches are a multi-selection list, not a one-coach select. Missing reference records link to the separate management destination and preserve the in-progress form during same-tab navigation. No inline reference creation is embedded.
- Step 3: whole-number IDR price per place, minimum participant count, and maximum capacity. Visible units remove currency/count ambiguity; integer inputs use an appropriate numeric input mode. Validate against server-approved ranges; never accept min > max or a capacity below occupied places. Final policy/range limits belong to planning, not invented UI maxima.
- Step 4: list all required public facts and all selected coaches. Every group has a labeled contextual Edit link back to that step, using the Review edit links copy row. Publication explanation and Save and publish session action are visible. Existing-session review uses Save session changes.
- Back retains entries. Continue validates the current group and moves focus to the next heading; errors move focus to the first invalid field and provide text beside it. Previous completed steps can be revisited. No intermediate step creates a publicly visible draft or changes an existing session.
- Final save validates and persists the complete session and coach assignments atomically. While pending, keep review readable and disable duplicate submission; success returns to the saved session in the admin list and shows the success text only after server confirmation. A separate public view must show the published values.
- Failed save retains all entries and offers retry. An ambiguous network outcome must recheck whether the save succeeded before another create, avoiding duplicates/false failure claims. A stale edit never silently overwrites another admin; retain the local entries while reviewing the newly loaded version.
- Class defaults remain class-owned; saved session values remain session-owned. Updating class defaults affects future creations only. Do not auto-update even unbooked sessions.
- Admin authentication/authorization is server-enforced. An expired/denied session shows the named recovery message rather than empty public data or false save success. Preserve a safe local form while reauthenticating when possible; do not store passwords or private credentials with it.

Class and reference management use labeled create/edit forms and the same field/save feedback treatments. The class default form includes level, duration, price, min/max, venue, and multiple coaches. The separate reference screens are reachable on phones before creating a valid session. Real content fields and final operating validation ranges must be settled by the planner.

## Responsive and Accessibility Contract

| Content width | Contract layout |
|---------------|-----------------|
| Below 640px | One column, 16px page gutters, wrapped compact header, chronological full-width rows, full-page stepped admin form, visible admin bottom navigation. |
| 640px to 1023px | 24px gutters, max-800px schedule column; admin reference facts/review groups may use two columns only when each remains at least 280px. Guided editable field groups stay focused; sheet max-width 640px. |
| 1024px and above | 32px gutters, max-1120px page; schedule max-800px centered; admin management lists/review facts may expand into columns, with every action preserved. Compact labeled top admin navigation replaces bottom navigation. |

Breakpoints are initial content-fit defaults, to be checked by continuously resizing. Phone headings use 20px and expanded headings use 28px; never shrink 16px input/body text. Do not stretch the phone list into a wall-wide column or introduce side-by-side detail pages that contradict D-04.

- Admin bottom navigation base height is 64px plus `env(safe-area-inset-bottom)`. Page padding and scroll padding reserve the actual bar height plus 16px. Form action regions use content-sized height plus safe area; reserve their measured height, not a fixed guess. During keyboard use they remain in reachable document flow rather than obscuring fields.
- Ensure the last field, validation message, summary row, and save action can scroll entirely above any fixed region. Safe-area top/side insets apply where needed. No `100vh` hero or arbitrary page-sized empty padding.
- Grid/flex children permit shrinking; names use normal wrapping with overflow-wrap for unbroken strings. Coach names form a vertical list, not clipped tags. Counts/prices may wrap to another line without losing their units. No ellipsis hides mandatory detail facts.
- All visible controls have meaningful labels; icon-only close/previous/next controls have localized accessible names and 48px hit areas. UI text does not contain decorative emoji.
- Use semantic landmarks/headings, lists for schedules/coaches, real links for navigation, buttons for actions, associated labels/hints/errors for inputs, and `aria-current`/selected states for navigation/date choices. No nested row buttons.
- Focus follows visual order; every control works with Tab, Shift+Tab, Enter/Space as applicable. Modal Escape closes and returns focus. Use a persistent visible focus outline, not a hover-only cue. Color is never the only state signal.
- Schedule/detail loading and form result messages have restrained live announcements. A changed date announces its heading/result count without moving focus away from the activated date. Required-field errors use `aria-invalid` and associated descriptions.
- Preserve 200% text zoom and reflow at 320 CSS px. Verify actual input/control text and focus at phone, intermediate, and desktop sizes in both languages. Test long names and translated labels; do not set arbitrary content length policy to rescue a layout.
- Use 180ms sheet translation/opacity and 120ms step transitions solely to explain opened context and progression. No looping pulse, animated skeleton, scroll reveal, bounce, or ornamental movement. With `prefers-reduced-motion: reduce`, remove those transitions while preserving focus and state changes.

## Data-State Behavior

These are normative behavior definitions for implementation. Probe classification and resolved-count evidence are owned by the orchestrator in the next section.

| Element | Required behavior |
|---------|-------------------|
| Public schedule list | Initial load shows schedule-loading copy and nonanimated row placeholders matching the eventual row hierarchy. Zero results use the relevant empty copy/shortcut. One result remains one full-width row; many results form a chronological vertical list. Load failure retains date controls and offers retry for that date. |
| Schedule date change | Keep control state visible and name the requested date while fetching. Do not label a previous date's rows as current results. Rapid requests discard stale responses; a failure remains recoverable without losing date selection. |
| Session detail | Show named loading/error state with close/retry working. Missing required facts are shown as unavailable, never fabricated; keep supplied facts and show a visible incomplete-data message. Refresh uses the latest status/count. |
| Admin session/reference lists | Distinguish loading, truly empty, load failure, and forbidden access. Zero/one/many use the same usable list composition. Failed requests never masquerade as zero items. Long names/actions wrap. |
| Admin forms | Empty fields keep labels/hints; class-prefilled values remain editable. Partial progress retains entries through steps and same-tab reference navigation. Field errors and failed saves preserve values. Disabled submit indicates the specific pending operation. |
| Coach options | Zero options links to separate coach management; one option is still explicitly selected; many options stay vertically scrollable with each name readable. Selected coaches remain visible in review. |
| Navigation/language | Only implemented destinations exist. Long labels wrap without losing 48px targets. Language changes preserve selected date/open session and form values. Failed protected navigation shows access/load recovery, not dead links. |
| Club information/media | Publish supplied facts with genuine bilingual content. Missing photography/logo means text identity and no fabricated media. Missing factual content stays visibly unavailable in development and is an explicit content prerequisite before a real club launch. |

Incomplete-detail and unknown-field text use the Copywriting Contract rows. Do not substitute zero for an unknown remaining-place count.

## UI Considerations

User confirmed the corrected surface classifications and state rules from 01-UI-PROBE.md on 2026-10-08. Kinds were supplied as explicit elements overrides (01-UI-PROBE-ELEMENTS.json); probe report: 01-UI-PROBE-REPORT.json. Copy lives in the Copywriting Contract; behavior rules live in Data-State Behavior. These are acceptance rules, not claims of implemented or tested UI.

Applicable state considerations resolved: 78/78 (explicit 78, backstop 0, unresolved 0, unclassified 0).

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | E1 | resolved (explicit) | Zero sessions for the selected date shows the Copywriting empty-schedule copy and a next-scheduled-date shortcut only when such a date exists; date controls stay usable. |
| loading | E1 | resolved (explicit) | Loading names the requested date, shows nonanimated row placeholders matching the row hierarchy, keeps the selected date, and never labels the previous date's rows as current. |
| error | E1 | resolved (explicit) | Load failure keeps date controls, names the failed date load, and offers Retry for that date; a failure is never rendered as an empty schedule. |
| populated | E1 | resolved (explicit) | Sessions render as chronological full-width rows with time, class, availability label plus exact remaining count, and open the detail sheet. |
| partial | E1 | resolved (explicit) | A row missing a fact shows it as unavailable (never zero) while keeping supplied facts. |
| overflow | E1 | resolved (explicit) | Long lists scroll vertically in page flow; no page-wide horizontal scroll at 320px; bottom safe area and fixed regions are reserved. |
| zero-one-many | E1 | resolved (explicit) | Zero uses the empty state, one remains a single full-width row, many form a chronological vertical list; remaining-place counts keep pluralized units in both languages. |
| long-text | E1 | resolved (explicit) | Long class/venue names and Indonesian labels wrap without ellipsis on required facts; body text stays 16px and row targets stay at least 48px. |
| empty | E2 | resolved (explicit) | The native date input always keeps its label and hint; with no picked value it shows the currently selected strip date. |
| loading | E2 | resolved (explicit) | While a date's sessions load, the activated date stays selected and focused; rapid repeated choices discard stale responses. |
| error | E2 | resolved (explicit) | An invalid or out-of-range picked date shows an associated inline error and keeps the previous valid selection. |
| populated | E2 | resolved (explicit) | Seven deterministic date buttons show weekday label and 20px bold day; the selected date has green fill, white text, and an accessible selected state. |
| partial | E2 | resolved (explicit) | Choosing a date outside the visible strip via picker or previous/next keeps the strip in sync with that date. |
| overflow | E2 | resolved (explicit) | The strip scrolls locally inside its own row; previous/next buttons and the picker work without swipe; the page never scrolls sideways. |
| zero-one-many | E2 | resolved (explicit) | The strip always shows a fixed set of seven dates; per-date session counts never change button count or width. |
| long-text | E2 | resolved (explicit) | Indonesian weekday labels and the picker label fit or wrap inside 48px-minimum buttons without shrinking below readable size. |
| empty | E3 | resolved (explicit) | A session with no supplied coaches or facts shows each missing fact as unavailable with the incomplete-data message; nothing is fabricated. |
| loading | E3 | resolved (explicit) | Opening or refreshing the sheet shows a named loading state while Close remains operable and focus stays inside the dialog. |
| error | E3 | resolved (explicit) | Detail load failure shows a named error with Retry and working Close; focus returns to the originating row on close. |
| populated | E3 | resolved (explicit) | Facts appear in contract order: class/level, localized date/time with WIB, venue, every coach as a separate name, price per place, remaining places, minimum participants, maximum capacity. |
| partial | E3 | resolved (explicit) | Partial detail keeps valid facts, marks missing ones unavailable, and shows the Copywriting incomplete-data message; an unknown remaining-place count is never shown as 0. |
| overflow | E3 | resolved (explicit) | Long content scrolls inside the sheet with header and Close visible; bottom safe area is respected. |
| zero-one-many | E3 | resolved (explicit) | Coaches render as a vertical list: zero shows unavailable, one shows a single name, many show every name without truncation. |
| long-text | E3 | resolved (explicit) | Long names, prices, and bilingual labels wrap inside the sheet; no required fact is ellipsized. |
| loading | E4 | resolved (explicit) | Navigation keeps its label and current-destination state while the destination loads. |
| error | E4 | resolved (explicit) | Failed protected navigation shows access/load recovery (sign in or retry), never a dead link. |
| overflow | E4 | resolved (explicit) | Admin bottom navigation reserves 64px plus safe-area inset; page scroll padding clears it; the header wraps rather than overflowing. |
| long-text | E4 | resolved (explicit) | Long Indonesian/English navigation and language labels wrap while every target stays at least 48px; switching language preserves selected date, open session, and form values. |
| empty | E5 | resolved (explicit) | Empty email/password fields keep visible labels and hints; submitting empty fields shows associated required errors. |
| loading | E5 | resolved (explicit) | Signing in disables submit with a named pending label and prevents duplicate submission while keeping the entered email. |
| error | E5 | resolved (explicit) | Invalid credentials or network failure show an associated, announced error with email preserved; session expiry shows the Copywriting session-ended message. |
| partial | E5 | resolved (explicit) | With one field filled, its value is kept and only the missing field is flagged. |
| overflow | E5 | resolved (explicit) | The form fits at 320px and 200% zoom with the submit action reachable above the on-screen keyboard. |
| long-text | E5 | resolved (explicit) | Long error messages and translated labels wrap; the Show/Hide password toggle keeps a 48px target and localized name. |
| empty | E6 | resolved (explicit) | New-session steps show empty fields with labels/hints; class-prefilled defaults appear and remain editable. |
| loading | E6 | resolved (explicit) | Saving disables final submit with a named pending operation; entered values remain intact. |
| error | E6 | resolved (explicit) | Field errors are associated per field and the step containing errors is identified; a failed save keeps all values and offers retry. |
| populated | E6 | resolved (explicit) | The review step shows Step 4 of 4 with an editable summary of class/time, venue, every selected coach, price, and min/max limits. |
| partial | E6 | resolved (explicit) | Partial progress persists across steps and same-tab reference navigation; review blocks final save until all required fields and at least one coach are set. |
| overflow | E6 | resolved (explicit) | Long forms scroll in document flow; the last field, error, and action region sit above fixed navigation and safe area. |
| zero-one-many | E6 | resolved (explicit) | Selected coaches in review list zero (save blocked with message), one, or many as readable vertical names. |
| long-text | E6 | resolved (explicit) | Long field labels, hints, and errors wrap in both languages; inputs keep 16px text and 48px height. |
| empty | E7 | resolved (explicit) | Class/reference create forms show empty labeled fields with hints; required errors appear after submit or blur. |
| loading | E7 | resolved (explicit) | Save disables submit with a named pending label and prevents duplicate records. |
| error | E7 | resolved (explicit) | Validation and save failures show associated field errors and an inline save error with retry; values are preserved. |
| partial | E7 | resolved (explicit) | Partially filled class defaults keep values and flag only invalid/missing fields, including minimum greater than maximum. |
| overflow | E7 | resolved (explicit) | Forms reflow to one column at 320px with the action region reachable above keyboard and fixed navigation. |
| long-text | E7 | resolved (explicit) | Long class, venue, and coach names and translated labels wrap; success shows persistent text near the saved record. |
| empty | E8 | resolved (explicit) | A truly empty admin list names the relevant Add action. |
| loading | E8 | resolved (explicit) | Lists show a named loading state with static placeholders; add/edit actions stay reachable. |
| error | E8 | resolved (explicit) | Load failure and forbidden access show distinct messages with retry or sign-in recovery; failures never render as zero items. |
| populated | E8 | resolved (explicit) | Records show readable names and key facts with add/edit actions per record. |
| partial | E8 | resolved (explicit) | Records missing optional facts show them as unavailable without hiding the record. |
| overflow | E8 | resolved (explicit) | Long lists scroll vertically; on wide screens columns expand without dropping actions. |
| zero-one-many | E8 | resolved (explicit) | Zero shows the empty state with Add, one shows a single full record, many use the same vertical composition. |
| long-text | E8 | resolved (explicit) | Long names and statuses wrap; action labels stay visible with 48px targets. |
| empty | E9 | resolved (explicit) | Zero coach options show a message linking to coach management. |
| loading | E9 | resolved (explicit) | Coach options show a named loading state; existing selections are preserved. |
| error | E9 | resolved (explicit) | Coach option load failure shows retry and keeps prior selections. |
| populated | E9 | resolved (explicit) | Coaches render as vertical labeled checkbox rows with 48px targets and 8px gaps. |
| partial | E9 | resolved (explicit) | Selected coaches that are no longer available are flagged in review rather than silently dropped. |
| overflow | E9 | resolved (explicit) | Many coaches scroll vertically with each name fully readable. |
| zero-one-many | E9 | resolved (explicit) | Zero links to management, one still requires explicit selection, many remain a vertical checklist. |
| long-text | E9 | resolved (explicit) | Long coach names wrap within checkbox rows without truncation. |
| empty | E10 | resolved (explicit) | Missing logo/photography renders a text identity; missing facts show visible unavailable text in development; no media is fabricated. |
| loading | E10 | resolved (explicit) | Text facts render immediately; supplied media loading never blocks reading facts. |
| error | E10 | resolved (explicit) | Failed media load falls back to text identity with facts intact. |
| populated | E10 | resolved (explicit) | Only supplied bilingual club facts and assets are published. |
| overflow | E10 | resolved (explicit) | Club information wraps and scrolls in page flow without horizontal scrolling. |
| long-text | E10 | resolved (explicit) | Long bilingual club descriptions wrap at readable width; no required fact is truncated. |
| loading | E11 | resolved (explicit) | The discard confirmation has fixed local content and shows no server loading state. |
| error | E11 | resolved (explicit) | If leaving is declined or fails, the form and its input remain intact. |
| overflow | E11 | resolved (explicit) | Phone actions stack; dialog content scrolls internally at 200% zoom. |
| long-text | E11 | resolved (explicit) | Long translated title/explanation wraps; Keep editing remains the initial focus and safe default. |
| loading | E12 | resolved (explicit) | Pending status names the owning operation inline in context. |
| error | E12 | resolved (explicit) | Errors are announced, associated with affected fields, and include a text recovery action. |
| overflow | E12 | resolved (explicit) | Long status messages wrap inside the panel without covering fields. |
| long-text | E12 | resolved (explicit) | Availability labels show text and exact remaining count together and wrap in both languages; color is never the only signal. |

Element key: E1 public schedule, E2 date strip/picker, E3 session detail sheet, E4 navigation/language, E5 admin sign-in, E6 guided session editor, E7 class/reference editor, E8 admin record lists, E9 coach selection, E10 club information/media, E11 discard confirmation, E12 validation/status panel.

## Scope and Decision Traceability

| Requirement | Contract coverage |
|-------------|-------------------|
| DISC-01 | Public Club information route/header link, genuine content, no sign-in barrier. |
| DISC-02 | Schedule-first public entry and chronological dated-session list. |
| DISC-03 | Today, quick-date strip, previous/next, labeled native date picker, and empty-date shortcut. |
| DISC-04 | Detail sheet exposes date/time, all coaches, level, venue, price/place, minimum, maximum, and remaining places. |
| DISC-05 | Exact availability algorithm, localized textual labels, full/cancelled presentation, cancelled precedence. |
| AUTH-06 | Fixed-account email/password admin entry, authenticated destinations, server authority and recoverable denied/expired states. |
| SCHED-01 | Separate class create/edit and session-default fields, future-only default changes. |
| SCHED-02 | Four-step dated-session create/edit and final valid immediate-publication save. |
| SCHED-04 | Separate coaches management and multi-coach selection. |
| SCHED-05 | Separate venues management and required per-session venue. |
| SCHED-06 | Separate levels management and editable session/class level. |
| SCHED-07 | Integer IDR price per place, guided field validation and review. |
| SCHED-08 | Separate minimum/maximum facts, validated min/max and safe capacity edits. |
| SCHED-09 | Required venue and one-or-more unique coaches, reviewed and saved together. |

| Locked decisions | Where carried forward |
|------------------|-----------------------|
| D-01 to D-04 | Schedule-first/today, summaries, context-preserving detail sheet. |
| D-05 to D-08 | Final valid immediate save, editable class snapshots, future-only defaults, separate references. |
| D-09 to D-13 | Exact 25% rule, visible cancelled records, WIB/IDR, Indonesian default and remembered English. |
| D-14 to D-17 | Setup accounts, email/password, guided create/edit, working-only phone bottom navigation. |
| D-18 to D-20 | Responsive bilingual/accessibility contracts, confirmed direction/Antislop, public privacy/capacity. Later hold/review/group/minimum rules are preserved without new actions. |
| D-21 to D-22 | SQLite/Prisma remain server-side implementation constraints; no Supabase or client database access. |
| D-23 to D-24 | Installed shadcn/Tailwind foundation with mandatory per-component customization and locked brand palette. |

Inputs: `01-CONTEXT.md` contributes all 24 locked decisions; `01-RESEARCH.md` contributes advisory server/public DTO, persistence, optimistic-edit and validation boundaries; `.planning/UI-BRIEF.md`/`PRODUCT.md` contribute Community matchday and novice phone usability; `components.json`/CLI/package commands establish installed setup. Current-session input adds initialization, delegated preset choice, heavy customization, and exact palette through D-23/D-24. Routes, component dimensions, copy, and visual tokens beyond locked colors are researcher defaults.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Initialization preset b2YOAa; zero installed UI blocks. Proposed small button/input/select/checkbox/dialog/alert-dialog/field wrappers only, customized as specified. | not required for official registry; configuration inspected 2026-10-08 |
| Third-party registries | None declared or configured. No external blocks selected. | not applicable; empty `components.json.registries` verified 2026-10-08 |

No third-party source entered this contract. If a later plan proposes an external block, complete the workflow's source-view safety gate before including it; this record does not preapprove future registries.

## Verification and Antislop Evidence Boundary

Contract evidence now: required upstream files/skills read, current installed inventory enumerated, component treatments and dials written, token contrast computed, scope traced. No business UI exists. The setup build/lint reported by the orchestrator does not verify any Lafu workflow.

Before delivering implemented Phase 1 UI, the executor must personally run the Antislop core Delivery Gate and applicable UI/mobile checklists with item-by-item evidence. Include build/lint, browser console, every implemented control/destination, Indonesian/English, 320/390/640/820/1024/1440px and continuous intermediate-width checks, text zoom, keyboard/focus/close restoration, safe-area/keyboard action reachability, long names/multiple coaches, all prescribed empty/loading/error states, and create/edit-to-public-view persistence. Manually check comfortable phone use as well as automated checks. Contrast ratios above are inputs to those checks, not a runtime PASS.

Isolated labeled fixtures cover nearly-full boundaries including odd maximum capacities, zero/full, and cancelled precedence without creating fake production bookings/attendance. Public responses/rendered details expose no private customer/participant/payment fields. Capacity validation and publication confirmation need real server evidence; decorative UI review cannot prove them.

Real club content, translation responsibility for factual club copy, approved field/range limits, remaining architecture, and admin recovery/provisioning mechanics remain planner prerequisites. This contract does not silently decide later reservation, payment, cancellation, recurrence, or refund policies.

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Checker approval:** 2026-10-08. Seven dimensions passed, no remaining recommendations. Final workflow approval awaits the UI state-probe confirmation; status remains draft until then.
