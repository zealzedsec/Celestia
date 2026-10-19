'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSky, fmtTime, fmtDateTime, usePolling, useBrowserTimeZone } from '@/lib/celestial/use-sky'
import { TimeZoneCombobox } from './forms/timezone-combobox'
import { MoonVisual } from './moon-visual'
import { ZODIAC, PHASE_NAMES, PHASE_GLYPHS } from '@/lib/celestial/data'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

interface MoonDay {
  day: number
  phaseAngle: number
  phaseIndex: number
  phaseName: string
  glyph: string
  illumination: number
  sign: string
  signGlyph: string
  degree: string
  distanceKm: number
  isToday: boolean
  quarter: { name: string; time: string } | null
}

export function MoonTracker() {
  const { data: sky, error } = useSky(60000)
  const [ym, setYm] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1 } })
  const browserTz = useBrowserTimeZone()
  const [zoneChoice, setZoneChoice] = useState<string | null>(null)
  const calZone = zoneChoice ?? browserTz
  const [selectedDay, setSelectedDay] = useState<MoonDay | null>(null)
  const calendar = usePolling<{ year: number; month: number; days: MoonDay[] }>(
    `/api/moon-calendar?year=${ym.year}&month=${ym.month}&zone=${encodeURIComponent(calZone)}`, 3_600_000)
  const cal = calendar.data && calendar.data.year === ym.year && calendar.data.month === ym.month ? calendar.data : null
  const calErr = cal ? null : calendar.error

  if (!sky && !error) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 celestial-card lg:col-span-2" />
        <Skeleton className="h-96 celestial-card" />
      </div>
    )
  }
  if (!sky) {
    return <div className="celestial-card p-6 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> Moon data unavailable ({error}).</div>
  }
  const moon = sky.moon
  const zodiacMoon = ZODIAC[moon.signIndex]

  const monthName = new Date(Date.UTC(ym.year, ym.month - 1, 1)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const shiftMonth = (d: number) => {
    const m = ym.month - 1 + d
    setYm({ year: ym.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 })
    setSelectedDay(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live moon */}
        <div className="celestial-card celestial-card-gold conic-live p-6 flex flex-col items-center text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Live Phase — updates every minute</div>
          <MoonVisual phaseAngle={moon.phaseAngle} size={200} />
          <div className="font-display text-2xl mt-3 glow-gold" style={{ color: 'var(--gilded)' }}>{moon.phaseName}</div>
          <div className="tabular text-sm text-muted-foreground">{(moon.illumination * 100).toFixed(1)}% illuminated</div>
        </div>

        {/* Moon vitals */}
        <div className="celestial-card p-6">
          <div className="eyebrow mb-4">Lunar Vitals</div>
          <div className="space-y-2.5 text-sm">
            <Vital k="Phase angle" v={`${moon.phaseAngle.toFixed(1)}°`} />
            <Vital k="Lunar day" v={`${moon.moonDayNumber} / 30`} />
            <Vital k="Age since new" v={`${moon.ageDays.toFixed(2)} days`} />
            <Vital k="Zodiac position" v={moon.formattedDegree} gold />
            <Vital k="Motion" v={`${moon.position.speed.toFixed(2)}°/day ${moon.position.retrograde ? '℞' : ''}`} />
            <Vital k="Distance" v={`${moon.distanceKm.toLocaleString()} km`} />
            <Vital k="Angular size" v={`${moon.angularDiameterDeg.toFixed(3)}°`} />
            <Vital k="Constellation (IAU)" v={moon.constellation} />
            <Vital k="Ecliptic lat" v={`${moon.latitude.toFixed(2)}°`} />
            <Vital k="Moonrise / Moonset" v={`${fmtTime(moon.riseTime)} — ${fmtTime(moon.setTime)}`} />
          </div>
          <div className="hairline my-3" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            The Moon walks {zodiacMoon.element.toLowerCase()} through {zodiacMoon.name} — {zodiacMoon.traits}
          </div>
        </div>

        {/* Cycle card */}
        <div className="space-y-4">
          <div className="celestial-card p-6">
            <div className="eyebrow mb-3">Next Turning</div>
            <div className="flex items-center gap-3">
              <MoonVisual phaseAngle={PHASE_NAMES.indexOf(moon.nextPhaseName) * 45} size={56} glow={false} />
              <div>
                <div className="font-display text-lg" style={{ color: 'var(--gilded)' }}>{moon.nextPhaseName}</div>
                <div className="tabular text-xs text-muted-foreground">{fmtDateTime(moon.nextPhaseTime)}</div>
              </div>
            </div>
            <div className="hairline my-3" />
            <div className="space-y-1.5">
              {moon.quarterCycle.slice(0, 4).map((q, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{PHASE_GLYPHS[PHASE_NAMES.indexOf(q.name)]} {q.name}</span>
                  <span className="tabular text-muted-foreground">{fmtDateTime(q.time)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="celestial-card p-6">
            <div className="eyebrow mb-3">Lunar Distance Cycle</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>☾ Perigee <span className="text-[10px] text-muted-foreground">(closest)</span></span>
                <span className="tabular text-xs">{fmtDateTime(moon.perigee?.time)} · {moon.perigee?.distanceKm.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span>☽ Apogee <span className="text-[10px] text-muted-foreground">(farthest)</span></span>
                <span className="tabular text-xs">{fmtDateTime(moon.apogee?.time)} · {moon.apogee?.distanceKm.toLocaleString()} km</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  <span>356 000 km</span><span>now {(moon.distanceKm / 1000).toFixed(0)}k</span><span>406 700 km</span>
                </div>
                <div className="relative h-1.5 bg-white/[0.05]" role="meter" aria-label="Moon distance between perigee and apogee extremes" aria-valuemin={356000} aria-valuemax={406700} aria-valuenow={moon.distanceKm}>
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-1.5 bg-[var(--moonlight)] shadow-[0_0_10px_var(--moonlight)]"
                    style={{ left: `calc(${Math.min(100, Math.max(0, ((moon.distanceKm - 356000) / 50700) * 100))}% - 3px)` }} />
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground pt-1">Full moons near perigee are the fabled supermoons — the Moon swells to its largest apparent size ({moon.angularDiameterDeg.toFixed(3)}° today).</div>
            </div>
          </div>
          <div className="celestial-card p-6">
            <div className="eyebrow mb-3">Void-of-course watch</div>
            {moon.voidOfCourse ? (
              <div className="text-sm">
                <div className="flex items-center gap-2"><span className="ribbon-flag">void of course</span><span className="text-muted-foreground">until {fmtDateTime(moon.voidUntil)}</span></div>
                <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">The Moon has made her last major aspect in {moon.sign}. Tradition counsels against launching new ventures until she enters the next sign.</p>
              </div>
            ) : (
              <div className="text-sm">
                <div>Next aspect in {moon.sign}: <span className="text-[var(--gilded)]">{moon.nextAspect ?? '—'}</span></div>
                <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">The Moon still has work to do in this sign — the void begins after her final major aspect.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="celestial-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-display text-lg">{monthName}</span>
            <Button size="sm" variant="ghost" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <TimeZoneCombobox value={calZone} onChange={(z) => { setZoneChoice(z); setSelectedDay(null) }} />
            </div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Moon Phase Calendar · click a day</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] uppercase tracking-widest text-muted-foreground/60 pb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((wd) => <div key={wd}>{wd}</div>)}
        </div>
        {calErr ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-2 text-destructive" />
            <div className="text-sm text-destructive">The lunar calendar could not be drawn ({calErr}).</div>
            <Button size="sm" variant="outline" className="mt-3" onClick={calendar.refresh}>try again</Button>
          </div>
        ) : !cal ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 28 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5">
              {/* leading blanks for weekday alignment (month starts on Mon col) */}
              {Array.from({ length: (new Date(Date.UTC(cal.year, cal.month - 1, 1)).getUTCDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} aria-hidden="true" />
              ))}
              {cal.days.map((d) => (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(selectedDay?.day === d.day ? null : d)}
                  title={`${d.phaseName} · ${d.illumination * 100 | 0}% · Moon in ${d.sign} ${d.degree}`}
                  aria-pressed={selectedDay?.day === d.day}
                  className={`rounded-lg border p-2 text-center transition-colors ${
                    selectedDay?.day === d.day
                      ? 'border-[rgba(167,139,250,0.65)] bg-primary/15 -translate-y-0.5'
                      : d.isToday
                        ? 'border-[rgba(232,200,116,0.6)] bg-primary/10 breathe'
                        : 'border-border/50 bg-secondary/20 hover:bg-primary/5'
                  }`}
                >
                  <div className="tabular text-[10px] text-muted-foreground text-left">{d.day}</div>
                  <div className="text-xl leading-none my-1">{d.glyph}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">{d.phaseName.replace(' Moon', '')}</div>
                  <div className="tabular text-[9px]" style={{ color: 'var(--astral)' }}>{d.signGlyph}{d.sign.slice(0, 2)}</div>
                  {d.quarter && (
                    <div className="mt-1 text-[8.5px] uppercase tracking-wider text-[var(--gilded)] truncate" title={`${d.quarter.name} exact at ${fmtTime(d.quarter.time, calZone)}`}>
                      ◆ {fmtTime(d.quarter.time, calZone)}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Day dossier */}
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 rounded-lg border border-[rgba(233,203,124,0.3)] bg-secondary/25 p-4 flex flex-wrap items-center gap-5"
              >
                <MoonVisual phaseAngle={selectedDay.phaseAngle} size={84} glow />
                <div className="min-w-40">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{monthName.split(' ')[0]} {selectedDay.day}{selectedDay.isToday ? ' · today' : ''}</div>
                  <div className="font-display text-lg" style={{ color: 'var(--gilded)' }}>{selectedDay.phaseName}</div>
                  <div className="tabular text-xs text-muted-foreground">{(selectedDay.illumination * 100).toFixed(1)}% illuminated · phase angle {selectedDay.phaseAngle.toFixed(0)}°</div>
                </div>
                <div className="text-xs space-y-1 min-w-44">
                  <div>Moon in <span className="text-[var(--astral)]">{selectedDay.signGlyph} {selectedDay.sign} {selectedDay.degree}</span></div>
                  <div className="tabular">Distance: {(selectedDay.distanceKm / 1000).toFixed(0)}k km</div>
                  <div className="text-muted-foreground">Phase angle {selectedDay.phaseAngle < 180 ? 'waxing ☽' : 'waning ☾'} toward {selectedDay.phaseAngle < 180 ? 'fullness' : 'renewal'}</div>
                </div>
                <button onClick={() => setSelectedDay(null)} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">dismiss</button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Vital({ k, v, gold }: { k: string; v: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-xs">{k}</span>
      <span className={`tabular text-right ${gold ? 'text-[var(--gilded)]' : ''}`}>{v}</span>
    </div>
  )
}
