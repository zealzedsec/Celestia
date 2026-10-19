// Celestia — shared astronomical & astrological types

export interface PlanetPosition {
  id: string // canonical id: sun, moon, mercury...
  name: string
  glyph: string
  longitude: number // geocentric ecliptic longitude (true of date), 0-360
  latitude: number // ecliptic latitude
  speed: number // degrees per day (negative = retrograde)
  retrograde: boolean
  sign: string
  signIndex: number // 0..11
  degreeInSign: number // 0..30
  formattedDegree: string // e.g. "17°42′ Taurus"
  distanceAU: number
  distanceKm: number
  raHours: number // right ascension (of date)
  decDeg: number
  azimuth: number // horizon coords for observer
  altitude: number
  magnitude: number | null
  constellation: string
  riseTime: string | null // ISO
  setTime: string | null // ISO
  transitTime: string | null // ISO
  isAboveHorizon: boolean
  element: string
  modality: string
  ruledSigns: string[]
}

export interface MoonInfo {
  phaseAngle: number // 0-360
  phaseName: string
  phaseEmoji: string
  illumination: number // 0..1
  ageDays: number
  sign: string
  signIndex: number
  degreeInSign: number
  formattedDegree: string
  longitude: number
  latitude: number
  distanceKm: number
  angularDiameterDeg: number
  isWaxing: boolean
  nextPhaseName: string
  nextPhaseTime: string
  quarterCycle: { name: string; time: string }[]
  perigee: { time: string; distanceKm: number } | null
  apogee: { time: string; distanceKm: number } | null
  constellation: string
  riseTime: string | null
  setTime: string | null
  moonDayNumber: number // lunar day 1..30
  voidOfCourse: boolean
  voidUntil: string | null
  /** the next major aspect the Moon perfects in its current sign (null when void of course) */
  nextAspect: string | null
}

export interface AspectHit {
  a: string
  b: string
  aName: string
  bName: string
  type: string
  glyph: string
  angle: number
  orb: number
  nature: 'harmonious' | 'challenging' | 'dynamic'
  applying: boolean
  exactness: number // 0..1, 1 = exact
}

export interface SkyEvent {
  title: string
  time: string
  kind: 'moonphase' | 'ingress' | 'retrograde' | 'eclipse' | 'season' | 'apsis' | 'elongation'
  detail: string
  glyph: string
  /** the body the event belongs to, when there is one */
  body?: string
}

export interface SunTimes {
  sunrise: string | null
  sunset: string | null
  transit: string | null
  dayLengthMinutes: number | null
  civilDawn: string | null
  civilDusk: string | null
  nauticalDawn: string | null
  nauticalDusk: string | null
  astroDawn: string | null
  astroDusk: string | null
  goldenHourEnd: string | null
  goldenHourStart: string | null
}

export interface SkySnapshot {
  timestamp: string
  jd: number
  location: { lat: number; lon: number; name?: string }
  sun: PlanetPosition
  moon: MoonInfo & { position: PlanetPosition }
  planets: PlanetPosition[]
  allBodies: PlanetPosition[]
  aspects: AspectHit[]
  events: SkyEvent[]
  sunTimes: SunTimes
  moonTimes: { rise: string | null; set: string | null }
  seasons: { name: string; time: string }[]
  eclipses: { kind: string; time: string; type: string }[]
  lunarDay: number
}

export interface ChartPoint {
  id: string
  name: string
  glyph: string
  longitude: number
  sign: string
  signIndex: number
  degreeInSign: number
  formattedDegree: string
  house: number
  houseWholeSign: number
}

export type HouseSystemId = 'whole-sign' | 'equal' | 'porphyry' | 'placidus'

export interface NatalChartPayload {
  input: {
    name: string
    birthDate: string
    lat: number
    lon: number
    locationName: string
    tzOffsetMinutes: number
    timeZone: string | null
  }
  utcDate: string
  julianDay: number
  houseSystem: HouseSystemId
  /** set when the requested system is undefined at this latitude and Porphyry was used */
  houseSystemFallback: HouseSystemId | null
  /** house = house in the chosen system; houseWholeSign kept for whole-sign comparisons */
  planets: (PlanetPosition & { house: number; houseWholeSign: number })[]
  points: ChartPoint[]
  angles: {
    ascendant: { longitude: number; sign: string; formatted: string; signIndex: number }
    midheaven: { longitude: number; sign: string; formatted: string; signIndex: number }
    descendant: { longitude: number; sign: string; formatted: string }
    imumCoeli: { longitude: number; sign: string; formatted: string }
  }
  houses: { index: number; sign: string; signIndex: number; cuspLongitude: number; glyph: string; formatted: string }[]
  aspects: AspectHit[]
  balance: {
    elements: Record<string, number>
    modalities: Record<string, number>
    polarities: { yang: number; yin: number }
    dominantElement: string
    dominantModality: string
    chartRuler: string
    sunSign: string
    moonSign: string
    risingSign: string
    isDayChart: boolean
    hemispheres: { above: number; below: number; east: number; west: number }
  }
  lunarPhaseAtBirth: { angle: number; name: string; illumination: number }
  interpretations: { planet: string; placement: string; text: string }[]
}

export interface PlanetaryHour {
  index: number // 0..23 (0 = first hour of day starting at sunrise)
  ruler: string
  glyph: string
  startTime: string
  endTime: string
  isDay: boolean
  isCurrent: boolean
  magical: string
}

export interface PlanetaryHoursPayload {
  location: { lat: number; lon: number; name?: string }
  date: string
  dayRuler: string
  dayGlyph: string
  nightRuler: string
  nightGlyph: string
  sunrise: string | null
  sunset: string | null
  nextSunrise: string | null
  currentHour: PlanetaryHour | null
  hours: PlanetaryHour[]
  serverNow: string
}
