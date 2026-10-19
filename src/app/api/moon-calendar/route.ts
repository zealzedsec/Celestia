import { NextRequest, NextResponse } from 'next/server'
import * as A from 'astronomy-engine'
import { phaseIndexOf, PHASE_NAMES, PHASE_GLYPHS, ZODIAC, signOfLongitude, formatDegree } from '@/lib/celestial/data'
import { isValidTimeZone, utcToWallTime, zoneOffsetMinutes } from '@/lib/celestial/timezone'
import { jsonError, NO_STORE, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/moon-calendar?year=2026&month=9&zone=Africa/Johannesburg  (or legacy &tz=minutes east of UTC)
 * Each day is sampled at local noon so the row matches the Moon the observer sees that day.
 * Exact quarter instants are attached to the day they fall on in local time.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const now = new Date()
  const year = parseInt(sp.get('year') ?? String(now.getUTCFullYear()), 10)
  const month = parseInt(sp.get('month') ?? String(now.getUTCMonth() + 1), 10)
  if (!(year >= 1900 && year <= 2200) || !(month >= 1 && month <= 12)) return jsonError('Invalid year/month')
  const zoneRaw = sp.get('zone')
  const zone = zoneRaw && isValidTimeZone(zoneRaw) ? zoneRaw : null
  const tzRaw = parseInt(sp.get('tz') ?? '0', 10)
  const fixedTz = Number.isFinite(tzRaw) ? Math.max(-840, Math.min(840, tzRaw)) : 0
  const offsetAt = (utcMs: number) => (zone ? zoneOffsetMinutes(utcMs, zone) : fixedTz)
  const localDateOf = (d: Date) => zone ? utcToWallTime(d, zone).slice(0, 10) : new Date(d.getTime() + fixedTz * 60000).toISOString().slice(0, 10)

  try {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const todayLocal = localDateOf(now)

    // exact quarter moments that fall inside this local month
    const quarters = new Map<string, { name: string; time: string }>()
    const qNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']
    let mq = A.SearchMoonQuarter(new Date(Date.UTC(year, month - 1, 1) - 2 * 86400000))
    while (mq.time.date.getTime() < Date.UTC(year, month, 1) + 2 * 86400000) {
      quarters.set(localDateOf(mq.time.date), { name: qNames[mq.quarter], time: mq.time.date.toISOString() })
      mq = A.NextMoonQuarter(mq)
    }

    const days: Record<string, unknown>[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const noonGuess = Date.UTC(year, month - 1, d, 12, 0, 0)
      const t = new Date(noonGuess - offsetAt(noonGuess) * 60000) // local noon
      const angle = A.MoonPhase(t)
      const idx = phaseIndexOf(angle)
      const m = A.EclipticGeoMoon(t)
      const sg = signOfLongitude(m.lon)
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        phaseAngle: angle,
        phaseIndex: idx,
        phaseName: PHASE_NAMES[idx],
        glyph: PHASE_GLYPHS[idx],
        illumination: A.Illumination(A.Body.Moon, t).phase_fraction,
        sign: sg.sign,
        signGlyph: ZODIAC[sg.signIndex].glyph,
        degree: formatDegree(sg.degreeInSign),
        distanceKm: Math.round(m.dist * 1.495978707e8),
        isToday: iso === todayLocal,
        quarter: quarters.get(iso) ?? null,
      })
    }
    return NextResponse.json({ year, month, tz: zone ?? fixedTz, days }, { headers: NO_STORE })
  } catch (err) {
    return serverError('moon-calendar', err, 'Failed to build moon calendar')
  }
}
