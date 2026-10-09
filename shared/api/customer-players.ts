// Player names per session for one club day, keyed by session id. Sessions with nobody booked are absent.
export interface SessionPlayersResponse {
  date: string
  sessions: Record<string, string[]>
}
