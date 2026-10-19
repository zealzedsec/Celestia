import { describe, expect, it } from 'vitest'
import * as A from 'astronomy-engine'
import { computeAngles, computeHouses, houseOf } from '@/lib/celestial/houses'

const date = new Date('1990-05-12T08:30:00Z')
const lat = 51.5
const lon = -0.12

/** Independent check: ecliptic-of-date point → horizon & hour angle via astronomy-engine */
function sky(eclLon: number) {
  const time = A.MakeTime(date)
  const vec = A.RotateVector(A.Rotation_ECT_EQD(time), A.VectorFromSphere(new A.Spherical(0, eclLon, 1), time))
  const eq = A.EquatorFromVector(vec)
  const hor = A.Horizon(time, new A.Observer(lat, lon, 0), eq.ra, eq.dec, '')
  const lst = A.SiderealTime(time) * 15 + lon
  const ha = ((((lst - eq.ra * 15) % 360) + 540) % 360) - 180
  return { hor, ha, dec: eq.dec }
}

describe('chart angles', () => {
  const ang = computeAngles(date, lat, lon)
  it('puts the Ascendant on the eastern horizon', () => {
    const { hor } = sky(ang.ascendant)
    expect(Math.abs(hor.altitude)).toBeLessThan(1e-3)
    expect(hor.azimuth).toBeGreaterThan(0)
    expect(hor.azimuth).toBeLessThan(180)
  })
  it('puts the Midheaven on the meridian', () => {
    expect(Math.abs(sky(ang.midheaven).ha)).toBeLessThan(1e-3)
  })
})

describe('house systems', () => {
  const ang = computeAngles(date, lat, lon)

  it('Placidus cusps sit at exact fractions of their own semi-arcs', () => {
    const { cusps } = computeHouses('placidus', ang, lat)
    for (const [idx, f] of [[10, 1 / 3], [11, 2 / 3], [1, 4 / 3], [2, 5 / 3]] as const) {
      const { ha, dec } = sky(cusps[idx])
      const dsa = (Math.acos(-Math.tan((lat * Math.PI) / 180) * Math.tan((dec * Math.PI) / 180)) * 180) / Math.PI
      const expected = f <= 1 ? -f * dsa : -(dsa + (f - 1) * (180 - dsa))
      expect(ha).toBeCloseTo(expected, 3)
    }
  })

  it('angular cusps coincide with the angles', () => {
    for (const sys of ['placidus', 'porphyry'] as const) {
      const { cusps } = computeHouses(sys, ang, lat)
      expect(cusps[0]).toBeCloseTo(ang.ascendant, 6)
      expect(cusps[9]).toBeCloseTo(ang.midheaven, 6)
    }
  })

  it('equal & whole-sign houses are 30° apart', () => {
    const eq = computeHouses('equal', ang, lat).cusps
    const ws = computeHouses('whole-sign', ang, lat).cusps
    expect(eq[0]).toBeCloseTo(ang.ascendant, 6)
    expect(ws[0] % 30).toBe(0)
    for (let i = 1; i < 12; i++) {
      expect(((eq[i] - eq[i - 1] + 360) % 360)).toBeCloseTo(30, 6)
      expect(((ws[i] - ws[i - 1] + 360) % 360)).toBeCloseTo(30, 6)
    }
  })

  it('falls back to Porphyry where Placidus is undefined (polar latitudes)', () => {
    const polar = computeAngles(new Date('2026-06-21T12:00:00Z'), 78.2, 15.6)
    const h = computeHouses('placidus', polar, 78.2)
    expect(h.system).toBe('porphyry')
    expect(h.fallbackFrom).toBe('placidus')
  })

  it('assigns every longitude to exactly one house', () => {
    const { cusps } = computeHouses('placidus', ang, lat)
    for (let i = 0; i < 12; i++) expect(houseOf(cusps[i] + 0.01, cusps)).toBe(i + 1)
  })
})
