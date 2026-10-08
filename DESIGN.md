---
name: Lafu (Lawu Fun Tennis Club)
description: Jalur Lawu. A Material 3 phone app where every tennis session reads like a Mount Lawu trail post.
colors:
  primary: "#164D45"
  on-primary: "#FFFFFF"
  secondary-container: "#C9E7DE"
  on-secondary-container: "#0D2E29"
  surface: "#F5F9F7"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#EDF4F1"
  surface-container: "#E5EEEA"
  surface-container-high: "#DCE7E2"
  on-surface: "#1D252C"
  on-surface-variant: "#4B5D57"
  outline: "#4B5D57"
  outline-variant: "#C6D3CD"
  signboard: "#164D45"
  on-signboard: "#FFFFFF"
  on-signboard-variant: "#B8DDD3"
  plate: "#C9E7DE"
  on-plate: "#0D2E29"
  error: "#B42318"
  error-container: "#FEECE8"
  on-error-container: "#7A1A11"
  warning: "#805000"
  warning-container: "#FFF4D6"
  scrim: "rgba(29, 37, 44, 0.4)"
typography:
  numeral:
    fontFamily: "'Barlow Condensed', system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "system-ui, Roboto, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
  headline-display:
    fontFamily: "'Barlow Condensed', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.025em"
  title:
    fontFamily: "system-ui, Roboto, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title-display:
    fontFamily: "'Barlow Condensed', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.025em"
  body:
    fontFamily: "system-ui, Roboto, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, Roboto, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  top-app-bar:
    backgroundColor: "{colors.signboard}"
    textColor: "{colors.on-signboard}"
    height: "64px"
  navigation-bar:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    height: "64px"
  navigation-indicator-active:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
    width: "64px"
    height: "32px"
  button-filled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
    height: "48px"
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
    height: "48px"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
    height: "48px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
    height: "48px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.full}"
    size: "48px"
  post-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.on-plate}"
    typography: "{typography.numeral}"
    rounded: "{rounded.md}"
    padding: "12px 4px"
    width: "80px"
  post-plate-ended:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.numeral}"
    rounded: "{rounded.md}"
    padding: "12px 4px"
  day-marker:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-display}"
    rounded: "{rounded.md}"
    height: "76px"
  day-marker-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.headline-display}"
    rounded: "{rounded.md}"
    height: "76px"
  day-marker-today:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.headline-display}"
    rounded: "{rounded.md}"
    height: "76px"
  status-panel-info:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  status-panel-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  status-panel-success:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  sample-data-notice:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  menu:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "8px 0"
    width: "208px"
  list-container:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  date-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "48px"
---

# Design System: Lafu (Lawu Fun Tennis Club)

## Overview

**Creative North Star: "Jalur Lawu"**

Every session reads like a post on a Mount Lawu trail: where you are, what is next, how long until you get there. The club green is the trail board. It runs across the top of the app as a signboard bar carrying the routed white LAFU wordmark, and it marks the one thing a member has chosen. Everything else stands on a pale mist ground in light mode and a night-forest ground in dark mode, with tonal Material 3 surfaces doing the layering.

The idiom is Material 3, chosen for an Android-first membership of mixed tech comfort, often reading outdoors at the courts. Reading text uses the phone's own UI face (Roboto on Android), so nothing feels foreign. A single routed sign voice, Barlow Condensed Bold, is reserved for the things a trail sign would carve: the wordmark, the month, day numerals, and post-plate start times. The jump between those condensed numerals and the small labels beside them carries the hierarchy, so the system needs only five type steps and two weights.

Density is calm list density, not card density. Sessions are rows separated by hairlines, each led by a tonal post plate; there are no white cards with green pills. States are always words first, with a small drawn mark that only echoes the word.

**Key Characteristics:**
- Green signboard top app bar; mist ground; tonal post plates.
- Full club green only for the chosen thing: selected day, the one primary action, the signboard.
- System UI face for reading; Barlow Condensed Bold only for wordmark, month, day numerals, and plate times.
- Five type steps (label, body, title, headline, numeral), weights 400 and 700 only.
- Text-based states with echoing marks; nothing labeled twice.
- 48px touch targets, Material state layers, full-round controls.
- Light and dark follow the phone.

## Colors

A locked four-color club palette (club green, white, ink, pale green) expanded into Material 3 roles, with the green held back so that it means "chosen".

### Primary
- **Lawu Club Green** (primary, #164D45 light; lifts to #93D2C3 in dark so filled actions keep contrast): the selected day marker, the single filled action on a screen, focus outlines, open-availability words, and the "next / in progress" timing lines. Green on mist measures 9.06:1; dark primary on dark surface 10.47:1.
- **Signboard Green** (signboard, #164D45 in both schemes): the top app bar only. It does not lift in dark mode; the board is the board. White on signboard 9.63:1. The supporting club name uses Signboard Mist (#B8DDD3).

### Secondary
- **Plate Sage** (plate and secondary-container, #C9E7DE light, #2B4A43 dark): post plates, the active navigation indicator, tonal buttons, success panels, list leading-icon discs, text selection. On-plate ink (#0D2E29 light, #C9E7DE dark) measures 11.09:1 light and 7.38:1 dark.

### Neutral
- **Mist Ground** (surface, #F5F9F7; dark #0E1916 night forest): the page.
- **Pale Club Green** (surface-container-low, #EDF4F1): the date-control band beneath the app bar.
- **Container steps** (surface-container #E5EEEA, surface-container-high #DCE7E2, lowest #FFFFFF): navigation bar and menu, ended plates and loading placeholders, and the club fact list respectively.
- **Lawu Ink** (on-surface, #1D252C; dark #E3ECE8): titles and body. Ink on mist 14.61:1; dark 14.91:1.
- **Moss Grey** (on-surface-variant and outline, #4B5D57): supporting facts, inactive navigation, outlines. 6.59:1 on mist, 5.52:1 on surface-container-high.
- **Hairline** (outline-variant, #C6D3CD): row dividers and the band's bottom border.

### Status
- **Trail Amber** (warning #805000 on warning-container #FFF4D6): "nearly full" words and the sample-data notice. 6.25:1.
- **Brick** (error #B42318, containers #FEECE8 / #7A1A11): load failures and invalid dates. 5.75:1.

### Named Rules
**The Green Budget Rule.** Full club green appears only on the chosen thing: the selected day, the one primary action, and the signboard. Post plates are tonal sage, never full green.

**The Board Stays Green Rule.** The signboard keeps #164D45 in dark mode; only interactive primary lifts to a light tone.

## Typography

**Display Font:** Barlow Condensed Bold (700, self-hosted via Fontsource, with system-ui fallback)
**Body Font:** system-ui, which resolves to Roboto on Android (with Segoe UI, Helvetica Neue, Arial)

**Character:** The phone's own voice for everything people read, and one routed trail-sign voice for numbers and the club's name. The condensed numerals are what a member sees first.

### Hierarchy
- **Numeral** (Barlow Condensed 700, 2rem, line-height 1, tabular): post-plate start times and the next-day shortcut numeral.
- **Headline** (system 700, 1.75rem, 1.15): page headings such as the club page. In Barlow Condensed at the same size it sets the LAFU wordmark (uppercase, 0.025em) and the day-marker numerals.
- **Title** (system 700, 1.25rem, 1.3): session class names, the selected date heading, empty-state heading. In Barlow Condensed uppercase it sets the month and year above the day markers.
- **Body** (system 400, 1rem, 1.5): facts, prices, button labels (700), list values capped at 65ch.
- **Label** (system 400 or 700, 0.875rem, 1.43): weekday names, plate end times, availability words and counts, navigation labels, notices.

### Named Rules
**The Routed Voice Rule.** Barlow Condensed is used only for the wordmark, month, day numerals, and plate times. Any other text in it is a defect.

**The Two Weights Rule.** Only 400 and 700 exist. Emphasis is weight or size, never a third weight.

**The Uppercase Belongs To The Sign Rule.** Uppercase appears only in the routed voice (wordmark, month). System-face text stays in sentence case.

## Layout

Mobile first, single column at phone widths. Page gutters are 16px on phones, 24px from 640px, 32px from 1024px, and never intrude into a device safe area. Content is capped at 50rem, widening to 72rem from 1024px, where the session list becomes two columns with a 40px gap.

The shell: a sticky 64px signboard app bar under the top safe area; on phones a fixed bottom navigation bar (destinations at least 64px tall, padded for the bottom safe area, with page content padded to clear it). From 640px the bottom bar becomes an 80px navigation rail docked under the full-width app bar.

Session rows are a grid: an 80px plate column (96px from 640px), a fluid facts column, and from 640px a fixed 9rem state column. Rows carry 16px vertical padding and a 16px column gap, with hairline dividers between them.

The day-marker strip shows only whole cells: it fits as many 48px-minimum markers as the width allows and sizes each to fill the row exactly, so no marker rests cut in half; it scrolls inside its own row with snap.

### Named Rules
**The State Cell Reflow Rule.** Availability is a third column from 640px. On phones it reflows as one unit under the facts, because a right cell at 390px forces class titles onto three lines. This is a recorded phone adaptation, not drift.

## Elevation & Depth

Flat and tonal. Depth comes from stepping surface containers (mist ground, pale band, container, high, lowest), not from shadows. Rows, plates, panels, and the list container carry no shadow. Shadows exist only for things that float over the page.

### Shadow Vocabulary
- **Menu** (`box-shadow: 0 2px 6px rgba(29, 37, 44, 0.16), 0 1px 2px rgba(29, 37, 44, 0.12)`): the language menu.
- **Sheet** (`box-shadow: 0 -8px 24px rgba(29, 37, 44, 0.16)`): reserved for the session detail sheet (not yet built).

### Named Rules
**The Tonal First Rule.** If a surface sits on the page, it differs by tone. A shadow means it floats.

## Shapes

Material shape scale: 4px for placeholder bars, 8px for fields, menus, the "today" chip, and notices, 12px for post plates, day markers, panels, and the list container, and full-round for every button, icon button, and navigation indicator. Cancelled plates switch to a dashed outline with no fill, so the shape survives while the session reads as void. Borders are 1px hairlines; the only 2px strokes are the today ring and focus outlines.

## Components

### Buttons
- **Shape:** full-round (9999px), minimum 48px tall, 24px horizontal padding (12px for text buttons), bold body label that wraps rather than truncates.
- **Filled:** club green with white; the one primary action on a screen.
- **Tonal:** sage container; the default and the secondary action.
- **Outlined:** 1px Moss Grey outline, green label; used for retry inside error panels.
- **Text:** green label, lowest emphasis.
- **Pending:** the button renames itself to the running operation and ignores presses; no spinner.
- **Hover / Focus / Press:** a state layer in the content color (8% hover on hover-capable devices, 10% focus, 12% pressed, 150ms); focus also draws a 2px primary outline offset 2px.
- **Icon button:** 48px circle, Moss Grey glyph at 24px, required accessible name; disabled at 40% opacity.

### Post Plate (signature)
The trail post. A 12px-rounded sage plate leading each session row, with the start time in the 2rem routed numeral and "s.d. / until" end time in label beneath. Ended sessions drop to surface-container-high with Moss Grey ink; cancelled sessions become a dashed outline. The empty state reuses a small plate inside the green next-day shortcut.

### Day Markers
A band on pale club green holds the month (routed, uppercase), an outlined "Today" chip when away from today, previous/next/calendar icon buttons, and seven whole-cell markers. Each marker stacks the weekday label over a routed numeral. Selected: filled club green. Today (unselected): 2px inset green ring and green text. The calendar button opens the native date picker, falling back to a labeled 48px field with an inline error.

### State Cell
Availability words with a 16px drawn mark that only echoes the word: filled circle open (green), half-filled nearly full (amber), hollow full (ink), struck cancelled (Moss Grey). Only open and nearly full carry a remaining-places count; "Full" stands alone. On today's list it adds timing: "Next, starts in ..." or "In progress" in bold green, and ended sessions show "Selesai / Ended" with a check mark and claim no places.

### Status Panels and Notices
12px-rounded tonal panels (info on surface-container, error on error-container, success on sage) with a bold title first and an optional action. The sample-data notice is a bold amber label on the warning container, shown once above the list. Loading uses static plate-and-line placeholders with no shimmer or pulse.

### Navigation
- **Top app bar:** signboard green, routed LAFU wordmark plus the club name in Signboard Mist; focus outlines turn white here.
- **Language menu:** translate glyph plus the current code (ID / EN) as a 48px full-round action; opens an 8px-rounded menu on surface-container with the menu shadow, each language in its own name, a green check on the current one.
- **Navigation bar / rail:** surface-container. Each destination is a 24px icon inside a 64 by 32px full-round indicator with the label beneath; active is sage indicator, bolder stroke, bold ink label; inactive is Moss Grey.
- **Destination change:** Material fade-through (90ms out, 210ms in with a 0.98 scale, emphasized easing); app bar and navigation stay put. Reduced motion removes it.

### Club Fact List
A Material list on the lowest container (12px radius, hairline dividers): 40px sage disc with leading icon, bold label, supporting value. Missing content reads as an explicit "unavailable" word, never invented.

### Not Yet Built
The drawn trail line between posts, date-change motion, a signboard-language club page, the session detail sheet (plan 01-07), and admin surfaces are open. Admin surfaces inherit this system. The app icon is a text-based LAFU placeholder until the club supplies a logo.

## Do's and Don'ts

### Do:
- **Do** keep full club green (#164D45) to the selected day, the one filled action, and the signboard.
- **Do** set start times, day numerals, the month, and the wordmark in Barlow Condensed Bold, and everything else in the system UI face.
- **Do** state every condition as a word; drawn marks only echo it.
- **Do** give every touch target at least 48px and a state layer for press and hover.
- **Do** draw focus as a 2px primary outline offset 2px, white on the signboard.
- **Do** separate rows with hairlines on the mist ground and layer with tonal containers.
- **Do** keep page gutters out of safe areas and pad the bottom for the navigation bar.
- **Do** follow the phone's light or dark preference, keeping the signboard green in both.

### Don't:
- **Don't** fill post plates with full club green; they are tonal sage.
- **Don't** label anything twice; if the app bar or tab already names it, the page does not repeat it visibly.
- **Don't** put eyebrow or kicker labels above headings.
- **Don't** use a third font weight or a third typeface.
- **Don't** put shadows on rows, plates, or panels; shadows are for menus and sheets.
- **Don't** add spinners, shimmer, or pulse to loading; use static placeholders and named pending labels.
- **Don't** show a places count beside "Full", or any places for an ended session.
