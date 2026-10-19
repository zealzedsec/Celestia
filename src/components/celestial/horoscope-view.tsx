'use client'

import { fmtTime, useHoroscopes } from '@/lib/celestial/use-sky'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function HoroscopeView() {
  const { data, loading, error, refresh } = useHoroscopes(600000)

  if (loading && !data) return <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 celestial-card" />)}</div>
  if (error || !data) return <div className="celestial-card p-6 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> The oracle is silent ({error}).</div>

  return (
    <div className="space-y-4">
      <div className="celestial-card p-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Cast at <span className="text-[var(--gilded)] tabular">{fmtTime(data.date)}</span> from the real transits to each sign’s solar point (15° of the sign) — recast as the Moon moves.
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 text-xs uppercase tracking-widest hover:text-[var(--gilded)] transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> recast
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.horoscopes.map((h) => (
          <div key={h.sign} className="celestial-card p-5 relative overflow-hidden">
            <div className="absolute -right-3 -top-6 text-[110px] opacity-[0.07] select-none pointer-events-none" style={{ color: 'var(--astral)' }}>{h.glyph}</div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl" style={{ color: 'var(--astral)' }}>{h.glyph}</span>
                <div>
                  <div className="font-display text-lg">{h.sign}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.element}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">sky mood</div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${h.mood}%`, background: h.mood > 66 ? '#8fd4a8' : h.mood > 40 ? 'var(--gilded)' : '#e2543e' }}
                    />
                  </div>
                  <span className="tabular text-xs text-muted-foreground w-6">{h.mood}</span>
                </div>
              </div>
            </div>
            <div className="font-serif-alt text-[17px] mt-3 leading-snug" style={{ color: 'var(--moonlight)' }}>{h.headline}</div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{h.body}</p>
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Key transit: <span className="text-[var(--astral)]">{h.keyTransit}</span></span>
              <span>Lucky sigil <span className="text-[var(--gilded)] text-sm">{h.luckyGlyph}</span> · power hour {h.powerHourRuler}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
