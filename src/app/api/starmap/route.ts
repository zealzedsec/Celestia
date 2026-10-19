import { NextRequest, NextResponse } from 'next/server'
import * as Astronomy from 'astronomy-engine'
import { STARS } from '@/lib/celestial/stars'
import { computeAllPositions, makeObserver } from '@/lib/celestial/astro'
import { jsonError, NO_STORE, parseInstant, parseLocation, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * Live sky-dome payload: horizon coordinates (alt/az) for the bright-star catalog, the Sun,
 * Moon and planets, plus the ecliptic and celestial equator traced across the dome.
 * Star RA/Dec (J2000) are precessed to the true equator & equinox of date before conversion.
 * Optional ?t=ISO renders the dome for any instant (used by the Chronomancer).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const loc = parseLocation(sp)
  if ('error' in loc) return jsonError(loc.error)
  const now = parseInstant(sp.get('t'))
  if ('error' in now) return jsonError(now.error)

  try {
    const time = Astronomy.MakeTime(now)
    const observer = makeObserver(loc.lat, loc.lon)
    const rotJ2000 = Astronomy.Rotation_EQJ_EQD(time)
    const rotEcl = Astronomy.Rotation_ECT_EQD(time)
    const round = (x: number) => Math.round(x * 10) / 10

    // equator-of-date vector → horizon (Horizon() expects RA in sidereal HOURS)
    const toHorizon = (vecDate: Astronomy.Vector) => {
      const sph = Astronomy.SphereFromVector(vecDate)
      const hor = Astronomy.Horizon(time, observer, sph.lon / 15, sph.lat, 'normal')
      return { alt: round(hor.altitude), az: round(hor.azimuth) }
    }

    const stars = STARS.map((s) => {
      const vec = Astronomy.VectorFromSphere({ lat: s.dec, lon: s.ra, dist: 1 }, time)
      return { name: s.name, con: s.con, ...toHorizon(Astronomy.RotateVector(rotJ2000, vec)), mag: s.mag, cls: s.cls, dist: s.dist }
    })

    // great circles sampled every 5°: ecliptic (true, of date) and celestial equator
    const ecliptic = Array.from({ length: 73 }, (_, i) => {
      const lon = i * 5
      return { lon, ...toHorizon(Astronomy.RotateVector(rotEcl, Astronomy.VectorFromSphere({ lat: 0, lon, dist: 1 }, time))) }
    })
    const equator = Array.from({ length: 73 }, (_, i) => toHorizon(Astronomy.VectorFromSphere({ lat: 0, lon: i * 5, dist: 1 }, time)))

    const bodies = computeAllPositions(now, observer, false).map((p) => ({
      id: p.id,
      name: p.name,
      glyph: p.glyph,
      alt: round(p.altitude),
      az: round(p.azimuth),
      mag: p.magnitude,
      retrograde: p.retrograde,
      sign: p.sign,
    }))

    return NextResponse.json({
      timestamp: now.toISOString(),
      location: loc,
      moonPhaseAngle: Astronomy.MoonPhase(now),
      stars,
      bodies,
      ecliptic,
      equator,
    }, { headers: NO_STORE })
  } catch (err) {
    return serverError('starmap', err, 'Sky map failed')
  }
}
