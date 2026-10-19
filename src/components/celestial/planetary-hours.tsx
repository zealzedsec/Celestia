'use client'

import { useHours, useSky, fmtTime } from '@/lib/celestial/use-sky'
import { PLANET_BY_ID, PLANET_MAGICAL_HOURS } from '@/lib/celestial/data'
import { PlanetaryHour as PHour } from '@/lib/celestial/types'
import { AlertTriangle, Clock3 } from 'lucide-react'

export function PlanetaryHours() {
  const { data: hours, error } = useHours(30000)
  const { data: sky } = useSky(120000)

  if (error || !hours) {
    return <div className="celestial-card p-6 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> Planetary hours unavailable ({error}).</div>
  }

  const cur = hours.currentHour

  return (
    <div className="space-y-4">
      {/* Current hour hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="celestial-card celestial-card-gold p-6 flex flex-col items-center justify-center text-center lg:col-span-2">
          <div className="eyebrow mb-1">The Hour Belongs To</div>
          {cur ? (
            <>
              <div className="text-6xl my-2 breathe rounded-full p-2" style={{ color: PLANET_BY_ID[cur.ruler]?.color, textShadow: `0 0 30px ${PLANET_BY_ID[cur.ruler]?.color}88` }}>
                {cur.glyph}
              </div>
              <div className="font-display text-3xl glow-gold" style={{ color: PLANET_BY_ID[cur.ruler]?.color }}>{cur.ruler}</div>
              <div className="tabular text-sm text-muted-foreground mt-1">
                {cur.isDay ? '☀ day' : '☾ night'} hour {((cur.index % 12) + 1).toString() + ['th','st','nd','rd'][(cur.index % 12) % 10 > 3 || Math.floor(((cur.index % 12) % 100) / 10) === 1 ? 0 : (cur.index % 12) % 10]} · {fmtTime(cur.startTime)} — {fmtTime(cur.endTime)}
              </div>
              <div className="mt-3 max-w-md text-sm text-muted-foreground font-serif-alt text-[15px]">
                Work now for: {PLANET_MAGICAL_HOURS[cur.ruler] ?? 'the turning of the wheel'}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8">The hour stands between calculations…</div>
          )}
        </div>

        {/* Day ruler card */}
        <div className="celestial-card p-6 flex flex-col justify-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">The Day & Its Ruler</div>
          <div className="flex items-center gap-3">
            <span className="text-4xl" style={{ color: PLANET_BY_ID[hours.dayRuler.toLowerCase()]?.color }}>{hours.dayGlyph}</span>
            <div>
              <div className="font-display text-xl" style={{ color: 'var(--gilded)' }}>{hours.dayRuler} Day</div>
              <div className="text-xs text-muted-foreground">first hour & the whole day’s octave</div>
            </div>
          </div>
          <div className="hairline" />
          <div className="space-y-1.5 text-sm">
            <Row k="Sunrise" v={fmtTime(hours.sunrise)} />
            <Row k="Sunset" v={fmtTime(hours.sunset)} />
            <Row k="Next sunrise" v={fmtTime(hours.nextSunrise)} />
            <Row k="Night begins with" v={`${hours.nightGlyph} ${hours.nightRuler}`} />
          </div>
          {sky && (
            <div className="text-[11px] text-muted-foreground pt-1">
              Day length: {sky.sunTimes.dayLengthMinutes ? `${Math.floor(sky.sunTimes.dayLengthMinutes / 60)}h ${sky.sunTimes.dayLengthMinutes % 60}m` : '—'} at {hours.location.name}
            </div>
          )}
        </div>
      </div>

      {/* Hours timeline */}
      <div className="celestial-card p-4">
        <div className="flex items-center gap-2 px-2 pb-3">
          <Clock3 className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
          <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">The 24 Planetary Hours — Chaldean order from sunrise</span>
        </div>
        {hours.hours.length === 0 ? (
          <div className="text-sm text-muted-foreground px-3 py-6 text-center">Polar day or night — the hours dissolve. Try a latitude nearer the equator.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {hours.hours.map((h: PHour) => (
              <div
                key={h.index}
                className={`rounded-lg border p-2.5 transition-colors ${h.isCurrent ? 'border-[rgba(232,200,116,0.65)] bg-primary/10 breathe' : 'border-border/50 bg-secondary/20'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl" style={{ color: PLANET_BY_ID[h.ruler]?.color }}>{h.glyph}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{h.isDay ? '☀' : '☾'} {(h.index % 12) + 1}</span>
                </div>
                <div className="text-sm mt-0.5">{h.ruler}</div>
                <div className="tabular text-[10px] text-muted-foreground">{fmtTime(h.startTime)}–{fmtTime(h.endTime)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About planetary hours */}
      <div className="celestial-card p-5 text-sm text-muted-foreground leading-relaxed">
        <div className="font-display text-base mb-2" style={{ color: 'var(--gilded)' }}>The Doctrine of Hours</div>
        <p className="mb-2">
          Each planetary day is divided by the horizon, not the clock: twelve unequal hours of light from sunrise to sunset,
          and twelve of darkness from sunset to the next sunrise. The day’s first hour belongs to the day’s ruler —
          the Sun for Sunday, the Moon for Monday, Mars for Tuesday, Mercury for Wednesday, Jupiter for Thursday, Venus for Friday, Saturn for Saturday.
        </p>
        <p>
          From that first ruler the hours descend through the <span className="text-[var(--astral)]">Chaldean order</span> —
          Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon — each planet stepping down one ring of the ancient ladder.
          Elections, talismans and petitions are timed to the hour of the planet whose current they require.
        </p>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="tabular">{v}</span>
    </div>
  )
}
