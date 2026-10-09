// Top-down tennis court geometry: doubles and singles sidelines, the service line, the centre service line and the net.
// Drawn in currentColor so callers set the faint tone (white at 15% on the band, ink at 8% on grey).
export function CourtLines({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 240" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="10" y="10" width="200" height="300" />
      <path d="M35 10v300M185 10v300M35 120h150M110 120v190M10 236h200" />
      <path d="M110 10v8" />
    </svg>
  )
}
