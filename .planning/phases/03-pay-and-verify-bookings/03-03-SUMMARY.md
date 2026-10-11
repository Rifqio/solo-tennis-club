# 03-03 Summary: admin proof review

Date: 2026-10-11. Status: implemented. Owners: OPER-05, PAY-05, PAY-06, PAY-08, UX-02.

## What changed
- **Server:**
  - The `review` filter lists pending proofs, oldest first, with search.
  - `reviewCount` sits beside `unpaidCount`.
  - The booking detail carries its proofs (with files and who reviewed them), plus `confirmed` and `paymentNote`.
  - `POST .../proofs/:proofId/approve|reject` (`proof-review.service.ts`) runs in one write transaction, checked against the booking's version and its awaiting_verification status:
    - approve sets confirmed, with who and when;
    - reject before the deadline sets needs_correction (the member can send again within the same deadline);
    - reject after it sets expired (places released, PAY-08).
  - Stale or double reviews return `STALE_VERSION` with the latest detail. A cancelled session is never confirmed. "other" needs a note. See `03-03-OPENAPI.yaml`.
- **Booking masuk:**
  - "Perlu dicek" is the first filter, with a lime count.
  - The review section in the booking detail (phone page and desktop drawer) shows:
    - what is owed and the deadline, with a warning when it has passed;
    - when the proof was sent, and the files (images inline, opening full size in a new tab for pinch zoom; PDFs as files);
    - Tolak and Setujui;
    - earlier proofs, folded away.
  - Reject is a sheet (dialog on desktop) with the four reasons; Lainnya needs a note. It says whether the member can still resubmit or the places will be released.
  - Results are toasts ("Pembayaran {name} dikonfirmasi.", "Bukti ditolak." / "Bukti ditolak, slot dilepas."). After a rejection, "Kabari {name} di WhatsApp" opens a ready message with the reason and either the deadline or the release.
  - A booking that changed meanwhile shows its latest state with one notice.

## Not done (noted)
- The rail/dock Booking badge does not show the review count yet. The filter chip carries it. A global badge needs a light count request on every admin screen; this is left for 03-06 or later.

## Evidence
- `tests/integration/admin-proof-review.test.ts`: 6 tests. They cover queue order and count, approve (and a double approve refused), reject before the deadline then resubmission, reject after the deadline with places released, a stale version with the latest detail, a cancelled session, and reason and note rules, plus that members cannot review.
- Browser at 1440 and 390:
  - The queue and its count, and the drawer or phone page with the proof.
  - Approve, shown by a toast.
  - Reject without a reason is refused; with a reason it gives a toast, and the WhatsApp follow-up appears.
  - No sideways scroll, no page errors.
- 232 tests pass; type check and lint are clean.
