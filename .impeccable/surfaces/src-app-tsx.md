---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/features/public/schedule/SchedulePage.tsx","src/features/public/club/ClubPage.tsx"]
---

# Lafu app shell (public schedule and club)

Mode: Operate. Installable mobile web app in the Material 3 idiom; light and dark follow the phone. Audience: Lafu members of mixed tech comfort on Android phones, often outdoors at the courts. Job: find a date, compare sessions by time, places, level, price. Constraints: locked club palette #164D45 / #FFFFFF / #1D252C / #EDF4F1, Indonesian first with English, text-based states, no fabricated club content, no booking controls until Phase 2.

Unresolved: real club logo and photos; app icon is text-based until supplied.

## Direction contract

THESIS: Every session reads like a Mount Lawu trail post: where you are, what is next, how long until you get there. Refuses the white card list with a green pill that every booking app ships.

OWN-WORLD: Club green signboard bars, white routed condensed numerals (Barlow Condensed Bold), mist pale-green ground in light, night-forest ground in dark, Material 3 controls with tonal surfaces; only the chosen thing burns full green.

STORY: A member opens the app, sees today's posts at a glance, steps across day markers, and knows each session's time, level, venue, price and open places without reading twice.

FIRST VIEWPORT: Green top app bar with LAFU and a language action. Day-marker strip below. Session rows each led by a tonal sage post plate with the start time large and facts beside. Availability reflows under the facts on phones and occupies a third column from 640px. Material navigation bar: Jadwal, Klub.

FORM: Jalur Lawu, grounded list position 7, seed key b5fc1590. Signature move: the post plate.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

CONTINUATION (2026-10-09): `.planning/phases/01-publish-and-browse-sessions/01-DESIGN-BLUEPRINT.md` proposes remaining Phase 1 details, admin surfaces, state/recovery behavior, responsive layout, and acceptance scenarios. It inherits DESIGN.md and existing plan boundaries; it is not confirmation of implemented admin routes or runtime acceptance. Existing review screenshots include mocked availability states; live Phase 1 occupancy remains zero.
