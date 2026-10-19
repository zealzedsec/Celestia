// Celestia — core astronomy engine wrapper (server-side)
// Powered by astronomy-engine (VSOP87 / ELP-grade ephemeris)
import * as A from 'astronomy-engine'
import { AspectHit, MoonInfo, PlanetPosition, SkyEvent } from './types'
import {
  formatDegree, signOfLongitude, elementOfSignIndex, modalityOfSignIndex,
  phaseIndexOf, PHASE_NAMES, PHASE_GLYPHS, ZODIAC, PLANET_BY_ID,
} from './data'

const AU_KM = 1.495978707e8
const DAY_MS = 86400000
const MOON_RADIUS_KM = 1737.4
/** Full moons closer than this are popularly called supermoons (Nolle's 90% criterion ≈ 361 885 km) */
const SUPERMOON_KM = 361885

export const TRACKED = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const
const RETRO_CAPABLE = new Set(['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
const OUTER = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])

export function bodyIdToEnum(id: string): A.Body {
  switch (id) {
    case 'sun': return A.Body.Sun
    case 'moon': return A.Body.Moon
    case 'mercury': return A.Body.Mercury
    case 'venus': return A.Body.Venus
    case 'mars': return A.Body.Mars
    case 'jupiter': return A.Body.Jupiter
    case 'saturn': return A.Body.Saturn
    case 'uranus': return A.Body.Uranus
    case 'neptune': return A.Body.Neptune
    case 'pluto': return A.Body.Pluto
    default: throw new Error(`Unknown body ${id}`)
  }
}

export function makeObserver(lat: number, lon: number): A.Observer {
  return new A.Observer(lat, lon, 100)
}

/** Unsigned angular separation, 0..180 */
export function angDiff(a: number, b: number): number {
  let d = Math.abs(((a - b) % 360 + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

const norm360 = (x: number) => ((x % 360) + 360) % 360

/** Ecliptic-of-date longitude/latitude of a body */
export function eclipticOf(body: A.Body, date: Date): { lon: number; lat: number; distAU: number } {
  if (body === A.Body.Moon) {
    const m = A.EclipticGeoMoon(date)
    return { lon: m.lon, lat: m.lat, distAU: m.dist }
  }
  const vec = A.GeoVector(body, date, true)
  const ecl = A.Ecliptic(vec)
  return { lon: ecl.elon, lat: ecl.elat, distAU: ecl.vec.Length() }
}

/** Longitude speed in degrees/day by central difference (accurate right through stations) */
export function longitudeSpeed(body: A.Body, date: Date, halfSpanHours = 6): number {
  const h = halfSpanHours * 3600000
  let d = eclipticOf(body, new Date(date.getTime() + h)).lon - eclipticOf(body, new Date(date.getTime() - h)).lon
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d / ((2 * h) / DAY_MS)
}

export function julianDay(date: Date): number {
  // UT-based Julian Day — consistent with the live clock (TT drifts ~69 s ahead of UT)
  return date.getTime() / DAY_MS + 2440587.5
}

function safe<T>(fn: () => T): T | null {
  try { return fn() } catch { return null }
}

export function computePosition(
  id: string,
  date: Date,
  observer: A.Observer,
  opts: { riseSet?: boolean } = {}
): PlanetPosition {
  const body = bodyIdToEnum(id)
  const meta = PLANET_BY_ID[id]
  const ecl = eclipticOf(body, date)
  const signInfo = signOfLongitude(ecl.lon)
  const speed = longitudeSpeed(body, date, id === 'moon' ? 1 : 6)
  const retrograde = speed < 0 && RETRO_CAPABLE.has(id)

  // Equatorial (of date, topocentric, aberration-corrected) → horizon for the observer
  const eq = A.Equator(body, date, observer, true, true)
  const hor = A.Horizon(date, observer, eq.ra, eq.dec, 'normal')

  // Constellation lookup takes J2000 RA/Dec (hours/degrees)
  const consName = safe(() => {
    const eqJ = A.Equator(body, date, observer, false, false)
    return A.Constellation(eqJ.ra, eqJ.dec).name
  }) ?? '—'

  const magnitude = id === 'sun' ? null : safe(() => A.Illumination(body, date).mag)

  let riseTime: string | null = null
  let setTime: string | null = null
  let transitTime: string | null = null
  if (opts.riseSet !== false) {
    riseTime = safe(() => A.SearchRiseSet(body, observer, +1, date, 2)?.date.toISOString() ?? null)
    setTime = safe(() => A.SearchRiseSet(body, observer, -1, date, 2)?.date.toISOString() ?? null)
    transitTime = safe(() => A.SearchHourAngle(body, observer, 0, date).time.date.toISOString())
  }

  return {
    id,
    name: meta.name,
    glyph: meta.glyph,
    longitude: ecl.lon,
    latitude: ecl.lat,
    speed,
    retrograde,
    sign: signInfo.sign,
    signIndex: signInfo.signIndex,
    degreeInSign: signInfo.degreeInSign,
    formattedDegree: `${formatDegree(signInfo.degreeInSign)} ${signInfo.sign}`,
    distanceAU: ecl.distAU,
    distanceKm: Math.round(ecl.distAU * AU_KM),
    raHours: eq.ra,
    decDeg: eq.dec,
    azimuth: hor.azimuth,
    altitude: hor.altitude,
    magnitude,
    constellation: consName,
    riseTime, setTime, transitTime,
    isAboveHorizon: hor.altitude > 0,
    element: elementOfSignIndex(signInfo.signIndex),
    modality: modalityOfSignIndex(signInfo.signIndex),
    // zodiac signs this body rules (modern co-rulers included)
    ruledSigns: ZODIAC.filter((z) => z.ruler.toLowerCase().includes(id)).map((z) => z.name),
  }
}

export function computeAllPositions(date: Date, observer: A.Observer, riseSet = true): PlanetPosition[] {
  return TRACKED.map((id) => computePosition(id, date, observer, { riseSet }))
}

export const ASPECT_TYPES: { type: string; glyph: string; angle: number; orb: number; nature: AspectHit['nature']; major: boolean }[] = [
  { type: 'Conjunction', glyph: '☌', angle: 0, orb: 8, nature: 'dynamic', major: true },
  { type: 'Semisextile', glyph: '⚺', angle: 30, orb: 2.5, nature: 'harmonious', major: false },
  { type: 'Sextile', glyph: '⚹', angle: 60, orb: 5, nature: 'harmonious', major: true },
  { type: 'Square', glyph: '□', angle: 90, orb: 7, nature: 'challenging', major: true },
  { type: 'Trine', glyph: '△', angle: 120, orb: 7, nature: 'harmonious', major: true },
  { type: 'Quincunx', glyph: '⚻', angle: 150, orb: 2.5, nature: 'challenging', major: false },
  { type: 'Opposition', glyph: '☍', angle: 180, orb: 8, nature: 'challenging', major: true },
]

/** Bodies that carry a longitude + daily speed — planets, or chart points (speed 0) */
type Aspectable = Pick<PlanetPosition, 'id' | 'name' | 'longitude' | 'speed'>

export function computeAspects(positions: Aspectable[], _date?: Date, onlyMajor = false): AspectHit[] {
  const hits: AspectHit[] = []
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]
      const b = positions[j]
      const diff = angDiff(a.longitude, b.longitude)
      for (const at of ASPECT_TYPES) {
        if (onlyMajor && !at.major) continue
        const orb = Math.abs(diff - at.angle)
        // tighter orb between two slow outer planets — generational noise otherwise
        const orbLimit = at.orb - (OUTER.has(a.id) && OUTER.has(b.id) ? 2 : 0)
        if (orb > orbLimit) continue
        // applying vs separating: is the orb shrinking over the next six hours?
        const later = angDiff(a.longitude + (a.speed * 6) / 24, b.longitude + (b.speed * 6) / 24)
        hits.push({
          a: a.id, b: b.id, aName: a.name, bName: b.name,
          type: at.type, glyph: at.glyph, angle: at.angle,
          orb: Math.round(orb * 100) / 100,
          nature: at.nature,
          applying: Math.abs(later - at.angle) < orb,
          exactness: Math.max(0, 1 - orb / orbLimit),
        })
        break
      }
    }
  }
  return hits.sort((x, y) => y.exactness - x.exactness)
}

/**
 * Void-of-course Moon: the Moon perfects no further major (Ptolemaic) aspect to the classical
 * planets before it leaves its current sign. Every aspect angle is tested on both sides of the
 * circle (e.g. 90° and 270°), not just those already inside some orb.
 */
export function voidOfCourse(moon: Aspectable, others: Aspectable[], degreeInSign: number): { voc: boolean; nextAspect: string | null } {
  const daysToExit = (30 - degreeInSign) / Math.max(0.05, moon.speed)
  const targets = [0, 60, 90, 120, 180, 240, 270, 300]
  const classical = others.filter((o) => ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(o.id))
  let soonest: { days: number; label: string } | null = null
  for (const o of classical) {
    const rel = moon.speed - o.speed // the Moon always outruns the planets
    if (rel <= 0) continue
    const sep = norm360(moon.longitude - o.longitude)
    for (const t of targets) {
      const needed = norm360(t - sep)
      const days = needed / rel
      if (days > 1e-6 && days < daysToExit && (!soonest || days < soonest.days)) {
        const angle = t > 180 ? 360 - t : t
        const asp = ASPECT_TYPES.find((x) => x.angle === angle)
        soonest = { days, label: `${asp?.type ?? 'aspect'} ${o.name}` }
      }
    }
  }
  return { voc: soonest === null, nextAspect: soonest?.label ?? null }
}

function lastNewMoon(date: Date): Date | null {
  return A.SearchMoonPhase(0, date, -32)?.date ?? null
}

export function computeMoonInfo(date: Date, observer: A.Observer, positions?: PlanetPosition[]): MoonInfo {
  const all = positions ?? computeAllPositions(date, observer, false)
  const pos = positions?.find((p) => p.id === 'moon') ?? computePosition('moon', date, observer, { riseSet: true })
  const phaseAngle = A.MoonPhase(date)
  const illum = A.Illumination(A.Body.Moon, date)
  const pIdx = phaseIndexOf(phaseAngle)

  const newMoon = lastNewMoon(date)
  const ageDays = newMoon ? (date.getTime() - newMoon.getTime()) / DAY_MS : (phaseAngle / 360) * 29.530588
  const moonDayNumber = Math.max(1, Math.min(30, Math.floor(ageDays) + 1))

  // Next named phase: the first 45° waypoint strictly beyond the current bucket
  const targets = [45, 90, 135, 180, 225, 270, 315, 0]
  let best: { t: Date; n: string } | null = null
  for (const a of targets) {
    const ahead = norm360(a - phaseAngle)
    if (ahead < 22.5 || ahead > 337.5) continue
    const r = A.SearchMoonPhase(a, date, 40)
    if (r && (!best || r.date < best.t)) best = { t: r.date, n: PHASE_NAMES[phaseIndexOf(a)] }
  }

  const quarterCycle: { name: string; time: string }[] = []
  let mq = A.SearchMoonQuarter(date)
  const qNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']
  for (let i = 0; i < 5; i++) {
    quarterCycle.push({ name: qNames[mq.quarter], time: mq.time.date.toISOString() })
    mq = A.NextMoonQuarter(mq)
  }

  // Lunar apsides straight from the ephemeris
  let perigee: MoonInfo['perigee'] = null
  let apogee: MoonInfo['apogee'] = null
  let aps = A.SearchLunarApsis(date)
  for (let i = 0; i < 2; i++) {
    const rec = { time: aps.time.date.toISOString(), distanceKm: Math.round(aps.dist_km) }
    if (aps.kind === A.ApsisKind.Pericenter) perigee ??= rec
    else apogee ??= rec
    aps = A.NextLunarApsis(aps)
  }

  const distKm = pos.distanceKm
  const angularDiameterDeg = (2 * Math.atan(MOON_RADIUS_KM / distKm) * 180) / Math.PI

  const voc = voidOfCourse(pos, all.filter((p) => p.id !== 'moon'), pos.degreeInSign)
  const voidUntil = voc.voc ? new Date(date.getTime() + ((30 - pos.degreeInSign) / Math.max(0.05, pos.speed)) * DAY_MS).toISOString() : null

  return {
    phaseAngle,
    phaseName: PHASE_NAMES[pIdx],
    phaseEmoji: PHASE_GLYPHS[pIdx],
    illumination: illum.phase_fraction,
    ageDays,
    sign: pos.sign,
    signIndex: pos.signIndex,
    degreeInSign: pos.degreeInSign,
    formattedDegree: pos.formattedDegree,
    longitude: pos.longitude,
    latitude: pos.latitude,
    distanceKm: distKm,
    angularDiameterDeg,
    isWaxing: phaseAngle < 180,
    nextPhaseName: best?.n ?? 'New Moon',
    nextPhaseTime: (best?.t ?? date).toISOString(),
    quarterCycle,
    perigee,
    apogee,
    constellation: pos.constellation,
    riseTime: pos.riseTime,
    setTime: pos.setTime,
    moonDayNumber,
    voidOfCourse: voc.voc,
    voidUntil,
    nextAspect: voc.nextAspect,
  }
}

// ———————————————————————————— Almanac events ————————————————————————————

const signIndexAt = (body: A.Body, t: number) => Math.floor(norm360(eclipticOf(body, new Date(t)).lon) / 30) % 12

/** All sign ingresses of a body in [from, to] — retrograde re-entries included */
function findIngresses(id: string, from: number, to: number, stepMs: number): SkyEvent[] {
  const body = bodyIdToEnum(id)
  const meta = PLANET_BY_ID[id]
  const out: SkyEvent[] = []
  let tPrev = from
  let sPrev = signIndexAt(body, tPrev)
  for (let t = from + stepMs; t <= to + stepMs; t += stepMs) {
    const tc = Math.min(t, to)
    const s = signIndexAt(body, tc)
    if (s !== sPrev) {
      let a = tPrev, b = tc
      for (let i = 0; i < 40 && b - a > 30000; i++) {
        const mid = (a + b) / 2
        if (signIndexAt(body, mid) === sPrev) a = mid; else b = mid
      }
      const sign = ZODIAC[s]
      const backwards = (s - sPrev + 12) % 12 === 11
      out.push({
        title: `${meta.name} enters ${sign.name}`, kind: 'ingress', glyph: meta.glyph, time: new Date(b).toISOString(),
        detail: backwards ? `${meta.name} slips back into ${sign.name} by retrograde motion` : `${meta.name} crosses into ${sign.element.toLowerCase()} ${sign.modality.toLowerCase()} ${sign.name} ${sign.glyph}`,
        body: id,
      })
    }
    if (tc >= to) break
    tPrev = tc
    sPrev = s
  }
  return out
}

/** Retrograde & direct stations in [from, to] (zero crossings of longitude speed) */
function findStations(id: string, from: number, to: number, stepMs: number): SkyEvent[] {
  const body = bodyIdToEnum(id)
  const meta = PLANET_BY_ID[id]
  const out: SkyEvent[] = []
  let tPrev = from
  let vPrev = longitudeSpeed(body, new Date(tPrev))
  for (let t = from + stepMs; t <= to; t += stepMs) {
    const v = longitudeSpeed(body, new Date(t))
    if (Math.sign(v) !== Math.sign(vPrev) && v !== 0) {
      let a = tPrev, b = t
      for (let i = 0; i < 40 && b - a > 60000; i++) {
        const mid = (a + b) / 2
        if (Math.sign(longitudeSpeed(body, new Date(mid))) === Math.sign(vPrev)) a = mid; else b = mid
      }
      const goingRetro = v < 0
      const at = signOfLongitude(eclipticOf(body, new Date(b)).lon)
      out.push({
        title: `${meta.name} stations ${goingRetro ? 'retrograde' : 'direct'}`, kind: 'retrograde', glyph: meta.glyph,
        time: new Date(b).toISOString(),
        detail: `${goingRetro ? 'Apparent backward motion begins' : 'Forward motion resumes'} at ${formatDegree(at.degreeInSign)} ${at.sign}`,
        body: id,
      })
    }
    tPrev = t
    vPrev = v
  }
  return out
}

export interface EventOptions {
  days?: number
  /** include the Moon's ~13 sign ingresses per month */
  moonIngresses?: boolean
}

/** Upcoming notable events: phases, ingresses, stations, elongations, apsides, eclipses, seasons */
export function computeUpcomingEvents(date: Date, opts: EventOptions = {}): SkyEvent[] {
  const days = Math.max(1, Math.min(400, opts.days ?? 45))
  const from = date.getTime()
  const to = from + days * DAY_MS
  const events: SkyEvent[] = []

  // Lunar phases — with supermoon / micromoon flags on full moons
  const qNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']
  const qGlyphs = ['🌑', '🌓', '🌕', '🌗']
  let mq = A.SearchMoonQuarter(date)
  while (mq.time.date.getTime() <= to) {
    let detail = 'Lunar quarter turn'
    const moonAt = eclipticOf(A.Body.Moon, mq.time.date)
    const distKm = moonAt.distAU * AU_KM
    const sign = signOfLongitude(moonAt.lon)
    if (mq.quarter === 2) detail = distKm < SUPERMOON_KM ? `Supermoon in ${sign.sign} — ${Math.round(distKm).toLocaleString('en-US')} km` : `Full Moon in ${sign.sign}`
    else if (mq.quarter === 0) detail = `New Moon in ${sign.sign} — seed time`
    else detail = `${qNames[mq.quarter]} in ${sign.sign}`
    events.push({ title: mq.quarter === 2 && distKm < SUPERMOON_KM ? 'Super Full Moon' : qNames[mq.quarter], kind: 'moonphase', glyph: qGlyphs[mq.quarter], time: mq.time.date.toISOString(), detail, body: 'moon' })
    mq = A.NextMoonQuarter(mq)
  }

  // Lunar perigee / apogee
  let aps = A.SearchLunarApsis(date)
  while (aps.time.date.getTime() <= to) {
    const peri = aps.kind === A.ApsisKind.Pericenter
    events.push({ title: peri ? 'Lunar perigee' : 'Lunar apogee', kind: 'apsis', glyph: peri ? '◉' : '○', time: aps.time.date.toISOString(), detail: `Moon ${peri ? 'nearest' : 'farthest'} — ${Math.round(aps.dist_km).toLocaleString('en-US')} km`, body: 'moon' })
    aps = A.NextLunarApsis(aps)
  }

  // Ingresses: step sizes tuned to each body's speed
  const ingressStep: Record<string, number> = { sun: DAY_MS, mercury: DAY_MS / 2, venus: DAY_MS / 2, mars: DAY_MS, jupiter: 2 * DAY_MS, saturn: 3 * DAY_MS, uranus: 5 * DAY_MS, neptune: 5 * DAY_MS, pluto: 5 * DAY_MS }
  for (const [id, step] of Object.entries(ingressStep)) events.push(...findIngresses(id, from, to, step))
  if (opts.moonIngresses) events.push(...findIngresses('moon', from, to, DAY_MS / 8))

  // Stations
  const stationStep: Record<string, number> = { mercury: DAY_MS, venus: DAY_MS, mars: DAY_MS, jupiter: 2 * DAY_MS, saturn: 2 * DAY_MS, uranus: 3 * DAY_MS, neptune: 3 * DAY_MS, pluto: 3 * DAY_MS }
  for (const [id, step] of Object.entries(stationStep)) events.push(...findStations(id, from, to, step))

  // Greatest elongations of the inferior planets — best visibility windows
  for (const id of ['mercury', 'venus'] as const) {
    let t = date
    for (let i = 0; i < 6; i++) {
      const el = safe(() => A.SearchMaxElongation(bodyIdToEnum(id), t))
      if (!el || el.time.date.getTime() > to) break
      const meta = PLANET_BY_ID[id]
      events.push({ title: `${meta.name} greatest elongation`, kind: 'elongation', glyph: meta.glyph, time: el.time.date.toISOString(), detail: `${el.elongation.toFixed(1)}° from the Sun — best seen in the ${el.visibility} sky`, body: id })
      t = new Date(el.time.date.getTime() + 10 * DAY_MS)
    }
  }

  // Seasons
  for (const y of new Set([date.getUTCFullYear(), new Date(to).getUTCFullYear()])) {
    const s = safe(() => A.Seasons(y))
    if (!s) continue
    for (const item of [
      { n: 'March Equinox', t: s.mar_equinox }, { n: 'June Solstice', t: s.jun_solstice },
      { n: 'September Equinox', t: s.sep_equinox }, { n: 'December Solstice', t: s.dec_solstice },
    ]) {
      const ms = item.t.date.getTime()
      if (ms > from && ms <= to) events.push({ title: item.n, kind: 'season', glyph: '❋', time: item.t.date.toISOString(), detail: 'Solar turning point — the Sun enters a cardinal sign', body: 'sun' })
    }
  }

  // Eclipses — every one inside the window
  const lunarKinds: Record<string, string> = { penumbral: 'Penumbral', partial: 'Partial', total: 'Total' }
  let le = safe(() => A.SearchLunarEclipse(date))
  while (le && le.peak.date.getTime() <= to) {
    events.push({ title: `${lunarKinds[le.kind] ?? ''} Lunar Eclipse`.trim(), kind: 'eclipse', glyph: '🌘', time: le.peak.date.toISOString(), detail: `${lunarKinds[le.kind] ?? 'Lunar'} eclipse · ${Math.round(le.sd_total || le.sd_partial || le.sd_penum)} min semi-duration · visible wherever the Moon is up`, body: 'moon' })
    le = safe(() => A.NextLunarEclipse(le!.peak))
  }
  const solarKinds: Record<string, string> = { partial: 'Partial', annular: 'Annular', total: 'Total', hybrid: 'Hybrid' }
  let se = safe(() => A.SearchGlobalSolarEclipse(date))
  while (se && se.peak.date.getTime() <= to) {
    const where = se.latitude !== undefined && se.longitude !== undefined ? ` · peak near ${se.latitude.toFixed(0)}°, ${se.longitude.toFixed(0)}°` : ''
    events.push({ title: `${solarKinds[se.kind] ?? ''} Solar Eclipse`.trim(), kind: 'eclipse', glyph: '🌑', time: se.peak.date.toISOString(), detail: `${solarKinds[se.kind] ?? 'Solar'} eclipse${where}`, body: 'sun' })
    se = safe(() => A.NextGlobalSolarEclipse(se!.peak))
  }

  return events
    .filter((e) => { const ms = new Date(e.time).getTime(); return ms >= from && ms <= to })
    .sort((x, y) => new Date(x.time).getTime() - new Date(y.time).getTime())
}

/**
 * The current solar day for an observer. While the Sun is up this is today's sunrise and the
 * coming sunset; at night it is the next sunrise and the sunset after it. Every twilight time is
 * anchored to that same day, so the dashboard never shows "tomorrow's sunset" at noon.
 */
export function sunTimesFor(date: Date, observer: A.Observer) {
  const H = 3600000
  const nextRise = safe(() => A.SearchRiseSet(A.Body.Sun, observer, +1, date, 2)?.date ?? null)
  const nextSet = safe(() => A.SearchRiseSet(A.Body.Sun, observer, -1, date, 2)?.date ?? null)
  const sunUp = !!nextSet && (!nextRise || nextSet < nextRise)

  let sunrise: Date | null
  let sunset: Date | null
  if (sunUp) {
    sunrise = safe(() => A.SearchRiseSet(A.Body.Sun, observer, +1, new Date(nextSet!.getTime() - 26 * H), 2)?.date ?? null)
    if (sunrise && sunrise > date) sunrise = null // polar edge: the rise found is not today's
    sunset = nextSet
  } else {
    sunrise = nextRise
    sunset = nextRise ? safe(() => A.SearchRiseSet(A.Body.Sun, observer, -1, nextRise, 2)?.date ?? null) : null
  }

  const cross = (dir: 1 | -1, alt: number, from: Date | null, spanDays: number) =>
    from ? safe(() => A.SearchAltitude(A.Body.Sun, observer, dir, from, spanDays, alt)?.date.toISOString() ?? null) : null
  const before = (d: Date | null, hours: number) => (d ? new Date(d.getTime() - hours * H) : null)

  const transit = safe(() => A.SearchHourAngle(A.Body.Sun, observer, 0, sunrise ?? date).time.date.toISOString())
  const dayLengthMinutes = sunrise && sunset && sunset > sunrise ? Math.round((sunset.getTime() - sunrise.getTime()) / 60000) : null

  return {
    sunrise: sunrise?.toISOString() ?? null,
    sunset: sunset?.toISOString() ?? null,
    transit,
    dayLengthMinutes,
    // dawn crossings searched in the hours before sunrise, dusk crossings in the hours after sunset
    astroDawn: cross(+1, -18, before(sunrise, 5), 0.25),
    nauticalDawn: cross(+1, -12, before(sunrise, 4), 0.2),
    civilDawn: cross(+1, -6, before(sunrise, 3), 0.15),
    goldenHourEnd: cross(+1, 6, sunrise, 0.2),
    goldenHourStart: cross(-1, 6, before(sunset, 4), 0.2),
    civilDusk: cross(-1, -6, sunset, 0.15),
    nauticalDusk: cross(-1, -12, sunset, 0.2),
    astroDusk: cross(-1, -18, sunset, 0.25),
  }
}
