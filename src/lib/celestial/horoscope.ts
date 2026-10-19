// Celestia — Live transit-based horoscope generator
// Each sign's horoscope is derived from actual current sky: which transiting planets
// aspect that sign's natal Sun point (15° of the sign), and which solar houses they occupy.
import { computeAllPositions } from './astro'
import { PLANET_BY_ID, ZODIAC } from './data'
import { PlanetPosition } from './types'
import * as A from 'astronomy-engine'

const MAJORS: { type: string; angle: number }[] = [
  { type: 'Conjunction', angle: 0 }, { type: 'Sextile', angle: 60 }, { type: 'Square', angle: 90 },
  { type: 'Trine', angle: 120 }, { type: 'Opposition', angle: 180 },
]

const HOUSE_THEMES = [
  { theme: 'identity & fresh beginnings', advice: 'claim the day as your own' },
  { theme: 'money, worth & resources', advice: 'invest in what truly feeds you' },
  { theme: 'words, ideas & connections', advice: 'say the thing you have been circling' },
  { theme: 'home & the inner sanctum', advice: 'tend the hearth before the horizon' },
  { theme: 'pleasure, love & play', advice: 'let joy be productive' },
  { theme: 'work, craft & wellbeing', advice: 'polish the daily ritual' },
  { theme: 'others & the sacred mirror', advice: 'meet the other halfway' },
  { theme: 'depths, secrets & renewal', advice: 'let the old skin fall away' },
  { theme: 'horizons & grand questions', advice: 'zoom out until meaning returns' },
  { theme: 'ambition & visibility', advice: 'stand where you can be seen' },
  { theme: 'allies & future dreams', advice: 'trade visions with your tribe' },
  { theme: 'rest, mysteries & release', advice: 'retreat to recharge the spell' },
]

const ELEMENT_TONE: Record<string, string[]> = {
  Fire: ['blazes', 'ignites', 'crackles with heat'],
  Earth: ['grounds', 'compacts', 'sets into patient stone'],
  Air: ['stirs', 'quickens', 'rattles the shutters'],
  Water: ['floods', 'seeps', 'pulls at the hidden tide'],
}

const ASPECT_TONE: Record<string, string> = {
  Conjunction: 'fuses with your solar essence',
  Sextile: 'opens a willing door for you',
  Square: 'grinds against your comfort, and grinds you sharper',
  Trine: 'pours grace along your path',
  Opposition: 'stares you down from across the sky',
}

export interface SignHoroscope {
  sign: string
  glyph: string
  headline: string
  body: string
  luckyGlyph: string
  powerHourRuler: string
  element: string
  keyTransit: string
  mood: number // 0..100 derived from aspect natures
}

export function generateDailyHoroscopes(date: Date, lat: number, lon: number): SignHoroscope[] {
  const positions = computeAllPositions(date, new A.Observer(lat, lon, 100), false)
  const transiting = positions

  const out: SignHoroscope[] = []
  for (let s = 0; s < 12; s++) {
    const sign = ZODIAC[s]
    const solarPoint = s * 30 + 15 // natal sun approximated at 15° of sign (solar-house tradition)
    const hits: { p: PlanetPosition; type: string; orb: number }[] = []
    const solarHouses: { p: PlanetPosition; house: number }[] = []

    for (const p of transiting) {
      if (p.id === 'sun' && p.signIndex === s) continue // sun never aspects its own sign point meaningfully today
      let diff = Math.abs(p.longitude - solarPoint)
      if (diff > 180) diff = 360 - diff
      for (const m of MAJORS) {
        const orb = Math.abs(diff - m.angle)
        if (orb <= (p.id === 'sun' || p.id === 'moon' ? 9 : 6.5)) {
          hits.push({ p, type: m.type, orb })
          break
        }
      }
      // solar house: relative sign position
      const house = ((p.signIndex - s + 12) % 12) + 1
      solarHouses.push({ p, house })
    }

    hits.sort((a, b) => a.orb - b.orb)
    const key = hits[0]
    const moonHouse = solarHouses.find((h) => h.p.id === 'moon')!.house
    const theme = HOUSE_THEMES[moonHouse - 1]

    // mood score
    let mood = 62
    for (const h of hits.slice(0, 4)) {
      const w = (1 - h.orb / 9) * 12
      if (['Trine', 'Sextile'].includes(h.type)) mood += w
      else if (['Square', 'Opposition'].includes(h.type)) mood -= w * 0.8
      else mood += w * 0.4
    }
    if (sign.element === 'Fire' && positions[0].signIndex === s) mood += 3
    mood = Math.max(18, Math.min(97, Math.round(mood)))

    const tone = ELEMENT_TONE[sign.element][s % 3]
    const headline = key
      ? `${key.p.name} ${ASPECT_TONE[key.type]}`
      : `The ${sign.element.toLowerCase()} in you ${tone}`

    const houseLines = solarHouses
      .filter((h) => ['sun', 'moon', 'mercury', 'venus', 'mars'].includes(h.p.id) && h.house <= 12)
      .slice(0, 3)
      .map((h) => `${h.p.name} energises your ${h.house}${['th','st','nd','rd'][h.house % 10 > 3 || Math.floor(h.house % 100 / 10) === 1 ? 0 : h.house % 10] ?? 'th'} house of ${HOUSE_THEMES[h.house - 1].theme}`)
      .join('; ')

    const body = [
      key
        ? `Transiting ${key.p.name} ${key.p.retrograde ? '(retrograde) ' : ''}${ASPECT_TONE[key.type].toLowerCase()} today, and the ${sign.element} current runs strong. ${key.type === 'Square' || key.type === 'Opposition' ? 'Friction is fuel — the obstacle in your path is also the whetstone.' : 'Ride the current; it is moving your way.'}`
        : `No loud transits press upon your Sun today, ${sign.name} — a rare silence that lets subtler voices speak. The ${sign.element.toLowerCase()} element ${tone} quietly through your affairs.`,
      houseLines ? `In the solar houses: ${houseLines}.` : '',
      `With the Moon moving through your ${moonHouse}${['th','st','nd','rd'][moonHouse % 10 > 3 || Math.floor(moonHouse % 100 / 10) === 1 ? 0 : moonHouse % 10] ?? 'th'} house of ${theme.theme}, ${theme.advice}.`,
      sign.element === 'Water' ? 'Trust what you feel over what you are told.' : sign.element === 'Air' ? 'A conversation is a door; open several.' : sign.element === 'Fire' ? 'Begin before you feel ready — the flame teaches.' : 'Small, solid steps outrun the impatient leap.',
    ].filter(Boolean).join(' ')

    const ruler = PLANET_BY_ID[ZODIAC[s].ruler.split(' ')[0].toLowerCase()] ?? PLANET_BY_ID.sun
    const lucky = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'][(s + date.getUTCDate()) % 7]

    out.push({
      sign: sign.name,
      glyph: sign.glyph,
      headline,
      body,
      luckyGlyph: PLANET_BY_ID[lucky].glyph,
      powerHourRuler: ruler.name,
      element: sign.element,
      keyTransit: key ? `${key.p.name} ${key.type} natal Sun · orb ${key.orb.toFixed(1)}°` : 'No major solar aspect',
      mood,
    })
  }
  return out
}
