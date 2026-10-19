// Celestia — Natal chart computation
// Real angles (apparent sidereal time + true obliquity), four house systems, lunar nodes and
// the Part of Fortune. Birth wall time is converted to UTC with an explicit offset — never via the
// server's own time zone.
import * as A from 'astronomy-engine'
import { ChartPoint, NatalChartPayload, PlanetPosition } from './types'
import { ZODIAC, formatDegree, signOfLongitude, elementOfSignIndex, modalityOfSignIndex, PHASE_NAMES, phaseIndexOf } from './data'
import { computePosition, computeAspects, julianDay } from './astro'
import { computeAngles, computeHouses, houseOf, meanNorthNode, partOfFortune, HouseSystem } from './houses'
import { wallTimeToUtc } from './timezone'

/** Ascendant longitude for a UTC instant — kept for the synastry engine and older callers */
export function ascendantLongitude(date: Date, lat: number, lon: number): number {
  return computeAngles(date, lat, lon).ascendant
}

export function midheavenLongitude(date: Date, lon: number): number {
  return computeAngles(date, 0, lon).midheaven
}

const INTERPRETATIONS: Record<string, (sign: string, house: number, extra: string) => string> = {
  sun: (s, h, x) => `The Sun in ${s} (house ${h}) crowns the identity with the essence of ${s.toLowerCase()} energy${x}. This is the vital core — the person you are growing into. In the ${h}${ordinal(h)} house of life, radiance expresses through ${houseTheme(h)}.`,
  moon: (s, h, x) => `The Moon in ${s} (house ${h}) colours the emotional tides${x}. Instinct arrives in the language of ${s.toLowerCase()}; safety is found there. Its placement in the ${h}${ordinal(h)} house reveals where the heart seeks shelter: ${houseTheme(h)}.`,
  mercury: (s, h, x) => `Mercury in ${s} (house ${h}) shapes the voice of the mind${x}. Thought flows like ${s.toLowerCase()} quicksilver, and communication finds its stage in the ${h}${ordinal(h)} house — ${houseTheme(h)}.`,
  venus: (s, h, x) => `Venus in ${s} (house ${h}) gilds the way one loves and creates beauty${x}. Attraction wears ${s.toLowerCase()} robes, and the garden of pleasure blooms in the ${h}${ordinal(h)} house: ${houseTheme(h)}.`,
  mars: (s, h, x) => `Mars in ${s} (house ${h}) forges the sword of desire${x}. Action arrives with ${s.toLowerCase()} heat, and the warrior fights for the ${h}${ordinal(h)} house domain: ${houseTheme(h)}.`,
  jupiter: (s, h, x) => `Jupiter in ${s} (house ${h}) opens the gates of expansion${x}. Fortune favours ${s.toLowerCase()} qualities, and luck ripens in the ${h}${ordinal(h)} house — ${houseTheme(h)}.`,
  saturn: (s, h, x) => `Saturn in ${s} (house ${h}) sets the great examination${x}. Mastery is demanded of ${s.toLowerCase()} virtues, and karma's schoolhouse stands in the ${h}${ordinal(h)} house: ${houseTheme(h)}.`,
  uranus: (s, h, x) => `Uranus in ${s} (house ${h}) sends lightning through the life${x}. Freedom is demanded in the ${s.toLowerCase()} manner, and revolution strikes in the ${h}${ordinal(h)} house: ${houseTheme(h)}.`,
  neptune: (s, h, x) => `Neptune in ${s} (house ${h}) dissolves boundaries${x}. The dream speaks ${s.toLowerCase()}, and the mist settles over the ${h}${ordinal(h)} house — ${houseTheme(h)}.`,
  pluto: (s, h, x) => `Pluto in ${s} (house ${h}) buries and resurrects${x}. Transformation arrives as ${s.toLowerCase()} fire, burning deepest in the ${h}${ordinal(h)} house: ${houseTheme(h)}.`,
  ascendant: (s) => `The Ascendant in ${s} is the mask and the door — the first breath the world receives of you. It filters every experience through ${s.toLowerCase()} perception.`,
  northNode: (s, h) => `The North Node in ${s} (house ${h}) points the soul's compass: growth arrives by leaning into ${s.toLowerCase()} lessons and the ${h}${ordinal(h)} house arena of ${houseTheme(h)}.`,
}

export function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
}

function houseTheme(h: number): string {
  const themes = [
    'self-image and first impressions', 'money, values and possessions', 'communication, siblings and short journeys',
    'home, roots and the private soul', 'romance, creativity and children', 'daily work, health and service',
    'partnership and the sacred mirror', 'death, rebirth and shared depths', 'philosophy, travel and higher learning',
    'career, honour and public standing', 'friendships, hopes and alliances', 'the hidden, the mystic and the undoing',
  ]
  return themes[h - 1] ?? 'life'
}

const BASE = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
const WEIGHTS: Record<string, number> = { sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 0.5, neptune: 0.5, pluto: 0.5 }

function point(id: string, name: string, glyph: string, lon: number, cusps: number[], wholeSignAsc: number): ChartPoint {
  const s = signOfLongitude(lon)
  return {
    id, name, glyph, longitude: lon, sign: s.sign, signIndex: s.signIndex, degreeInSign: s.degreeInSign,
    formattedDegree: `${formatDegree(s.degreeInSign)} ${s.sign}`,
    house: houseOf(lon, cusps),
    houseWholeSign: ((s.signIndex - wholeSignAsc + 12) % 12) + 1,
  }
}

export interface NatalInput {
  name: string
  birthDate: string // local wall time "YYYY-MM-DDTHH:mm"
  lat: number
  lon: number
  locationName: string
  tzOffsetMinutes: number
  timeZone?: string | null
  houseSystem?: HouseSystem
}

export function computeNatalChart(input: NatalInput): NatalChartPayload {
  const { name, birthDate, lat, lon, locationName, tzOffsetMinutes } = input
  const houseSystem = input.houseSystem ?? 'placidus'
  const utcDate = wallTimeToUtc(birthDate, tzOffsetMinutes)
  if (!Number.isFinite(utcDate.getTime())) throw new Error('Invalid birth date')
  const observer = new A.Observer(lat, lon, 100)

  const angles = computeAngles(utcDate, lat, lon)
  const ascSign = signOfLongitude(angles.ascendant)
  const mcSign = signOfLongitude(angles.midheaven)
  const houseSet = computeHouses(houseSystem, angles, lat)

  const planets: NatalChartPayload['planets'] = BASE.map((id) => {
    const p: PlanetPosition = computePosition(id, utcDate, observer, { riseSet: false })
    return { ...p, house: houseOf(p.longitude, houseSet.cusps), houseWholeSign: ((p.signIndex - ascSign.signIndex + 12) % 12) + 1 }
  })
  const sun = planets[0]
  const moon = planets[1]

  const nn = meanNorthNode(utcDate)
  const points: ChartPoint[] = [
    point('northNode', 'North Node', '☊', nn, houseSet.cusps, ascSign.signIndex),
    point('southNode', 'South Node', '☋', (nn + 180) % 360, houseSet.cusps, ascSign.signIndex),
    point('fortune', 'Part of Fortune', '⊗', partOfFortune(angles.ascendant, sun.longitude, moon.longitude, sun.altitude > 0), houseSet.cusps, ascSign.signIndex),
  ]

  const houses = houseSet.cusps.map((cusp, i) => {
    const s = signOfLongitude(cusp)
    return { index: i + 1, sign: s.sign, signIndex: s.signIndex, cuspLongitude: cusp, glyph: ZODIAC[s.signIndex].glyph, formatted: `${formatDegree(s.degreeInSign)} ${s.sign}` }
  })

  // aspects: planets + the two angles + the North Node (angles & node have no motion of their own)
  const aspects = computeAspects([
    ...planets,
    { id: 'asc', name: 'Ascendant', longitude: angles.ascendant, speed: 0 },
    { id: 'mc', name: 'Midheaven', longitude: angles.midheaven, speed: 0 },
    { id: 'northNode', name: 'North Node', longitude: nn, speed: -0.053 },
  ], utcDate, true).filter((a) => !(['asc', 'mc', 'northNode'].includes(a.a) && ['asc', 'mc', 'northNode'].includes(a.b)))

  // Balance
  const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  const modalities: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 }
  let yang = 0, yin = 0
  for (const p of planets) {
    const w = WEIGHTS[p.id] ?? 1
    elements[p.element] += w
    modalities[p.modality] += w
    if (p.signIndex % 2 === 0) yang += w; else yin += w
  }
  elements[elementOfSignIndex(ascSign.signIndex)] += 2
  modalities[modalityOfSignIndex(ascSign.signIndex)] += 2
  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0]
  const dominantModality = Object.entries(modalities).sort((a, b) => b[1] - a[1])[0][0]

  // Chart ruler = traditional ruler of the rising sign; hemisphere & sect emphasis
  const chartRuler = ZODIAC[ascSign.signIndex].ruler.split(' ')[0]
  const isDayChart = sun.altitude > 0
  const hemispheres = {
    above: planets.filter((p) => p.house >= 7).length,
    below: planets.filter((p) => p.house <= 6).length,
    east: planets.filter((p) => p.house >= 10 || p.house <= 3).length,
    west: planets.filter((p) => p.house >= 4 && p.house <= 9).length,
  }

  const phaseAngle = A.MoonPhase(utcDate)
  const illum = A.Illumination(A.Body.Moon, utcDate)

  const interp = (p: (typeof planets)[number], extra: string) => INTERPRETATIONS[p.id](p.sign, p.house, extra)
  const interpretations = [
    { planet: 'Sun', placement: `Sun in ${sun.sign}, house ${sun.house}`, text: interp(sun, `, answering the call “${ZODIAC[sun.signIndex].keyword}”`) },
    { planet: 'Moon', placement: `Moon in ${moon.sign}, house ${moon.house}`, text: interp(moon, '') },
    { planet: 'Ascendant', placement: `ASC in ${ascSign.sign}`, text: INTERPRETATIONS.ascendant(ascSign.sign, 1, '') },
    ...planets.slice(2).map((p) => ({
      planet: p.name,
      placement: `${p.name} in ${p.sign}, house ${p.house}${p.retrograde ? ' ℞' : ''}`,
      text: interp(p, p.retrograde ? ', turned inward by retrograde motion' : ''),
    })),
    { planet: 'North Node', placement: `☊ in ${points[0].sign}, house ${points[0].house}`, text: INTERPRETATIONS.northNode(points[0].sign, points[0].house, '') },
  ]

  const fmt = (lonDeg: number) => { const d = signOfLongitude(lonDeg); return { longitude: lonDeg, sign: d.sign, signIndex: d.signIndex, formatted: `${formatDegree(d.degreeInSign)} ${d.sign}` } }

  return {
    input: { name, birthDate, lat, lon, locationName, tzOffsetMinutes, timeZone: input.timeZone ?? null },
    utcDate: utcDate.toISOString(),
    julianDay: julianDay(utcDate),
    houseSystem: houseSet.system,
    houseSystemFallback: houseSet.fallbackFrom,
    planets,
    points,
    angles: {
      ascendant: { ...fmt(angles.ascendant), signIndex: ascSign.signIndex },
      midheaven: { ...fmt(angles.midheaven), signIndex: mcSign.signIndex },
      descendant: fmt(angles.descendant),
      imumCoeli: fmt(angles.imumCoeli),
    },
    houses,
    aspects,
    balance: {
      elements, modalities,
      polarities: { yang: Math.round(yang * 10) / 10, yin: Math.round(yin * 10) / 10 },
      dominantElement, dominantModality, chartRuler,
      sunSign: sun.sign, moonSign: moon.sign, risingSign: ascSign.sign,
      isDayChart, hemispheres,
    },
    lunarPhaseAtBirth: { angle: phaseAngle, name: PHASE_NAMES[phaseIndexOf(phaseAngle)], illumination: illum.phase_fraction },
    interpretations,
  }
}
