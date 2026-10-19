import { describe, expect, it } from 'vitest'
import { formatOffset, isValidWallTime, offsetForWallTime, utcToWallTime, wallTimeAsUtcMs, wallTimeToUtc, zoneOffsetMinutes } from '@/lib/celestial/timezone'

describe('wall-time parsing', () => {
  it('parses as UTC arithmetic, independent of the host zone', () => {
    expect(new Date(wallTimeAsUtcMs('1990-05-12T10:30')).toISOString()).toBe('1990-05-12T10:30:00.000Z')
  })
  it('rejects impossible calendar dates instead of rolling them over', () => {
    expect(isValidWallTime('1990-02-30T10:30')).toBe(false)
    expect(isValidWallTime('2025-02-29T00:00')).toBe(false)
    expect(isValidWallTime('2024-02-29T00:00')).toBe(true)
    expect(isValidWallTime('nonsense')).toBe(false)
  })
})

describe('historical offsets (IANA, DST-aware)', () => {
  it('knows summer and winter time', () => {
    expect(offsetForWallTime('2026-07-01T12:00', 'Europe/London')).toBe(60)
    expect(offsetForWallTime('2026-01-01T12:00', 'Europe/London')).toBe(0)
    expect(offsetForWallTime('2026-06-01T09:00', 'Asia/Kathmandu')).toBe(345)
  })
  it('shifts times inside a spring-forward gap forward (zoneinfo fold=0)', () => {
    // 02:30 does not exist in New York on 2026-03-08 → read as EST → 03:30 EDT
    const off = offsetForWallTime('2026-03-08T02:30', 'America/New_York')
    expect(off).toBe(-300)
    expect(wallTimeToUtc('2026-03-08T02:30', off).toISOString()).toBe('2026-03-08T07:30:00.000Z')
  })
  it('resolves an ambiguous fall-back time to the earlier (daylight) instant', () => {
    expect(offsetForWallTime('2026-10-25T01:30', 'Europe/London')).toBe(60)
  })
  it('round-trips UTC → wall time', () => {
    const d = new Date('2026-10-16T11:30:00Z')
    expect(utcToWallTime(d, 'Africa/Johannesburg')).toBe('2026-10-16T13:30')
    expect(zoneOffsetMinutes(d.getTime(), 'Pacific/Kiritimati')).toBe(840)
  })
  it('formats offsets with a real sign', () => {
    expect(formatOffset(330)).toBe('UTC+05:30')
    expect(formatOffset(-180)).toBe('UTC−03:00')
    expect(formatOffset(0)).toBe('UTC±00:00')
  })
})
