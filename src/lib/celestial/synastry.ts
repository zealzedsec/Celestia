// Celestia — Synastry engine: cross-aspects between two natal charts + resonance score
import * as A from 'astronomy-engine'
import { AspectHit, PlanetPosition } from './types'
import { computePosition } from './astro'
import { signOfLongitude, formatDegree, elementOfSignIndex } from './data'
import { ascendantLongitude } from './natal'
import { wallTimeToUtc } from './timezone'

/** Tighter orbs than transit work — synastry tradition favours precision */
const SYNASTRY_ASPECTS: { type: string; glyph: string; angle: number; orb: number; nature: AspectHit['nature']; weight: number }[] = [
  { type: 'Conjunction', glyph: '☌', angle: 0, orb: 7, nature: 'dynamic', weight: 1.0 },
  { type: 'Sextile', glyph: '⚹', angle: 60, orb: 4, nature: 'harmonious', weight: 0.6 },
  { type: 'Square', glyph: '□', angle: 90, orb: 5.5, nature: 'challenging', weight: 0.8 },
  { type: 'Trine', glyph: '△', angle: 120, orb: 5.5, nature: 'harmonious', weight: 0.9 },
  { type: 'Opposition', glyph: '☍', angle: 180, orb: 6.5, nature: 'challenging', weight: 0.9 },
]

/** Luminaries & personal planets weigh most in the weave */
const SYNASTRY_WEIGHTS: Record<string, number> = {
  sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1.4, saturn: 1.4, uranus: 0.7, neptune: 0.7, pluto: 0.7,
}

const ASPECT_STORY: Record<string, string> = {
  Conjunction: 'two souls fuse into one current — identification, magnetism, no distance',
  Sextile: 'opportunity knocks politely — each opens doors the other walks through',
  Square: 'friction that forges — growth through delicious, provoking challenge',
  Trine: 'grace flows unasked — ease, affinity, an innate shared language',
  Opposition: 'the sacred mirror — attraction across an axis of polarity',
}

export interface SynastryAspect extends Omit<AspectHit, 'applying'> {
  aChart: 'A' | 'B'
  aBody: string
  bBody: string
  story: string
  weightScore: number
}

export interface SynastryBody {
  id: string
  name: string
  glyph: string
  longitude: number
  sign: string
  degreeInSign: number
  formattedDegree: string
  retrograde: boolean
  houseWholeSign: number | null
}

export interface SynastryChartSide {
  name: string
  locationName: string
  birthDate: string
  utcDate: string
  bodies: SynastryBody[]
  ascendant: { formatted: string; sign: string; signIndex: number }
  sunSign: string
  moonSign: string
  risingSign: string
  elements: Record<string, number>
}

export interface SynastryPayload {
  a: SynastryChartSide
  b: SynastryChartSide
  aspects: SynastryAspect[]
  score: number // 0..100 resonance
  verdict: string
  bonds: { label: string; text: string }[]
  topBonds: SynastryAspect[]
  /** where each person's planets fall in the other's whole-sign houses */
  overlays: { aInB: Overlay[]; bInA: Overlay[] }
}

export interface Overlay {
  body: string
  name: string
  glyph: string
  house: number
}

function angDiff(a: number, b: number): number {
  let d = Math.abs(((a - b) % 360 + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

function sideOf(
  name: string,
  birthDateLocal: string,
  tzOffsetMinutes: number,
  lat: number,
  lon: number,
  locationName: string
): SynastryChartSide {
  const utcDate = wallTimeToUtc(birthDateLocal, tzOffsetMinutes)
  if (!Number.isFinite(utcDate.getTime())) throw new Error('Invalid birth date')
  const observer = new A.Observer(lat, lon, 100)
  const ascLon = ascendantLongitude(utcDate, lat, lon)
  const ascSign = signOfLongitude(ascLon)
  const ids = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

  const bodies: SynastryBody[] = ids.map((id) => {
    const p: PlanetPosition = computePosition(id, utcDate, observer, { riseSet: false })
    const house = Math.floor(((p.signIndex - ascSign.signIndex) % 12 + 12) % 12) + 1
    return {
      id, name: p.name, glyph: p.glyph,
      longitude: p.longitude, sign: p.sign, degreeInSign: p.degreeInSign,
      formattedDegree: `${formatDegree(p.degreeInSign)} ${p.sign}`,
      retrograde: p.retrograde, houseWholeSign: house,
    }
  })

  const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  const weights: Record<string, number> = { sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 0.5, neptune: 0.5, pluto: 0.5 }
  for (const b of bodies) {
    const sg = signOfLongitude(b.longitude)
    elements[elementOfSignIndex(sg.signIndex)] += weights[b.id] ?? 1
  }
  elements[elementOfSignIndex(ascSign.signIndex)] += 2

  return {
    name, locationName, birthDate: birthDateLocal, utcDate: utcDate.toISOString(),
    bodies,
    ascendant: { formatted: `${formatDegree(ascSign.degreeInSign)} ${ascSign.sign}`, sign: ascSign.sign, signIndex: ascSign.signIndex },
    sunSign: bodies[0].sign,
    moonSign: bodies[1].sign,
    risingSign: ascSign.sign,
    elements,
  }
}

export function computeSynastry(
  aIn: { name: string; birthDate: string; lat: number; lon: number; locationName: string; tzOffsetMinutes: number },
  bIn: { name: string; birthDate: string; lat: number; lon: number; locationName: string; tzOffsetMinutes: number }
): SynastryPayload {
  const a = sideOf(aIn.name || 'The First', aIn.birthDate, aIn.tzOffsetMinutes, aIn.lat, aIn.lon, aIn.locationName)
  const b = sideOf(bIn.name || 'The Second', bIn.birthDate, bIn.tzOffsetMinutes, bIn.lat, bIn.lon, bIn.locationName)

  const aspects: SynastryAspect[] = []
  for (const pa of a.bodies) {
    for (const pb of b.bodies) {
      const diff = angDiff(pa.longitude, pb.longitude)
      for (const at of SYNASTRY_ASPECTS) {
        const orb = Math.abs(diff - at.angle)
        if (orb <= at.orb) {
          const wa = SYNASTRY_WEIGHTS[pa.id] ?? 1
          const wb = SYNASTRY_WEIGHTS[pb.id] ?? 1
          aspects.push({
            a: pa.id, b: pb.id, aName: pa.name, bName: pb.name,
            aChart: 'A', aBody: pa.id, bBody: pb.id,
            type: at.type, glyph: at.glyph, angle: at.angle,
            orb: Math.round(orb * 100) / 100,
            nature: at.nature,
            exactness: Math.max(0, 1 - orb / at.orb),
            story: ASPECT_STORY[at.type],
            weightScore: Math.round(wa * wb * at.weight * (1 - orb / at.orb) * 100) / 100,
          })
          break
        }
      }
    }
  }
  aspects.sort((x, y) => y.weightScore - x.weightScore)

  // Resonance score: harmony − discord, normalised — real astro-chemistry, not flattery
  let harmony = 0
  let discord = 0
  for (const asp of aspects) {
    const w = asp.weightScore * (1 + asp.exactness)
    if (asp.nature === 'harmonious') harmony += w
    else if (asp.nature === 'challenging') discord += w * 0.85
    else harmony += w * 0.55 // conjunctions lean magnetic
  }
  const raw = harmony + discord === 0 ? 0 : (harmony - discord * 0.35) / (harmony + discord + 1.2)
  const score = Math.max(12, Math.min(97, Math.round(52 + raw * 55)))

  const verdict =
    score >= 84 ? 'Twin flames — the charts sing in resonance' :
    score >= 68 ? 'Deep affinity — a bond with gravity and grace' :
    score >= 52 ? 'Magnetic middle — attraction braided with friction' :
    score >= 36 ? 'Karmic classroom — love as a demanding teacher' :
    'Trial by fire — the hardest alchemy, and sometimes the greatest'

  // Named bonds: the classic synastry pillars
  const find = (side: SynastryChartSide, id: string) => side.bodies.find((x) => x.id === id)
  const bonds: { label: string; text: string }[] = []
  const bondPairs: { label: string; pick: SynastryAspect[] }[] = [
    { label: 'Luminary weave (Sun/Moon contacts)', pick: aspects.filter((x) => ['sun', 'moon'].includes(x.aBody) && ['sun', 'moon'].includes(x.bBody)) },
    { label: 'Venus–Mars chemistry', pick: aspects.filter((x) => [x.aBody, x.bBody].includes('venus') && [x.aBody, x.bBody].includes('mars')) },
    { label: 'Moon to their Sun (the nurturer bond)', pick: aspects.filter((x) => (x.aBody === 'moon' && x.bBody === 'sun') || (x.aBody === 'sun' && x.bBody === 'moon')) },
    { label: 'Saturn bindings (glue or gravity)', pick: aspects.filter((x) => x.aBody === 'saturn' || x.bBody === 'saturn') },
  ]
  for (const bp of bondPairs) {
    const top = bp.pick[0]
    bonds.push({
      label: bp.label,
      text: top
        ? `${a.name}’s ${find(a, top.aBody)?.name ?? top.aName} ${top.glyph} ${b.name}’s ${find(b, top.bBody)?.name ?? top.bName} — ${top.type} (orb ${top.orb.toFixed(1)}°) — ${top.story}.`
        : 'No close contact — this current flows quietly between these charts.',
    })
  }

  const overlay = (from: SynastryChartSide, into: SynastryChartSide): Overlay[] =>
    from.bodies.map((x) => ({
      body: x.id, name: x.name, glyph: x.glyph,
      house: ((signOfLongitude(x.longitude).signIndex - into.ascendant.signIndex + 12) % 12) + 1,
    }))

  return { a, b, aspects, score, verdict, bonds, topBonds: aspects.slice(0, 6), overlays: { aInB: overlay(a, b), bInA: overlay(b, a) } }
}
