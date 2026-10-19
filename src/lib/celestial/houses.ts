// Celestia — chart angles & house systems
//
// Angles use apparent sidereal time and the true obliquity of date from astronomy-engine, so
// they share a frame with the planet longitudes (true ecliptic of date).
import * as A from 'astronomy-engine'

export type HouseSystem = 'whole-sign' | 'equal' | 'porphyry' | 'placidus'

export const HOUSE_SYSTEMS: { id: HouseSystem; label: string; blurb: string }[] = [
  { id: 'placidus', label: 'Placidus', blurb: 'Time-based trisection of the diurnal arcs — the modern Western default.' },
  { id: 'whole-sign', label: 'Whole Sign', blurb: 'Each sign is one house, starting from the rising sign — the Hellenistic method.' },
  { id: 'equal', label: 'Equal', blurb: '30° houses measured from the exact Ascendant degree.' },
  { id: 'porphyry', label: 'Porphyry', blurb: 'Each quadrant between the angles divided into three equal spaces.' },
]

export function isHouseSystem(v: unknown): v is HouseSystem {
  return typeof v === 'string' && HOUSE_SYSTEMS.some((h) => h.id === v)
}

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const norm = (x: number) => ((x % 360) + 360) % 360

/** True obliquity of the ecliptic (degrees) */
export function trueObliquity(date: Date): number {
  return A.e_tilt(A.MakeTime(date)).tobl
}

/** Local apparent sidereal time in degrees (= RAMC) */
export function localSiderealDeg(date: Date, lon: number): number {
  return norm(A.SiderealTime(date) * 15 + lon)
}

export interface ChartAngles {
  ramc: number
  obliquity: number
  ascendant: number
  midheaven: number
  descendant: number
  imumCoeli: number
}

export function computeAngles(date: Date, lat: number, lon: number): ChartAngles {
  const ramc = localSiderealDeg(date, lon)
  const eps = trueObliquity(date)
  const θ = ramc * D2R
  const ε = eps * D2R
  const φ = lat * D2R
  const asc = norm(Math.atan2(Math.cos(θ), -(Math.sin(θ) * Math.cos(ε) + Math.tan(φ) * Math.sin(ε))) * R2D)
  const mc = norm(Math.atan2(Math.sin(θ), Math.cos(θ) * Math.cos(ε)) * R2D)
  return { ramc, obliquity: eps, ascendant: asc, midheaven: mc, descendant: norm(asc + 180), imumCoeli: norm(mc + 180) }
}

/** Ecliptic longitude (β = 0) → declination */
function eclDeclination(lonDeg: number, epsDeg: number): number {
  return Math.asin(Math.sin(epsDeg * D2R) * Math.sin(lonDeg * D2R)) * R2D
}

/** Right ascension (degrees) → ecliptic longitude of the ecliptic point with that RA */
function raToEclLon(raDeg: number, epsDeg: number): number {
  return norm(Math.atan2(Math.sin(raDeg * D2R), Math.cos(raDeg * D2R) * Math.cos(epsDeg * D2R)) * R2D)
}

/**
 * Placidus cusp: the ecliptic point whose hour angle is `fraction` of its own semi-arc.
 * `fraction` counts from the MC eastwards: 1/3 → cusp 11, 2/3 → cusp 12, 4/3 → cusp 2, 5/3 → cusp 3.
 * Returns null where the trisection is undefined (circumpolar ecliptic points, |lat| ≳ 66°).
 */
function placidusCusp(ramc: number, lat: number, eps: number, fraction: number): number | null {
  const tanφ = Math.tan(lat * D2R)
  let lon = raToEclLon(ramc + fraction * 90, eps) // first guess: Porphyry-like
  for (let i = 0; i < 80; i++) {
    const δ = eclDeclination(lon, eps)
    const x = -tanφ * Math.tan(δ * D2R)
    if (x < -1 || x > 1) return null
    const dsa = Math.acos(x) * R2D // diurnal semi-arc
    const hourAngleFromMc = fraction <= 1 ? fraction * dsa : dsa + (fraction - 1) * (180 - dsa)
    const next = raToEclLon(ramc + hourAngleFromMc, eps)
    const delta = Math.abs(((next - lon + 540) % 360) - 180)
    lon = next
    if (delta < 1e-9) break
  }
  return lon
}

export interface HouseCusps {
  system: HouseSystem
  /** requested system could not be computed here (polar latitude) and this one was used */
  fallbackFrom: HouseSystem | null
  cusps: number[] // 12 ecliptic longitudes, cusps[0] = house 1
}

export function computeHouses(system: HouseSystem, angles: ChartAngles, lat: number): HouseCusps {
  const { ascendant: asc, midheaven: mc, ramc, obliquity: eps } = angles
  if (system === 'whole-sign') {
    const start = Math.floor(asc / 30) * 30
    return { system, fallbackFrom: null, cusps: Array.from({ length: 12 }, (_, i) => norm(start + i * 30)) }
  }
  if (system === 'equal') {
    return { system, fallbackFrom: null, cusps: Array.from({ length: 12 }, (_, i) => norm(asc + i * 30)) }
  }
  if (system === 'placidus') {
    const c11 = placidusCusp(ramc, lat, eps, 1 / 3)
    const c12 = placidusCusp(ramc, lat, eps, 2 / 3)
    const c2 = placidusCusp(ramc, lat, eps, 4 / 3)
    const c3 = placidusCusp(ramc, lat, eps, 5 / 3)
    if (c11 !== null && c12 !== null && c2 !== null && c3 !== null) {
      const cusps = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12]
      return { system, fallbackFrom: null, cusps }
    }
    return { ...computeHouses('porphyry', angles, lat), fallbackFrom: 'placidus' }
  }
  // Porphyry: trisect each quadrant along the ecliptic
  const quad = (from: number, to: number) => {
    const span = norm(to - from)
    return [from, norm(from + span / 3), norm(from + (2 * span) / 3)]
  }
  const ic = norm(mc + 180)
  const dsc = norm(asc + 180)
  return { system: 'porphyry', fallbackFrom: null, cusps: [...quad(asc, ic), ...quad(ic, dsc), ...quad(dsc, mc), ...quad(mc, asc)] }
}

/** Which house (1..12) contains an ecliptic longitude, for any cusp set */
export function houseOf(lon: number, cusps: number[]): number {
  const L = norm(lon)
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]
    const span = norm(cusps[(i + 1) % 12] - start)
    if (norm(L - start) < span || span === 0) return i + 1
  }
  return 1
}

/** Mean lunar node (Meeus 47.7) — the North Node; the South Node is opposite */
export function meanNorthNode(date: Date): number {
  const T = (A.MakeTime(date).tt) / 36525
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000)
}

/** Part of Fortune — day formula ASC + Moon − Sun, reversed for night births (Sun below horizon) */
export function partOfFortune(asc: number, sunLon: number, moonLon: number, sunAboveHorizon: boolean): number {
  return sunAboveHorizon ? norm(asc + moonLon - sunLon) : norm(asc + sunLon - moonLon)
}
