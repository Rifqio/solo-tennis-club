// The phone feedback scenes (board G2): one court seen from behind the baseline, one call per outcome. Each plays once
// on arrival and holds its last frame, which is also what reduced motion shows (styles in index.css, "Court scenes").
export type CourtSceneKind = 'sent' | 'let' | 'out' | 'rain'

const MESH = Array.from({ length: 18 }, (_, index) => 98 + index * 12)
// Rain lands across the court: [x, ground y, delay ms]. Nearer drops are bigger.
const RAIN: [number, number, number][] = [[150, 70, 0], [236, 96, 120], [118, 128, 260], [276, 140, 60], [182, 176, 340], [88, 214, 180],
  [300, 206, 420], [212, 236, 520], [140, 248, 640], [250, 120, 700], [170, 110, 560], [322, 248, 300]]
const PUDDLES: [number, number, number, number][] = [[132, 214, 30, 6], [262, 170, 22, 4.5], [190, 118, 14, 3]]
const depth = (ground: number) => 0.4 + 0.6 * (ground - 36) / 224

function Court() {
  return <>
    <g className="cs-lines">
      <path d="M40 260 L112 36 H278 L350 260" />
      <path d="M66 260 L130 36 M324 260 L260 36" />
      <path d="M121 66 H269 M97 150 H293 M195 66 V150" />
      <path d="M112 36 H278" className="cs-baseline" />
    </g>
  </>
}

function Net() {
  return (
    <g className="cs-net">
      <g className="cs-wobble">
        <rect x="86" y="80" width="218" height="16" className="cs-mesh-fill" />
        <g className="cs-mesh">{MESH.map(x => <path key={x} d={`M${x} 80 V96`} />)}</g>
        <path d="M86 80 H304" className="cs-tape" />
      </g>
      <path d="M86 77 V97 M304 77 V97" className="cs-posts" />
    </g>
  )
}

function Ball() {
  return (
    <g className="cs-bx">
      <g className="cs-sy"><g className="cs-bs"><ellipse rx="13" ry="4" className="cs-shadow" /></g></g>
      <g className="cs-by"><g className="cs-bs"><g className="cs-spin">
        <circle r="13" className="cs-ball" />
        <path d="M-9 -9c5 5 5 13 0 18M9 -9c-5 5-5 13 0 18" className="cs-seam" />
      </g></g></g>
    </g>
  )
}

export function CourtScene({ kind, className }: { kind: CourtSceneKind; className?: string }) {
  return (
    <svg viewBox="0 0 390 260" aria-hidden="true" className={`court-scene cs-${kind} ${className ?? ''}`}>
      {kind === 'out' || kind === 'rain' ? (
        <g className="cs-dim">
          <Court />
          {kind === 'rain' && PUDDLES.map(([x, y, rx, ry]) => <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} className="cs-puddle" />)}
          <Net />
        </g>
      ) : <g><Court /><Net /></g>}
      {kind === 'sent' && <ellipse cx="170" cy="58" rx="9" ry="3" className="cs-disc" />}
      {kind === 'let' && <ellipse cx="196" cy="114" rx="11" ry="3.8" className="cs-disc cs-disc-out" />}
      <Ball />
      {kind === 'rain' && RAIN.map(([x, ground, delay]) => {
        const k = depth(ground)
        return (
          <g key={`${x}-${ground}`} style={{ animationDelay: `${delay + 200}ms` }}>
            <path d={`M${(x + 5 * k).toFixed(1)} ${(ground - 20 * k).toFixed(1)} L${x} ${ground - 3}`} className="cs-drop" style={{ strokeWidth: 1 + 1.4 * k, animationDelay: `${delay + 200}ms` }} />
            <ellipse cx={x} cy={ground} rx={8 * k} ry={2.6 * k} className="cs-splash" style={{ animationDelay: `${delay + 200}ms` }} />
          </g>
        )
      })}
    </svg>
  )
}
