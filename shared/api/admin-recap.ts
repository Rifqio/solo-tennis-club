// GET /api/admin/recap?month=YYYY-MM (OPER-12) and GET /api/admin/recap/export?month=YYYY-MM (OPER-13).
// A booking counts in the month of its session date (03-DECISIONS). Revenue counts paid (confirmed) bookings only;
// cancelled sessions count for nothing but the cancelled tally.

export interface AdminRecapClassRow {
  id: string
  name: string
  // Sessions held or still to come (not cancelled) in the month.
  sessions: number
  // Places held by active bookings (paid, under review, or unpaid before their deadline), against the places offered.
  used: number
  capacity: number
  revenueIdr: number
}

export interface AdminRecapResponse {
  month: string
  // The month still running: money for its later sessions may still come in.
  partial: boolean
  // The month's first and last club dates.
  range: { from: string; to: string }
  revenueIdr: number
  // A finished month compares with the whole month before; a running month with what the month before had been paid
  // by the same day (from-to are those days). Null when there is nothing paid to compare with.
  comparison: { month: string; from: string; to: string; revenueIdr: number; changePct: number } | null
  pending: { amountIdr: number; bookings: number }
  places: { used: number; capacity: number }
  sessions: { held: number; upcoming: number; cancelled: number }
  // Six months of paid revenue, oldest first, ending with this month.
  months: { month: string; revenueIdr: number }[]
  // Highest revenue first.
  classes: AdminRecapClassRow[]
  // The club's current month: the switcher goes no later.
  latestMonth: string
}
