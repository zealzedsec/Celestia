'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePolling, useCelestiaStore } from '@/lib/celestial/use-sky'
import { CONSTELLATIONS, STAR_BY_NAME } from '@/lib/celestial/stars'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Sparkle, Waypoints, ZoomIn, ZoomOut, Maximize2, Search, Tags, Orbit } from 'lucide-react'

interface StarPos { name: string; con: string; alt: number; az: number; mag: number; cls: string; dist: number }
interface BodyPos { id: string; name: string; glyph: string; alt: number; az: number; mag: number | null; retrograde: boolean }
interface CirclePoint { alt: number; az: number }
interface SkyMapPayload {
  timestamp: string
  location: { lat: number; lon: number; name?: string }
  moonPhaseAngle: number
  stars: StarPos[]
  bodies: BodyPos[]
  ecliptic: (CirclePoint & { lon: number })[]
  equator: CirclePoint[]
}

/** Spectral-class tint (approximate blackbody colours) */
const SPECTRAL_COLOR: Record<string, string> = {
  O: '#aabfff', B: '#c9d9ff', A: '#f5f3ff', F: '#fff6e6',
  G: '#ffe9c0', K: '#ffd9a3', M: '#ffb46e', W: '#c9d9ff',
}

/**
 * Stereographic projection from the zenith — alt 90° → centre, alt 0° → rim.
 * This is a chart of the sky seen from BELOW (lying on your back, head to the north), so with
 * north up, east is on the LEFT. Plotting east on the right would mirror every constellation.
 */
function project(alt: number, az: number, R: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const r = R * Math.tan((Math.PI / 2 - rad(Math.max(alt, -0.5))) / 2)
  const x = -r * Math.sin(rad(az))
  const y = -r * Math.cos(rad(az))
  return { x, y }
}

/** Above-horizon runs of a sampled great circle as SVG path data */
function circlePath(points: CirclePoint[], R: number, cx: number, cy: number): string {
  const segs: string[] = []
  let open = false
  for (const p of points) {
    if (p.alt <= 0) { open = false; continue }
    const { x, y } = project(p.alt, p.az, R)
    segs.push(`${open ? 'L' : 'M'}${(cx + x).toFixed(1)} ${(cy + y).toFixed(1)}`)
    open = true
  }
  return segs.join(' ')
}

/** Lit-limb + terminator path for a small phase disc (waxing lit on the right, as seen from the north) */
function moonPhasePath(cx: number, cy: number, r: number, phaseAngle: number): string {
  const φ = ((phaseAngle % 360) + 360) % 360
  const waxing = φ < 180
  const crescent = φ < 90 || φ > 270
  const rx = Math.abs(Math.cos((φ * Math.PI) / 180)) * r
  const limb = waxing ? 1 : 0
  const term = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${limb} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${term} ${cx} ${cy - r} Z`
}

const SIZE = 520
const HALF = SIZE / 2
const ZOOMS = [1, 1.6, 2.4, 3.6] as const

/** `at` (ISO instant) renders the dome for another moment — the Chronomancer uses it */
export function SkyMap({ at, compact = false }: { at?: string | null; compact?: boolean } = {}) {
  // the dome MUST follow the observatory location chosen in the header
  const observatory = useCelestiaStore((s) => s.location)
  const domeUrl = `/api/starmap?lat=${observatory.lat}&lon=${observatory.lon}&name=${encodeURIComponent(observatory.name)}${at ? `&t=${encodeURIComponent(at)}` : ''}`
  const location = usePolling<SkyMapPayload>(domeUrl, at ? 3_600_000 : 60000)
  const [showEcliptic, setShowEcliptic] = useState(true)
  const [showLines, setShowLines] = useState(true)
  const [showNames, setShowNames] = useState(true)
  const [showConLabels, setShowConLabels] = useState(false)
  const [zoomIdx, setZoomIdx] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [query, setQuery] = useState('')
  const [pickedStar, setPickedStar] = useState<StarPos | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const zoom = ZOOMS[zoomIdx]
  const R = 240
  const CX = 260
  const CY = 260

  // non-passive wheel zoom
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoomIdx((z) => {
        const next = z + (e.deltaY < 0 ? 1 : -1)
        return Math.max(0, Math.min(ZOOMS.length - 1, next))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // drag-to-pan (pointer events, scales with zoom)
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY }
    // capture on the SVG itself — star nodes are replaced on every poll and would drop the drag
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    const scale = SIZE / zoom / (svgRef.current?.clientWidth || SIZE)
    setPan((p) => ({ x: p.x + dx * scale, y: p.y + dy * scale }))
  }
  const endDrag = () => { dragRef.current = null }

  const resetView = () => { setPan({ x: 0, y: 0 }); setZoomIdx(0); setPickedStar(null) }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 24 / zoom
    const actions: Record<string, () => void> = {
      '+': () => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1)),
      '=': () => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1)),
      '-': () => setZoomIdx((z) => Math.max(0, z - 1)),
      '0': resetView,
      ArrowLeft: () => setPan((p) => ({ ...p, x: p.x + step })),
      ArrowRight: () => setPan((p) => ({ ...p, x: p.x - step })),
      ArrowUp: () => setPan((p) => ({ ...p, y: p.y + step })),
      ArrowDown: () => setPan((p) => ({ ...p, y: p.y - step })),
    }
    const fn = actions[e.key]
    if (fn) { e.preventDefault(); e.stopPropagation(); fn() }
  }

  const { visibleStars, lines, conLabels, sunAlt, twilight, belowBodies, visibleBodies, eclipticPath, equatorPath, eclipticMarks } = useMemo(() => {
    if (!location.data) {
      return { visibleStars: [] as (StarPos & { x: number; y: number })[], lines: [] as { key: string; pts: string }[], conLabels: [] as { name: string; x: number; y: number }[], sunAlt: -90, twilight: 1, belowBodies: [] as BodyPos[], visibleBodies: [] as BodyPos[], eclipticPath: '', equatorPath: '', eclipticMarks: [] as { lon: number; x: number; y: number }[] }
    }
    const { stars, bodies } = location.data
    const sun = bodies.find((b) => b.id === 'sun')
    const sunAlt = sun?.alt ?? -90
    // stars fade out through dawn: fully bright below -12° sun, nearly gone above +2°
    const twilight = Math.min(1, Math.max(0.04, (2 - sunAlt) / 14))

    const visibleStars = stars
      .filter((s) => s.alt > 0.5)
      .map((s) => ({ ...s, ...project(s.alt, s.az, R) }))

    const lines: { key: string; pts: string }[] = []
    const conLabels: { name: string; x: number; y: number }[] = []
    if (showLines) {
      for (const fig of CONSTELLATIONS) {
        const pts: { x: number; y: number }[] = []
        fig.lines.forEach((poly, li) => {
          const segs: string[] = []
          let open = false
          for (const starName of poly) {
            const s = stars.find((z) => z.name === starName)
            if (!s || s.alt <= 0.5) {
              open = false
              continue
            }
            const { x, y } = project(s.alt, s.az, R)
            pts.push({ x, y })
            segs.push(open ? `L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`)
            open = true
          }
          if (segs.length > 1) lines.push({ key: `${fig.abbr}-${li}`, pts: segs.join(' ') })
        })
        if (pts.length >= 2 && showConLabels) {
          const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length
          const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length
          if (Math.hypot(cx, cy) < R * 0.92) conLabels.push({ name: fig.name, x: cx, y: cy })
        }
      }
    }

    return {
      visibleStars,
      lines,
      conLabels,
      sunAlt,
      twilight,
      belowBodies: bodies.filter((b) => b.alt <= 0.5).sort((a, b) => b.alt - a.alt),
      visibleBodies: bodies.filter((b) => b.alt > 0.5),
      eclipticPath: circlePath(location.data.ecliptic ?? [], R, CX, CY),
      equatorPath: circlePath(location.data.equator ?? [], R, CX, CY),
      eclipticMarks: (location.data.ecliptic ?? []).filter((p) => p.alt > 2 && p.lon % 30 === 0 && p.lon < 360).map((p) => ({ lon: p.lon, ...project(p.alt, p.az, R) })),
    }
  }, [location.data, showLines, showConLabels])

  // search: match stars currently above the horizon + solar-system bodies
  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const starHits = visibleStars.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6)
    const bodyHits = visibleBodies.filter((b) => b.name.toLowerCase().includes(q)).map((b) => ({ name: b.name, isBody: true }))
    return [...bodyHits, ...starHits.map((s) => ({ name: s.name, isBody: false }))]
  }, [query, visibleStars, visibleBodies])

  const searchMatch = (name: string) => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return false
    const hit = searchHits.find((h) => h.name === name)
    return !!hit
  }

  const pickedInfo = pickedStar ?? (searchHits.length === 1 ? visibleStars.find((s) => s.name === searchHits[0].name) ?? null : null)

  const viewBox = useMemo(() => {
    const w = SIZE / zoom
    const cx = HALF - pan.x
    const cy = HALF - pan.y
    return `${(cx - w / 2).toFixed(2)} ${(cy - w / 2).toFixed(2)} ${w.toFixed(2)} ${w.toFixed(2)}`
  }, [zoom, pan])

  if (location.loading && !location.data) {
    return <Skeleton className="h-[540px] celestial-card" />
  }
  if (location.error || !location.data) {
    return (
      <div className="celestial-card p-6 flex items-center gap-3 text-destructive">
        <AlertTriangle className="h-5 w-5" /> Sky dome could not render ({location.error}).
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'celestial-card corners p-4 sm:p-6'}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="eyebrow">Sky Dome — whole heavens above {location.data?.location.name ?? observatory.name}</div>
        <div className="flex flex-wrap items-center gap-2">
          {/* star search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="find a star…"
              aria-label="Search stars"
              className="h-8 w-40 rounded-full border border-border/70 bg-background/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-[rgba(233,203,124,0.5)] outline-none"
            />
            {searchHits.length > 0 && (
              <div className="absolute top-9 left-0 z-20 w-56 rounded-lg border border-border/70 bg-popover/95 backdrop-blur-xl p-1 shadow-xl">
                {searchHits.map((h) => (
                  <button
                    key={h.name}
                    onClick={() => { setQuery(h.name); const s = visibleStars.find((z) => z.name === h.name); if (s) setPickedStar(s) }}
                    className="w-full text-left rounded-md px-2.5 py-1.5 text-xs hover:bg-primary/10 flex items-center gap-2"
                  >
                    <Sparkle className="h-3 w-3 text-[var(--gilded)]" /> {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowLines((v) => !v)}
            aria-pressed={showLines}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${showLines ? 'border-[rgba(233,203,124,0.5)] text-[var(--gilded)]' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
          >
            <Waypoints className="h-3 w-3" /> figures
          </button>
          <button
            onClick={() => setShowNames((v) => !v)}
            aria-pressed={showNames}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${showNames ? 'border-[rgba(233,203,124,0.5)] text-[var(--gilded)]' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
          >
            <Sparkle className="h-3 w-3" /> labels
          </button>
          <button
            onClick={() => setShowConLabels((v) => !v)}
            aria-pressed={showConLabels}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${showConLabels ? 'border-[rgba(167,139,250,0.6)] text-[var(--astral)]' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
          >
            <Tags className="h-3 w-3" /> realms
          </button>
          <button
            onClick={() => setShowEcliptic((v) => !v)}
            aria-pressed={showEcliptic}
            className={`flex items-center gap-1.5 border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${showEcliptic ? 'border-[rgba(233,203,124,0.5)] text-[var(--gilded)]' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
            title="Ecliptic (gold) & celestial equator (violet)"
          >
            <Orbit className="h-3 w-3" /> ecliptic
          </button>
          <span
            className="rounded-full border px-3 py-1 text-[11px] tabular tracking-wider"
            style={{
              borderColor: 'rgba(167,139,250,0.35)',
              color: twilight > 0.6 ? 'var(--moonlight)' : 'var(--ember)',
            }}
          >
            {sunAlt > 0 ? '☀ daylight' : sunAlt > -6 ? 'civil twilight' : sunAlt > -12 ? 'nautical twilight' : sunAlt > -18 ? 'astronomical twilight' : '✧ full darkness'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[560px]">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className={`w-full select-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            role="application"
            tabIndex={0}
            aria-label="Sky dome — stereographic view of the whole sky. Plus and minus zoom, arrow keys pan, 0 resets."
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <defs>
              <radialGradient id="domeFill" cx="50%" cy="42%" r="72%">
                <stop offset="0%" stopColor="#131033" />
                <stop offset="70%" stopColor="#0a0720" />
                <stop offset="100%" stopColor="#060412" />
              </radialGradient>
              <radialGradient id="groundRing" cx="50%" cy="50%" r="50%">
                <stop offset="78%" stopColor="rgba(233,203,124,0)" />
                <stop offset="100%" stopColor="rgba(233,203,124,0.16)" />
              </radialGradient>
            </defs>

            <circle cx={CX} cy={CY} r={R} fill="url(#domeFill)" stroke="rgba(233,203,124,0.4)" strokeWidth="1.2" />
            <circle cx={CX} cy={CY} r={R} fill="url(#groundRing)" />
            <circle cx={CX} cy={CY} r={R * 0.62} fill="none" stroke="rgba(167,139,250,0.10)" strokeWidth="0.7" strokeDasharray="2 5" />
            <circle cx={CX} cy={CY} r={R * 0.31} fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth="0.7" strokeDasharray="2 5" />
            {/* zenith marker */}
            <circle cx={CX} cy={CY} r="2" fill="rgba(233,203,124,0.6)" />

            {/* alt/az graticule */}
            {[30, 60].map((alt) => (
              <circle key={alt} cx={CX} cy={CY} r={R * Math.tan(((90 - alt) * Math.PI) / 360)} fill="none" stroke="rgba(167,139,250,0.10)" strokeWidth="0.7" strokeDasharray="3 6" />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((az) => {
              const { x, y } = project(0.5, az, R)
              return <line key={az} x1={CX} y1={CY} x2={CX + x} y2={CY + y} stroke="rgba(167,139,250,0.08)" strokeWidth="0.6" />
            })}

            {/* cardinal points */}
            {[
              { az: 0, label: 'N' }, { az: 90, label: 'E' }, { az: 180, label: 'S' }, { az: 270, label: 'W' },
            ].map(({ az, label }) => {
              const px = CX - (R + 16) * Math.sin((az * Math.PI) / 180)
              const py = CY - (R + 16) * Math.cos((az * Math.PI) / 180)
              return (
                <text key={label} x={px} y={py + 4} textAnchor="middle" fontSize="14" fill="rgba(233,203,124,0.85)" className="font-display">
                  {label}
                </text>
              )
            })}

            {/* ecliptic (the Sun's road, gold) & celestial equator (violet) */}
            {showEcliptic && (
              <g>
                <path d={equatorPath} fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="0.8" strokeDasharray="1.5 4" />
                <path d={eclipticPath} fill="none" stroke="rgba(233,203,124,0.45)" strokeWidth="0.9" strokeDasharray="5 3" />
                {eclipticMarks.map((m) => (
                  <text key={m.lon} x={CX + m.x} y={CY + m.y - 4} textAnchor="middle" fontSize="8.5" fill="rgba(233,203,124,0.6)">
                    {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'][m.lon / 30]}{'\uFE0E'}
                  </text>
                ))}
              </g>
            )}

            {/* constellation figures — drawn at twilight strength */}
            <g opacity={twilight}>
              {/* figure paths are built centre-relative (like the star offsets) — shift them onto the dome */}
              <g transform={`translate(${CX} ${CY})`}>
                {lines.map((l) => (
                  <path key={l.key} d={l.pts} fill="none" stroke="rgba(167,139,250,0.34)" strokeWidth="0.8" strokeLinecap="round" />
                ))}
              </g>

              {/* constellation realm labels */}
              {showConLabels && conLabels.map((c) => (
                <text key={c.name} x={CX + c.x} y={CY + c.y} textAnchor="middle" fontSize="7" fill="rgba(167,139,250,0.55)" className="font-display" letterSpacing="1.5">
                  {c.name.toUpperCase()}
                </text>
              ))}

              {/* stars */}
              {visibleStars.map((s) => {
                const size = Math.max(0.5, (3.8 - s.mag) * 0.62)
                const color = SPECTRAL_COLOR[s.cls] ?? '#f5f3ff'
                const major = s.mag < 1.6
                const highlighted = pickedInfo?.name === s.name || searchMatch(s.name)
                return (
                  <g key={s.name}>
                    {highlighted && (
                      <circle cx={CX + s.x} cy={CY + s.y} r={size + 5} fill="none" stroke="var(--gilded)" strokeWidth="1" opacity="0.9">
                        <animate attributeName="r" values={`${size + 3};${size + 7};${size + 3}`} dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={CX + s.x}
                      cy={CY + s.y}
                      r={size}
                      fill={color}
                      opacity={Math.min(1, 0.35 + (2.2 - Math.min(s.mag, 2.2)) * 0.32)}
                      style={major ? { filter: `drop-shadow(0 0 ${size * 2.2}px ${color}aa)` } : undefined}
                      onClick={() => setPickedStar(s === pickedStar ? null : s)}
                    >
                      <title>{`${s.name} — mag ${s.mag} · ${s.con} · ${s.dist} ly`}</title>
                    </circle>
                    {major && showNames && (
                      <text x={CX + s.x + size + 3} y={CY + s.y + 2.5} fontSize="8.5" fill="rgba(236,232,244,0.75)" className="font-serif-alt">
                        {s.name}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>

            {/* planets on the dome — always full brightness */}
            {visibleBodies.map((b) => {
              const { x, y } = project(b.alt, b.az, R)
              const meta = PLANET_BY_ID[b.id]
              const color = meta?.color ?? '#e9cb7c'
              const px = CX + x
              const py = CY + y
              if (b.id === 'moon') {
                return (
                  <g key={b.id}>
                    <circle cx={px} cy={py} r="11" fill="#cfd8e3" opacity="0.12" />
                    <circle cx={px} cy={py} r="6.5" fill="#1b1830" stroke="rgba(207,216,227,0.35)" strokeWidth="0.5" />
                    <path d={moonPhasePath(px, py, 6.5, location.data?.moonPhaseAngle ?? 180)} fill="#e8edf5" style={{ filter: 'drop-shadow(0 0 5px rgba(232,237,245,0.8))' }}>
                      <title>{`Moon — alt ${b.alt}° · az ${b.az}°`}</title>
                    </path>
                    {showNames && <text x={px + 10} y={py + 4} fontSize="8" fill="rgba(236,232,244,0.75)">Moon</text>}
                  </g>
                )
              }
              return (
                <g key={b.id}>
                  <circle cx={px} cy={py} r="7.5" fill={color} opacity="0.22" />
                  <circle cx={px} cy={py} r="3.6" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                    <title>{`${b.name} — alt ${b.alt}° · az ${b.az}°${b.retrograde ? ' · retrograde' : ''}`}</title>
                  </circle>
                  <text x={px + 9} y={py + 4} fontSize="10.5" fill={color} className="font-display">
                    {b.glyph}
                  </text>
                  {showNames && (
                    <text x={px + 9} y={py + 15} fontSize="7.5" fill="rgba(236,232,244,0.65)">
                      {b.name}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* zoom controls */}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg bg-background/70" onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))} title="Zoom in (or scroll up)" aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg bg-background/70" onClick={() => setZoomIdx((z) => Math.max(0, z - 1))} title="Zoom out (or scroll down)" aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg bg-background/70" onClick={resetView} title="Reset view" aria-label="Reset view">
              <Maximize2 className="h-4 w-4" />
            </Button>
            {zoom > 1 && <span className="tabular text-center text-[9px] text-muted-foreground">{zoom}×</span>}
          </div>
        </div>

        {/* picked star dossier */}
        {pickedInfo && (
          <div className="mt-3 w-full max-w-[560px] rounded-lg border border-[rgba(233,203,124,0.3)] bg-secondary/30 px-4 py-2.5 text-xs flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="font-display text-sm" style={{ color: 'var(--gilded)' }}>✦ {pickedInfo.name}</span>
            <span className="text-muted-foreground">{STAR_BY_NAME.get(pickedInfo.name)?.con ?? pickedInfo.con}</span>
            <span className="tabular">mag {pickedInfo.mag}</span>
            <span className="tabular">{pickedInfo.dist} ly</span>
            <span className="tabular">alt {pickedInfo.alt}° · az {pickedInfo.az}°</span>
            <span style={{ color: SPECTRAL_COLOR[pickedInfo.cls] ?? '#f5f3ff' }}>class {pickedInfo.cls}</span>
            <button onClick={() => setPickedStar(null)} className="ml-auto text-muted-foreground hover:text-foreground">dismiss</button>
          </div>
        )}

        {/* under-horizon strip */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {belowBodies.map((b) => {
            const meta = PLANET_BY_ID[b.id]
            return (
              <span key={b.id} className="flex items-center gap-1">
                <span style={{ color: meta?.color }}>{b.glyph}</span>
                {b.name} <span className="tabular">↓{Math.abs(b.alt).toFixed(0)}°</span>
              </span>
            )
          })}
        </div>
        <div className="mt-1.5 text-[10px] text-muted-foreground/70 tracking-wide">
          Stereographic zenith view · east on the left as seen looking up · {visibleStars.length} HYG stars above horizon · precessed J2000 → date{at ? ` · ${new Date(at).toUTCString().slice(5, 22)} UT` : ''} · scroll or +/− to zoom, drag or arrows to pan
        </div>
      </div>
    </div>
  )
}
