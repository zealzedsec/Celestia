'use client'

/**
 * Chronomancer — the Celestia time machine.
 * Reconstructs the entire sky for any instant 1800–2200: positions, moon, aspects,
 * rise/set and the events window around the chosen moment. Scrub with the slider,
 * type an exact datetime, or let the lapse animation run.
 */
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SkySnapshot } from '@/lib/celestial/types'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import { fmtTime, fmtDateTime, useCelestiaStore } from '@/lib/celestial/use-sky'
import { MoonVisual } from './moon-visual'
import { SkyMap } from './sky-map'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Play, Pause, Rewind, FastForward, Hourglass, Sparkles } from 'lucide-react'

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STEP_MS: Record<string, number> = {
  hour: 3600e3, day: 86400e3, week: 7 * 86400e3, month: 30.44 * 86400e3, year: 365.25 * 86400e3,
}

export function ChronoMachine() {
  const location = useCelestiaStore((s) => s.location)
  const [localDt, setLocalDt] = useState<string>(() => toLocalInput(new Date()))
  const [snapshot, setSnapshot] = useState<SkySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [showDome, setShowDome] = useState(true)

  // debounce-fetch the sky for the chosen instant (aborts superseded requests)
  useEffect(() => {
    // a datetime-local string without a zone parses as browser-local wall time, i.e. it already IS
    // the right instant. (The previous version subtracted the UTC offset a second time, shifting
    // every reconstructed sky by the viewer's offset — and by the wrong amount across DST.)
    const utc = new Date(localDt)
    if (!isFinite(utc.getTime())) return
    const controller = new AbortController()
    let alive = true
    const id = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/sky?lat=${location.lat}&lon=${location.lon}&name=${encodeURIComponent(location.name)}&t=${utc.toISOString()}`, { cache: 'no-store', signal: controller.signal })
        const j = await r.json()
        if (j.error) throw new Error(j.error)
        if (!alive) return
        setSnapshot(j)
        setErr(null)
      } catch (e) {
        if (!alive || (e instanceof DOMException && e.name === 'AbortError')) return
        setErr(e instanceof Error ? e.message : 'The chronoscope failed')
      } finally {
        if (alive) setLoading(false)
      }
    }, 260)
    return () => { alive = false; clearTimeout(id); controller.abort() }
  }, [localDt, location])

  // time-lapse animation
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setLocalDt((v) => {
        const next = new Date(new Date(v).getTime() + STEP_MS[speed])
        if (next.getFullYear() < 1800 || next.getFullYear() > 2200) { setPlaying(false); return v }
        return toLocalInput(next)
      })
    }, 900)
    return () => clearInterval(id)
  }, [playing, speed])

  const nudge = useCallback((dir: 1 | -1, mult = 1) => {
    setLocalDt((v) => toLocalInput(new Date(new Date(v).getTime() + dir * STEP_MS[speed] * mult)))
  }, [speed])

  const jump = useCallback((y: number) => {
    setLocalDt((v) => {
      const d = new Date(v)
      d.setFullYear(d.getFullYear() + y)
      return toLocalInput(d)
    })
  }, [])

  const now = new Date()
  const year = new Date(localDt).getFullYear()
  const isPast = new Date(localDt).getTime() < now.getTime()
  const offMinutes = Math.round((now.getTime() - new Date(localDt).getTime()) / 60000)
  const offLabel =
    Math.abs(offMinutes) < 1 ? 'the present moment' :
    Math.abs(offMinutes) < 2880 ? `${offMinutes > 0 ? '−' : '+'}${(Math.abs(offMinutes) / 60).toFixed(1)} h from now` :
    `${offMinutes > 0 ? '−' : '+'}${(Math.abs(offMinutes) / 1440).toFixed(1)} days from now`

  return (
    <div className="space-y-4">
      {/* Control deck */}
      <div className="celestial-card celestial-card-gold corners p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56">
            <Lbl>Chosen instant (your local time)</Lbl>
            <input
              type="datetime-local"
              value={localDt}
              min="1800-01-01T00:00" max="2200-12-31T23:59"
              onChange={(e) => { setPlaying(false); setLocalDt(e.target.value) }}
              className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm tabular"
            />
          </div>
          <div>
            <Lbl>Step size</Lbl>
            <div className="flex gap-1">
              {(['hour', 'day', 'week', 'month'] as const).map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${speed === s ? 'border-[rgba(233,203,124,0.55)] text-[var(--gilded)] bg-[rgba(233,203,124,0.08)]' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => nudge(-1)} title={`back one ${speed}`}><Rewind className="h-4 w-4" /></Button>
            <Button size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => setPlaying((v) => !v)} title={playing ? 'pause the lapse' : 'run the lapse'} aria-label={playing ? 'pause' : 'play'}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => nudge(1)} title={`forward one ${speed}`}><FastForward className="h-4 w-4" /></Button>
          </div>
          <div>
            <Lbl>Great leaps</Lbl>
            <div className="flex gap-1">
              <button onClick={() => jump(-10)} className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">−10y</button>
              <button onClick={() => jump(-1)} className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">−1y</button>
              <button onClick={() => { setPlaying(false); setLocalDt(toLocalInput(new Date())) }} className="rounded-full border border-[rgba(233,203,124,0.55)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--gilded)] hover:bg-[rgba(233,203,124,0.08)]">now</button>
              <button onClick={() => jump(1)} className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">+1y</button>
              <button onClick={() => jump(10)} className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">+10y</button>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">offset from now</div>
            <div className="tabular text-sm" style={{ color: isPast ? 'var(--astral)' : 'var(--verdant)' }}>{offLabel}</div>
            <div className="tabular text-[10px] text-muted-foreground">UTC {snapshot ? new Date(snapshot.timestamp).toISOString().slice(11, 16) : '—'}</div>
          </div>
        </div>
        {/* epoch ribbon — maps 1900…2100 onto the track */}
        <input
          type="range"
          min={0} max={4000}
          value={Math.max(0, Math.min(4000, (year - 2000) * 20 + 2000))}
          onChange={(e) => {
            const centerYear = 2000 + (Number(e.target.value) - 2000) * 0.05
            setPlaying(false)
            setLocalDt((cur) => {
              const d = new Date(cur)
              d.setFullYear(Math.round(centerYear))
              return toLocalInput(d)
            })
          }}
          className="w-full mt-3 accent-[var(--gilded)]"
          aria-label="Fine year scrub"
        />
        <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground/70 -mt-1">
          <span>1900</span><span>1950</span><span>2000</span><span>2050</span><span>2100</span>
        </div>
      </div>

      {err && <div className="celestial-card p-5 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> {err}</div>}
      {!snapshot && !err && <Skeleton className="h-72 celestial-card" />}

      {snapshot && (
        <div className={`grid gap-4 lg:grid-cols-3 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {/* Moon at chosen instant */}
          <motion.div key={snapshot.timestamp} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="celestial-card celestial-card-gold p-6 flex flex-col items-center text-center">
            <div className="eyebrow mb-2">The Moon, Reconstructed</div>
            <MoonVisual phaseAngle={snapshot.moon.phaseAngle} size={150} />
            <div className="font-display text-xl mt-2 glow-gold" style={{ color: 'var(--gilded)' }}>{snapshot.moon.phaseName}</div>
            <div className="tabular text-xs text-muted-foreground">{(snapshot.moon.illumination * 100).toFixed(1)}% lit · day {snapshot.moon.moonDayNumber}</div>
            <div className="mt-1 text-sm"><span className="text-[var(--astral)]">{snapshot.moon.formattedDegree}</span></div>
            <div className="tabular text-[11px] text-muted-foreground mt-2">
              {(snapshot.moon.distanceKm / 1000).toFixed(0)}k km away · {snapshot.moon.isWaxing ? 'waxing ☽' : 'waning ☾'}
            </div>
          </motion.div>

          {/* Positions at chosen instant */}
          <motion.div key={`pos-${snapshot.timestamp}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="celestial-card p-4">
            <div className="eyebrow px-2 pb-3">Positions of the Wanderers</div>
            <div className="space-y-1 max-h-72 overflow-y-auto scroll-ethereal pr-1">
              {snapshot.allBodies.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span style={{ color: PLANET_BY_ID[p.id].color, textShadow: `0 0 10px ${PLANET_BY_ID[p.id].color}55` }}>{p.glyph}</span>
                    {p.name}
                  </span>
                  <span className="tabular text-xs">
                    <span className="text-[var(--gilded)]">{p.formattedDegree.split(' ')[0]}</span> {p.sign}
                    {p.retrograde && <span className="text-destructive ml-1 text-[10px]">℞</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="hairline my-3" />
            <div className="text-[11px] text-muted-foreground px-2 leading-relaxed">
              ☉ Sun {snapshot.sun.isAboveHorizon ? 'above' : 'below'} the horizon at {location.name} · alt {snapshot.sun.altitude.toFixed(0)}° ·
              sunrise {fmtTime(snapshot.sunTimes.sunrise)} · sunset {fmtTime(snapshot.sunTimes.sunset)}
            </div>
          </motion.div>

          {/* Aspects + events then */}
          <motion.div key={`asp-${snapshot.timestamp}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-4">
            <div className="celestial-card p-4">
              <div className="flex items-center gap-2 px-2 pb-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
                <span className="eyebrow">Aspects of that Hour</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-ethereal pr-1">
                {snapshot.aspects.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span style={{ color: PLANET_BY_ID[a.a]?.color }}>{PLANET_BY_ID[a.a]?.glyph}</span>{a.aName}
                      <span style={{ color: a.nature === 'harmonious' ? '#8fd4a8' : a.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }}>{a.glyph}</span>
                      {a.bName}<span style={{ color: PLANET_BY_ID[a.b]?.color }}>{PLANET_BY_ID[a.b]?.glyph}</span>
                    </span>
                    <span className="tabular text-muted-foreground">{a.type} {a.orb.toFixed(1)}°</span>
                  </div>
                ))}
                {snapshot.aspects.length === 0 && <div className="text-xs text-muted-foreground px-2 py-3 text-center">No tight major aspects at this instant.</div>}
              </div>
            </div>
            <div className="celestial-card p-4">
              <div className="flex items-center gap-2 px-2 pb-2">
                <Hourglass className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
                <span className="eyebrow">Soon After That Moment</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-ethereal pr-1">
                {snapshot.events.slice(0, 6).map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5"><span className="text-[var(--astral)]">{e.glyph}</span>{e.title}</span>
                    <span className="tabular text-muted-foreground">{fmtDateTime(e.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {snapshot && (
        <div className="celestial-card corners p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="eyebrow">The dome at that instant</div>
            <button onClick={() => setShowDome((v) => !v)} aria-expanded={showDome} className="chip text-[var(--astral)]">
              {showDome ? 'hide dome' : 'show dome'}
            </button>
          </div>
          {showDome && <SkyMap at={snapshot.timestamp} compact />}
        </div>
      )}

      {/* Historical note strip */}
      <div className="celestial-card p-4 text-[13px] text-muted-foreground leading-relaxed flex items-start gap-3">
        <Hourglass className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gilded)' }} />
        <div>
          <span className="text-foreground/90 font-medium">Electional hint — </span>
          scrub until the Moon applies to a harmonious aspect with the Sun or Jupiter and both sit above the horizon:
          the classical recipe for an auspicious hour. Retrograde stations found in “Soon After That Moment” mark
          the turning tides of the fast planets. Computed from the same arcsecond-grade ephemeris as the living sky —
          the machine of time runs the very same engine {year >= 1800 && year <= 2200 ? `for ${year}` : ''}.
        </div>
      </div>
    </div>
  )
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{children}</div>
}
