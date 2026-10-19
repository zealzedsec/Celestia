import { NextRequest, NextResponse } from 'next/server'
import { searchCities } from '@/lib/celestial/cities'
import { isValidTimeZone } from '@/lib/celestial/timezone'
import { TtlCache } from '@/lib/api'

export const dynamic = 'force-dynamic'

export interface Place {
  name: string
  country: string
  region?: string
  lat: number
  lon: number
  tz: string
  population?: number
}

const cache = new TtlCache<Place[]>(24 * 3600_000, 256)

/**
 * GET /api/geocode?q=… — worldwide place search with IANA time zones.
 * Built-in gazetteer first (instant, offline), merged with Open-Meteo's free geocoder
 * (no key, no tracking) when the network is reachable. Never fails hard: offline → local only.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ results: [], source: 'none' })

  const local: Place[] = searchCities(q, 6).map((c) => ({ name: c.name, country: c.country, lat: c.lat, lon: c.lon, tz: c.tz }))
  const key = q.toLowerCase()
  let online = cache.get(key)
  let source: 'online' | 'offline' = 'online'

  if (!online) {
    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
      url.searchParams.set('name', q)
      url.searchParams.set('count', '10')
      url.searchParams.set('language', 'en')
      url.searchParams.set('format', 'json')
      const res = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`geocoder ${res.status}`)
      const json = await res.json()
      const raw: Array<Record<string, unknown>> = Array.isArray(json?.results) ? json.results : []
      online = raw
        .map((r) => ({
          name: String(r.name ?? ''),
          country: String(r.country ?? ''),
          region: r.admin1 ? String(r.admin1) : undefined,
          lat: Number(r.latitude),
          lon: Number(r.longitude),
          tz: String(r.timezone ?? ''),
          population: typeof r.population === 'number' ? r.population : undefined,
        }))
        .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 && isValidTimeZone(p.tz))
      cache.set(key, online)
    } catch {
      online = []
      source = 'offline'
    }
  }

  // merge: built-in entries win; drop online duplicates within ~5 km of one
  const merged = [...local]
  for (const p of online) {
    if (!merged.some((m) => Math.abs(m.lat - p.lat) < 0.05 && Math.abs(m.lon - p.lon) < 0.05)) merged.push(p)
  }
  return NextResponse.json({ results: merged.slice(0, 10), source }, { headers: { 'Cache-Control': 'no-store' } })
}
