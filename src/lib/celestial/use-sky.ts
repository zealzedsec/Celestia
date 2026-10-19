'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SkySnapshot, PlanetaryHoursPayload, SkyEvent } from './types'
import { SignHoroscope } from './horoscope'
import { usePreferences } from './preferences'
import { browserTimeZone, utcToWallTime } from './timezone'
import { WORLD_CITIES } from './cities'
import { CITY_PRESETS } from './data'

export interface LocationState {
  lat: number
  lon: number
  name: string
  /** IANA zone of the place, when known — times are shown in it */
  tz?: string
}

interface CelestiaStore {
  location: LocationState
  recent: LocationState[]
  setLocation: (loc: LocationState) => void
}

const sameSpot = (a: LocationState, b: LocationState) => Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01

export const useCelestiaStore = create<CelestiaStore>()(
  persist(
    (set) => ({
      location: { lat: -26.2041, lon: 28.0473, name: 'Johannesburg', tz: 'Africa/Johannesburg' },
      recent: [],
      setLocation: (loc) => set((s) => ({ location: loc, recent: [loc, ...s.recent.filter((r) => !sameSpot(r, loc))].slice(0, 6) })),
    }),
    {
      name: 'celestia-location',
      version: 2,
      // v1 stored no time zone — recover it for known cities
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<CelestiaStore>
        const loc = p.location ?? { lat: -26.2041, lon: 28.0473, name: 'Johannesburg' }
        const known = WORLD_CITIES.find((c) => c.name === loc.name) ?? CITY_PRESETS.find((c) => c.name === loc.name)
        return { location: { ...loc, tz: loc.tz ?? known?.tz }, recent: p.recent ?? [] } as CelestiaStore
      },
    }
  )
)

// ———————————————— shared polling store ————————————————
// Every component that asks for the same URL shares one request, one timer and one cached
// result. Data outlives unmounts for a while, so switching modules renders instantly from
// cache and refreshes in the background (stale-while-revalidate).

interface Snapshot<T> {
  data: T | null
  error: string | null
  loading: boolean
  updatedAt: number | null
}

interface Entry {
  snap: Snapshot<unknown>
  listeners: Set<() => void>
  intervals: Map<symbol, number>
  timer: ReturnType<typeof setInterval> | null
  controller: AbortController | null
  evictTimer: ReturnType<typeof setTimeout> | null
}

const EVICT_AFTER_MS = 5 * 60_000
const entries = new Map<string, Entry>()
const EMPTY: Snapshot<never> = { data: null, error: null, loading: true, updatedAt: null }

function entryFor(url: string): Entry {
  let e = entries.get(url)
  if (!e) {
    e = { snap: EMPTY, listeners: new Set(), intervals: new Map(), timer: null, controller: null, evictTimer: null }
    entries.set(url, e)
  }
  return e
}

function publish(e: Entry, patch: Partial<Snapshot<unknown>>) {
  e.snap = { ...e.snap, ...patch }
  e.listeners.forEach((l) => l())
}

async function load(url: string, force = false) {
  const e = entries.get(url)
  if (!e) return
  if (!force && typeof document !== 'undefined' && document.hidden) return
  e.controller?.abort()
  const controller = new AbortController()
  e.controller = controller
  if (e.snap.data === null) publish(e, { loading: true })
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.error) throw new Error(json?.error ?? `Server responded ${res.status}`)
    if (controller.signal.aborted) return
    publish(e, { data: json, error: null, loading: false, updatedAt: Date.now() })
  } catch (err) {
    if (controller.signal.aborted) return
    publish(e, { error: err instanceof Error ? err.message : 'Connection failed', loading: false })
  }
}

function reschedule(url: string, e: Entry) {
  if (e.timer) clearInterval(e.timer)
  e.timer = null
  if (!e.intervals.size) return
  e.timer = setInterval(() => load(url), Math.min(...e.intervals.values()))
}

function subscribe(url: string, intervalMs: number, listener: () => void) {
  const e = entryFor(url)
  const token = Symbol(url)
  if (e.evictTimer) { clearTimeout(e.evictTimer); e.evictTimer = null }
  const first = e.listeners.size === 0
  e.listeners.add(listener)
  e.intervals.set(token, intervalMs)
  reschedule(url, e)
  // first subscriber (or stale cache) triggers an immediate refresh
  if (first && (!e.snap.updatedAt || Date.now() - e.snap.updatedAt > Math.min(intervalMs, 15_000))) load(url)
  return () => {
    e.listeners.delete(listener)
    e.intervals.delete(token)
    reschedule(url, e)
    if (!e.listeners.size) {
      e.controller?.abort()
      e.evictTimer = setTimeout(() => entries.delete(url), EVICT_AFTER_MS)
    }
  }
}

if (typeof document !== 'undefined') {
  // returning to a background tab refreshes everything on screen at once
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return
    for (const [url, e] of entries) if (e.listeners.size) load(url)
  })
}

/** Shared, abortable, visibility-aware polling fetch. Pass `null` to pause. */
export function usePolling<T>(url: string | null, intervalMs: number): Snapshot<T> & { refresh: () => void } {
  const sub = useCallback((l: () => void) => (url ? subscribe(url, intervalMs, l) : () => {}), [url, intervalMs])
  const get = useCallback(() => (url ? (entryFor(url).snap as Snapshot<T>) : (EMPTY as Snapshot<T>)), [url])
  const snap = useSyncExternalStore(sub, get, () => EMPTY as Snapshot<T>)
  const refresh = useCallback(() => { if (url) load(url, true) }, [url])
  return { ...snap, refresh }
}

const locQuery = (l: LocationState) => `lat=${l.lat}&lon=${l.lon}&name=${encodeURIComponent(l.name)}`

export function useSky(intervalMs = 60000) {
  const location = useCelestiaStore((s) => s.location)
  return usePolling<SkySnapshot>(`/api/sky?${locQuery(location)}`, intervalMs)
}

export function useHours(intervalMs = 30000) {
  const location = useCelestiaStore((s) => s.location)
  return usePolling<PlanetaryHoursPayload>(`/api/hours?${locQuery(location)}`, intervalMs)
}

export function useHoroscopes(intervalMs = 600000) {
  const location = useCelestiaStore((s) => s.location)
  return usePolling<{ date: string; horoscopes: SignHoroscope[] }>(`/api/horoscope?lat=${location.lat}&lon=${location.lon}`, intervalMs)
}

export function useEvents(days: number, moonIngresses = false) {
  return usePolling<{ start: string; days: number; events: SkyEvent[] }>(`/api/events?days=${days}&moon=${moonIngresses ? 1 : 0}`, 15 * 60_000)
}

/**
 * The current time, re-rendering on a fixed cadence (countdowns, "now" markers).
 * Bucketed so every subscriber in the same tick sees the same value.
 */
export function useNow(intervalMs = 1000): number {
  const sub = useCallback((l: () => void) => {
    const id = setInterval(l, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  const bucket = useCallback(() => Math.floor(Date.now() / intervalMs) * intervalMs, [intervalMs])
  return useSyncExternalStore(sub, bucket, bucket)
}

const noopSubscribe = () => () => {}
/** The viewer's IANA time zone ("UTC" during server rendering) */
export function useBrowserTimeZone(): string {
  return useSyncExternalStore(noopSubscribe, browserTimeZone, () => 'UTC')
}

// ———————————————— formatting (honours the clock & time-zone preferences) ————————————————

let clock24 = true
/** the zone every clock time is rendered in (undefined = this computer's zone) */
let displayTz: string | undefined

function resolveDisplayTz(): string | undefined {
  const pref = usePreferences.getState().timeDisplay
  const tz = useCelestiaStore.getState().location.tz
  return pref === 'observatory' && tz ? tz : undefined
}

if (typeof window !== 'undefined') {
  clock24 = usePreferences.getState().clock24
  displayTz = resolveDisplayTz()
  usePreferences.subscribe((s) => { clock24 = s.clock24; displayTz = resolveDisplayTz() })
  useCelestiaStore.subscribe(() => { displayTz = resolveDisplayTz() })
}

/**
 * Keep the pure formatters in sync with the preferences (call once near the root). Returns a key
 * that changes whenever formatting changes, so the shell can re-render the visible module.
 */
export function useFormatSync(): string {
  const c24 = usePreferences((s) => s.clock24)
  const pref = usePreferences((s) => s.timeDisplay)
  const tz = useCelestiaStore((s) => s.location.tz)
  const zone = pref === 'observatory' && tz ? tz : undefined
  useEffect(() => { clock24 = c24; displayTz = zone }, [c24, zone])
  return `${c24 ? 24 : 12}|${zone ?? 'system'}`
}

/** The zone times are displayed in, and a short label for it */
export function useDisplayZone(): { tz: string; label: string; isObservatory: boolean } {
  const pref = usePreferences((s) => s.timeDisplay)
  const loc = useCelestiaStore((s) => s.location)
  const system = useBrowserTimeZone()
  const isObservatory = pref === 'observatory' && !!loc.tz
  const tz = isObservatory ? loc.tz! : system
  return { tz, label: isObservatory ? `${loc.name} time` : 'your local time', isObservatory }
}

export function getDisplayTz(): string | undefined {
  return displayTz
}

const timeOpts = (): Intl.DateTimeFormatOptions => ({ hour: '2-digit', minute: '2-digit', hour12: !clock24 })

export function fmtTime(iso: string | null | undefined, tz?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  try {
    return d.toLocaleTimeString(clock24 ? 'en-GB' : 'en-US', { ...timeOpts(), timeZone: tz ?? displayTz })
  } catch {
    return d.toLocaleTimeString(clock24 ? 'en-GB' : 'en-US', timeOpts())
  }
}

/** Calendar day (YYYY-MM-DD) of an instant in the display zone */
function dayKey(d: Date): string {
  return displayTz ? utcToWallTime(d, displayTz).slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Time with a day hint when it is not today: "06:12 · tomorrow", "21:40 · Thu" */
export function fmtTimeRel(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dayDiff = Math.round((Date.parse(dayKey(d)) - Date.parse(dayKey(new Date()))) / 86400000)
  const t = fmtTime(iso)
  if (dayDiff === 0) return t
  if (dayDiff === 1) return `${t} · tomorrow`
  if (dayDiff === -1) return `${t} · yesterday`
  return `${t} · ${d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: displayTz })}`
}

/** Date in the display zone */
export function fmtDate(iso: string | Date, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('en-GB', { ...opts, timeZone: displayTz })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return fmtDate(iso, { day: '2-digit', month: 'short' }) + ' · ' + fmtTime(iso)
}

/** Fraction of the display-zone day elapsed at an instant (0..1) */
export function dayFraction(iso: string | Date): number {
  const d = new Date(iso)
  if (displayTz) {
    const wall = utcToWallTime(d, displayTz)
    return (Number(wall.slice(11, 13)) * 60 + Number(wall.slice(14, 16))) / 1440
  }
  return (d.getHours() * 60 + d.getMinutes()) / 1440
}

/** "in 3d 4h", "in 42m", "2h ago" */
export function fmtCountdown(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—'
  const ms = new Date(iso).getTime() - now
  const abs = Math.abs(ms)
  const m = Math.floor(abs / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  const body = d >= 1 ? `${d}d ${h % 24}h` : h >= 1 ? `${h}h ${m % 60}m` : `${Math.max(1, m)}m`
  return ms >= 0 ? `in ${body}` : `${body} ago`
}
