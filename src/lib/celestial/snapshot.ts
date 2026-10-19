// Celestia — assembles the full live-sky payload served by /api/sky
import { computeAllPositions, computeMoonInfo, computeAspects, computeUpcomingEvents, sunTimesFor, makeObserver, julianDay } from './astro'
import { SkySnapshot } from './types'

export function buildSnapshot(now: Date, lat: number, lon: number, name?: string): SkySnapshot {
  const observer = makeObserver(lat, lon)
  const allBodies = computeAllPositions(now, observer, true)
  const moonPos = allBodies.find((p) => p.id === 'moon')!
  const moonCore = computeMoonInfo(now, observer, allBodies)
  const events = computeUpcomingEvents(now, { days: 45 })
  return {
    timestamp: now.toISOString(),
    jd: julianDay(now),
    location: { lat, lon, name },
    sun: allBodies.find((p) => p.id === 'sun')!,
    moon: { ...moonCore, position: moonPos },
    planets: allBodies.filter((p) => p.id !== 'sun' && p.id !== 'moon'),
    allBodies,
    aspects: computeAspects(allBodies, now, true),
    events,
    sunTimes: sunTimesFor(now, observer),
    moonTimes: { rise: moonCore.riseTime, set: moonCore.setTime },
    seasons: events.filter((e) => e.kind === 'season').map((e) => ({ name: e.title, time: e.time })),
    eclipses: events.filter((e) => e.kind === 'eclipse').map((e) => ({ kind: e.title, time: e.time, type: e.detail })),
    lunarDay: moonCore.moonDayNumber,
  }
}
