// Celestia — Planetary Hours (Chaldean order) calculator
// A planetary "day" runs from sunrise to the next sunrise: 12 day hours (sunrise→sunset)
// then 12 night hours (sunset→next sunrise). The first hour of the day is ruled by
// that day's ruler; subsequent hours follow the Chaldean order.
import * as A from 'astronomy-engine'
import { CHALDEAN_ORDER, DAY_RULERS, PLANET_BY_ID, PLANET_MAGICAL_HOURS } from './data'
import { PlanetaryHour, PlanetaryHoursPayload } from './types'

function nextChaldean(rulerId: string): string {
  const idx = CHALDEAN_ORDER.indexOf(rulerId as (typeof CHALDEAN_ORDER)[number])
  return CHALDEAN_ORDER[(idx + 1) % 7]
}

function searchRise(dir: 1 | -1, from: Date, observer: A.Observer, limit = 4): Date | null {
  try {
    const r = A.SearchRiseSet(A.Body.Sun, observer, dir, from, limit)
    return r ? r.date : null
  } catch { return null }
}

export function computePlanetaryHours(date: Date, lat: number, lon: number, locationName?: string): PlanetaryHoursPayload {
  const observer = new A.Observer(lat, lon, 100)
  const now = date.getTime()

  // Anchor: the most recent sunrise at or before now
  const rise0 = searchRise(+1, new Date(now - 48 * 3600000), observer, 4) // earliest candidate within last 48h
  if (!rise0) {
    return minimal(lat, lon, locationName, date)
  }
  // walk forward to find the last sunrise <= now (rise0 search from 48h ago may skip one)
  let anchor = rise0
  for (let i = 0; i < 3; i++) {
    const nextRise = searchRise(+1, new Date(anchor.getTime() + 60 * 1000), observer, 2)
    if (nextRise && nextRise.getTime() <= now) anchor = nextRise
    else break
  }

  const sunset = searchRise(-1, anchor, observer, 2)
  const nextSunrise = sunset ? searchRise(+1, sunset, observer, 2) : null
  if (!sunset || !nextSunrise) return minimal(lat, lon, locationName, date, anchor.toISOString(), sunset?.toISOString() ?? null)

  const dayLength = (sunset.getTime() - anchor.getTime()) / 12
  const nightLength = (nextSunrise.getTime() - sunset.getTime()) / 12

  // Day ruler from the anchor sunrise's local weekday (approx local time by longitude)
  const tzApproxMs = (lon / 15) * 3600000
  const localAnchor = new Date(anchor.getTime() + tzApproxMs)
  const dow = localAnchor.getUTCDay()
  const dayRuler = DAY_RULERS[dow]

  const hours: PlanetaryHour[] = []
  let cursor: string = dayRuler
  for (let i = 0; i < 12; i++) {
    const start = new Date(anchor.getTime() + i * dayLength)
    const end = new Date(anchor.getTime() + (i + 1) * dayLength)
    hours.push({
      index: i, ruler: cursor, glyph: PLANET_BY_ID[cursor].glyph,
      startTime: start.toISOString(), endTime: end.toISOString(),
      isDay: true, isCurrent: false, magical: PLANET_MAGICAL_HOURS[cursor],
    })
    cursor = nextChaldean(cursor)
  }
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + i * nightLength)
    const end = new Date(sunset.getTime() + (i + 1) * nightLength)
    hours.push({
      index: 12 + i, ruler: cursor, glyph: PLANET_BY_ID[cursor].glyph,
      startTime: start.toISOString(), endTime: end.toISOString(),
      isDay: false, isCurrent: false, magical: PLANET_MAGICAL_HOURS[cursor],
    })
    cursor = nextChaldean(cursor)
  }

  let current: PlanetaryHour | null = null
  for (const h of hours) {
    const s = new Date(h.startTime).getTime()
    const e = new Date(h.endTime).getTime()
    if (now >= s && now < e) { h.isCurrent = true; current = h; break }
  }

  const nightRulerId = hours[12].ruler

  return {
    location: { lat, lon, name: locationName },
    date: date.toISOString(),
    dayRuler: PLANET_BY_ID[dayRuler].name,
    dayGlyph: PLANET_BY_ID[dayRuler].glyph,
    nightRuler: PLANET_BY_ID[nightRulerId].name,
    nightGlyph: PLANET_BY_ID[nightRulerId].glyph,
    sunrise: anchor.toISOString(),
    sunset: sunset.toISOString(),
    nextSunrise: nextSunrise.toISOString(),
    currentHour: current,
    hours,
    serverNow: new Date().toISOString(),
  }
}

function minimal(lat: number, lon: number, locationName: string | undefined, date: Date, sunrise: string | null = null, sunset: string | null = null): PlanetaryHoursPayload {
  return {
    location: { lat, lon, name: locationName },
    date: date.toISOString(),
    dayRuler: '—', dayGlyph: '', nightRuler: '—', nightGlyph: '',
    sunrise, sunset, nextSunrise: null,
    currentHour: null, hours: [],
    serverNow: new Date().toISOString(),
  }
}
