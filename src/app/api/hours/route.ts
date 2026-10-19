import { NextRequest, NextResponse } from 'next/server'
import { computePlanetaryHours } from '@/lib/celestial/hours'
import { jsonError, NO_STORE, parseInstant, parseLocation, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/hours?lat&lon&name&t=ISO — the Chaldean planetary-hour table around an instant
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const loc = parseLocation(sp)
  if ('error' in loc) return jsonError(loc.error)
  const at = parseInstant(sp.get('t'), 1900, 2100)
  if ('error' in at) return jsonError(at.error)
  try {
    return NextResponse.json(computePlanetaryHours(at, loc.lat, loc.lon, loc.name), { headers: NO_STORE })
  } catch (err) {
    return serverError('hours', err, 'Failed to compute planetary hours')
  }
}
