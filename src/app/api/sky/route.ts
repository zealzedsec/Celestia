import { NextRequest, NextResponse } from 'next/server'
import { buildSnapshot } from '@/lib/celestial/snapshot'
import { SkySnapshot } from '@/lib/celestial/types'
import { jsonError, NO_STORE, parseInstant, parseLocation, serverError, TtlCache } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * 30-second micro-cache for LIVE sky queries. The dashboard & planet tracker poll
 * every 60 s, so this halves the ephemeris load while keeping the sky instantaneous.
 * Time-travel queries (?t=…) bypass the cache entirely.
 */
const skyCache = new TtlCache<SkySnapshot>(30_000, 32)

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const loc = parseLocation(sp)
  if ('error' in loc) return jsonError(loc.error)
  const now = parseInstant(sp.get('t'))
  if ('error' in now) return jsonError(now.error)

  const cacheKey = sp.get('t') ? null : `${loc.lat.toFixed(4)}|${loc.lon.toFixed(4)}|${loc.name ?? ''}`
  const hit = cacheKey ? skyCache.get(cacheKey) : undefined
  if (hit) return NextResponse.json(hit, { headers: NO_STORE })

  try {
    const snapshot = buildSnapshot(now, loc.lat, loc.lon, loc.name)
    if (cacheKey) skyCache.set(cacheKey, snapshot)
    return NextResponse.json(snapshot, { headers: NO_STORE })
  } catch (err) {
    return serverError('sky', err, 'Failed to compute the sky')
  }
}
