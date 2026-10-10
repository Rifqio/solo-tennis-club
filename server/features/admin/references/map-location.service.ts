import type { MapLocationResponse } from '../../../../shared/api/admin-references.ts'
import { coordinatesFromMapUrl, isGoogleMapsHost, isShortMapLink, parseMapUrl } from '../../../../shared/maps.ts'
import { ApiError } from '../../../http/errors.ts'

export type FetchRedirect = (url: URL, signal: AbortSignal) => Promise<string | null>

const MAX_HOPS = 4
const TIMEOUT_MS = 5000

// Asks for the page without following, and returns where it redirects to.
const fetchRedirect: FetchRedirect = async (url, signal) => {
  const response = await fetch(url, { redirect: 'manual', signal, headers: { 'user-agent': 'Mozilla/5.0 (Lafu venue link check)' } })
  await response.body?.cancel()
  return response.status >= 300 && response.status < 400 ? response.headers.get('location') : null
}

// Reads a pasted Google Maps link. Short share links are followed, one hop at a time and only to Google hosts,
// until a link that carries coordinates turns up.
export async function resolveMapLocation(raw: string, follow: FetchRedirect = fetchRedirect): Promise<MapLocationResponse> {
  const pasted = parseMapUrl(raw)
  if (!pasted) throw new ApiError(422, 'MAP_LINK_UNREADABLE')
  let current = pasted
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const location = coordinatesFromMapUrl(current)
    if (location) return { mapUrl: pasted.href, ...location }
    if (hop === MAX_HOPS || (!isShortMapLink(current) && hop > 0)) break
    let next: string | null
    try { next = await follow(current, signal) } catch { break }
    if (!next) break
    let target: URL
    try { target = new URL(next, current) } catch { break }
    if (target.protocol !== 'https:' || !isGoogleMapsHost(target.hostname)) break
    current = target
  }
  throw new ApiError(422, 'MAP_LINK_UNREADABLE')
}
