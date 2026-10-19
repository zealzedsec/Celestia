'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, MapPin, Search, WifiOff } from 'lucide-react'
import { searchCities } from '@/lib/celestial/cities'

export interface PlaceResult {
  name: string
  country: string
  region?: string
  lat: number
  lon: number
  tz: string
}

/**
 * Type-ahead place search. Built-in cities answer instantly; the worldwide geocoder fills in
 * as you type (debounced, aborted when superseded). Arrow keys + Enter work; Escape closes.
 */
export function PlaceSearch({ onPick, placeholder = 'Search any city or town…', autoFocus, id }: {
  onPick: (p: PlaceResult) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) return
    const controller = new AbortController()
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        const j = await r.json()
        if (controller.signal.aborted) return
        setResults(j.results ?? [])
        setOffline(j.source === 'offline')
      } catch {
        if (!controller.signal.aborted) setOffline(true)
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }, 260)
    return () => { clearTimeout(t); controller.abort() }
  }, [q])

  // close when clicking elsewhere
  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const onChange = (value: string) => {
    setQ(value)
    setHi(0)
    setOpen(true)
    // instant local answers while the network catches up
    setResults(value.trim().length >= 2 ? searchCities(value, 6).map((c) => ({ ...c })) : [])
  }

  const pick = (p: PlaceResult) => {
    onPick(p)
    setQ('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => (h + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (h - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[hi]) }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        id={id}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[hi] ? `${listId}-${hi}` : undefined}
        className="h-9 w-full border border-input bg-background/60 pl-8 pr-8 text-sm outline-none focus:border-[rgba(233,203,124,0.5)]"
      />
      {busy && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto scroll-ethereal bg-[rgba(5,4,10,0.95)] backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.06)] py-1">
          {results.map((p, i) => (
            <li key={`${p.name}-${p.lat}-${p.lon}`} id={`${listId}-${i}`} role="option" aria-selected={i === hi}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(p)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2 text-sm ${i === hi ? 'bg-[rgba(233,203,124,0.08)]' : ''}`}
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--astral)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{[p.region, p.country].filter(Boolean).join(', ')} · {p.tz.replace(/_/g, ' ')}</span>
                </span>
                <span className="tabular text-[10px] text-muted-foreground shrink-0 mt-0.5">{p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°</span>
              </button>
            </li>
          ))}
          {offline && (
            <li className="px-3 py-1.5 text-[10.5px] text-muted-foreground flex items-center gap-1.5 border-t border-white/[0.05]">
              <WifiOff className="h-3 w-3" /> offline — showing built-in cities only
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
