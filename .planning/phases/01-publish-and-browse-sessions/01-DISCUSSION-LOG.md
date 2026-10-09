# Phase 1: Publish and Browse Sessions - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution agents. Decisions are captured in `01-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 01-publish-and-browse-sessions
**Areas discussed:** Customer starting screen and session details; Creating and publishing sessions; Availability labels and schedule settings; Admin access and phone navigation

The user selected all four areas, answered the focused questions below, and approved saving the final summarized context. Earlier product scope and UI-direction approvals were carried forward.

## Customer starting screen and session details

### When someone opens Lafu, what should they see first?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Schedules first (recommended) | Compact club header, date navigation, and upcoming sessions; club information remains reachable. | Yes |
| 2. Club introduction first | Short club introduction followed by a View schedules action. |  |

**User response:** `1`
**Captured decision:** Schedules first: compact club header, date navigation, and upcoming sessions immediately; club information remains easy to reach.

### Which date should the schedule open on?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Today (recommended) | Predictable today selection; clear empty-day message and shortcut to next scheduled date. | Yes |
| 2. Next date with a session | Automatically open the next date with sessions. |  |
| 3. Last viewed date | Remember the previous date; use today for a first visit. |  |

**User response:** `1`
**Captured decision:** Today. If today has no sessions, show a clear message and a shortcut to the next scheduled date.

### How much information should each session show in the schedule list?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Compact summary (recommended) | Time, class/level, venue, price, and remaining places; tap for all coaches and limits. | Yes |
| 2. Full details in the list | Show all session facts immediately in taller entries. |  |

**User response:** `1`
**Captured decision:** Compact summary: time, class/level, venue, price, and remaining places. Full details include all coaches and participant minimum/maximum.

### How should tapping a session open those details?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Dedicated detail screen (recommended) | Full detail page with booking guidance and back navigation preserving the date. |  |
| 2. Bottom sheet | Slide up over the schedule; longer content scrolls inside. | Yes |

**User response:** `2`
**Captured decision:** Bottom sheet over the schedule. Longer content scrolls inside the sheet.

### Move to creating and publishing sessions or discuss customer screens further?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Move to creating and publishing sessions (recommended) | End this area and discuss publishing. | Yes |
| 2. Discuss the customer screens further | Continue discussing customer screens. |  |

**User response:** `1`
**Captured decision:** Move to creating and publishing sessions.

## Creating and publishing sessions

### When an admin creates a session, when should it become visible to customers?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Draft, then publish (recommended) | Save privately, review, then publish. |  |
| 2. Publish immediately | Saving a complete valid session makes it public immediately. | Yes |

**User response:** `2`
**Captured decision:** Publish immediately when the admin saves a complete, valid session.

### When creating another session of the same class, how should its details be filled?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Reuse class defaults (recommended) | Prefill level, duration, price, participant limits, venue, and coaches; allow session overrides. | Yes |
| 2. Prefill the basics | Prefill basic class values; choose venue/coaches each time. |  |
| 3. Enter everything manually | Start all session fields empty. |  |

**User response:** `1`
**Captured decision:** Reuse editable class defaults for level, duration, price, minimum/maximum participants, venue, and coaches.

### If an admin changes class defaults later, what should happen to sessions already created?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Keep existing sessions unchanged (recommended) | New defaults apply only to new sessions; edit existing sessions individually. | Yes |
| 2. Update upcoming sessions without bookings | Apply defaults to upcoming unbooked sessions; leave booked sessions unchanged. |  |

**User response:** `1`
**Captured decision:** Keep existing sessions unchanged. Defaults affect newly created sessions; admins edit existing sessions individually.

### If an admin needs a new coach, venue, or level while creating a session, how should that work?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Add it within the session form (recommended) | Create new reference data in a small form without leaving session creation. |  |
| 2. Manage it separately | Use dedicated management screens, then return to session creation. | Yes |

**User response:** `2`
**Captured decision:** Manage it separately: go to the relevant management screen, add it there, then return to creating the session.

### Move to availability labels and schedule settings or discuss session creation further?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Move to availability labels and schedule settings (recommended) | End this area and discuss availability/settings. | Yes |
| 2. Discuss session creation further | Continue discussing session creation. |  |

**User response:** `1`
**Captured decision:** Move to availability labels and schedule settings.

## Availability labels and schedule settings

### When should a session be labeled nearly full?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Two places or fewer remaining (recommended) | Nearly full at two remaining places or fewer; display exact count. |  |
| 2. 25% of capacity or less remaining | Nearly full at 25% of capacity or less remaining; zero is fully booked. | Yes |

**User response:** `2`
**Captured decision:** When 25% of capacity or less remains, alongside the exact remaining-place count. Zero remaining places is fully booked.

### When a session is cancelled, how should it appear in the public schedule?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Keep it visible (recommended) | Show Cancelled and prevent booking. | Yes |
| 2. Hide it | Remove the cancelled session from the public schedule. |  |

**User response:** `1`
**Captured decision:** Keep it visible, clearly labeled Cancelled and unavailable for booking.

### Which timezone and currency should Lafu use for session times and prices?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. WIB (UTC+7), IDR | Session time WIB UTC+7; price IDR. | Yes |
| 2. WITA (UTC+8), IDR | Session time WITA UTC+8; price IDR. |  |
| 3. WIT (UTC+9), IDR | Session time WIT UTC+9; price IDR. |  |

**User response:** `1`
**Captured decision:** WIB (UTC+7) and Indonesian rupiah (IDR).

### Which language should the app use on someone's first visit?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Indonesian (recommended) | Default Indonesian; easy English switch; remember choice. | Yes |
| 2. Follow the device/browser language | Match Indonesian/English browser language; otherwise Indonesian. |  |
| 3. English | Default English; Indonesian switch; remember choice. |  |

**User response:** `1`
**Captured decision:** Indonesian by default, with an easy English switch and the selected language remembered.

### Move to admin access and phone navigation or discuss availability/settings further?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Move to admin access and phone navigation (recommended) | End this area and discuss admins. | Yes |
| 2. Discuss availability and settings further | Continue discussing availability/settings. |  |

**User response:** `1`
**Captured decision:** Move to admin access and phone navigation.

## Admin access and phone navigation

### How should someone receive admin access?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Owner-authorized access (recommended) | Owner grants each admin access; public signup never grants admin permission. |  |
| 2. Fixed team at setup | Designated admins configured at setup; later additions handled through setup, without in-app invitations. | Yes |

**User response:** `2`
**Captured decision:** Fixed designated admin accounts configured at setup. No in-app invitation flow; adding admins later is handled through setup.

### How should designated admins sign in?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Email and password (recommended) | Staff email/password login; no message code each time. | Yes |
| 2. Phone-number OTP | Code delivered through WhatsApp or SMS. |  |

**User response:** `1`
**Captured decision:** Email and password. The customer phone-OTP booking flow remains unchanged.

### For creating or editing a session on a phone, which form style should we use?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. One form with clear sections (recommended) | One form divided into date/time, venue/coaches, price/limits sections; prefill defaults. |  |
| 2. Short guided steps | One field group per step, followed by review and save. | Yes |

**User response:** `2`
**Captured decision:** Short guided steps, one group of fields at a time, with review and save at the end. Class defaults are prefilled.

### How should admins move between sessions and management screens on a phone?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Visible bottom navigation (recommended) | Main available destinations stay one tap away. | Yes |
| 2. A labeled Menu button | Use a labeled navigation menu to leave more room for the current task. |  |

**User response:** `1`
**Captured decision:** Visible bottom navigation. Show only destinations available in the current phase.

### Ready to save phase context or explore more decisions?

| Option | Description | Selected |
|--------|-------------|----------|
| 1. Ready - save the phase context (recommended) | Save context after the summary of all four areas. | Yes |
| 2. Explore more decisions before saving | Continue exploring decisions before context creation. |  |

**User response:** `1`
**Captured decision:** Ready to save the phase context after all four areas were summarized.

## Agent's Discretion

No explicit additional product-decision delegation was made. Technical implementation, exact design tokens, navigation labels, and accessibility mechanisms remain research/UI-planning work within the confirmed decisions.

## Deferred Ideas

No new features were introduced. Later-phase features retain their approved roadmap scope.

## Planning Clarifications (2026-10-08)

- User: "Hold up, for database we don't want to use supabase. Can we start simple using sqlite?" Selected SQLite for initial persistence and excluded Supabase (D-21).
- User: "And we can use prisma for the orm". Selected Prisma for data access and migrations (D-22).
- These explicit instructions supersede the earlier advisory database recommendation. No application code or dependency installation was requested by these clarifications.

## UI-Phase Clarifications (2026-10-08)

- User selected option 1 to initialize shadcn/ui, while requiring substantial component customization to avoid a generic shadcn appearance (D-23).
- User asked to match the previously agreed palette. Carry forward the selected Community matchday colors `#164D45`, `#FFFFFF`, `#1D252C`, and `#EDF4F1` (D-24).
- Initialization is authorized. The researcher setup contract still requests the user's preset string before running the init command; no setup has run yet.
- User then selected "Choose one for me". The agent chose official preset `b2YOAa` (Radix/Nova, Inter, neutral base, green baseline). Initialization completed with shadcn 4.21.4 and Tailwind 4.3.3; `components.json`, aliases, font/theme imports and `cn` utility are present. No shadcn UI components or tennis screens have been added. Brand tokens use the agreed palette. Setup build and lint checks passed; this is not implemented Lafu UI acceptance.
