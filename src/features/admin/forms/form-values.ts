export interface DefaultValues { levelId: string; venueId: string; durationMinutes: string; priceIdr: string; minParticipants: string; maxParticipants: string; coachIds: string[] }
export const emptyDefaults: DefaultValues = { levelId: '', venueId: '', durationMinutes: '', priceIdr: '', minParticipants: '', maxParticipants: '', coachIds: [] }
export function parseInteger(value: string): number | string { return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : value }
