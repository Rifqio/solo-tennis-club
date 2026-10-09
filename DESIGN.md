---
version: alpha
name: Lafu (Lawu Fun Tennis Club)
description: Courtside. A bright, photographic tennis-club phone app on court blue and ink, where the chosen thing turns ball lime and session times read like a scoreboard.
colors:
  primary: "#0079ED"
  primary-deep: "#0062C4"
  primary-light: "#4DA3FF"
  on-primary: "#FFFFFF"
  accent: "#C0FC49"
  on-accent: "#0F1112"
  ink: "#0F1112"
  ink-raised: "#232628"
  on-ink: "#F2F3F3"
  on-ink-variant: "#9AA1A6"
  surface: "#F2F3F3"
  surface-card: "#FFFFFF"
  surface-container: "#E7E9E9"
  on-surface: "#0F1112"
  on-surface-variant: "#5B6166"
  outline: "#767C81"
  outline-variant: "#D3D7D8"
  surface-dark: "#0F1112"
  surface-card-dark: "#1A1D1F"
  surface-container-dark: "#232628"
  on-surface-dark: "#F2F3F3"
  on-surface-variant-dark: "#9AA1A6"
  outline-dark: "#6B7378"
  warning: "#805000"
  warning-container: "#FFF4D6"
  warning-dark: "#F5C46A"
  error: "#B42318"
  error-container: "#FEECE8"
  error-dark: "#FFB4A8"
  scrim: "rgba(15, 17, 18, 0.56)"
typography:
  display:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  scoreboard:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum' 1"
  wordmark:
    fontFamily: "'Outfit Variable', Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  xs: "4px"
  sm: "8px"
  lg: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  court-band:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  date-tile:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    width: "56px"
    height: "72px"
  date-tile-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    width: "56px"
    height: "72px"
  slot-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0 16px"
    height: "48px"
  slot-chip-selected:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0 16px"
    height: "48px"
  scoreboard-cell:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.scoreboard}"
    rounded: "{rounded.xs}"
    width: "48px"
    height: "48px"
  session-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "48px"
  button-primary-on-dark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "48px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.primary-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "48px"
  dock:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink-variant}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "72px"
  dock-active:
    backgroundColor: "transparent"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
  book-fab:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    size: "64px"
  filter-tab:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label}"
    height: "48px"
  filter-tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    height: "48px"
  bottom-sheet:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  onboarding-start-bar:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    height: "64px"
  pager:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    height: "64px"
---

# Design System: Lafu (Lawu Fun Tennis Club)

> **Status: target system, approved direction 2026-10-09; implementation pending.** This file replaces the "Jalur Lawu" world (club green, Barlow Condensed, Material shapes). The running app still shows Jalur Lawu until the rebuild lands; where code and this file disagree, this file is the target. The motion and feedback system, state rules, calendar behavior, and accessibility rules carry over unchanged.

## Overview

**Creative North Star: "Courtside"**

Standing at the edge of a blue hard court on a bright morning: big flat fields of court blue, white lines, one lime ball that your eye goes to first, and a black scoreboard with the numbers that matter. Lafu should feel like that. Large color fields and real court photography do the work that thin hairlines and pale tints did before; type is bigger and rounder; the one lime thing on each screen is always what you have chosen or the action you came to take.

The layout grammar comes from a padel court booking app the club owner selected (Dribbble, "Padel Court Booking & Sports App UI" by Sheikh Raihan UI): a labeled bottom menu with a raised center action in a notch, a scrolling strip of date tiles with a selection bar, schedule tabs with an underline, an "available only" switch and a row of time chips, and a full-bleed photographic onboarding with a long start bar. The palette comes from the same studio's "Live Sports & Tennis Streaming App UI": court blue #0079ED, ball lime #C0FC49, and ink #0F1112, plus its scoreboard digit cells. Both are adapted, not copied: no logos, people, copy, or features from the references are reused, and anything Lafu does not have (community feeds, chat, alerts, ratings, favorites, avatar stacks) is left out.

Lafu's signature is the **scoreboard**: every session time is set in Deep Court cells with white digits, the way a club scoreboard shows a set. It replaces the trail-post plate and carries the same job: the time is the first thing you read.

**Key Characteristics:**
- Court-blue band at the top of each main screen, with white court-line art; ink dock at the bottom with a lime "Pesan" button in a notch.
- Lime means chosen or primary, and it only ever sits on ink or blue, never on the light page.
- Outfit throughout, in four weights; big two-line headlines on onboarding and screen titles.
- Session times as scoreboard cells; availability as words with an echoing mark.
- Real tennis photography (licensed, never presented as the club or its members) on onboarding and the club page.
- Square-ish shapes (4px tiles and chips, 8px cards and buttons), full round only for the book button and pager.
- Light and dark follow the phone; the micro-interactions from Jalur Lawu stay.

**Dials:** ENERGY 3 / RHYTHM 2 / MOTION 2. Energy comes from color fields, photography and type scale; rhythm stays consistent between screens because members use the schedule daily; motion stays functional (shared selection, shared axis, press), with no decorative loops.

## Colors

Three committed colors: court blue for fields, ink for anchors and the dock, ball lime for the one chosen thing. Everything else is neutral.

### Primary
- **Court Blue** (#0079ED): the top band on main screens, the calendar sheet header, onboarding fields and large display text on blue. White on Court Blue measures 4.24:1, so only large text (at least 18.66px bold or 24px regular) may sit directly on it. Display, headline and title in white pass as large text.
- **Deep Court** (#0062C4): anything small that must sit on or near blue, and blue text on light surfaces. Unselected date tiles on the band, small labels on the band, text links and the "available" word on the light page. White on Deep Court 5.93:1; Deep Court on the light ground 5.33:1, on white 5.93:1.
- **Sky Court** (#4DA3FF): blue text and marks in dark mode. 7.21:1 on ink, 6.45:1 on dark cards.

### Accent
- **Ball Lime** (#C0FC49): the selected date tile, the selected time chip's text, scoreboard digits, the book button, the onboarding start bar, the active dock icon, and the primary action on dark or blue grounds. Ink on lime and lime on ink both measure 15.56:1; lime on dark cards 13.93:1. Lime on the light page has no visible edge (1.09:1) and lime text on blue fails (3.48:1), so lime never sits on the light page and never carries text on blue.

### Ink
- **Court Ink** (#0F1112): the dock, scoreboard cells, the primary button on light pages (with lime text), body text in light mode, the ground in dark mode. Ink on the light ground 17.03:1.
- **Raised Ink** (#232628): raised surfaces on ink (dock pressed states, dark containers, pager buttons). Text on it 13.69:1.
- **On-ink** (#F2F3F3) and **On-ink Variant** (#9AA1A6, 7.23:1 on ink): labels and inactive dock destinations.

### Neutral (light)
- **Court Grey Ground** (#F2F3F3): the page.
- **Card White** (#FFFFFF): session cards, sheets, the club fact list.
- **Container Grey** (#E7E9E9): ended scoreboard cells, placeholders, input fills, unselected filter backgrounds.
- **Muted** (#5B6166): supporting facts, inactive tabs. 5.64:1 on ground, 6.28:1 on white, 5.15:1 on container.
- **Outline** (#767C81): chip and button borders. 3.80:1 on ground, 4.23:1 on white, enough for control boundaries.
- **Hairline** (#D3D7D8): dividers inside cards only; never a control's only edge.

### Neutral (dark)
- Ground ink #0F1112, cards #1A1D1F, containers #232628, text #F2F3F3 (15.24:1 on cards), muted #9AA1A6 (6.47:1 on cards), outline #6B7378 (3.51:1 on cards). The Court Blue band stays #0079ED in dark mode; small text on it still uses Deep Court tiles.

### Status
- **Amber** (#805000 on #FFF4D6, 6.25:1; on white 6.85:1; dark #F5C46A, 10.48:1 on cards): "nearly full" and the sample-data notice.
- **Brick** (#B42318 on #FEECE8, 5.75:1; on white 6.57:1; dark #FFB4A8, 9.96:1 on cards): load failures and invalid input.
- **Available** uses Deep Court (light) or Sky Court (dark), never lime, so "open" stays readable on white cards.

### Named Rules
**The Black Is For The Dock Rule.** Court Ink fills only the bottom navigation (dock and rail). Primary buttons are Ball Lime with ink text everywhere; time cells, selected chips, the selected calendar day, the checked switch and the active tab underline are Deep Court with white. Lime never carries text itself: it is a fill holding ink text, or a mark on Deep Court, ink or blue (club owner review, 2026-10-09).

**The One Lime Rule.** One lime focal point per screen region: the selected day in the band, the selected chip in the slot row, the book button in the dock. A second lime element in the same region is a defect.

**The Small Text Avoids Blue Rule.** Text under 18.66px bold never sits directly on Court Blue; it sits on a Deep Court tile or moves off the band.

## Typography

**Font:** Outfit (variable, self-hosted via `@fontsource-variable/outfit`, with system-ui fallback). Chosen by the club owner to match the padel reference; its round geometric shapes and clear numerals suit a friendly sports club and read well at phone sizes in Indonesian and English.

**Character:** One family, four weights. Display and headline are bold and tight; body is regular; labels are medium so small text stays solid on color.

### Hierarchy
- **Display** (700, 2.5rem/40px, 1.05, -0.01em): onboarding headlines (two lines), club page hero title. White on blue or on photo scrim.
- **Headline** (700, 1.75rem, 1.15): screen titles in the court band ("Jadwal", "Klub"), the calendar sheet's chosen date.
- **Title** (600, 1.25rem, 1.3): session class names, section titles ("Hanya yang tersedia" row, "Jam mulai"), date tile numerals, the onboarding start bar label.
- **Body** (400, 1rem, 1.5): facts, prices, descriptions, button labels at 600.
- **Label** (500, 0.875rem, 1.43): weekday names, chip times, tab and dock labels, availability words, notices.
- **Scoreboard** (700, 1.5rem, tabular figures): digits inside scoreboard cells only.
- **Wordmark** (700, 1rem, uppercase, 0.16em tracking): "LAFU" in the band and on onboarding, next to the ball mark. The only tracked uppercase in the system; it is the club's mark, not a label style.

### Named Rules
**The Four Weights Rule.** 400 body, 500 label, 600 title and button, 700 display, headline, scoreboard, wordmark. No other weights.

**The Big Type On Color Rule.** Text on Court Blue or on photographs is display, headline or title, in white. Smaller text on those grounds moves onto a Deep Court tile or an ink scrim.

**The Sentence Case Rule.** Everything except the wordmark is sentence case.

## Layout

Mobile first. Main screens stack three zones: the **court band** (blue, from the top safe area, bottom corners 24px), the **content** on the grey ground, and the **dock** (ink, fixed, from the bottom safe area). Page gutters are 16px on phones, 24px from 640px, 32px from 1024px.

**Schedule screen order (phone):** band (wordmark and language action, headline "Jadwal", month with previous/next and calendar buttons, date tile strip) → filter tabs by level → "Hanya yang tersedia" switch → time chip row → session cards → space for the dock.

**Widths:** content caps at 50rem, widening to 72rem from 1024px, where session cards become two columns with a 24px gap. From 640px the dock becomes a left ink rail (80px) with the book button at its top; the band spans the content column.

**Strips that scroll sideways** (date tiles, time chips, filter tabs) scroll inside their own row with snap, and the tiles at the edges may peek to show there is more. Nothing ever widens the page: main clips horizontal overflow, and slides happen inside clipped rows.

**Fixed regions** reserve their real height: page bottom padding is the dock height plus the notch overhang plus the bottom safe area plus 16px.

### Named Rules
**The Band Holds The Date Rule.** The date you are looking at always lives in the blue band at the top of the schedule; the content below never repeats it as a heading.

**The State Cell Reflow Rule.** Availability is a right column inside a session card from 640px; on phones it reflows as one unit under the facts. Recorded phone adaptation.

## Elevation & Depth

Depth is mostly color, not shadow: the blue band over the grey ground, white cards on grey, the ink dock under everything. Cards carry no shadow.

### Shadow Vocabulary
- **Book button** (`box-shadow: 0 6px 16px rgba(15, 17, 18, 0.28)`): the lime button lifting out of the dock notch.
- **Sheet** (`box-shadow: 0 -8px 24px rgba(15, 17, 18, 0.18)`): bottom sheets.
- **Menu** (`box-shadow: 0 2px 6px rgba(15, 17, 18, 0.16), 0 1px 2px rgba(15, 17, 18, 0.12)`): popovers and menus from 640px.

### Named Rules
**The Color Is Depth Rule.** If a surface sits on the page, it differs by color. A shadow means it floats (sheet, menu) or rises out of the dock (book button).

## Shapes

Square-ish, after the padel reference: 4px for date tiles, time chips, scoreboard cells, the onboarding start bar, and placeholders; 8px for session cards, buttons, fields, notices and the club fact list; 24px for the court band's bottom corners, the dock's top corners, and bottom sheets' top corners; full round only for the book button, pager, and dots. Borders are 1px; the 2px strokes are the today ring, the focus outline, and the active tab underline (3px).

**Notched photo card** (club page and onboarding only): a photo with its top-right corner cut at 45 degrees (24px leg), echoing the padel reference's folded-corner image cards. A five-point polygon, never applied to text cards.

## Components

### Court Band
Full-bleed Court Blue under the status bar with 24px bottom corners. Row 1: ball mark + "LAFU" wordmark, language action (translate glyph + code) on the right. Row 2: screen headline in white. On the schedule, rows 3 and 4 hold the month (title, white) with previous/next/calendar icon buttons on Deep Court circles, then the date tile strip. Decorative white court lines (a top-down service box and center line at 14% white) sit behind the right side, aria-hidden. Focus outlines are white inside the band.

### Date Tiles
A horizontal strip of 56 by 72px tiles, 4px radius, 8px gap, after the padel date strip. Each tile stacks the weekday (label, white) over the day number (title, white) on Deep Court. Selected: Ball Lime fill, ink text, and a 16 by 3px ink bar centered at the tile's top edge (the padel selection bar). Today when unselected: 2px inset white ring. The selected fill is one shared element that springs to the new day. The calendar button opens the Club Calendar sheet.

### Club Calendar
Same behavior as before (react-day-picker, loaded on demand; phone bottom sheet, popover from 640px; one tap applies; arrows, Enter, Escape; floating local dates so a device time zone never shifts a club day). New look: sheet header is a Court Blue strip holding the chosen date as a white headline; day cells are 48px with 4px radius, Outfit title numerals; selected is Deep Court with white digits, today an inset 2px Deep Court ring, outside the public window muted and not selectable.

### Filter Tabs
After the padel club tabs: a row of text tabs ("Semua", then each level present that day), label size, 48px tall, inactive Muted, active ink at 600 with a 3px Deep Court underline (Sky Court in dark mode) that slides between tabs on the selection spring. Tabs only list levels that exist on the selected day; if only one level exists the row is hidden.

### Available-Only Switch
A row with the title "Hanya yang tersedia" / "Show available only" and a switch (52 by 32px track; on: Deep Court track with white thumb; off: Container Grey track with white thumb and Outline border). On hides full, cancelled and ended sessions and states how many were hidden ("3 sesi disembunyikan").

### Time Chips
After the padel slot row: a scrolling row of 48px chips, one per session start time on the selected day, label size in 24-hour WIB. Default: white fill, 1px Outline border, ink text. Selected: Deep Court fill, white text. Tapping a chip scrolls its session card into view and marks it; chips for full or cancelled sessions keep their time but show the state word under it in Muted.

### Session Card (scoreboard signature)
White card, 8px radius, 16px padding, no shadow. Top row: the **scoreboard**, two 48px Deep Court cells holding the start hour and minute in white scoreboard digits with a colon between them, and the end time ("s.d. 19:30") in label beside it. Below: class name (title), level and venue (body, Muted), price per place (body 600), then the state cell (word plus mark, with remaining places for open sessions; next / in progress timing on today). Bottom right: "Pesan" primary button (lime, ink text) when the session can be booked. Ended: scoreboard cells turn Container Grey with Muted digits and the state reads "Selesai". Cancelled: cells become 1px dashed Outline with Muted digits and the explanation line shows. The whole card opens the session detail sheet; the Pesan button goes straight to booking.

### Dock (bottom menu)
After the padel bottom menu, in ink: a 72px bar plus the bottom safe area, 24px top corners, with a smooth notch at the center cradling the **book button**, a 64px Ball Lime circle with an ink "+" glyph and the visible label "Pesan" beneath, raised 24px into the notch with the book-button shadow. Destinations: Jadwal, Klub on the left; Booking saya and Akun on the right. Booking saya appears only when that screen exists (plan 02-03); until then the right side holds Akun alone. Each destination is a 24px icon over a label; active is a lime icon and on-ink label at 600, inactive is On-ink Variant. The active marker is a 4px lime dot under the label that springs between destinations. Tapping the active destination scrolls to top. From 640px the dock becomes a left ink rail with the book button at the top.

### Book Sheet
The book button opens a bottom sheet titled "Pesan sesi" listing the next bookable sessions (up to 10, across the coming days) as compact rows: date tile, scoreboard time, class, places left. Tapping a row opens the booking flow for that session. Empty: "Belum ada sesi yang bisa dipesan" with a link to the schedule. It only lists sessions that admission rules allow (scheduled, places left, before the five-hour cutoff).

### Onboarding (first visit only)
Shown once per device on the first visit to the public app, never before a deep link (session, booking, admin), and always skippable. Three slides, each a full-bleed licensed court photograph with an ink scrim rising from the bottom (scrim exists for text contrast, not decoration). Content sits in the lower half: ball mark + wordmark, a two-line display headline in white, a body line in white on the scrim, then controls.
- **Slides 1 and 2:** an ink pager capsule (after the tennis reference) with a Raised Ink previous circle, dots in the middle (current dot white, others On-ink Variant), and a lime next circle.
- **Slide 3:** the padel start bar: a 64px bar, the left two-thirds Ball Lime with "Mulai" and three chevrons (the chevrons show the bar can be dragged forward), the right third ink track. Tap or drag to the end to finish.
- **"Lewati" / "Skip"** sits top right on every slide (white text button on a Deep Court circle background for contrast).
- Finishing or skipping lands on the schedule for today and stores `lafu.onboarded`.

Slides and copy (Indonesian first):
1. Court with net photo. "Jadwal tenis, sekali lihat" / "Your tennis schedule at a glance". "Lihat kelas, pelatih, dan tempat yang tersisa tanpa perlu masuk." / "See classes, coaches and places left without signing in."
2. Three balls photo. "Pesan untuk kamu dan teman" / "Book for you and your friends". "Satu pesanan untuk beberapa tempat; nama tiap pemain bisa diubah." / "One booking for several places; each player's name can be changed."
3. Ball on baseline photo. "Tempatmu kami simpan 5 jam" / "We hold your places for 5 hours". "Selesaikan pembayaran sebelum batas waktu yang tertera." / "Complete payment before the deadline shown."

Slides describe only what exists; when payment proof ships (Phase 3), slide 3 may mention QRIS and proof upload.

### Session Detail Sheet
Bottom sheet, white, 24px top corners. Court Blue header with the class name (headline, white) and a 2 x 2 grid of Deep Court tiles: Tanggal, Jam (WIB), Durasi, Slot, each a small label over a large white value. Below: the state word and mark, who is playing (names as tags for signed-in members; a sign-in link for visitors), then label-value rows for level, venue, coaches and group size. Pinned at the bottom: price per slot and the lime "Pesan slot" button when bookable, otherwise the reason ("Penuh", "Dibatalkan", "Sesi sudah selesai", "Pemesanan ditutup 5 jam sebelum mulai").

### Players
Signed-in members see who is playing, as they did in the shared spreadsheet: tags in the detail sheet and a short line on each session card ("Andy, Dmitri, +2"). Names only, never phones or payment state. Visitors who are not signed in see counts only.

### Sign-in and Booking
Sign-in follows the club owner's reference login: a court photo across the top under an ink fade, a centred title and one line, a phone field with a leading icon, one full-width lime button, the session being booked as a small card, six code boxes over one real input, and a random tip while the code arrives. Booking uses a task band (back, the step's question, a three-part step bar with the current step in lime), a big quantity stepper, player name fields, a check step with the quiet 5-hour notice, and a pinned bar with the total and the lime action. The dock hides during these tasks.

### Booked
Full Court Blue with white text: a white court-line drawing, a white check badge that pops and draws its tick, a short lime and white burst, and a lime ball that drops in and bounces to rest; then the headline, a Deep Court countdown to the payment deadline, the booking card, the payment note and the lime "Kembali ke jadwal" button. Plays once; reduced motion shows the finished picture.

### Buttons
- **Primary:** Ball Lime fill, ink label at 600, 8px radius, 48px tall, on light pages and on blue alike. One per screen region.
- **Quiet notice:** pale court-blue tint (#E6F0FA; dark #13304D) with a Deep Court title, for timing rules such as the 5-hour hold.
- **Secondary:** transparent with 1px Outline border, ink label.
- **Text:** Deep Court label (Sky Court in dark mode).
- **Icon button:** 48px; on the band a Deep Court circle with a white glyph.
- **Pending:** renames itself to the running operation; no spinner.
- State layers (8% hover, 10% focus, 12% pressed) and the press scale carry over.

### Fields
48px, 8px radius, white fill (dark: #1A1D1F) with 1px Outline border; label above in label 500; focus 2px Deep Court ring (Sky Court in dark mode); errors in Brick below the field.

### State Cell
Unchanged behavior: words first, mark echoes (filled open in Deep Court, half nearly full in Amber, hollow full in ink, struck cancelled in Muted); remaining places only for open and nearly full; "Penuh" alone; ended shows "Selesai" and claims no places; today adds "Berikutnya, mulai ... lagi" or "Sedang berlangsung" in Deep Court at 600.

### Status Panels and Notices
8px-radius panels: info on Container Grey, error on Brick container, success on ink with lime title. The sample-data notice is an Amber label on its container, once above the list. Loading uses static placeholders shaped like scoreboard cards, shown only after 150ms.

### Club Page
Court band with headline "Klub". Below it a notched photo card (court net photo) with the club name in display white on an ink scrim, then the club fact list (white, 8px radius, 40px Deep Court discs with white icons). Missing facts read "Belum tersedia". The admin sign-in link stays as a quiet text link at the end.

### Graphics
- **Court lines:** top-down tennis court geometry (service boxes, center service line, singles sidelines) drawn as SVG strokes in white at 14% on blue, or ink at 8% on grey. Used in the band and the empty states. It is a tennis court, so it belongs to the subject.
- **Ball mark:** a lime circle with two curved seam strokes in ink, used beside the wordmark, as the app icon motif, and in empty states. Never animated in a loop.
- **Photography:** licensed tennis photography (court, net, balls, no identifiable people and no visible brand marks) on onboarding, the club page and the book sheet header. Current files and provenance: `public/photos/court-net.webp` (Unsplash, @asabasai), `three-balls.webp` (@olli_mn), `ball-baseline.webp` (@mariogogh), each under the Unsplash License, verified 2026-10-09, with provenance sidecars. They are generic tennis imagery, not the club; replace them with club photography when supplied. Text over photos always sits on the ink scrim.

### Motion and Feedback
Carried over from Jalur Lawu unchanged, which the club owner asked to keep: one interruptible spring vocabulary (selection 520/40, content 380/36, pop 600/32); shared selection elements (date tile fill, dock dot, filter underline) that slide to the new choice; shared-axis X for day changes and onboarding slides (28px plus fade, inside clipped rows); swipe between days on touch with rubber-band resistance; press scale 0.96 touch, 0.98 mouse; 8ms selection haptic on Android; placeholders after 150ms; reduced motion removes springs, slides and fades.
- **New:** the book button scales to 0.94 on press and springs back with the pop spring; the onboarding start bar's lime section follows the finger while dragging and snaps back if released early; the book sheet rises with the content spring.

### Admin Surfaces
Admin screens inherit this system: court band with the screen title, ink dock with Sesi, Kelas, Kelola and a lime book button that becomes "Tambah sesi" (create session). Forms use the field and button rules above; the time picker dialog and calendar text-entry alternative carry over from the admin form polish.

## Do's and Don'ts

### Do:
- **Do** keep Ball Lime on ink or as a fill with ink text; on the light page use ink with lime text.
- **Do** put only large white text directly on Court Blue; small text goes on Deep Court tiles.
- **Do** show session times as scoreboard cells, and state every condition as a word with an echoing mark.
- **Do** use licensed court photography without identifiable people or brand marks, with its source recorded, and swap in club photos when supplied.
- **Do** keep 48px touch targets, 8px between adjacent targets, white focus outlines inside the band and Deep Court rings elsewhere.
- **Do** keep sideways strips inside their own clipped rows so the page never widens.
- **Do** follow the phone's light or dark preference; the band stays Court Blue and the dock stays ink in both.

### Don't:
- **Don't** add features the references show and Lafu lacks: community, chat, notifications, alerts, ratings, favorites, avatar stacks, or player counts.
- **Don't** put a second lime element in the same region, lime on the light page, or lime text on blue.
- **Don't** present stock photography as the club, its courts or its members.
- **Don't** use more than the four Outfit weights, or tracked uppercase outside the wordmark.
- **Don't** add shadows to cards; shadows are for the book button, sheets and menus.
- **Don't** show onboarding again after it was finished or skipped, or before a deep link.
- **Don't** loop motion, animate anything that did not change, or block input while a spring settles.
- **Don't** show a places count beside "Penuh", or any places for an ended session.

## History

Replaces the "Jalur Lawu" system (2026-10-08 to 2026-10-09: club green #164D45 signboard, Barlow Condensed numerals, tonal post plates, Material 3 shapes). Phase 1 was manually accepted by the user on 2026-10-09 under that system; that acceptance covers behavior, not this new visual system. The redesign must be re-verified (build, contrast in both themes, phone and intermediate widths, keyboard, reduced motion, and the user's manual review) before any Delivery Gate PASS is claimed.
