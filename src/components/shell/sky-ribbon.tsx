'use client'

import { useMemo } from 'react'
import { fmtCountdown, fmtTime, useHours, useNow, useSky } from '@/lib/celestial/use-sky'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import { ModuleId } from './modules'

/** A one-line live status band under the top bar: the state of the sky at a glance, every item a shortcut */
export function SkyRibbon({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const { data: sky } = useSky(60000)
  const { data: hours } = useHours(30000)
  const now = useNow(30_000)

  const next = useMemo(() => sky?.events.find((e) => new Date(e.time).getTime() > now), [sky, now])
  if (!sky) return <div className="h-[var(--ribbon-h)]" aria-hidden="true" />

  const m = sky.moon
  const retro = sky.planets.filter((p) => p.retrograde)
  const hour = hours?.currentHour
  const hourMeta = hour ? PLANET_BY_ID[hour.ruler] : null

  return (
    <div className="sky-ribbon h-[var(--ribbon-h)] px-3 sm:px-4 flex items-center gap-1 overflow-x-auto scroll-none text-[11px]" role="status" aria-label="Current sky">
      <RibbonItem onClick={() => onNavigate('moon')} title="Open the Moon observatory">
        <span className="text-[13px]">{m.phaseEmoji}</span>
        <span className="text-[var(--moonlight)]">{m.phaseName}</span>
        <span className="text-muted-foreground tabular">{(m.illumination * 100).toFixed(0)}%</span>
        <span className="text-muted-foreground">in</span>
        <span className="text-[var(--astral)]">{m.sign}</span>
      </RibbonItem>

      {m.voidOfCourse ? (
        <RibbonItem onClick={() => onNavigate('moon')} title="The Moon makes no further major aspect before leaving its sign">
          <span className="ribbon-flag">void of course</span>
          <span className="text-muted-foreground">until {fmtTime(m.voidUntil)}</span>
        </RibbonItem>
      ) : m.nextAspect ? (
        <RibbonItem onClick={() => onNavigate('moon')} title="The Moon’s next major aspect in this sign">
          <span className="text-muted-foreground">☽ next</span>
          <span>{m.nextAspect}</span>
        </RibbonItem>
      ) : null}

      {hour && hourMeta && (
        <RibbonItem onClick={() => onNavigate('hours')} title="Current planetary hour">
          <span style={{ color: hourMeta.color }}>{hourMeta.glyph}</span>
          <span>Hour of {hourMeta.name}</span>
          <span className="text-muted-foreground tabular">ends {fmtTime(hour.endTime)}</span>
        </RibbonItem>
      )}

      <RibbonItem onClick={() => onNavigate('planets')} title="Retrograde planets">
        <span className={retro.length ? 'text-[var(--ember)]' : 'text-muted-foreground'}>℞</span>
        {retro.length ? (
          <span className="flex gap-1">{retro.map((p) => <span key={p.id} title={`${p.name} retrograde`} style={{ color: PLANET_BY_ID[p.id].color }}>{p.glyph}</span>)}</span>
        ) : (
          <span className="text-muted-foreground">all direct</span>
        )}
      </RibbonItem>

      {next && (
        <RibbonItem onClick={() => onNavigate('almanac')} title={next.detail}>
          <span>{next.glyph}</span>
          <span>{next.title}</span>
          <span className="text-[var(--gilded)] tabular">{fmtCountdown(next.time, now)}</span>
        </RibbonItem>
      )}
    </div>
  )
}

function RibbonItem({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="ribbon-item shrink-0 inline-flex items-center gap-1.5 px-2.5 h-6 whitespace-nowrap">
      {children}
    </button>
  )
}
