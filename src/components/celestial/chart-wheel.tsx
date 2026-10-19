'use client'

import { forwardRef, useMemo } from 'react'
import type { NatalChartPayload } from '@/lib/celestial/types'
import { PLANET_BY_ID, ZODIAC } from '@/lib/celestial/data'

// literal colours (not CSS variables) so an exported SVG renders identically anywhere
const GOLD = '#e9cb7c'
const VIOLET = '#a78bfa'
const ELEMENT_COLOR: Record<string, string> = { Fire: '#e2543e', Earth: '#9bab68', Air: '#d4c05a', Water: '#5aa8a0' }
const ASPECT_COLOR: Record<string, string> = { harmonious: '#8fd4a8', challenging: '#e2543e', dynamic: 'rgba(233,203,124,0.85)' }

const SIZE = 400
const C = SIZE / 2
const R_OUT = 190
const R_ZOD = 160
const R_PLANET = 132
const R_HOUSE_NUM = 74
const R_CORE = 62

const norm = (x: number) => ((x % 360) + 360) % 360

/** Spread glyphs that sit closer than `minSep` degrees, keeping their order around the circle */
function spread(items: { id: string; lon: number }[], minSep = 10): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.lon - b.lon).map((x) => ({ ...x, at: x.lon }))
  const n = sorted.length
  for (let iter = 0; iter < 60 && n > 1; iter++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      const a = sorted[i]
      const b = sorted[(i + 1) % n]
      const gap = norm(b.at - a.at)
      if (gap < minSep && n * minSep < 360) {
        const push = (minSep - gap) / 2
        a.at = norm(a.at - push)
        b.at = norm(b.at + push)
        moved = true
      }
    }
    if (!moved) break
  }
  return new Map(sorted.map((x) => [x.id, x.at]))
}

export const ChartWheel = forwardRef<SVGSVGElement, { chart: NatalChartPayload; showPoints?: boolean }>(function ChartWheel({ chart, showPoints = true }, ref) {
  const asc = chart.angles.ascendant.longitude
  const pos = (lon: number, r: number) => {
    const t = ((180 + lon - asc) * Math.PI) / 180
    return { x: C + r * Math.cos(t), y: C - r * Math.sin(t) }
  }
  const arcPath = (a: number, b: number, r1: number, r2: number) => {
    const p1 = pos(a, r1), p2 = pos(b, r1), p3 = pos(b, r2), p4 = pos(a, r2)
    const large = norm(b - a) > 180 ? 1 : 0
    return `M${p1.x} ${p1.y} A${r1} ${r1} 0 ${large} 0 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r2} ${r2} 0 ${large} 1 ${p4.x} ${p4.y} Z`
  }

  const bodies = useMemo(() => [
    ...chart.planets.map((p) => ({ id: p.id, lon: p.longitude, glyph: p.glyph, color: PLANET_BY_ID[p.id]?.color ?? GOLD, retro: p.retrograde, point: false })),
    ...(showPoints ? chart.points.map((p) => ({ id: p.id, lon: p.longitude, glyph: p.glyph, color: '#b9b1d6', retro: false, point: true })) : []),
  ], [chart, showPoints])
  const placed = useMemo(() => spread(bodies), [bodies])

  const lonOf = (id: string): number | null => {
    if (id === 'asc') return chart.angles.ascendant.longitude
    if (id === 'mc') return chart.angles.midheaven.longitude
    return bodies.find((b) => b.id === id)?.lon ?? null
  }

  const cusps = chart.houses.map((h) => h.cuspLongitude)
  const angleIdx = new Set([0, 3, 6, 9])

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-[420px] select-none" role="img"
      aria-label={`Natal chart wheel for ${chart.input.name}: Sun in ${chart.balance.sunSign}, Moon in ${chart.balance.moonSign}, ${chart.balance.risingSign} rising`}>
      <defs>
        <radialGradient id="wheelCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1233" />
          <stop offset="100%" stopColor="#07050f" />
        </radialGradient>
      </defs>
      <rect width={SIZE} height={SIZE} fill="#000" />
      <circle cx={C} cy={C} r={R_OUT} fill="url(#wheelCore)" stroke="rgba(167,139,250,0.3)" />

      {/* zodiac band */}
      {ZODIAC.map((sign, i) => (
        <g key={sign.name}>
          <path d={arcPath(i * 30, i * 30 + 30, R_OUT, R_ZOD)} fill={i % 2 ? 'rgba(40,28,80,0.55)' : 'rgba(26,19,52,0.55)'} stroke="rgba(167,139,250,0.25)" strokeWidth="0.6" />
          {(() => { const p = pos(i * 30 + 15, (R_OUT + R_ZOD) / 2); return <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="15" fill={ELEMENT_COLOR[sign.element]}>{sign.glyph}</text> })()}
        </g>
      ))}

      {/* degree ticks */}
      {Array.from({ length: 72 }, (_, i) => {
        const lon = i * 5
        const p1 = pos(lon, R_ZOD), p2 = pos(lon, R_ZOD - (i % 2 === 0 ? 6 : 3))
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(167,139,250,0.45)" strokeWidth="0.6" />
      })}
      <circle cx={C} cy={C} r={R_ZOD} fill="none" stroke="rgba(167,139,250,0.35)" />

      {/* house cusps & numbers */}
      {cusps.map((cusp, i) => {
        const isAngle = angleIdx.has(i)
        const p1 = pos(cusp, R_CORE), p2 = pos(cusp, isAngle ? R_OUT + 6 : R_ZOD)
        const mid = cusp + norm(cusps[(i + 1) % 12] - cusp) / 2
        const n = pos(mid, R_HOUSE_NUM)
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isAngle ? GOLD : 'rgba(233,228,242,0.22)'} strokeWidth={isAngle ? 1.3 : 0.6} strokeDasharray={isAngle && i !== 0 && i !== 6 ? '4 3' : undefined} opacity={isAngle ? 0.85 : 1} />
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="rgba(233,228,242,0.5)" fontFamily="Georgia, serif">{i + 1}</text>
          </g>
        )
      })}

      {/* angle labels */}
      {[{ l: 'ASC', lon: chart.angles.ascendant.longitude }, { l: 'MC', lon: chart.angles.midheaven.longitude }, { l: 'DSC', lon: chart.angles.descendant.longitude }, { l: 'IC', lon: chart.angles.imumCoeli.longitude }].map((a) => {
        const q = pos(a.lon + 4, R_ZOD - 10)
        return <text key={a.l} x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill={GOLD} fontFamily="Georgia, serif" letterSpacing="1">{a.l}</text>
      })}

      {/* aspect web */}
      <circle cx={C} cy={C} r={R_CORE} fill="rgba(6,4,17,0.75)" stroke="rgba(233,203,124,0.3)" strokeWidth="0.8" />
      {chart.aspects.map((a, i) => {
        const la = lonOf(a.a), lb = lonOf(a.b)
        if (la === null || lb === null) return null
        const p1 = pos(la, R_CORE - 2), p2 = pos(lb, R_CORE - 2)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ASPECT_COLOR[a.nature]} strokeWidth={a.exactness > 0.66 ? 1.3 : 0.7} opacity={0.3 + a.exactness * 0.5} />
      })}

      {/* bodies */}
      {bodies.map((b) => {
        const at = placed.get(b.id) ?? b.lon
        const tick1 = pos(b.lon, R_ZOD), tick2 = pos(b.lon, R_ZOD - 9)
        const g = pos(at, b.point ? R_PLANET - 22 : R_PLANET)
        const lead = pos(at, (b.point ? R_PLANET - 22 : R_PLANET) + 11)
        return (
          <g key={b.id}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={b.color} strokeWidth="1.1" />
            <line x1={tick2.x} y1={tick2.y} x2={lead.x} y2={lead.y} stroke={b.color} strokeWidth="0.4" opacity="0.5" />
            {!b.point && <circle cx={g.x} cy={g.y} r="11" fill="rgba(8,6,18,0.92)" stroke={b.color} strokeWidth="0.8" />}
            <text x={g.x} y={g.y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={b.point ? 10 : 12} fill={b.color}>{b.glyph}</text>
            {b.retro && (() => { const r = pos(at, R_PLANET - 17); return <text x={r.x} y={r.y} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#e2543e">℞</text> })()}
          </g>
        )
      })}

      <text x={C} y={C - 6} textAnchor="middle" fontSize="8" fill="rgba(233,228,242,0.55)" fontFamily="Georgia, serif" letterSpacing="2">{chart.houseSystem.toUpperCase().replace('-', ' ')}</text>
      <text x={C} y={C + 8} textAnchor="middle" fontSize="7" fill={VIOLET} fontFamily="Georgia, serif" letterSpacing="1.5">{chart.balance.isDayChart ? 'DAY CHART' : 'NIGHT CHART'}</text>
    </svg>
  )
})

/** Download the wheel as SVG, or rasterise it to a 2× PNG */
export async function exportWheel(svg: SVGSVGElement, name: string, format: 'svg' | 'png') {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(SIZE))
  clone.setAttribute('height', String(SIZE))
  const xml = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const fileBase = `natal-${name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'chart'}`
  const download = (blob: Blob, ext: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${fileBase}.${ext}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  if (format === 'svg') return download(svgBlob, 'svg')

  const url = URL.createObjectURL(svgBlob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url })
    const canvas = document.createElement('canvas')
    canvas.width = SIZE * 2
    canvas.height = SIZE * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    ctx.drawImage(img, 0, 0, SIZE, SIZE)
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (png) download(png, 'png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
