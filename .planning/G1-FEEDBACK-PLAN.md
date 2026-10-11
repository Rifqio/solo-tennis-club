# G1 status and feedback: implementation plan

**Status (2026-10-11): built.** Phases 1-4 committed (ae79027 building blocks, 447a3c1 admin, 8c6a700 member, 4b85cc5 copy, 40886b5 field-failure rule); browser probes at 390 and 1440 checked the save toast, archive with Urungkan, booking step 2 field errors and the offline banner. Left open: the admin "session about to expire" banner (needs the expiry from the API); admin copy keeps the boards' wording (G1's formal voice applies to Rekap, which is Phase 3); the full e2e run is with the e2e update.

Source: the design artifact's `project/GuideFeedback.dc.html` (G1), DESIGN.md › Motion and Feedback, antislop R-19 (motion must have a purpose) and R-27 (every view has loading, empty and error states that name the cause and the next action), and antislop-layoutmobile (fixed elements never cover content and respect safe areas). Built on two read-only inventories of every admin and customer action (2026-10-11).

## 1. The rule this plan enforces

**Every outcome gets exactly one piece of feedback, chosen by G1's ladder** (stop at the first "yes"):

| Question | Use | Goes away when |
|---|---|---|
| Is one field the cause? | Field error | The field is fixed |
| Can the whole page not be shown? | Error page | The person leaves |
| Is a decision needed before going on? | Dialog | A choice is made |
| Is it a lasting page or system state? | Banner | The state is over |
| Is one card or form affected? | Notice panel | Fixed or resubmitted |
| Is it the result of a finished action? | Toast | 4s, or 6s with Urungkan |

Rules that prevent double feedback:
1. **A screen that is the result replaces the toast.** For example, the booking confirmation (BookedArt), landing on Sesi after admin sign-in, and the sign-in form after sign-out. None of these shows a toast.
2. **Toasts are only for success.** A failure that needs action is a field error or a notice panel, never a toast.
3. **Field errors win over panels.** If every server error maps to a field, show no generic "Periksa isian" panel.
4. **One live announcement per outcome.** A toast and a `role=status` panel never announce the same thing.
5. **Feedback is spent once.** A toast is never replayed on reload or Back: navigation state is cleared after it is shown.
6. **One toast at a time.** A new one replaces the current one, and only one banner shows at a time.

## 2. What exists today (gaps the inventories found)

- **StatusPanel** has no icons. Success and info are both grey `#E7E9E9`, so success cannot be told apart. G1 wants success as white on Deep Court with a lime check.
- **Missing pieces:** there is no toast, no banner, and no offline handling. Success shows as `SavedNote` panels that never go away and that come back on reload.
- **Double feedback found:**
  - STALE_VERSION shows an error panel plus a conflict section, and the copy says "Sesi" on every form.
  - BOOKING_CLOSED in Catat booking shows an info panel plus an error panel.
  - A 401 during a save shows the sign-in notice, then a stale error in the form.
  - Session VALIDATION_FAILED shows field errors plus a generic panel.
  - OTP expired shows an error panel and an info panel with the same text.
  - The OTP throttle countdown appears twice.
  - A booking error stays visible on both step 1 and step 3.
  - A cancelled session is stated three times in the detail.
  - Cancelled and expired panels stack on the booking detail.
- **No feedback at all:**
  - Load-more failures, on every list.
  - A saved row that is off-screen or beyond page 1.
  - Restore on phone (a stale-state bug: nothing changes).
  - Undo landing on the phone editor.
  - Coach photo saved.
  - Linking to an account: focus is lost, and the BOOKING_ALREADY_LINKED error vanishes.
  - Booking step 2 with a blank name.
  - Catat booking step 2 validation: focus doesn't move.
  - Booking options failing on the network: Confirm stays disabled with no reason.
  - Resending the OTP code.
  - Archive disabled while the form is dirty: the reason is only a tooltip, which doesn't show on touch.
- **Wrong cause shown:**
  - A network failure on booking confirm says "kendala di server".
  - A network failure on session load says "nggak bisa dipesan".
  - A 401 on confirm gives no way to sign in.
  - SESSION_CHANGED says "muat ulang", though nothing needs reloading.
  - BOOKING_CLOSED leaves Confirm enabled.

## 3. Building blocks (phase 1)

All of these use the existing springs in `src/lib/motion.ts`.

| Piece | What | Motion (G1 §4) | Reduced motion |
|---|---|---|---|
| **Tone tokens + StatusPanel restyle** (`src/components/ui/status-panel.tsx`) | Info: Deep Court on `#E6F0FA` with an info icon. Success: white on Deep Court with a lime check badge. Warning: amber `#805000` on `#FFF4D6` with a triangle. Error: brick `#B42318` on `#FEECE8` with a circle. Roles: info/success use `status` (polite); warning uses `alert` when first shown; error uses `alert`. Add dark-mode tokens. | Fades in place over 150ms; fades out over 150ms | At once |
| **Toast** (`src/components/ui/toast.tsx` + `ToastProvider` in both `AdminLayout` and `PublicLayout`, above `<Outlet>`, so a toast survives the navigation that follows a save) | `useToast().show({ message, undo?: { label, run } })`. Success tone, lime check, max 2 lines. **Phone:** above the dock, or above a sticky action bar when one is present (read `--bottom-chrome`, which the dock and action bars set), plus safe area, 16px gutter. **Desktop:** bottom centre of the content column (offset by the rail). Lasts 4s, or 6s with Urungkan. The timer pauses on hover or focus. One persistent polite live region; the toast never takes focus, and Urungkan is reachable by Tab. | Rises 16px with a fade on contentSpring (about 280ms); exit is a 160ms fade | 150ms fade |
| **Banner** (`src/components/ui/banner.tsx`) | Sits under the blue band, as wide as the content column, and pushes content down. At most one. First use: **offline** (`online`/`offline` events), in both apps: "Koneksi terputus. Perubahan belum tersimpan, kami coba lagi otomatis." in member voice; formal for admin. A slot for "sesi admin hampir berakhir" later, once the API exposes the expiry. | Opens downward with a fade over 240ms; closes over 200ms | At once |
| **Field error motion** (TextField, SelectField, StepperField, ChoiceChips, CoachPicker, VenueList, CodeBoxes) | The message fades in over 150ms; the border changes at once. **One 8px shake, 420ms, only when submit is pressed** (`useSubmitShake()`, moved out of `code-boxes.tsx`). Focus moves to the first invalid field. | As described | No shake; message at once |
| **Success check** | `PopIn` scale goes from 0.4 → **0.6 → 1** on popSpring (G1 value) | Pop | Shown at once |
| **Dialog** (DiscardChangesDialog, the link-confirm dialog that should be shared, and Sheet from 640px) | One `AlertDialogShell` | Content scales 0.96 → 1 with a fade over 240ms; backdrop fades over 200ms; reverse in 160ms | 150ms fade |
| **Retire SavedNote** | Each use moves to a toast (§4). Delete the component once nothing uses it. | — | — |

## 4. Where each pattern goes

### Admin (formal Indonesian)

| Action | Success: phone | Success: desktop | Failure | Notes on doubles and edges |
|---|---|---|---|---|
| Session create/edit | Back to Sesi on the saved day; **scroll the saved card into view** and toast "Sesi tersimpan." | Roster panel **selects the saved session** (fixes the mismatch); toast | Field errors with focus and shake. Server VALIDATION_FAILED: fields only (drop the generic panel). Network: notice panel "Belum pasti tersimpan. Simpan lagi aman." | Remove the SavedNote panel inside the card. Ignore `replayed` (no second toast). |
| Class create/edit | List, scrolled to the row; toast "Kelas tersimpan." / "Kelas ditambahkan." (two separate messages, so a create stops saying "Perubahan tersimpan") | Editor stays and the row highlight glides; toast | Same as above | If the row isn't on page 1, the toast alone is the feedback (no scroll). |
| Coach/venue/level save | List, scrolled to the row; toast "{Nama} tersimpan." | Toast only; **remove the inline "✓ Tersimpan"** beside Simpan | Same | — |
| Archive | Toast "{Nama} diarsipkan." with **Urungkan, 6s**, replacing the ArchivedNotice panel | Same | Archive failure: notice panel in the form | The Arsipkan button explains why it's disabled in visible text, not only a tooltip (touch has no hover). |
| Urungkan / Pulihkan | Toast "{Nama} dipulihkan."; **fix the phone stale-state bug** (refresh the record after restore) | Toast | Undo failure: error notice at the top of the list with "Coba lagi". Never an error toast. | Undo shows a pending state; no double taps. |
| Coach photo upload/remove | Toast "Foto tersimpan." / "Foto dihapus." The new photo shows in place. | Same | Inline error under the photo (as today) | The photo change alone isn't announced, so the toast is the single announcement. |
| Catat booking dari WA | Lands on the booking; toast "Booking tercatat." (on a replay: "Booking ini sudah tercatat.") | Drawer opens on the booking; toast | CAPACITY: notice panel on step 2 with the new count. SESSION_CHANGED: notice panel. **BOOKING_CLOSED: only the "sudah tutup" panel** (drop the duplicate error). Step 2 validation: focus and shake. | Drop the "Booking tercatat" panel: the band already shows the deadline, so the panel repeated it. |
| Link to account | Toast "Terhubung ke akun {nama}."; focus goes to the phone row (focus is lost today); the "Dihubungkan…" line just appears, as content | Same | NOT_FOUND / MISMATCH: notice in the section. **BOOKING_ALREADY_LINKED: refresh, plus an info notice "Booking ini sudah terhubung oleh admin lain."** shown above the phone row, so it no longer vanishes | Drop SavedNote on the linked line (otherwise two motions for one result). |
| Sign-in | Lands on Sesi; no toast (the screen is the result) | Same | Field errors with shake; throttle as a warning panel; **the countdown shows only on the button** | — |
| Sign-out | Sign-in screen; no toast | Same | Failure: notice at the top of main, as today | Pending gets visible text on phone. |
| Session expired (401) | Sign-in overlay, as today | Same | — | After signing in again, **clear the stale UNAUTHENTICATED error** and keep `location.state`. |
| Version conflict (STALE_VERSION) | **One** notice panel: "Admin lain baru mengubah {kelas/sesi/coach…} ini." with the latest/yours comparison and "Gunakan versi terbaru" | Same | — | Per-kind copy, replacing "Sesi" everywhere. |
| Load more (all lists) | Error notice at the foot of the list with "Coba lagi"; the loaded rows stay | Same | — | Today it fails silently. |

### Member (casual Indonesian)

| Action | Success | Failure | Notes on doubles and edges |
|---|---|---|---|
| **Booking confirm** | **The confirmation screen only, with no toast**: BookedArt on phone, BookedBadge on desktop | CAPACITY: notice on step 3 with **"Ubah jumlah"**, which goes to step 1. BOOKING_CLOSED: notice and Confirm **disabled**. SESSION_CHANGED: "Detail sesi baru berubah. Cek lagi, lalu konfirmasi." 401: dialog "Sesi login habis", with "Login lagi" going to sign-in with `returnTo` (the draft is kept). Network: "Koneksi putus. Belum pasti terkirim, coba lagi aman." | Clear the error when the step changes (it shows on both steps today). |
| Booking options/session load fails | — | Notice panel with the real cause and "Coba lagi"; never a disabled Confirm with no reason | "Nggak bisa dipesan" only for an actual 404. |
| Booking step 2 names | — | Lanjut stays enabled; pressing it shows field errors on the empty names, with focus and shake | The disabled button with no reason goes. |
| OTP request/verify | Next step appears (the form slide is the feedback) | Wrong code: boxes, shake and the line, as today. Expired: **one** notice. Throttle: warning panel in plain words ("Tunggu sebentar, lalu coba lagi"); the **number only on the button**. | Hours are shown as hours, not "3600 detik". |
| Resend code | Toast "Kode baru dikirim." | Notice | No dock here, so it sits at the bottom with the safe area. |
| Sign-in via returnTo | Lands back on the task; no toast (the button becoming "Lanjut" is the result) | — | — |
| Akun page | Account details only; **drop the "Kamu sudah masuk" success panel** (it's a lasting state shown as a success) | — | — |
| Sign out | Sign-in form appears; no toast | Notice panel | — |
| Booking kamu | — | Load-more failure: notice at the foot, list kept. Desktop panel handles 401. | Cancelled session + expired hold: **one** notice, by priority (cancelled wins). Cancelled session + still unpaid: one warning, "Sesi dibatalkan, chat admin soal pembayaran", and the countdown is hidden. |
| Session detail | — | With seeded content, a failed refresh becomes a quiet info notice "Sebagian info belum termuat" plus retry, instead of an alert over a working page | Cancelled is said **once** (the status plus the footer reason; the paragraph goes). |
| Language switch | The content changes language; no toast | — | Correct as it is. |
| Offline (both apps) | Banner while offline; it closes when back online | — | Retries are not automatic for writes, so the copy doesn't promise it. |

### Desktop vs phone summary

- **Toast placement:**
  - Phone: above the dock or the sticky action bar, plus the safe area.
  - Desktop: bottom centre of the content column, clear of the rail.
- **Saves:**
  - Phone saves usually return to a list, so the saved row scrolls into view and the toast is the single message.
  - Desktop saves stay in the split view, so the selection highlight plus the toast is the feedback, and there is no panel in the editor.
- **Dialogs:** a bottom sheet on phone and a centred dialog from 640px, with the same G1 timings.
- **Banner:** the content-column width under the band, at every size.

## 5. Edge cases to cover

- **Toasts and navigation:**
  - Show the toast, then navigate. The provider sits above the routes, so the toast survives.
  - Never pass success through `location.state`; that is what made SavedNote come back on reload.
- **Rapid repeat saves** replace the toast; they don't stack.
- **Replayed requests** (idempotent retries) get no second success toast.
- **Aborted requests** (leaving mid-save) get no feedback.
- **Undo after leaving the screen:** the toast stays for its 6s and Urungkan still works, because it calls the API, not the page.
- **Session expiry during undo:** the sign-in overlay handles it, and the toast goes away.
- **Toast vs keyboard on phone:** when a field has focus and the keyboard is open, the toast waits until the keyboard closes or shows above the action bar. Check this on iOS Safari and Android Chrome.
- **Screen readers:**
  - One persistent polite region for toasts.
  - Field errors are announced once (move to `aria-describedby` with one summary `alert`, instead of one alert per field).
- **Reduced motion:** every piece follows G1's reduced-motion column (§3).
- **Dark mode:** the four tones need dark tokens; check contrast for AA.

## 6. Order of work (each is its own commit)

1. **Primitives:**
   - Tone tokens and StatusPanel icons.
   - Toast and the provider in both layouts.
   - The offline Banner.
   - `useSubmitShake` plus field-error motion.
   - The dialog shell.
   - PopIn at 0.6.
2. **Admin wiring** (§4 admin table): SavedNote becomes toasts; STALE_VERSION becomes one panel; the 401 stale error, restore bug, link focus, load-more notice and BOOKING_CLOSED dedupe are fixed.
3. **Member wiring** (§4 member table): booking errors and their next actions, step 2 validation, OTP dedupes, resend toast, the Akun panel, Booking kamu dedupes, the session detail.
4. **Wording pass:**
   - G1 §5: what happened, then what to do, in two lines.
   - Members casual, admin formal.
   - No technical messages.
   - Success phrased short and in the past tense.
5. **Verification.**

## 7. Verification

- `npx tsc -b`, eslint and `npx vitest run` pass. Add unit tests for the toast queue (replace, pause, undo timing) and `useStepDirection`/`useSubmitShake`.
- **Playwright probes at 390 and 1440, with and without reduced motion:**
  - Every success in §4 produces exactly one `role=status` announcement, and no StatusPanel success in the DOM.
  - The booking confirm produces no toast.
  - A toast never overlaps the dock or action bar (bounding boxes).
  - Offline on and off shows and hides the banner.
  - Each double case in §2 now renders one message.
- The full e2e suite runs once at the end.
- The user checks by hand: a save, an archive with undo, Catat booking, a booking confirm, a wrong OTP, and offline, on a phone and on desktop.

## 8. Decisions with a default (say if you want otherwise)

1. **Catat booking dari WA lands on the booking with a toast, and the "Booking tercatat" panel goes.** The band already shows the deadline the panel repeated.
2. **Sign-in that returns to a task shows no toast.** The task continuing is the feedback.
3. **Coach photo gets a toast.** The image change alone isn't announced to screen readers.
4. **"Sesi admin hampir berakhir" banner is deferred** until the API exposes the admin session's expiry. Offline is the only banner in this pass.
