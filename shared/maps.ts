// Google Maps links an admin pastes for a venue. Long links carry the coordinates; short share links
// (maps.app.goo.gl) only redirect to one, so the server follows them before reading.

export interface MapLocation { latitude: number; longitude: number }

export const MAP_URL_MAX = 2000

const GOOGLE_HOST = /^(?:www\.|maps\.)?google\.[a-z]{2,3}(?:\.[a-z]{2})?$/
const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl'])

export function parseMapUrl(raw: string): URL | null {
  const text = raw.trim()
  if (!text || text.length > MAP_URL_MAX) return null
  let url: URL
  try { url = new URL(text) } catch { return null }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  return isGoogleMapsHost(url.hostname) ? url : null
}

export function isGoogleMapsHost(hostname: string) {
  return GOOGLE_HOST.test(hostname) || SHORT_HOSTS.has(hostname)
}

export function isShortMapLink(url: URL) {
  return SHORT_HOSTS.has(url.hostname)
}

function valid(latitude: number, longitude: number): MapLocation | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude: round(latitude), longitude: round(longitude) }
}

function round(value: number) { return Math.round(value * 1e6) / 1e6 }

const PAIR = /(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/

// The place pin (!3d…!4d…) wins over the camera centre (@lat,lng), which can sit off to one side.
export function coordinatesFromMapUrl(url: URL): MapLocation | null {
  const text = decodeURIComponent(url.href)
  const pin = /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/.exec(text)
  if (pin) return valid(Number(pin[1]), Number(pin[2]))
  for (const key of ['query', 'q', 'll', 'destination', 'center']) {
    const value = url.searchParams.get(key)
    const match = value ? PAIR.exec(value) : null
    if (match && match.index === 0) return valid(Number(match[1]), Number(match[2]))
  }
  const camera = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/.exec(text)
  if (camera) return valid(Number(camera[1]), Number(camera[2]))
  return null
}

// What a member opens: the admin's own link when there is one, else a search for the venue.
export function venueMapsHref(venueName: string, mapUrl?: string | null, address?: string | null) {
  if (mapUrl) return mapUrl
  const query = [venueName, address].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
