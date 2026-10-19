'use client'

/**
 * Book of Shadows — the journal & grimoire-keeper of CELESTIA.
 * Ponderings, tarot readings, horoscope reflections, dreams and diary pages,
 * each entry stamped with its living sky sigil (moon phase & sign, sun sign,
 * planetary hour ruler) at the moment of writing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCelestiaStore, fmtDateTime } from '@/lib/celestial/use-sky'
import { browserTimeZone } from '@/lib/celestial/timezone'
import { MOODS, type DrawnCard } from '@/lib/celestial/tarot'
import { TarotDrawer } from './tarot-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import {
  Search, Star, Flame, Download, Feather, Trash2, Pencil, X, Sparkles,
  BookOpen, BrainCircuit, SunMedium, Bug, MoonStar, FileText, Hand,
} from 'lucide-react'

// ————— kinds —————
const KINDS = [
  { id: 'pondering', label: 'Pondering', glyph: '✦', color: 'var(--astral)', hint: 'half-formed thoughts & cosmic what-ifs', icon: BrainCircuit },
  { id: 'tarot', label: 'Tarot', glyph: '⛤', color: 'var(--gilded)', hint: 'spreads, draws & their unravelings', icon: Sparkles },
  { id: 'horoscope', label: 'Horoscope', glyph: '☿', color: 'var(--verdant)', hint: 'reflections on the transit oracle', icon: SunMedium },
  { id: 'diary', label: 'Diary', glyph: '❦', color: 'var(--rose-cosmic)', hint: 'the plain, precious record of days', icon: BookOpen },
  { id: 'dream', label: 'Dream', glyph: '☽', color: '#b7c3e8', hint: 'messages from the moonlit country', icon: MoonStar },
] as const
type KindId = (typeof KINDS)[number]['id']

interface SkySigil {
  moonPhase?: string
  moonPhaseAngle?: number
  moonSign?: string
  illumination?: number
  sunSign?: string
  hourRuler?: string | null
  dayRuler?: string | null
  locationName?: string
  capturedAt?: string
}

interface JournalEntry {
  id: string
  kind: KindId
  title: string
  body: string
  mood: string | null
  tags: string[]
  skySigil: SkySigil
  tarotSpread: { name: string; question: string | null; cards: DrawnCard[] } | null
  favorite: boolean
  createdAt: string
  updatedAt: string
}

interface JournalStats {
  total: number
  byKind: Record<string, number>
  favorites: number
  streak: number
  days: number
  tagCloud: Record<string, number>
}

const emptyComposer = { id: null as string | null, kind: 'pondering' as KindId, title: '', body: '', mood: null as string | null, tags: '', spread: null as JournalEntry['tarotSpread'] }

export function Journal() {
  const location = useCelestiaStore((s) => s.location)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [stats, setStats] = useState<JournalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [kindFilter, setKindFilter] = useState<KindId | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const [composer, setComposer] = useState(emptyComposer)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [burning, setBurning] = useState<string | null>(null)
  const burnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const inflight = useRef<AbortController | null>(null)
  const load = useCallback(async () => {
    // abort the previous search so a slow, stale response can never overwrite a newer one
    inflight.current?.abort()
    const controller = new AbortController()
    inflight.current = controller
    setLoading(true)
    try {
      const params = new URLSearchParams({ tz: browserTimeZone() })
      if (q.trim()) params.set('q', q.trim())
      if (favOnly) params.set('favorite', '1')
      const res = await fetch(`/api/journal?${params}`, { cache: 'no-store', signal: controller.signal })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEntries(json.entries)
      setStats(json.stats)
    } catch (e) {
      if (controller.signal.aborted) return
      toast({ title: 'The book resisted opening', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [q, favOnly])

  useEffect(() => {
    const t = setTimeout(load, 220) // debounce search
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => () => inflight.current?.abort(), [])

  useEffect(() => () => { if (burnTimer.current) clearTimeout(burnTimer.current) }, [])

  const visible = useMemo(() => entries.filter((e) =>
    (kindFilter === 'all' || e.kind === kindFilter) && (!tagFilter || e.tags.includes(tagFilter))
  ), [entries, kindFilter, tagFilter])

  const save = async () => {
    if (!composer.title.trim() && !composer.body.trim()) {
      toast({ title: 'The page is blank', description: 'Write a whisper before sealing it.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const tags = composer.tags.split(',').map((t) => t.trim()).filter(Boolean)
      const payload = {
        kind: composer.kind,
        title: composer.title,
        body: composer.body,
        mood: composer.mood,
        tags,
        tarotSpread: composer.spread,
        lat: location.lat,
        lon: location.lon,
        name: location.name,
      }
      const res = composer.id
        ? await fetch(`/api/journal?id=${composer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: composer.id ? 'The page was revised' : 'Sealed into the book of shadows' })
      setComposer(emptyComposer)
      load()
    } catch (e) {
      toast({ title: 'The quill slipped', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleFavorite = async (e: JournalEntry) => {
    const next = !e.favorite
    setEntries((es) => es.map((x) => (x.id === e.id ? { ...x, favorite: next } : x)))
    setStats((s) => (s ? { ...s, favorites: Math.max(0, s.favorites + (next ? 1 : -1)) } : s))
    try {
      const res = await fetch(`/api/journal?id=${e.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite: next }) })
      if (!res.ok) throw new Error('star failed')
    } catch {
      // roll back the optimistic star if the ether refuses it
      setEntries((es) => es.map((x) => (x.id === e.id ? { ...x, favorite: e.favorite } : x)))
      setStats((s) => (s ? { ...s, favorites: Math.max(0, s.favorites + (next ? -1 : 1)) } : s))
      toast({ title: 'The star would not take hold', variant: 'destructive' })
    }
  }

  const burn = async (e: JournalEntry) => {
    if (burning !== e.id) {
      setBurning(e.id)
      if (burnTimer.current) clearTimeout(burnTimer.current)
      burnTimer.current = setTimeout(() => setBurning(null), 2600)
      return
    }
    setBurning(null)
    setEntries((es) => es.filter((x) => x.id !== e.id))
    try {
      const res = await fetch(`/api/journal?id=${e.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('burn failed')
      setStats((s) => (s ? { ...s, total: Math.max(0, s.total - 1) } : s))
      toast({ title: 'The page burned to starlight' })
    } catch {
      toast({ title: 'The page refuses to burn', variant: 'destructive' })
      load() // restore the unburnt page
    }
  }

  const startEdit = (e: JournalEntry) => {
    setComposer({
      id: e.id,
      kind: e.kind,
      title: e.title,
      body: e.body,
      mood: e.mood,
      tags: e.tags.join(', '),
      spread: e.tarotSpread,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const exportMd = () => {
    const lines = ['# CELESTIA — Book of Shadows', '']
    for (const e of visible) {
      const k = KINDS.find((x) => x.id === e.kind)
      lines.push(`## ${k?.glyph ?? '✧'} ${e.title}`)
      lines.push(`*${fmtDateTime(e.createdAt)} · ${k?.label} · ${e.skySigil?.moonPhase ?? ''} in ${e.skySigil?.moonSign ?? ''} · Sun in ${e.skySigil?.sunSign ?? ''}${e.mood ? ` · mood: ${e.mood}` : ''}*`)
      if (e.tags.length) lines.push(`tags: ${e.tags.map((t) => `#${t}`).join(' ')}`)
      if (e.tarotSpread) {
        lines.push(``, `**Spread — ${e.tarotSpread.name}**${e.tarotSpread.question ? ` · “${e.tarotSpread.question}”` : ''}`)
        for (const c of e.tarotSpread.cards) lines.push(`- ${c.position}: **${c.name}**${c.reversed ? ' (reversed)' : ''} — ${(c.reversed ? c.keywords.reversed : c.keywords.upright).join(', ')}`)
      }
      lines.push('', e.body, '', '---', '')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `celestia-book-of-shadows-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: `${visible.length} pages transcribed to markdown` })
  }

  const moodMeta = (name: string | null) => (name ? MOODS.find((m) => m.name === name) : undefined)
  const editing = Boolean(composer.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {/* ————— Header band: title + stats ————— */}
      <div className="celestial-card celestial-card-gold lit-top p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-serif-alt italic text-[16px] text-muted-foreground max-w-xl leading-relaxed">
              Ink your ponderings, lay the tarot, tether horoscope reflections and dreams — every page is stamped with the sky it was written under.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={exportMd} disabled={!visible.length} className="gap-2 border-border/70">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <TarotDrawer trigger={
              <Button variant="outline" size="sm" className="gap-2 border-[rgba(233,203,124,0.4)] text-[var(--gilded)] hover:bg-[rgba(233,203,124,0.08)]">
                <Hand className="h-3.5 w-3.5" /> Quick draw
              </Button>
            } onAttach={(spread) => {
              setComposer((c) => ({
                ...c,
                kind: 'tarot',
                title: c.title || `${spread.name}: ${spread.cards.map((x) => x.name).join(' · ')}`,
                body: c.body || spread.cards.map((x) => `${x.position} — ${x.name}${x.reversed ? ' (℞)' : ''}: ${(x.reversed ? x.keywords.reversed : x.keywords.upright).join(', ')}. ${x.meaning}`).join('\n\n'),
                spread,
              }))
              toast({ title: 'The spread waits in the composer', description: 'Add your reflection and seal the page.' })
            }} />
          </div>
        </div>

        {stats && (
          <>
            <div className="hairline my-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-2.5">
            <MiniStat icon={<Feather className="h-3.5 w-3.5" />} label="pages" value={String(stats.total)} />
            <MiniStat icon={<span className="streak-ember" />} label="day streak" value={String(stats.streak)} accent />
            <MiniStat icon={<Star className="h-3.5 w-3.5" />} label="starred" value={String(stats.favorites)} />
            <MiniStat icon={<FileText className="h-3.5 w-3.5" />} label="days inked" value={String(stats.days)} />
            <MiniStat icon={<Sparkles className="h-3.5 w-3.5" />} label="tarot pages" value={String(stats.byKind.tarot ?? 0)} />
            <MiniStat icon={<MoonStar className="h-3.5 w-3.5" />} label="dreams" value={String(stats.byKind.dream ?? 0)} />
            </div>
          </>
        )}
        {stats && Object.keys(stats.tagCloud).length > 0 && (
          <div className="tag-cloud mt-3.5">
            {Object.entries(stats.tagCloud).slice(0, 14).map(([tag, n]) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`chip ${tagFilter === tag ? '!border-[rgba(233,203,124,0.75)] !bg-[rgba(233,203,124,0.15)] text-[var(--gilded)]' : 'text-muted-foreground'}`}
              >
                #{tag} <span className="tabular opacity-60">{n}</span>
              </button>
            ))}
            {tagFilter && (
              <button onClick={() => setTagFilter(null)} className="chip text-destructive"><X className="h-3 w-3" /> clear</button>
            )}
          </div>
        )}
      </div>

      {/* ————— Composer ————— */}
      <div className="celestial-card corners p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="candle inline-block w-2.5 h-6 rounded-b-full bg-gradient-to-b from-[#f7e6b0] to-[#c99b3f]" aria-hidden="true" />
          <span className="eyebrow">{editing ? 'Revising a page' : 'Open a fresh page'}</span>
          {editing && (
            <button onClick={() => setComposer(emptyComposer)} className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <X className="h-3 w-3" /> stop revising
            </button>
          )}
        </div>

        {/* kind picker */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {KINDS.map((k) => {
            const active = composer.kind === k.id
            return (
              <button
                key={k.id}
                onClick={() => setComposer((c) => ({ ...c, kind: k.id }))}
                title={k.hint}
                className={`rounded-lg px-3 py-1.5 text-xs border transition-all shimmer-sweep ${
                  active ? 'text-foreground' : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                style={active ? { borderColor: k.color, background: 'rgba(233,203,124,0.05)', boxShadow: `0 0 18px -6px ${k.color}` } : undefined}
              >
                <span className="mr-1.5" style={{ color: k.color }}>{k.glyph}</span>{k.label}
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={composer.title}
            onChange={(e) => setComposer((c) => ({ ...c, title: e.target.value }))}
            placeholder="Give the page a title…"
            className="font-display tracking-wide bg-secondary/25"
          />
          <Input
            value={composer.tags}
            onChange={(e) => setComposer((c) => ({ ...c, tags: e.target.value }))}
            placeholder="tags — moonwater, thresholds, venus season…"
            className="bg-secondary/25"
          />
        </div>
        <Textarea
          value={composer.body}
          onChange={(e) => setComposer((c) => ({ ...c, body: e.target.value }))}
          placeholder="Pour the ink… what stirs under tonight’s sky?"
          className="mt-3 min-h-[130px] font-serif-alt text-[16px] leading-[28px] bg-secondary/25 resize-y"
        />

        {/* moods + spread + save */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-1">weather within</span>
          {MOODS.map((m) => (
            <button
              key={m.name}
              onClick={() => setComposer((c) => ({ ...c, mood: c.mood === m.name ? null : m.name }))}
              className={`mood-badge transition-transform ${composer.mood === m.name ? 'scale-105' : 'opacity-55 hover:opacity-90'}`}
              style={{ '--mood-c': m.color } as React.CSSProperties}
            >
              <span>{m.glyph}</span> {m.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mt-4">
          <TarotDrawer
            onAttach={(spread) => setComposer((c) => ({ ...c, kind: 'tarot', spread }))}
            trigger={
              <Button variant="outline" size="sm" className="gap-2 border-[rgba(233,203,124,0.35)]">
                <Hand className="h-3.5 w-3.5" /> {composer.spread ? 'Re-cut the spread' : 'Draw a spread'}
              </Button>
            }
          />
          {composer.spread && (
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(233,203,124,0.35)] bg-[rgba(233,203,124,0.05)] px-3 py-1.5 quill-in">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gilded)]" />
              <span className="text-xs text-[var(--gilded)]">{composer.spread.name}</span>
              <span className="text-[11px] text-muted-foreground">· {composer.spread.cards.map((c) => c.name).join(' · ')}</span>
              <button onClick={() => setComposer((c) => ({ ...c, spread: null }))} aria-label="Detach spread" className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Button onClick={save} disabled={saving} className="wax-seal ml-auto text-white gap-2 px-5">
            {saving ? <Feather className="h-4 w-4 animate-pulse" /> : <BookOpen className="h-4 w-4" />}
            {editing ? 'Seal revision' : 'Seal the page'}
          </Button>
        </div>
      </div>

      {/* ————— Filters ————— */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the shadows…" className="pl-9 bg-secondary/25" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setKindFilter('all')}
            className={`chip ${kindFilter === 'all' ? '!border-[rgba(233,203,124,0.75)] text-[var(--gilded)]' : 'text-muted-foreground'}`}
          >all</button>
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKindFilter(kindFilter === k.id ? 'all' : k.id)}
              className={`chip ${kindFilter === k.id ? '!border-[rgba(233,203,124,0.75)]' : 'text-muted-foreground'}`}
              style={kindFilter === k.id ? { color: k.color } : undefined}
            >
              <span>{k.glyph}</span> {k.label.toLowerCase()}
            </button>
          ))}
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`chip gap-1.5 ${favOnly ? '!border-[rgba(233,203,124,0.75)] text-[var(--gilded)]' : 'text-muted-foreground'}`}
            title="Starred pages only"
          >
            <Star className={`h-3 w-3 ${favOnly ? 'fill-[var(--gilded)]' : ''}`} /> starred
          </button>
        </div>
      </div>

      {/* ————— Entries ————— */}
      {loading && !entries.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 celestial-card" />
          <Skeleton className="h-56 celestial-card" />
        </div>
      ) : !visible.length ? (
        <div className="celestial-card p-10 text-center">
          <Bug className="h-6 w-6 mx-auto text-muted-foreground/50" aria-hidden="true" />
          <div className="font-display tracking-[0.15em] mt-3 text-muted-foreground">NO PAGES YET</div>
          <p className="font-serif-alt italic text-muted-foreground/80 mt-1.5 text-[15px]">
            The book of shadows waits for its first whisper — open a fresh page above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((e, i) => {
              const k = KINDS.find((x) => x.id === e.kind) ?? KINDS[0]
              const mm = moodMeta(e.mood)
              const isOpen = expanded === e.id
              return (
                <motion.article
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  className="journal-paper p-5 flex flex-col min-w-0 overflow-hidden"
                >
                  {/* head */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base" style={{ color: k.color }}>{k.glyph}</span>
                        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: k.color }}>{k.label}</span>
                        {mm && (
                          <span className="mood-badge" style={{ '--mood-c': mm.color } as React.CSSProperties}>
                            <span>{mm.glyph}</span> {mm.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg tracking-wide mt-1.5 truncate" style={{ color: 'var(--moonlight)' }}>{e.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite(e)}
                        aria-label={e.favorite ? 'Unstar page' : 'Star page'}
                        className={`p-1.5 rounded-md transition-all hover:scale-110 ${e.favorite ? 'text-[var(--gilded)]' : 'text-muted-foreground hover:text-[var(--gilded)]'}`}
                      >
                        <Star className={`h-4 w-4 ${e.favorite ? 'fill-[var(--gilded)]' : ''}`} />
                      </button>
                      <button onClick={() => startEdit(e)} aria-label="Revise page" className="p-1.5 rounded-md text-muted-foreground hover:text-[var(--astral)] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => burn(e)}
                        aria-label="Burn page"
                        title={burning === e.id ? 'Click again to burn' : 'Burn this page'}
                        className={`p-1.5 rounded-md transition-colors ${burning === e.id ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'}`}
                      >
                        {burning === e.id ? <Flame className="h-3.5 w-3.5 animate-pulse" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* sky sigil */}
                  <div className="sigil-row mt-2.5">
                    {e.skySigil?.moonPhase && <span title={`${((e.skySigil.illumination ?? 0) * 100).toFixed(0)}% illuminated`}>☽ {e.skySigil.moonPhase}</span>}
                    {e.skySigil?.moonSign && <span>☾ {e.skySigil.moonSign}</span>}
                    {e.skySigil?.sunSign && <span>☉ {e.skySigil.sunSign}</span>}
                    {e.skySigil?.hourRuler && <span title="Planetary hour ruler">♄ {e.skySigil.hourRuler.charAt(0).toUpperCase()}{e.skySigil.hourRuler.slice(1)} hour</span>}
                    <span className="tabular normal-case tracking-normal">{fmtDateTime(e.createdAt)}</span>
                  </div>

                  {/* body preview / full */}
                  {isOpen ? (
                    <p className="font-serif-alt text-[15.5px] leading-relaxed mt-3 text-foreground/85 whitespace-pre-line quill-in">{e.body}</p>
                  ) : (
                    <p className="font-serif-alt text-[15.5px] leading-relaxed mt-3 text-foreground/85 line-clamp-4">
                      <span className="dropcap-initial" aria-hidden="true">{e.body.charAt(0)}</span>
                      {e.body.slice(1)}
                    </p>
                  )}

                  {/* attached spread */}
                  {e.tarotSpread && (
                    <div className="mt-3.5 rounded-lg border border-[rgba(233,203,124,0.28)] bg-[rgba(233,203,124,0.04)] p-3.5">
                      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--gilded)] mb-2.5">
                        ⛤ {e.tarotSpread.name}{e.tarotSpread.question ? ` · “${e.tarotSpread.question}”` : ''}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {e.tarotSpread.cards.map((c, ci) => (
                          <div key={ci} className={`tarot-face ${c.reversed ? 'reversed-card' : ''} rounded-md px-2.5 py-2 w-[92px] text-center`} title={`${c.position} — ${(c.reversed ? c.keywords.reversed : c.keywords.upright).join(', ')}`}>
                            <div className={`text-xl ${c.reversed ? 'rotate-180' : ''}`}>{c.glyph}</div>
                            <div className="text-[9.5px] leading-tight mt-1 text-[var(--gilded)]">{c.name}</div>
                            <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">{c.reversed ? '℞ rev' : c.position.split(' ')[0]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* tags + expand */}
                  <div className="mt-auto pt-3.5 flex items-center justify-between gap-2">
                    <div className="tag-cloud min-h-[22px]">
                      {e.tags.map((t) => (
                        <button key={t} onClick={() => setTagFilter(t)} className="chip !text-[10px] text-muted-foreground">#{t}</button>
                      ))}
                    </div>
                    {e.body.length > 220 && (
                      <button onClick={() => setExpanded(isOpen ? null : e.id)} className="ink-link shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-[var(--gilded)] transition-colors">
                        {isOpen ? 'fold ↑' : 'unfold ↓'}
                      </button>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

function MiniStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 flex items-center gap-2.5 hover:border-[rgba(233,203,124,0.35)] transition-colors">
      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-[var(--gilded)] shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[9.5px] uppercase tracking-widest text-muted-foreground truncate">{label}</div>
        <div className="tabular text-sm font-medium" style={accent ? { color: 'var(--ember)' } : undefined}>{value}</div>
      </div>
    </div>
  )
}
