'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import { useBrowserTimeZone, useCelestiaStore } from '@/lib/celestial/use-sky'
import { isValidWallTime } from '@/lib/celestial/timezone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { SynastryPayload, Overlay } from '@/lib/celestial/synastry'
import { AlertTriangle, Heart, Loader2, Infinity as InfinityIcon, ArrowLeftRight } from 'lucide-react'
import { TimeZoneCombobox } from './forms/timezone-combobox'
import { BirthplaceFields, FieldLabel, type BirthplaceValue } from './forms/birthplace-fields'

interface SideForm {
  name: string
  birthDate: string
  timeZone: string
  place: BirthplaceValue
}

// Side B starts in London so the second soul always has a birthplace ready
const emptySide = (side: 'a' | 'b'): SideForm =>
  side === 'a'
    ? { name: '', birthDate: '', timeZone: '', place: { preset: '', lat: '', lon: '' } }
    : { name: '', birthDate: '', timeZone: 'Europe/London', place: { preset: 'London', lat: '51.5074', lon: '-0.1278' } }

export function Synastry() {
  const location = useCelestiaStore((s) => s.location)
  const [aRaw, setA] = useState<SideForm>(() => emptySide('a'))
  const browserTz = useBrowserTimeZone()
  // side A defaults to the viewer's zone and the observatory's place until edited
  const a: SideForm = useMemo(() => ({
    ...aRaw,
    timeZone: aRaw.timeZone === '' ? (location.tz ?? browserTz) : aRaw.timeZone,
    place: aRaw.place.lat === '' && aRaw.place.lon === '' && aRaw.place.preset === '' ? { preset: '', lat: String(location.lat), lon: String(location.lon) } : aRaw.place,
  }), [aRaw, browserTz, location])
  const [b, setB] = useState<SideForm>(() => emptySide('b'))
  const [swap, setSwap] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [res, setRes] = useState<SynastryPayload | null>(null)

  const weave = useCallback(async (swapped = swap) => {
    setBusy(true); setErr(null)
    try {
      for (const [label, side] of [['first', a], ['second', b]] as const) {
        if (!side.birthDate) throw new Error(`The ${label} soul needs a birth date & time`)
        if (!isValidWallTime(side.birthDate)) throw new Error(`The ${label} soul’s date does not exist on the calendar`)
        if (![parseFloat(side.place.lat), parseFloat(side.place.lon)].every(Number.isFinite)) throw new Error(`Choose a birthplace for the ${label} soul`)
      }
      const toBody = (s: SideForm) => ({
        name: s.name, birthDate: s.birthDate, lat: parseFloat(s.place.lat), lon: parseFloat(s.place.lon),
        locationName: s.place.preset || 'Custom location', timeZone: s.timeZone,
      })
      const post = await fetch('/api/synastry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: toBody(a), b: toBody(b), swap: swapped }),
      })
      const j = await post.json()
      if (!post.ok) throw new Error(j.error ?? 'The weave failed')
      setRes(j)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setBusy(false) }
  }, [a, b, swap])

  const flip = () => {
    const next = !swap
    setSwap(next)
    if (res) weave(next)
    else toast({ title: 'Perspective reversed', description: 'The mirror is turned — the charts will be read the other way.' })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] items-stretch">
        <SideCard side="a" title={swap ? 'The Second Soul' : 'The First Soul'} form={a} onChange={setA} />
        <div className="flex lg:flex-col items-center justify-center gap-2 px-1">
          <Button size="sm" variant="outline" onClick={flip} className="h-10 w-10 p-0" title="Swap which chart is read first" aria-label="Swap chart order" aria-pressed={swap}>
            <ArrowLeftRight className={`h-4 w-4 transition-transform ${swap ? 'rotate-180' : ''}`} />
          </Button>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground text-center leading-tight">swap</span>
        </div>
        <SideCard side="b" title={swap ? 'The First Soul' : 'The Second Soul'} form={b} onChange={setB} />
      </div>

      <Button onClick={() => weave()} disabled={busy} className="w-full h-11 gap-2 text-sm tracking-wide">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        Weave the charts
      </Button>
      {err && <div role="alert" className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {err}</div>}
      {busy && !res && (
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-72 celestial-card" /><Skeleton className="h-72 celestial-card" /><Skeleton className="h-72 celestial-card" /></div>
      )}
      {res && <SynastryDisplay res={res} />}
    </div>
  )
}

function SideCard({ side, title, form, onChange }: { side: 'a' | 'b'; title: string; form: SideForm; onChange: (f: SideForm) => void }) {
  const accent = side === 'a' ? 'var(--astral)' : 'var(--rose-cosmic)'
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="celestial-card p-4" style={{ boxShadow: `inset 0 2px 0 ${accent}` }}>
      <div className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: accent }}>{title}</div>
      <div className="grid gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.35fr] gap-2">
          <div>
            <FieldLabel htmlFor={`syn-${side}-name`}>Name</FieldLabel>
            <Input id={`syn-${side}-name`} value={form.name} maxLength={80} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder={side === 'a' ? 'e.g. Lira' : 'e.g. Orfeo'} className="h-9" />
          </div>
          <div>
            <FieldLabel htmlFor={`syn-${side}-date`}>Birth date & time</FieldLabel>
            <Input id={`syn-${side}-date`} type="datetime-local" min="1800-01-01T00:00" max="2200-12-31T23:59" value={form.birthDate} onChange={(e) => onChange({ ...form, birthDate: e.target.value })} className="h-9" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={`syn-${side}-tz`}>Time zone at birth</FieldLabel>
          <TimeZoneCombobox id={`syn-${side}-tz`} value={form.timeZone} wallTime={isValidWallTime(form.birthDate) ? form.birthDate : undefined} onChange={(timeZone) => onChange({ ...form, timeZone })} />
        </div>
        <BirthplaceFields idPrefix={`syn-${side}`} value={form.place} onChange={(place, zone) => onChange({ ...form, place, timeZone: zone ?? form.timeZone })} />
      </div>
    </motion.div>
  )
}

function SynastryDisplay({ res }: { res: SynastryPayload }) {
  const harmonyCount = res.aspects.filter((x) => x.nature === 'harmonious').length
  const challengeCount = res.aspects.filter((x) => x.nature === 'challenging').length
  const dynamicCount = res.aspects.filter((x) => x.nature === 'dynamic').length

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-4">
      {/* Resonance gauge */}
      <div className="celestial-card celestial-card-gold corners p-6 flex flex-col md:flex-row items-center gap-6">
        <ResonanceDial score={res.score} />
        <div className="flex-1 text-center md:text-left">
          <div className="eyebrow mb-1">The Verdict of the Weave</div>
          <div className="font-display text-xl glow-gold" style={{ color: 'var(--gilded)' }}>{res.verdict}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {res.aspects.length} cross-aspects woven — {harmonyCount} harmonious · {challengeCount} challenging · {dynamicCount} fusing.
            The strongest thread:{' '}
            <span style={{ color: PLANET_BY_ID[res.topBonds[0]?.aBody ?? 'sun']?.color }}>
              {res.topBonds[0]?.aName}
            </span> {res.topBonds[0]?.glyph}{' '}
            <span style={{ color: PLANET_BY_ID[res.topBonds[0]?.bBody ?? 'moon']?.color }}>
              {res.topBonds[0]?.bName}
            </span> {res.topBonds[0]?.type} (orb {res.topBonds[0]?.orb.toFixed(1)}°).
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
          <MiniStat label={`${res.a.name || 'First'}`} value={`${res.a.sunSign} ☉ · ${res.a.moonSign} ☽ · ${res.a.risingSign} ASC`} />
          <MiniStat label={`${res.b.name || 'Second'}`} value={`${res.b.sunSign} ☉ · ${res.b.moonSign} ☽ · ${res.b.risingSign} ASC`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cross aspect web */}
        <div className="celestial-card p-4">
          <div className="flex items-center gap-2 px-2 pb-3">
            <InfinityIcon className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
            <span className="eyebrow">Cross-Aspects — weighted by luminosity</span>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto scroll-ethereal pr-1">
            {res.aspects.map((asp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.3 }}
                className="rounded-md bg-secondary/30 px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] px-1 rounded border border-border/60 text-muted-foreground uppercase">A</span>
                    <span style={{ color: PLANET_BY_ID[asp.aBody]?.color }}>{PLANET_BY_ID[asp.aBody]?.glyph}</span>
                    <span className="truncate">{asp.aName}</span>
                    <span className="text-base" style={{ color: asp.nature === 'harmonious' ? '#8fd4a8' : asp.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }}>{asp.glyph}</span>
                    <span className="truncate">{asp.bName}</span>
                    <span style={{ color: PLANET_BY_ID[asp.bBody]?.color }}>{PLANET_BY_ID[asp.bBody]?.glyph}</span>
                    <span className="text-[10px] px-1 rounded border border-[rgba(232,160,184,0.4)] text-[var(--rose-cosmic)] uppercase">B</span>
                  </span>
                  <span className="tabular text-xs text-muted-foreground shrink-0 ml-2">{asp.type} · {asp.orb.toFixed(1)}°</span>
                </div>
                <div className="text-[11px] text-muted-foreground italic mt-0.5 pl-1">{asp.story}</div>
              </motion.div>
            ))}
            {res.aspects.length === 0 && <div className="text-sm text-muted-foreground px-3 py-6 text-center">The charts hold no tight angles — a free and distant orbit.</div>}
          </div>
        </div>

        {/* Named bonds + elemental chemistry */}
        <div className="space-y-4">
          <div className="celestial-card p-4">
            <div className="eyebrow px-2 pb-3">The Four Pillars of the Bond</div>
            <div className="space-y-2.5">
              {res.bonds.map((bd, i) => (
                <div key={i} className="rounded-md border border-border/50 bg-secondary/25 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--gilded)' }}>{bd.label}</div>
                  <div className="text-[13px] text-muted-foreground leading-snug">{bd.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="celestial-card p-4">
            <div className="eyebrow px-2 pb-3">Elemental Chemistry</div>
            <div className="grid grid-cols-2 gap-4">
              <ElemBars name={res.a.name || 'First'} elements={res.a.elements} />
              <ElemBars name={res.b.name || 'Second'} elements={res.b.elements} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OverlayCard title={`${res.a.name}’s planets in ${res.b.name}’s houses`} list={res.overlays.aInB} accent="var(--astral)" />
        <OverlayCard title={`${res.b.name}’s planets in ${res.a.name}’s houses`} list={res.overlays.bInA} accent="var(--rose-cosmic)" />
      </div>
    </motion.div>
  )
}

const HOUSE_SHORT = ['self', 'resources', 'speech', 'home', 'pleasure', 'service', 'partnership', 'depths', 'vision', 'calling', 'allies', 'the hidden']

function OverlayCard({ title, list, accent }: { title: string; list: Overlay[]; accent: string }) {
  return (
    <div className="celestial-card p-4">
      <div className="eyebrow px-1 pb-3">House overlays</div>
      <div className="text-xs mb-3 px-1" style={{ color: accent }}>{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {list.map((o) => (
          <div key={o.body} className="bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] px-2 py-1.5 text-center" title={`${o.name} falls in their ${o.house}th house of ${HOUSE_SHORT[o.house - 1]}`}>
            <div className="text-base" style={{ color: PLANET_BY_ID[o.body]?.color }}>{o.glyph}</div>
            <div className="text-[11px] tabular">H{o.house}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{HOUSE_SHORT[o.house - 1]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResonanceDial({ score }: { score: number }) {
  const R = 52
  const C = 2 * Math.PI * R
  const color = score >= 68 ? '#8fd4a8' : score >= 52 ? 'var(--gilded)' : '#e2543e'
  return (
    <div className="relative shrink-0 float-soft">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="7" />
        <circle
          cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * C} ${C}`} transform="rotate(-90 65 65)"
          style={{ filter: `drop-shadow(0 0 8px ${score >= 68 ? '#8fd4a8' : '#e9cb7c'})`, transition: 'stroke-dasharray 1.2s ease' }}
        />
        <circle cx="65" cy="65" r={R - 12} fill="none" stroke="rgba(233,203,124,0.2)" strokeWidth="0.6" strokeDasharray="2 4" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-display text-3xl" style={{ color }}>{score}</span>
        <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">resonance</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 px-2.5 py-1.5 bg-secondary/20">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className="text-[11px] tabular leading-tight mt-0.5">{value}</div>
    </div>
  )
}

function ElemBars({ name, elements }: { name: string; elements: Record<string, number> }) {
  const colors: Record<string, string> = { Fire: '#e2543e', Earth: '#8a9a5b', Air: '#d4c05a', Water: '#5aa8a0' }
  const max = Math.max(...Object.values(elements), 1)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 truncate">{name}</div>
      {Object.entries(elements).sort((x, y) => y[1] - x[1]).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5 mb-1">
          <span className="w-10 text-[10px]">{k}</span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: colors[k] }} />
          </div>
        </div>
      ))}
    </div>
  )
}
