import { describe, expect, it } from 'vitest'
import { searchCities, WORLD_CITIES } from '@/lib/celestial/cities'
import { isValidTimeZone } from '@/lib/celestial/timezone'

describe('offline gazetteer', () => {
  it('has a valid IANA zone and coordinates for every city', () => {
    for (const c of WORLD_CITIES) {
      expect(isValidTimeZone(c.tz), c.name).toBe(true)
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(c.lon)).toBeLessThanOrEqual(180)
    }
  })
  it('searches accent-insensitively and ranks prefix matches first', () => {
    expect(searchCities('zurich')[0]?.name).toBe('Zürich')
    expect(searchCities('sao')[0]?.name).toBe('São Paulo')
    expect(searchCities('cape')[0]?.name).toBe('Cape Town')
  })
  it('ignores one-letter queries', () => {
    expect(searchCities('a')).toEqual([])
  })
})
