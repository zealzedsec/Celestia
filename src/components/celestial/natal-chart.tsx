'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { NatalChartPayload } from '@/lib/celestial/types'
import { PLANET_BY_ID, ZODIAC } from '@/lib/celestial/data'
import { useBrowserTimeZone, useCelestiaStore } from '@/lib/celestial/use-sky'
import { usePreferences } from '@/lib/celestial/preferences'
import { HOUSE_SYSTEMS, type HouseSystem } from '@/lib/celestial/houses'
import { formatOffset, isValidWallTime, offsetForWallTime } from '@/lib/celestial/timezone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Star, Save, FolderOpen, Trash2, Loader2, AlertTriangle, Download, Image as ImageIcon, FileCode2, X } from 'lucide-react'
import { ChartWheel, exportWheel } from './chart-wheel'
import { TimeZoneCombobox } from './forms/timezone-combobox'
import { BirthplaceFields, FieldLabel, type BirthplaceValue } from './forms/birthplace-fields'

interface SavedChartRow { id: string; name: string; birthDate: string; locationName: string; timeZone: string | null; tzOffset: number; houseSystem: string; updatedAt: string }

interface CastForm {
  name: string
  birthDate: string
  /** null = the viewer's own zone (the most likely birth zone) */
  timeZone: string | null
  useObservatory: boolean
  place: BirthplaceValue
}

export function NatalChart() {
  const location = useCelestiaStore((s) => s.location)
  const defaultHouses = usePreferences((s) => s.houseSystem)
  const [form, setForm] = useState<CastForm>(() => ({ name: '', birthDate: '', timeZone: null, useObservatory: true, place: { preset: '', lat: '', lon: '' } }))
  const browserTz = useBrowserTimeZone()
  // default zone: the observatory's when the native was born there, otherwise this computer's
  const timeZone = form.timeZone ?? (form.useObservatory && location.tz ? location.tz : browserTz)
  const [houseSystem, setHouseSystem] = useState<HouseSystem>(defaultHouses)
  const [chart, setChart] = useState<NatalChartPayload | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedChartRow[] | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const lastRequest = useRef<Record<string, unknown> | null>(null)

  const coords = form.useObservatory
    ? { lat: location.lat, lon: location.lon, name: location.name }
    : { lat: parseFloat(form.place.lat), lon: parseFloat(form.place.lon), name: form.place.preset || 'Custom location' }

  const resolvedOffset = useMemo(
    () => (isValidWallTime(form.birthDate) ? offsetForWallTime(form.birthDate, timeZone) : null),
    [form.birthDate, timeZone],
  )

  const loadSaved = useCallback(async () => {
    try {
      const r = await fetch('/api/natal', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setSaved(j.charts ?? [])
    } catch {
      toast({ title: 'Could not open the archive', variant: 'destructive' })
    }
  }, [])

  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/natal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'The chart could not be cast')
      setChart(j.chart)
      lastRequest.current = body
      return j as { chart: NatalChartPayload; savedId: string | null }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  const cast = async (save = false) => {
    if (!form.birthDate) return setErr('Birth date & local time are required')
    if (!isValidWallTime(form.birthDate)) return setErr('That date does not exist on the calendar')
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return setErr('Choose a birthplace or enter its coordinates')
    const res = await post({
      name: form.name || 'Unnamed Soul', birthDate: form.birthDate, lat: coords.lat, lon: coords.lon,
      locationName: coords.name, timeZone, houseSystem, save,
    })
    if (res && save) {
      toast({ title: 'Chart cast & sealed in the archive' })
      if (showSaved) loadSaved()
    }
  }

  // switching the house system re-casts the chart on screen instantly
  const switchHouses = async (hs: HouseSystem) => {
    setHouseSystem(hs)
    if (lastRequest.current) await post({ ...lastRequest.current, houseSystem: hs, save: false })
  }

  const loadChart = async (row: SavedChartRow) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/natal?id=${encodeURIComponent(row.id)}&houseSystem=${houseSystem}`, { method: 'PUT' })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      const c: NatalChartPayload = j.chart
      setChart(c)
      lastRequest.current = { name: c.input.name, birthDate: c.input.birthDate, lat: c.input.lat, lon: c.input.lon, locationName: c.input.locationName, tzOffsetMinutes: c.input.tzOffsetMinutes, timeZone: c.input.timeZone, houseSystem }
      setForm((f) => ({ ...f, name: row.name, birthDate: row.birthDate, timeZone: row.timeZone ?? f.timeZone, useObservatory: false, place: { preset: '', lat: String(c.input.lat), lon: String(c.input.lon) } }))
      setShowSaved(false)
    } catch {
      toast({ title: 'Failed to load chart', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const deleteChart = async (row: SavedChartRow) => {
    const before = saved
    setSaved((s) => s?.filter((x) => x.id !== row.id) ?? null)
    try {
      const r = await fetch(`/api/natal?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
      if (!r.ok && r.status !== 404) throw new Error()
      toast({ title: `${row.name} released to the void` })
    } catch {
      setSaved(before)
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="celestial-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-12 items-end">
          <div className="md:col-span-3">
            <FieldLabel htmlFor="natal-name">Name</FieldLabel>
            <Input id="natal-name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name of the native" className="h-9" />
          </div>
          <div className="md:col-span-3">
            <FieldLabel htmlFor="natal-date">Birth date & local time</FieldLabel>
            <Input id="natal-date" type="datetime-local" min="1800-01-01T00:00" max="2200-12-31T23:59" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} className="h-9" />
          </div>
          <div className="md:col-span-4">
            <FieldLabel htmlFor="natal-tz">Time zone at birth</FieldLabel>
            <TimeZoneCombobox id="natal-tz" value={timeZone} wallTime={isValidWallTime(form.birthDate) ? form.birthDate : undefined} onChange={(tz) => setForm((f) => ({ ...f, timeZone: tz }))} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="natal-houses">House system</FieldLabel>
            <select id="natal-houses" value={houseSystem} onChange={(e) => switchHouses(e.target.value as HouseSystem)} className="h-9 w-full border border-input bg-background/60 px-2 text-sm">
              {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-12 items-end mt-3">
          <div className={form.useObservatory ? 'lg:col-span-12' : 'lg:col-span-5'}>
            <label className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground cursor-pointer min-h-9">
              <input type="checkbox" checked={form.useObservatory} onChange={(e) => setForm((f) => ({ ...f, useObservatory: e.target.checked }))} className="accent-[var(--astral)]" />
              Born at the observatory location — <span className="text-[var(--gilded)]">{location.name}</span>
              <span className="tabular">({location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°)</span>
            </label>
          </div>
          <div className={form.useObservatory ? 'hidden' : 'lg:col-span-7'}>
            {!form.useObservatory && (
              <BirthplaceFields idPrefix="natal" value={form.place} onChange={(place, zone) => setForm((f) => ({ ...f, place, timeZone: zone ?? f.timeZone }))} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button onClick={() => cast(false)} disabled={busy} className="h-9 gap-2 min-w-36">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Cast chart
          </Button>
          <Button variant="secondary" onClick={() => cast(true)} disabled={busy} className="h-9 gap-2"><Save className="h-4 w-4" /> Cast & save</Button>
          <Button variant="outline" onClick={() => { setShowSaved((v) => !v); if (!saved) loadSaved() }} className="h-9 gap-2" aria-expanded={showSaved}>
            <FolderOpen className="h-4 w-4" /> Archive{saved ? ` · ${saved.length}` : ''}
          </Button>
          {resolvedOffset !== null && (
            <span className="text-xs text-muted-foreground ml-auto tabular">
              resolves to <span className="text-[var(--gilded)]">{formatOffset(resolvedOffset)}</span> at birth · {timeZone.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {err && <div role="alert" className="mt-3 text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {err}</div>}
      </div>

      {showSaved && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="celestial-card p-4">
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="eyebrow">Chart archive — {saved?.length ?? '…'} saved</div>
            <button onClick={() => setShowSaved(false)} className="icon-btn" aria-label="Close archive"><X className="h-3.5 w-3.5" /></button>
          </div>
          {saved === null && <Skeleton className="h-16" />}
          {saved?.length === 0 && <div className="text-sm text-muted-foreground px-1 py-3">The archive is empty. Cast and save your first chart.</div>}
          <div className="grid gap-1.5 sm:grid-cols-2 max-h-64 overflow-y-auto scroll-ethereal pr-1">
            {saved?.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2 bg-secondary/30 px-3 py-2 text-sm">
                <button className="hover:text-[var(--gilded)] transition-colors text-left min-w-0" onClick={() => loadChart(row)}>
                  <span className="font-medium block truncate">{row.name}</span>
                  <span className="text-[11px] text-muted-foreground block truncate tabular">{row.birthDate.replace('T', ' ')} · {formatOffset(row.tzOffset)} · {row.locationName}</span>
                </button>
                <button onClick={() => deleteChart(row)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" aria-label={`Delete ${row.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {busy && !chart && <div className="grid gap-4 md:grid-cols-5"><Skeleton className="h-[420px] celestial-card md:col-span-2" /><Skeleton className="h-[420px] celestial-card md:col-span-3" /></div>}
      {chart && <NatalDisplay chart={chart} busy={busy} onHouses={switchHouses} />}
      {!chart && !busy && (
        <div className="celestial-card p-8 text-center">
          <div className="text-4xl text-[var(--gilded)] mb-2" aria-hidden="true">☉</div>
          <div className="font-serif-alt text-xl text-[var(--moonlight)]">Enter a birth moment to cast its heavens.</div>
          <div className="text-xs text-muted-foreground mt-2">The time zone resolves daylight-saving rules for the exact date — no guessing offsets.</div>
        </div>
      )}
    </div>
  )
}

function NatalDisplay({ chart, busy, onHouses }: { chart: NatalChartPayload; busy: boolean; onHouses: (h: HouseSystem) => void }) {
  const b = chart.balance
  const wheelRef = useRef<SVGSVGElement>(null)

  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(chart, null, 2)], { type: 'application/json' }))
    a.download = `natal-${chart.input.name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'chart'}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const signGlyph = (name: string) => ZODIAC.find((z) => z.name === name)?.glyph ?? ''

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: busy ? 0.6 : 1 }} className="space-y-4">
      {/* identity strip */}
      <div className="celestial-card celestial-card-gold p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-xl glow-gold truncate" style={{ color: 'var(--gilded)' }}>{chart.input.name}</div>
          <div className="text-xs text-muted-foreground tabular">
            born {chart.input.birthDate.replace('T', ' · ')} ({formatOffset(chart.input.tzOffsetMinutes)}{chart.input.timeZone ? ` · ${chart.input.timeZone.replace(/_/g, ' ')}` : ''}) · {chart.input.locationName}
          </div>
          <div className="text-[11px] text-muted-foreground tabular">UT {chart.utcDate.slice(0, 16).replace('T', ' ')} · JD {chart.julianDay.toFixed(4)}</div>
        </div>
        <div className="flex gap-5 text-sm">
          <Triple label="Sun" v={b.sunSign} glyph={signGlyph(b.sunSign)} />
          <Triple label="Moon" v={b.moonSign} glyph={signGlyph(b.moonSign)} />
          <Triple label="Rising" v={b.risingSign} glyph={signGlyph(b.risingSign)} />
          <Triple label="Ruler" v={b.chartRuler} glyph={PLANET_BY_ID[b.chartRuler.toLowerCase()]?.glyph ?? ''} />
        </div>
        <div className="text-xs text-muted-foreground">
          Born under <span className="text-[var(--gilded)]">{chart.lunarPhaseAtBirth.name}</span> ({(chart.lunarPhaseAtBirth.illumination * 100).toFixed(0)}% lit) · {b.isDayChart ? 'day' : 'night'} chart
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="celestial-card p-4 lg:col-span-2 flex flex-col items-center">
          <div role="radiogroup" aria-label="House system" className="segmented grid grid-cols-4 w-full mb-3">
            {HOUSE_SYSTEMS.map((h) => (
              <button key={h.id} role="radio" aria-checked={chart.houseSystem === h.id} onClick={() => onHouses(h.id as HouseSystem)} title={h.blurb}
                className={`segmented-item !text-[11px] ${chart.houseSystem === h.id ? 'segmented-item-active' : ''}`}>{h.label}</button>
            ))}
          </div>
          {chart.houseSystemFallback && (
            <div className="text-[11px] text-[var(--ember)] mb-2 text-center">Placidus is undefined this close to the pole — Porphyry houses are shown instead.</div>
          )}
          <ChartWheel ref={wheelRef} chart={chart} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs mt-3 tabular">
            <div>ASC <span className="text-[var(--gilded)]">{chart.angles.ascendant.formatted}</span></div>
            <div>MC <span className="text-[var(--gilded)]">{chart.angles.midheaven.formatted}</span></div>
            <div>DSC <span className="text-muted-foreground">{chart.angles.descendant.formatted}</span></div>
            <div>IC <span className="text-muted-foreground">{chart.angles.imumCoeli.formatted}</span></div>
          </div>
          <div className="flex gap-1.5 mt-3">
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => wheelRef.current && exportWheel(wheelRef.current, chart.input.name, 'png')}><ImageIcon className="h-3.5 w-3.5" /> PNG</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => wheelRef.current && exportWheel(wheelRef.current, chart.input.name, 'svg')}><FileCode2 className="h-3.5 w-3.5" /> SVG</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={exportJson}><Download className="h-3.5 w-3.5" /> JSON</Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="celestial-card p-4">
            <div className="eyebrow px-1 pb-3">Placements — {HOUSE_SYSTEMS.find((h) => h.id === chart.houseSystem)?.label} houses</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                    <th className="font-normal py-1.5 pl-1">Body</th><th className="font-normal">Position</th><th className="font-normal text-center">House</th><th className="font-normal text-center hidden sm:table-cell">Whole sign</th><th className="font-normal hidden md:table-cell">Element</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.planets.map((p) => (
                    <tr key={p.id} className="border-t border-white/[0.04]">
                      <td className="py-1.5 pl-1"><span className="inline-block w-5" style={{ color: PLANET_BY_ID[p.id].color }}>{p.glyph}</span>{p.name}{p.retrograde && <span className="text-destructive ml-1 text-xs" title="retrograde">℞</span>}</td>
                      <td className="tabular"><span className="text-[var(--gilded)]">{p.formattedDegree.split(' ')[0]}</span> {p.sign}</td>
                      <td className="text-center tabular">{p.house}</td>
                      <td className="text-center tabular text-muted-foreground hidden sm:table-cell">{p.houseWholeSign}</td>
                      <td className="text-muted-foreground text-xs hidden md:table-cell">{p.element} · {p.modality}</td>
                    </tr>
                  ))}
                  {chart.points.map((p) => (
                    <tr key={p.id} className="border-t border-white/[0.04] text-muted-foreground">
                      <td className="py-1.5 pl-1"><span className="inline-block w-5">{p.glyph}</span>{p.name}</td>
                      <td className="tabular"><span className="text-foreground/80">{p.formattedDegree.split(' ')[0]}</span> {p.sign}</td>
                      <td className="text-center tabular">{p.house}</td>
                      <td className="text-center tabular hidden sm:table-cell">{p.houseWholeSign}</td>
                      <td className="hidden md:table-cell" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="celestial-card p-4">
              <div className="eyebrow px-1 pb-3">Elemental & modal balance</div>
              <Bars data={b.elements} colors={{ Fire: '#e2543e', Earth: '#9bab68', Air: '#d4c05a', Water: '#5aa8a0' }} />
              <div className="h-3" />
              <Bars data={b.modalities} colors={{ Cardinal: '#e9cb7c', Fixed: '#a78bfa', Mutable: '#5aa8a0' }} />
              <div className="text-xs text-muted-foreground mt-3">
                Dominant <span className="text-[var(--gilded)]">{b.dominantElement}</span> · <span className="text-[var(--gilded)]">{b.dominantModality}</span> · Yang {b.polarities.yang} / Yin {b.polarities.yin}
              </div>
            </div>
            <div className="celestial-card p-4">
              <div className="eyebrow px-1 pb-3">Hemispheres</div>
              <Hemispheres h={b.hemispheres} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="celestial-card p-4">
          <div className="eyebrow px-1 pb-3">Natal aspects — {chart.aspects.length}</div>
          <div className="space-y-1 max-h-80 overflow-y-auto scroll-ethereal pr-1">
            {chart.aspects.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/25 px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span style={{ color: PLANET_BY_ID[a.a]?.color ?? 'var(--gilded)' }}>{PLANET_BY_ID[a.a]?.glyph ?? '·'}</span> <span className="truncate">{a.aName}</span>
                  <span style={{ color: a.nature === 'harmonious' ? '#8fd4a8' : a.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }}>{a.glyph}</span>
                  <span className="truncate">{a.bName}</span> <span style={{ color: PLANET_BY_ID[a.b]?.color ?? 'var(--gilded)' }}>{PLANET_BY_ID[a.b]?.glyph ?? '·'}</span>
                </span>
                <span className="tabular text-xs text-muted-foreground shrink-0">{a.type} {a.orb.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </div>
        <div className="celestial-card p-4">
          <div className="eyebrow px-1 pb-3">Reading the chart</div>
          <div className="space-y-2 max-h-80 overflow-y-auto scroll-ethereal pr-1 leading-relaxed">
            {chart.interpretations.map((it, i) => (
              <div key={i} className="bg-secondary/20 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wider mb-0.5 text-[var(--gilded)]">{it.placement}</div>
                <div className="text-muted-foreground font-serif-alt text-[15px]">{it.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Triple({ label, v, glyph }: { label: string; v: string; glyph: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl text-[var(--astral)]" aria-hidden="true">{glyph}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{v}</div>
    </div>
  )
}

function Bars({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map((e) => e[1]), 1)
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-16 text-xs">{k}</span>
          <div className="flex-1 h-2 bg-secondary/60 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={v} aria-label={k}>
            <div className="h-full transition-[width] duration-700" style={{ width: `${(v / max) * 100}%`, background: colors[k] ?? 'var(--astral)' }} />
          </div>
          <span className="tabular text-xs text-muted-foreground w-8 text-right">{v % 1 ? v.toFixed(1) : v}</span>
        </div>
      ))}
    </div>
  )
}

function Hemispheres({ h }: { h: NatalChartPayload['balance']['hemispheres'] }) {
  const cell = (label: string, n: number, hint: string) => (
    <div className="bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] p-3 text-center" title={hint}>
      <div className="font-display text-2xl text-[var(--moonlight)] tabular">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  )
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {cell('Above', h.above, 'Houses 7–12: public, visible life')}
        {cell('Below', h.below, 'Houses 1–6: private, personal life')}
        {cell('East', h.east, 'Houses 10–3: self-directed')}
        {cell('West', h.west, 'Houses 4–9: other-directed')}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {h.above > h.below ? 'Most planets ride above the horizon — a life lived in view.' : h.below > h.above ? 'Most planets rest below the horizon — an inward, self-made life.' : 'The horizon is balanced.'}{' '}
        {h.east > h.west ? 'The eastern weight favours self-determination.' : h.west > h.east ? 'The western weight works through others.' : ''}
      </p>
    </div>
  )
}
