import { describe, expect, it } from 'vitest'
import { computeNatalChart } from '@/lib/celestial/natal'
import { computeSynastry } from '@/lib/celestial/synastry'

const input = { name: 'Test', birthDate: '1990-05-12T10:30', lat: -26.2041, lon: 28.0473, locationName: 'Johannesburg', tzOffsetMinutes: 120 }

describe('natal chart', () => {
  it('converts local birth time with the given offset, regardless of the server zone (regression)', () => {
    const before = process.env.TZ
    process.env.TZ = 'America/New_York'
    const a = computeNatalChart(input)
    process.env.TZ = 'Asia/Tokyo'
    const b = computeNatalChart(input)
    process.env.TZ = before
    expect(a.utcDate).toBe('1990-05-12T08:30:00.000Z')
    expect(b.utcDate).toBe(a.utcDate)
  })

  it('places the Sun in Taurus and reports all four house systems consistently', () => {
    for (const houseSystem of ['placidus', 'whole-sign', 'equal', 'porphyry'] as const) {
      const c = computeNatalChart({ ...input, houseSystem })
      expect(c.houseSystem).toBe(houseSystem)
      expect(c.planets[0].sign).toBe('Taurus')
      expect(c.houses).toHaveLength(12)
      for (const p of c.planets) expect(p.house).toBeGreaterThanOrEqual(1)
    }
  })

  it('includes the lunar nodes opposite each other and the Part of Fortune', () => {
    const c = computeNatalChart(input)
    const nn = c.points.find((p) => p.id === 'northNode')!
    const sn = c.points.find((p) => p.id === 'southNode')!
    expect(((sn.longitude - nn.longitude + 360) % 360)).toBeCloseTo(180, 6)
    expect(c.points.some((p) => p.id === 'fortune')).toBe(true)
  })
})

describe('synastry', () => {
  it('builds house overlays in both directions', () => {
    const s = computeSynastry(input, { ...input, birthDate: '1992-11-03T22:15', lat: 51.5, lon: -0.12, tzOffsetMinutes: 0 })
    expect(s.overlays.aInB).toHaveLength(10)
    expect(s.overlays.bInA).toHaveLength(10)
    expect(s.score).toBeGreaterThanOrEqual(12)
    expect(s.score).toBeLessThanOrEqual(97)
  })
})
