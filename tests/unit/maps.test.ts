import { expect, test } from 'vitest'
import { coordinatesFromMapUrl, parseMapUrl, venueMapsHref } from '../../shared/maps.ts'
import { resolveMapLocation } from '../../server/features/admin/references/map-location.service.ts'

const read = (text: string) => { const url = parseMapUrl(text); return url && coordinatesFromMapUrl(url) }

test('reads the place pin before the camera centre', () => {
  expect(read('https://www.google.com/maps/place/Lapangan/@-7.56,110.80,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-7.5612345!4d110.8234567')).toEqual({ latitude: -7.561234, longitude: 110.823457 })
  expect(read('https://www.google.com/maps/@-7.5700,110.8100,15z')).toEqual({ latitude: -7.57, longitude: 110.81 })
  expect(read('https://maps.google.com/?q=-7.56,110.82')).toEqual({ latitude: -7.56, longitude: 110.82 })
  expect(read('https://www.google.com/maps/search/?api=1&query=-7.56%2C110.82')).toEqual({ latitude: -7.56, longitude: 110.82 })
})

test('rejects links that are not Google Maps or carry no usable place', () => {
  expect(parseMapUrl('https://evil.example/maps/@-7.5,110.8')).toBeNull()
  expect(parseMapUrl('javascript:alert(1)')).toBeNull()
  expect(parseMapUrl('not a link')).toBeNull()
  expect(read('https://www.google.com/maps/search/?api=1&query=Lapangan%20Manahan')).toBeNull()
  expect(read('https://www.google.com/maps/@95.0,110.8,15z')).toBeNull()
})

test('follows a short share link only to Google hosts', async () => {
  const hops: string[] = []
  const follow = async (url: URL) => { hops.push(url.href); return 'https://www.google.com/maps/place/X/@-7.5,110.8,17z/data=!3d-7.51!4d110.81' }
  await expect(resolveMapLocation('https://maps.app.goo.gl/AbC123', follow)).resolves.toEqual({ mapUrl: 'https://maps.app.goo.gl/AbC123', latitude: -7.51, longitude: 110.81 })
  expect(hops).toEqual(['https://maps.app.goo.gl/AbC123'])
  await expect(resolveMapLocation('https://maps.app.goo.gl/AbC123', async () => 'https://evil.example/@-7.5,110.8')).rejects.toMatchObject({ code: 'MAP_LINK_UNREADABLE' })
  await expect(resolveMapLocation('https://maps.app.goo.gl/AbC123', async () => { throw new Error('offline') })).rejects.toMatchObject({ code: 'MAP_LINK_UNREADABLE' })
  await expect(resolveMapLocation('https://example.com/x', follow)).rejects.toMatchObject({ code: 'MAP_LINK_UNREADABLE' })
})

test('members open the saved link, else a search by name and address', () => {
  expect(venueMapsHref('Court', 'https://maps.app.goo.gl/AbC123')).toBe('https://maps.app.goo.gl/AbC123')
  expect(venueMapsHref('Court A', null, 'Jl. Slamet Riyadi')).toBe('https://www.google.com/maps/search/?api=1&query=Court%20A%2C%20Jl.%20Slamet%20Riyadi')
})
