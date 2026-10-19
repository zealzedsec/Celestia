import { describe, expect, it } from 'vitest'
import { computeMoonInfo, computeUpcomingEvents, makeObserver, sunTimesFor, voidOfCourse } from '@/lib/celestial/astro'
import { formatDegree, signOfLongitude } from '@/lib/celestial/data'

describe('formatting', () => {
  it('never prints 60 arcminutes', () => {
    expect(formatDegree(29.99999)).toBe('29°59′')
    expect(formatDegree(17.99999)).toBe('17°59′')
    expect(formatDegree(0)).toBe('0°00′')
  })
  it('wraps longitudes into signs', () => {
    expect(signOfLongitude(-10).sign).toBe('Pisces')
    expect(signOfLongitude(360).sign).toBe('Aries')
  })
})

describe('void-of-course Moon', () => {
  const moon = { id: 'moon', name: 'Moon', longitude: 10, speed: 13 }
  it('is not void when an aspect is perfected before the sign ends', () => {
    // Moon at 10° Aries; the Sun at 284° makes a square exactly at 14° — still inside Aries
    const r = voidOfCourse(moon, [{ id: 'sun', name: 'Sun', longitude: 284, speed: 1 }], 10)
    expect(r.voc).toBe(false)
    expect(r.nextAspect).toMatch(/Square Sun/)
  })
  it('is void when nothing is perfected before the sign ends', () => {
    // Moon at 28° Aries; Sun at 0° — next aspect (sextile at 60°) lies in Gemini
    const r = voidOfCourse({ ...moon, longitude: 28 }, [{ id: 'sun', name: 'Sun', longitude: 0, speed: 1 }], 28)
    expect(r.voc).toBe(true)
  })
  it('sees aspects approaching from either side, not only those already within 6°', () => {
    // Moon at 1° Aries, Saturn at 76°: the sextile perfects at 16°, 15° away — the old code only
    // looked at aspects already within 6° and wrongly called this Moon void
    const r = voidOfCourse({ ...moon, longitude: 1 }, [{ id: 'saturn', name: 'Saturn', longitude: 76, speed: 0.03 }], 1)
    expect(r.voc).toBe(false)
  })
})

describe('moon info', () => {
  it('reports a young moon as young, not 30 days old (regression)', () => {
    // New Moon 2026-10-10T15:50Z; 20 hours later the age must be < 1 day
    const info = computeMoonInfo(new Date('2026-10-11T12:00:00Z'), makeObserver(-26.2, 28.0))
    expect(info.ageDays).toBeLessThan(1)
    expect(info.moonDayNumber).toBe(1)
  })
  it('uses the ephemeris lunar apsides', () => {
    const info = computeMoonInfo(new Date('2026-10-16T11:30:00Z'), makeObserver(-26.2, 28.0))
    expect(info.apogee?.time.slice(0, 13)).toBe('2026-10-16T22')
    expect(info.perigee?.time.slice(0, 10)).toBe('2026-10-28')
  })
})

describe('almanac', () => {
  const events = computeUpcomingEvents(new Date('2026-10-16T00:00:00Z'), { days: 365 })
  const find = (title: string) => events.find((e) => e.title === title)
  it('finds the 2026 Mercury retrograde station', () => {
    expect(find('Mercury stations retrograde')?.time.slice(0, 10)).toBe('2026-10-24')
  })
  it('finds the August 2027 total solar eclipse and February annular eclipse', () => {
    expect(events.some((e) => e.title === 'Total Solar Eclipse' && e.time.startsWith('2027-08-02'))).toBe(true)
    expect(events.some((e) => e.title === 'Annular Solar Eclipse' && e.time.startsWith('2027-02-06'))).toBe(true)
  })
  it('is sorted and within the window', () => {
    const times = events.map((e) => new Date(e.time).getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(Math.max(...times)).toBeLessThanOrEqual(new Date('2027-10-16T00:00:00Z').getTime())
  })
})

describe('solar day', () => {
  it('shows today’s sunset while the Sun is up (regression)', () => {
    const t = sunTimesFor(new Date('2026-10-16T11:30:00Z'), makeObserver(-26.2041, 28.0473))
    expect(t.sunrise?.slice(0, 10)).toBe('2026-10-16')
    expect(t.sunset?.slice(0, 10)).toBe('2026-10-16')
    expect(t.dayLengthMinutes).toBeGreaterThan(700)
  })
  it('shows the coming night’s sunrise while the Sun is down', () => {
    const t = sunTimesFor(new Date('2026-10-16T20:00:00Z'), makeObserver(-26.2041, 28.0473))
    expect(new Date(t.sunrise!).getTime()).toBeGreaterThan(new Date('2026-10-16T20:00:00Z').getTime())
  })
})
