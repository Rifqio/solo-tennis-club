const SIZE = 29

// A QR-like pattern for the sample QRIS: three finder squares and fixed noise. It is not a code and scans as nothing;
// the screen labels it as a sample until the club's own QRIS image replaces it (payment-details.ts).
function samplePattern() {
  const cells: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
  let seed = 20261011
  const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) cells[y]![x] = next() > 0.52
  const finder = (left: number, top: number) => {
    for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
      const cx = left + x, cy = top + y
      if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) continue
      const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3))
      cells[cy]![cx] = ring === 3 || ring <= 1
    }
  }
  finder(0, 0); finder(SIZE - 7, 0); finder(0, SIZE - 7)
  return cells
}

export function sampleQrSvg() {
  const cells = samplePattern()
  const rects = cells.flatMap((row, y) => row.map((on, x) => on ? `<rect x="${x + 2}" y="${y + 2}" width="1" height="1"/>` : '')).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE + 4} ${SIZE + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects}</g></svg>`
}

// The sample as an image address, for the screen and for "Simpan QR".
export const SAMPLE_QR_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleQrSvg())}`
