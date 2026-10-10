import { useI18n } from '@/i18n/use-i18n'

const ZOOM = 16
const TILE = 256

// Fractional OpenStreetMap tile position of a point (Web Mercator).
function tileOf(latitude: number, longitude: number) {
  const scale = 2 ** ZOOM
  const lat = (latitude * Math.PI) / 180
  return {
    x: ((longitude + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * scale,
  }
}

// A small static map of the saved pin: a 3 x 3 block of OSM tiles centred on the point, the pin on top.
// Purely a check for the admin that the link points at the right place; the link itself is what members open.
export function MapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { t } = useI18n()
  const { x, y } = tileOf(latitude, longitude)
  const baseX = Math.floor(x) - 1
  const baseY = Math.floor(y) - 1
  // Offset that puts the point at the centre of the frame.
  const left = `calc(50% - ${(x - baseX) * TILE}px)`
  const top = `calc(50% - ${(y - baseY) * TILE}px)`
  return (
    <div role="img" aria-label={t({ id: 'Peta titik lokasi', en: 'Map of the venue pin' })} className="relative h-40 overflow-hidden bg-surface-container-high">
      <div aria-hidden="true" className="absolute grid grid-cols-3" style={{ left, top, width: TILE * 3, height: TILE * 3 }}>
        {[0, 1, 2].flatMap(row => [0, 1, 2].map(column => (
          <img key={`${row}-${column}`} src={`https://tile.openstreetmap.org/${ZOOM}/${baseX + column}/${baseY + row}.png`}
            alt="" width={TILE} height={TILE} loading="lazy" decoding="async" referrerPolicy="strict-origin-when-cross-origin" className="block size-64 max-w-none" />
        )))}
      </div>
      <svg aria-hidden="true" viewBox="0 0 32 40" className="absolute left-1/2 top-1/2 h-10 w-8 -translate-x-1/2 -translate-y-full">
        <path d="M16 39C16 39 2 24 2 15a14 14 0 0 1 28 0c0 9-14 24-14 24z" className="fill-band-tile stroke-white" strokeWidth="2" />
        <circle cx="16" cy="15" r="5" className="fill-accent" />
      </svg>
      <span className="absolute bottom-0 right-0 bg-surface-container-lowest/85 px-1.5 text-label text-on-surface">© OpenStreetMap contributors</span>
    </div>
  )
}
