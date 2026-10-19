import { NextRequest, NextResponse } from 'next/server'
import { generateDailyHoroscopes, SignHoroscope } from '@/lib/celestial/horoscope'
import { jsonError, NO_STORE, parseLocation, serverError, TtlCache } from '@/lib/api'

export const dynamic = 'force-dynamic'

// horoscopes move with the Moon (~0.5°/hour) — a 10-minute cache per location is plenty fresh
const cache = new TtlCache<SignHoroscope[]>(10 * 60_000, 32)

export async function GET(req: NextRequest) {
  const loc = parseLocation(req.nextUrl.searchParams)
  if ('error' in loc) return jsonError(loc.error)
  try {
    const key = `${loc.lat.toFixed(2)}|${loc.lon.toFixed(2)}`
    let horoscopes = cache.get(key)
    if (!horoscopes) {
      horoscopes = generateDailyHoroscopes(new Date(), loc.lat, loc.lon)
      cache.set(key, horoscopes)
    }
    return NextResponse.json({ date: new Date().toISOString(), horoscopes }, { headers: NO_STORE })
  } catch (err) {
    return serverError('horoscope', err, 'Failed to generate horoscopes')
  }
}
