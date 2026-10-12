# State art: image prompts

Prompts for the illustrations on STC's empty, error and offline states (design board G3, "Empty, loading & offline"). They are written for Gemini's image model (Nano Banana): paste them in as they are.

Status: drafted 2026-10-12. These replace the Figma "Matchday stills" set (Figma file `pzlRXkgbyqH22RtEGhXNJN`), which the user did not like. The art style is kept; the drawings are new.

## Contents

- [How to use](#how-to-use)
- [Style reference](#style-reference)
- [The illustrations](#the-illustrations): where each one goes and what to name the file
- [1. Full set on one sheet](#1-full-set-on-one-sheet)
- [2. Single illustrations](#2-single-illustrations), one prompt per scene
- [3. Fix-up follow-ups](#3-fix-up-follow-ups)
- [Change log](#change-log)

## How to use

There are two steps: first one image with all six scenes, then each scene on its own.

**Step 1: the sheet.**

1. Attach the [style reference](#style-reference) image to a Gemini chat.
2. Paste [prompt 1](#1-full-set-on-one-sheet). Gemini returns one image with all six scenes in a 3×2 grid. This is the "sheet".
3. Download the sheet. Drawing all six together keeps them in one style; the tiles are too small to use in the app.

**Step 2: the six single images.** For each prompt in [section 2](#2-single-illustrations):

1. Start a new Gemini chat. A new chat keeps earlier images from leaking into the next one.
2. Attach the **sheet from step 1**, not the Dribbble image, so all six match each other.
3. Paste only that one prompt.
4. If the result drifts, send a follow-up from [section 3](#3-fix-up-follow-ups) in the same chat.
5. Save the image under its file name from [the table](#the-illustrations).

You can also stay in one chat and send the six prompts one after another, each as its own message. Later images may drift toward earlier ones, so section 3 matters more there.

When all six are saved, hand them to Claude to build into the app.

## Style reference

The style comes from **"The Alphabet of tennis" by Mijke Coebergh** on Dribbble. Use the full artwork, kept locally as `.planning/alphabet-0.jpeg`. It is the artist's work, so it is not committed to the repo: if the file is missing, save it again from the Dribbble shot. What we take from it:

- flat shapes with no outlines;
- one soft light source and crisp, flat cast shadows;
- calm crops of tennis objects, seen top-down or close up.

What we change: its pink and mint palette becomes STC's court blue and lime, and there are no people in the scenes.

## The illustrations

| # | Scene | State it illustrates | Where it shows | File name |
|---|---|---|---|---|
| 1 | Racket and ball on court | No bookings yet | Booking kamu, Aktif tab, empty | `no-bookings.webp` |
| 2 | Empty court from above | No sessions on this day | Jadwal, and admin Sesi, on an empty day | `no-sessions.webp` |
| 3 | Courtside bench and towel | Nothing in your history yet | Booking kamu, Riwayat tab, empty | `empty-history.webp` |
| 4 | Ball on the line | All clear, nothing to review | Admin Booking masuk with nothing to check | `all-clear.webp` |
| 5 | Ball caught in the net | Couldn't load | Any screen whose data failed to load (with "Coba lagi") | `load-error.webp` |
| 6 | Night court, lights off | You're offline | Any screen opened without a connection | `offline.webp` |

Final images go in `public/art/states/`.

---

## 1. Full set on one sheet

Attach the style reference, then paste:

```text
Use the attached image only as a STYLE reference (flat editorial tennis illustration, like Mijke Coebergh's "Alphabet of tennis"). Do not copy its compositions, people, or colours.

Create ONE image: a 3×2 grid of six square-cornered illustration tiles on a plain off-white background (#F2F3F3), with even 40px gutters. Each tile is 4:3 landscape. No text, no letters, no numbers, no logos anywhere.

STYLE (identical in every tile):
- Flat vector illustration. Solid colour shapes only. NO outlines, NO strokes around shapes, NO gradients, NO texture, NO grain, NO 3D, NO glossy highlights.
- One light source from the top-left. Shading is done with a single darker flat tone of the same colour on the shadow side.
- Cast shadows are crisp flat shapes in near-black at about 20% opacity, falling to the bottom-right, and they TOUCH the object that casts them (nothing floats).
- Court lines and string or seam details are clean white lines of one consistent thickness.
- Calm, quiet, slightly melancholic mood. Generous empty space. Simple shapes that still read at small size (about 240px wide).
- Strictly this palette, nothing else:
  court blue #0079ED, deep court blue #0062C4, pale blue #B8D4F2,
  tennis-ball lime #C0FC49, ink #0F1112 (shadows and small accents only),
  white #FFFFFF, off-white #F2F3F3.
- The tennis ball is always lime #C0FC49 with two curved white seams.
- Viewpoints are either straight top-down or a close, low crop, like a magazine detail shot.

THE SIX TILES (left to right, top row then bottom row):
1. "No bookings yet": top-down view of a tennis racket lying flat on a blue hard court, one lime ball resting beside it. Racket frame in deep blue, strings as a thin white grid. Lots of empty court around it.
2. "No sessions on this day": an empty tennis court seen from directly above, cropped so we see the net crossing the middle and the white lines. No players. One single lime ball near the baseline.
3. "Nothing in your history yet": a courtside bench seen from a low side angle, a folded white towel on it, a water bottle standing next to the bench leg, the blue court edge in front. Nobody there.
4. "All clear, nothing to review": extreme close-up of a lime ball resting exactly on a white baseline, with a faint oval skid mark on the blue court behind it, as in a clean "ball is in" line call.
5. "Couldn't load": close crop of a tennis net, white mesh in a diamond grid, with a lime ball caught in the mesh and pushing it slightly forward; the white net tape across the top edge.
6. "You're offline": the court at night. Deep blue sky, one floodlight pole with its lamps OFF (dark grey heads), the court below in deep blue with faint white lines, one lime ball on the court catching a little light.

Make all six feel like one series by one illustrator: the same flat style, palette, shadow angle and line thickness.
```

---

## 2. Single illustrations

For each one: open a new chat, attach the sheet you downloaded in step 1, and paste only that prompt (see [How to use](#how-to-use)).

### 2.1 No bookings yet → `no-bookings.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "No bookings yet" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

Top-down view of a tennis racket lying flat on a blue hard court (#0079ED), one lime ball (#C0FC49, two curved white seams) resting beside it. Racket frame in deep blue (#0062C4), strings as a thin white grid. Lots of empty court around it. The racket and ball each cast a crisp flat shadow to the bottom-right that touches them.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

### 2.2 No sessions on this day → `no-sessions.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "No sessions on this day" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

An empty tennis court seen from directly above, cropped so we see the net crossing the middle and the white court lines. Court in court blue (#0079ED) with a deep blue (#0062C4) surround. No players. One single lime ball (#C0FC49, two curved white seams) near the baseline, with a small crisp shadow to the bottom-right that touches it. The net casts a thin flat shadow.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

### 2.3 Nothing in your history yet → `empty-history.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "Nothing in your history yet" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

A courtside bench seen from a low side angle, with a folded white towel on it and a water bottle standing next to the bench leg; the blue court edge (#0079ED) runs along the front. Bench in deep blue (#0062C4), wall behind in pale blue (#B8D4F2). Nobody there. Crisp flat shadows to the bottom-right that touch the bench and the bottle.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

### 2.4 All clear, nothing to review → `all-clear.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "All clear, nothing to review" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

Extreme close-up of a lime ball (#C0FC49, two curved white seams) resting exactly on a white baseline on a blue hard court (#0079ED). Behind it, a faint oval skid mark on the court where it landed, in a slightly darker blue, as in a clean "ball is in" line call. The ball's shadow is a crisp flat oval to the bottom-right that touches the ball.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

### 2.5 Couldn't load → `load-error.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "Couldn't load" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

Close crop of a tennis net: white mesh in an even diamond grid against a deep blue background (#0062C4), with the white net tape across the top edge. A lime ball (#C0FC49, two curved white seams) is caught in the mesh, pushing it slightly forward so the nearby mesh lines bend around it. A small flat shadow sits under the ball.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

### 2.6 You're offline → `offline.webp`

```text
Use the attached sheet as the exact style reference. Recreate ONLY the "You're offline" scene as a single illustration, in exactly the same flat style, palette, shadow direction and line thickness:

The tennis court at night. Deep blue sky (#0062C4, darkened toward ink #0F1112 at the top). One floodlight pole on the left with its lamps OFF (dark grey heads, no glow, no light beams). The court below in deep blue with faint white lines. One lime ball (#C0FC49, two curved white seams) on the court, catching a little light. Quiet and still.

Output: 4:3 landscape, 1600×1200, the scene filling the frame edge to edge with its own background (no off-white border, no card, no rounded corners). No text, no letters, no numbers. Flat solid shapes only: no outlines, gradients, texture or 3D. Palette only: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF. Keep the main object centred-left, with clear empty space on the right.
```

---

## 3. Fix-up follow-ups

Send one of these in the same chat when a result drifts.

| Problem | Follow-up |
|---|---|
| Looks 3D or glossy | `Make it completely flat: solid fills only, no highlights, no gradients.` |
| Outlines appear | `Remove every outline; shapes meet edge to edge.` |
| An object seems to float | `Make the shadow touch the bottom of the object.` |
| Colours outside the palette | `Use only these colours: #0079ED #0062C4 #B8D4F2 #C0FC49 #0F1112 #FFFFFF.` |
| Text or numbers appear | `Remove all text and numbers.` |
| Too busy at small size | `Simplify: fewer, larger shapes; it must read at 240px wide.` |
| Ball seams wrong | `The ball has exactly two curved white seams that mirror each other, like a real tennis ball.` |

## Change log

- 2026-10-12: First version. Empty history uses a courtside bench instead of the tennis-ball can (the user said the can looked like toilet paper). Offline uses a floodlight with its lamps off.
- 2026-10-12: The six images are in the app as `public/art/states/<name>-640.webp` and `-1200.webp`, shown by `EmptyState` (`src/components/ui/empty-state.tsx`). The sources stay out of the repo, in `data/sheets/`.
- 2026-10-12: "How to use" spells out the two steps (sheet first, then one prompt per chat with the sheet attached). The style reference points at the local `.planning/alphabet-0.jpeg`.
