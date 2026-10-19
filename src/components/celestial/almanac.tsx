'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarPlus, Search, AlertTriangle, RefreshCcw } from 'lucide-react'
import { fmtCountdown, fmtDate, fmtTime, useDisplayZone, useEvents, useNow, useSky } from '@/lib/celestial/use-sky'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import type { SkyEvent } from '@/lib/celestial/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const KIND_META: Record<SkyEvent['kind'], { label: string; color: string }> = {
  moonphase: { label: 'Lunations', color: 'var(--moonlight)' },
  ingress: { label: 'Ingresses', color: 'var(--gilded)' },
  retrograde: { label: 'Stations', color: 'var(--ember)' },
  elongation: { label: 'Elongations', color: 'var(--verdant)' },
  eclipse: { label: 'Eclipses', color: 'var(--rose-cosmic)' },
  season: { label: 'Seasons', color: '#f3d58b' },
  apsis: { label: 'Apsides', color: 'var(--astral)' },
}
const KINDS = Object.keys(KIND_META) as SkyEvent['kind'][]
const WINDOWS = [30, 90, 180, 365] as const

export function Almanac() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(90)
  const [moonIngresses, setMoonIngresses] = useState(false)
  const [hidden, setHidden] = useState<Set<SkyEvent['kind']>>(() => new Set(['apsis']))
  const [q, setQ] = useState('')
  const { data, error, loading, refresh } = useEvents(days, moonIngresses)
  const now = useNow(30_000)
  const { data: sky } = useSky(60000)
  const retroNow = useMemo(() => sky?.planets.filter((p) => p.retrograde).map((p) => p.id) ?? [], [sky])

  const counts = useMemo(() => {
    const c: Partial<Record<SkyEvent['kind'], number>> = {}
    for (const e of data?.events ?? []) c[e.kind] = (c[e.kind] ?? 0) + 1
    return c
  }, [data])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data?.events ?? []).filter((e) =>
      !hidden.has(e.kind) && (!needle || `${e.title} ${e.detail}`.toLowerCase().includes(needle)))
  }, [data, hidden, q])

  const upcoming = filtered.filter((e) => new Date(e.time).getTime() >= now)
  const next = upcoming[0]

  const months = useMemo(() => {
    const groups = new Map<string, SkyEvent[]>()
    for (const e of upcoming) {
      const d = new Date(e.time)
      const key = fmtDate(d, { month: 'long', year: 'numeric' })
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }
    return [...groups.entries()]
  }, [upcoming])

  const toggle = (k: SkyEvent['kind']) => setHidden((h) => {
    const n = new Set(h)
    if (n.has(k)) n.delete(k); else n.add(k)
    return n
  })

  const icsHref = `/api/events?days=${days}&moon=${moonIngresses ? 1 : 0}&format=ics&kinds=${KINDS.filter((k) => !hidden.has(k)).join(',')}`

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="celestial-card p-4 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Window" className="segmented grid grid-cols-4 w-full sm:w-72 shrink-0">
          {WINDOWS.map((w) => (
            <button key={w} role="radio" aria-checked={days === w} onClick={() => setDays(w)} className={`segmented-item ${days === w ? 'segmented-item-active' : ''}`}>
              {w === 365 ? '1 year' : `${w} days`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events — “Mercury”, “eclipse”, “Scorpio”…" className="h-9 pl-8" aria-label="Search events" />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 cursor-pointer">
          <input type="checkbox" checked={moonIngresses} onChange={(e) => setMoonIngresses(e.target.checked)} className="accent-[var(--astral)]" />
          Moon sign changes
        </label>
        <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
          <a href={icsHref} download>
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </a>
        </Button>
      </div>

      {/* kind chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Event kinds">
        {KINDS.map((k) => {
          const on = !hidden.has(k)
          return (
            <button key={k} onClick={() => toggle(k)} aria-pressed={on}
              className={`chip transition-opacity ${on ? '' : 'opacity-40'}`} style={{ color: KIND_META[k].color }}>
              {KIND_META[k].label} <span className="tabular text-muted-foreground ml-1">{counts[k] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {error && !data ? (
        <div className="celestial-card p-6 flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" /> The almanac could not be read ({error}).
          <Button size="sm" variant="outline" onClick={refresh} className="ml-auto gap-1"><RefreshCcw className="h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-3"><Skeleton className="h-32 celestial-card" /><Skeleton className="h-96 celestial-card" /></div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            {next ? <NextUp event={next} now={now} /> : <div className="celestial-card p-6 text-sm text-muted-foreground">No events match these filters.</div>}
            <RetroGantt events={data?.events ?? []} retroNow={retroNow} start={data ? new Date(data.start).getTime() : now} days={days} />
          </div>

          <div className="celestial-card p-2 sm:p-4">
            {months.length === 0 && <div className="p-6 text-sm text-muted-foreground">Nothing in this window matches.</div>}
            {months.map(([month, list]) => (
              <section key={month} className="mb-4 last:mb-0">
                <h3 className="eyebrow px-2 py-2 sticky top-[var(--header-h)] z-[1] bg-black/70 backdrop-blur-md">{month}</h3>
                <ol className="timeline">
                  {list.map((e, i) => <TimelineRow key={`${e.kind}-${e.time}-${i}`} e={e} now={now} />)}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NextUp({ event, now }: { event: SkyEvent; now: number }) {
  const d = new Date(event.time)
  const zone = useDisplayZone()
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="celestial-card celestial-card-gold corners p-6 flex flex-col justify-between">
      <div className="eyebrow">Next in the heavens</div>
      <div className="flex items-center gap-4 mt-3">
        <span className="text-5xl leading-none" style={{ color: KIND_META[event.kind].color, textShadow: '0 0 24px currentColor' }}>{event.glyph}</span>
        <div className="min-w-0">
          <div className="font-display text-2xl text-[var(--gilded)] leading-tight">{event.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{event.detail}</div>
        </div>
      </div>
      <div className="flex items-end justify-between mt-5">
        <div className="text-sm">
          <div>{fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="text-muted-foreground tabular">{fmtTime(event.time)} · {zone.label}</div>
        </div>
        <div className="font-display text-3xl tabular text-[var(--moonlight)]">{fmtCountdown(event.time, now)}</div>
      </div>
    </motion.div>
  )
}

function TimelineRow({ e, now }: { e: SkyEvent; now: number }) {
  const d = new Date(e.time)
  const soon = new Date(e.time).getTime() - now < 3 * 86400000
  const meta = e.body ? PLANET_BY_ID[e.body] : null
  return (
    <li className="timeline-row grid grid-cols-[36px_1fr] sm:grid-cols-[84px_16px_1fr_auto] items-center gap-x-3 gap-y-1 px-2 py-2.5">
      <div className="hidden sm:block text-right leading-tight">
        <div className="text-sm tabular">{fmtDate(d, { day: '2-digit', month: 'short' })}</div>
        <div className="text-[10px] text-muted-foreground tabular">{fmtDate(d, { weekday: 'short' })} {fmtTime(e.time)}</div>
      </div>
      <div className="flex justify-center" style={{ color: KIND_META[e.kind].color }}><span className="timeline-node" /></div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: meta?.color ?? KIND_META[e.kind].color }}>{e.glyph}</span>
          <span className="truncate">{e.title}</span>
          {soon && <span className="ribbon-flag !text-[var(--gilded)] !border-[rgba(233,203,124,0.4)] !bg-[rgba(233,203,124,0.07)]">soon</span>}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span className="sm:hidden tabular">{fmtDate(d, { day: '2-digit', month: 'short' })} · {fmtTime(e.time)} — </span>{e.detail}
        </div>
      </div>
      <div className="hidden sm:block text-[11px] tabular text-muted-foreground whitespace-nowrap">{fmtCountdown(e.time, now)}</div>
    </li>
  )
}

/** Horizontal bars for every retrograde period that touches the window */
function RetroGantt({ events, retroNow, start, days }: { events: SkyEvent[]; retroNow: string[]; start: number; days: number }) {
  const end = start + days * 86400000
  const rows = useMemo(() => {
    const byBody = new Map<string, SkyEvent[]>()
    for (const e of events) if (e.kind === 'retrograde' && e.body) {
      if (!byBody.has(e.body)) byBody.set(e.body, [])
      byBody.get(e.body)!.push(e)
    }
    const out: { body: string; spans: { from: number; to: number }[] }[] = []
    for (const [body, list] of byBody) {
      const spans: { from: number; to: number }[] = []
      let open: number | null = null
      list.forEach((e, i) => {
        const t = new Date(e.time).getTime()
        if (e.title.includes('retrograde')) open = t
        else { spans.push({ from: open ?? start, to: t }); open = null }
        if (i === list.length - 1 && open !== null) spans.push({ from: open, to: end })
      })
      out.push({ body, spans })
    }
    // retrograde for the entire window: no station inside it at all
    for (const id of retroNow) if (!byBody.has(id)) out.push({ body: id, spans: [{ from: start, to: end }] })
    const order = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
    return out.sort((a, b) => order.indexOf(a.body) - order.indexOf(b.body))
  }, [events, retroNow, start, end])

  const pct = (t: number) => `${(((Math.min(Math.max(t, start), end) - start) / (end - start)) * 100).toFixed(2)}%`
  const ticks = Array.from({ length: 5 }, (_, i) => start + ((end - start) * i) / 4)

  return (
    <div className="celestial-card p-5">
      <div className="eyebrow mb-4">Retrograde seasons</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No stations in this window — every planet keeps its forward course.</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const meta = PLANET_BY_ID[r.body]
            return (
              <div key={r.body} className="grid grid-cols-[84px_1fr] items-center gap-3">
                <div className="text-xs flex items-center gap-1.5"><span style={{ color: meta.color }}>{meta.glyph}</span>{meta.name}</div>
                <div className="relative h-4 bg-white/[0.025] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  {r.spans.map((s, i) => (
                    <div key={i} className="absolute top-0 bottom-0"
                      title={`${meta.name} ℞ ${fmtDate(new Date(s.from), { day: 'numeric', month: 'short' })} – ${fmtDate(new Date(s.to), { day: 'numeric', month: 'short' })}`}
                      style={{ left: pct(s.from), width: `calc(${pct(s.to)} - ${pct(s.from)})`, background: `linear-gradient(90deg, ${meta.color}55, ${meta.color}aa)`, boxShadow: `0 0 12px -2px ${meta.color}` }} />
                  ))}
                </div>
              </div>
            )
          })}
          <div className="grid grid-cols-[84px_1fr] gap-3 pt-1">
            <span />
            <div className="flex justify-between text-[10px] text-muted-foreground tabular">
              {ticks.map((t) => <span key={t}>{fmtDate(new Date(t), { day: 'numeric', month: 'short' })}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
