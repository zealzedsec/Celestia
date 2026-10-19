'use client'

import { useSky, fmtTime, fmtTimeRel, fmtDateTime, fmtCountdown, useCelestiaStore, useNow, dayFraction, useDisplayZone } from '@/lib/celestial/use-sky'
import type { SunTimes } from '@/lib/celestial/types'
import { MoonVisual } from './moon-visual'
import { Skeleton } from '@/components/ui/skeleton'
import { PLANET_BY_ID, ZODIAC, ELEMENTS } from '@/lib/celestial/data'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Sparkles, CalendarClock, AlertTriangle } from 'lucide-react'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function Dashboard({ onOpenModule }: { onOpenModule: (m: string) => void }) {
  const { data: sky, loading, error } = useSky(60000)
  const location = useCelestiaStore((s) => s.location)

  if (loading && !sky) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72 celestial-card" />
        <Skeleton className="h-72 celestial-card" />
        <Skeleton className="h-56 celestial-card md:col-span-2" />
      </div>
    )
  }
  if (error || !sky) {
    return (
      <div className="celestial-card p-6 flex items-center gap-3 text-destructive">
        <AlertTriangle className="h-5 w-5" /> The ether is disturbed — could not reach the sky engine ({error}).
      </div>
    )
  }

  const moon = sky.moon
  const sun = sky.sun
  const illumPct = (moon.illumination * 100).toFixed(1)
  const zodiacSun = ZODIAC[sky.sun.signIndex]
  const zodiacMoon = ZODIAC[moon.signIndex]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Quick-conjure strip */}
      <motion.div variants={rise} className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mr-1">instruments</span>
        <button onClick={() => onOpenModule('union')} className="chip text-[var(--rose-cosmic)]">♀ weave a synastry</button>
        <button onClick={() => onOpenModule('chrono')} className="chip text-[var(--astral)]">⧖ travel through time</button>
        <button onClick={() => onOpenModule('planets')} className="chip text-[var(--gilded)]">♄ open the sky dome</button>
        <button onClick={() => onOpenModule('oracle')} className="chip text-[var(--verdant)]">✶ hear the oracle</button>
        <button onClick={() => onOpenModule('almanac')} className="chip text-[var(--gilded)]">☷ read the almanac</button>
        <button onClick={() => onOpenModule('journal')} className="chip text-[var(--rose-cosmic)]">❦ record a pondering</button>
      </motion.div>

      {/* Hero row: moon + sun + sky state */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Moon hero */}
        <motion.button
          variants={rise}
          whileHover={{ y: -4 }}
          onClick={() => onOpenModule('moon')}
          className="celestial-card celestial-card-gold corners p-6 flex flex-col items-center text-center transition-colors group"
        >
          <div className="eyebrow">The Moon Tonight</div>
          <div className="float-soft my-2">
            <MoonVisual phaseAngle={moon.phaseAngle} size={170} />
          </div>
          <div className="font-display text-2xl mt-1" style={{ color: 'var(--gilded)' }}>{moon.phaseName}</div>
          <div className="tabular text-sm text-muted-foreground">{illumPct}% illuminated · day {moon.moonDayNumber} of the lunar month</div>
          <div className="mt-2 text-sm">
            <span className="text-[var(--astral)]">{moon.formattedDegree}</span>
            <span className="text-muted-foreground"> · {zodiacMoon.keyword}</span>
          </div>
          {moon.voidOfCourse && (
            <div className="mt-2 text-[11px] uppercase tracking-widest px-2 py-1 rounded border border-[rgba(167,139,250,0.35)] text-[var(--astral)]">
              ☾ Void of course until {fmtTime(moon.voidUntil)}
            </div>
          )}
          <div className="mt-3 text-[11px] text-muted-foreground group-hover:text-[var(--gilded)] transition-colors">open moon observatory →</div>
        </motion.button>

        {/* Sun card */}
        <motion.div variants={rise} className="celestial-card p-6 flex flex-col">
          <div className="eyebrow mb-4">Solar & Lunar Diary</div>
          <div className="space-y-2.5 text-sm flex-1">
            <Row label="☀ Sunrise" value={fmtTimeRel(sky.sunTimes.sunrise)} sub={sky.sunTimes.civilDawn ? `dawn ${fmtTime(sky.sunTimes.civilDawn)}` : undefined} />
            <Row label="☼ Sunset" value={fmtTimeRel(sky.sunTimes.sunset)} sub={sky.sunTimes.civilDusk ? `dusk ${fmtTime(sky.sunTimes.civilDusk)}` : undefined} />
            <Row label="✧ Day length" value={sky.sunTimes.dayLengthMinutes ? `${Math.floor(sky.sunTimes.dayLengthMinutes / 60)}h ${sky.sunTimes.dayLengthMinutes % 60}m` : '—'} />
            <Row label="☾ Moonrise" value={fmtTimeRel(sky.moonTimes.rise)} />
            <Row label="☽ Moonset" value={fmtTimeRel(sky.moonTimes.set)} />
            <Row label="☉ Sun transit" value={fmtTimeRel(sky.sunTimes.transit)} />
          </div>
          <TwilightBand t={sky.sunTimes} />
          <div className="hairline my-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sun in <span className="text-[var(--gilded)]">{sun.sign} {sun.formattedDegree.split(' ')[0]}</span></span>
            <span>Alt <span className="tabular">{sun.altitude.toFixed(0)}°</span> {sun.isAboveHorizon ? '· above horizon' : '· below horizon'}</span>
          </div>
        </motion.div>

        {/* Current sky headline card */}
        <motion.div variants={rise} className="celestial-card p-6 flex flex-col">
          <div className="eyebrow mb-4">Sky over {location.name}</div>
          <div className="font-serif-alt text-2xl leading-snug" style={{ color: 'var(--moonlight)' }}>
            {moon.isWaxing ? 'The light gathers.' : 'The light releases.'}
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            The Sun stands in {zodiacSun.name} ({zodiacSun.element}, {zodiacSun.modality}) while the Moon pours through
            <span className="text-[var(--astral)]"> {moon.sign}</span>. The elemental weather is
            <span className="text-[var(--gilded)]"> {moon.position.element}</span> — {ELEMENTS.find((e) => e.name === moon.position.element)?.temper.toLowerCase()}.
          </p>
          <div className="hairline my-3" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Retrograde planets" value={String(sky.planets.filter((p) => p.retrograde).length)} accent />
            <Stat label="Live aspects" value={String(sky.aspects.length)} />
            <Stat label="Moon distance" value={`${(moon.distanceKm / 1000).toFixed(0)}k km`} />
            <Stat label="Julian day" value={sky.jd.toFixed(3)} />
          </div>
        </motion.div>
      </div>

      {/* Planet strip */}
      <motion.div variants={rise} className="celestial-card p-4">
        <div className="flex items-center justify-between px-2 pb-3">
          <div className="eyebrow">Living Positions — click any planet</div>
          <button onClick={() => onOpenModule('planets')} className="text-[11px] uppercase tracking-widest hover:text-[var(--gilded)] transition-colors">full tracker & sky dome →</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {sky.allBodies.map((p, i) => {
            const meta = PLANET_BY_ID[p.id]
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
                whileHover={{ y: -2 }}
                onClick={() => onOpenModule('planets')}
                className="text-left rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 hover:bg-primary/10 transition-colors shimmer-sweep"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg" style={{ color: meta.color, textShadow: `0 0 12px ${meta.color}55` }}>{p.glyph}</span>
                  {p.retrograde ? (
                    <span className="text-[10px] uppercase tracking-wider text-destructive flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> ℞ retro</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> direct</span>
                  )}
                </div>
                <div className="text-sm mt-1">{p.name} <span className="text-muted-foreground">in</span> <span className="text-[var(--gilded)]">{p.sign}</span></div>
                <div className="tabular text-[11px] text-muted-foreground">{p.formattedDegree.split(' ')[0]} · alt {p.altitude.toFixed(0)}°</div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Aspects + Events row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={rise} className="celestial-card p-4">
          <div className="flex items-center gap-2 px-2 pb-2">
            <Sparkles className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
            <span className="eyebrow">Live Aspects</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-ethereal pr-1">
            {sky.aspects.slice(0, 9).map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-sm hover:bg-primary/10 transition-colors">
                <span className="flex items-center gap-2">
                  <span style={{ color: PLANET_BY_ID[a.a]?.color }}>{PLANET_BY_ID[a.a]?.glyph}</span>
                  {a.aName}
                  <span className="text-lg" style={{ color: a.nature === 'harmonious' ? '#8fd4a8' : a.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }}>{a.glyph}</span>
                  {a.bName}
                  <span style={{ color: PLANET_BY_ID[a.b]?.glyph ? PLANET_BY_ID[a.b]?.color : undefined }}>{PLANET_BY_ID[a.b]?.glyph}</span>
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {a.type} · {a.orb.toFixed(1)}° {a.applying ? 'applying' : 'separating'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} className="celestial-card p-4">
          <div className="flex items-center gap-2 px-2 pb-2">
            <CalendarClock className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
            <span className="eyebrow">Oncoming Celestial Events — 45 days</span>
            <button onClick={() => onOpenModule('almanac')} className="ml-auto text-[11px] uppercase tracking-widest hover:text-[var(--gilded)] transition-colors">full almanac →</button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-ethereal pr-1">
            {sky.events.slice(0, 9).map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-sm hover:bg-primary/10 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-base text-[var(--astral)]">{e.glyph}</span>
                  {e.title}
                </span>
                <span className="text-xs text-muted-foreground tabular text-right">{fmtDateTime(e.time)}<span className="block text-[10px] text-[var(--gilded)]/80">{fmtCountdown(e.time)}</span></span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">
        {value}
        {sub && <span className="text-[11px] text-muted-foreground ml-2">{sub}</span>}
      </span>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border/50 px-2.5 py-1.5 bg-secondary/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="tabular text-sm" style={accent ? { color: 'var(--gilded)' } : undefined}>{value}</div>
    </div>
  )
}

/** The day's light at a glance: night → astronomical → nautical → civil → golden → day, and back */
function TwilightBand({ t }: { t: SunTimes }) {
  const now = useNow(60_000)
  const zone = useDisplayZone()
  const frac = (iso: string | null) => (iso ? dayFraction(iso) : null)
  const stops: [number | null, string][] = [
    [frac(t.astroDawn), '#0b1030'], [frac(t.nauticalDawn), '#1d2557'], [frac(t.civilDawn), '#4a3b78'],
    [frac(t.sunrise), '#c9774f'], [frac(t.goldenHourEnd), '#e9cb7c'],
    [frac(t.goldenHourStart), '#e9cb7c'], [frac(t.sunset), '#c9774f'],
    [frac(t.civilDusk), '#4a3b78'], [frac(t.nauticalDusk), '#1d2557'], [frac(t.astroDusk), '#0b1030'],
  ]
  const valid = stops.filter((s): s is [number, string] => s[0] !== null).sort((a, b) => a[0] - b[0])
  if (valid.length < 2) return null
  const gradient = `linear-gradient(90deg, #04040c 0%, ${valid.map(([f, c]) => `${c} ${(f * 100).toFixed(1)}%`).join(', ')}, #04040c 100%)`
  const nowFrac = dayFraction(new Date(now))
  return (
    <div className="mt-3">
      <div className="twilight-band" style={{ background: gradient }} role="img" aria-label="Today's light: twilight, sunrise, day and dusk">
        <span className="twilight-now" style={{ left: `calc(${(nowFrac * 100).toFixed(2)}% - 1px)` }} />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground tabular mt-1">
        <span>00:00</span><span>06:00</span><span>12:00 · {zone.label}</span><span>18:00</span><span>24:00</span>
      </div>
    </div>
  )
}
