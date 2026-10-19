// Celestia — Static esoteric & astronomical reference data

export interface ZodiacSign {
  name: string
  glyph: string
  dates: string
  element: 'Fire' | 'Earth' | 'Air' | 'Water'
  modality: 'Cardinal' | 'Fixed' | 'Mutable'
  polarity: 'Yang' | 'Yin'
  ruler: string
  bodyPart: string
  tarot: string
  stone: string
  herb: string
  keyword: string
  traits: string
  alchemy: string
}

export const ZODIAC: ZodiacSign[] = [
  { name: 'Aries', glyph: '♈\uFE0E', dates: 'Mar 21 – Apr 19', element: 'Fire', modality: 'Cardinal', polarity: 'Yang', ruler: 'Mars', bodyPart: 'Head & face', tarot: 'The Emperor', stone: 'Diamond & Bloodstone', herb: 'Nettle & Honeysuckle', keyword: 'I Am', traits: 'Pioneering courage, raw initiative, primal spark that lights the first flame.', alchemy: 'Calcination — the burning away of the old self.' },
  { name: 'Taurus', glyph: '♉\uFE0E', dates: 'Apr 20 – May 20', element: 'Earth', modality: 'Fixed', polarity: 'Yin', ruler: 'Venus', bodyPart: 'Throat & neck', tarot: 'The Hierophant', stone: 'Emerald & Rose Quartz', herb: 'Rose & Clover', keyword: 'I Have', traits: 'Rooted abundance, sensory devotion, the fertile field that sustains the seed.', alchemy: 'Congelation — spirit crystallising into stable form.' },
  { name: 'Gemini', glyph: '♊\uFE0E', dates: 'May 21 – Jun 20', element: 'Air', modality: 'Mutable', polarity: 'Yang', ruler: 'Mercury', bodyPart: 'Arms, hands & lungs', tarot: 'The Lovers', stone: 'Agate & Citrine', herb: 'Lavender & Fennel', keyword: 'I Think', traits: 'Quicksilver intelligence, sacred duality, the messenger between worlds.', alchemy: 'Dissolution — fixed ideas melting into flowing thought.' },
  { name: 'Cancer', glyph: '♋\uFE0E', dates: 'Jun 21 – Jul 22', element: 'Water', modality: 'Cardinal', polarity: 'Yin', ruler: 'Moon', bodyPart: 'Chest & stomach', tarot: 'The Chariot', stone: 'Moonstone & Pearl', herb: 'Chamomile & Jasmine', keyword: 'I Feel', traits: 'Tidal memory, protective love, the vessel that carries the waters of life.', alchemy: 'Separation — discerning what the heart truly holds.' },
  { name: 'Leo', glyph: '♌\uFE0E', dates: 'Jul 23 – Aug 22', element: 'Fire', modality: 'Fixed', polarity: 'Yang', ruler: 'Sun', bodyPart: 'Heart & spine', tarot: 'Strength', stone: 'Sunstone & Amber', herb: 'Rosemary & Sunflower', keyword: 'I Will', traits: 'Radiant sovereignty, generative warmth, the solar heart enthroned.', alchemy: 'Conjunction — the marriage of solar gold and lunar silver.' },
  { name: 'Virgo', glyph: '♍\uFE0E', dates: 'Aug 23 – Sep 22', element: 'Earth', modality: 'Mutable', polarity: 'Yin', ruler: 'Mercury', bodyPart: 'Digestion & gut', tarot: 'The Hermit', stone: 'Sapphire & Peridot', herb: 'Mint & Caraway', keyword: 'I Analyse', traits: 'Sacred refinement, alchemical purity, the priestess sorting wheat from chaff.', alchemy: 'Fermentation — subtle decay birthing new spirit.' },
  { name: 'Libra', glyph: '♎\uFE0E', dates: 'Sep 23 – Oct 22', element: 'Air', modality: 'Cardinal', polarity: 'Yang', ruler: 'Venus', bodyPart: 'Kidneys & lower back', tarot: 'Justice', stone: 'Opal & Lapis Lazuli', herb: 'Rose & Thyme', keyword: 'I Balance', traits: 'The golden scales, aesthetic equilibrium, love formalised as covenant.', alchemy: 'Sublimation — desire raised and purified into beauty.' },
  { name: 'Scorpio', glyph: '♏\uFE0E', dates: 'Oct 23 – Nov 21', element: 'Water', modality: 'Fixed', polarity: 'Yin', ruler: 'Mars (trad.) / Pluto', bodyPart: 'Reproductive organs', tarot: 'Death', stone: 'Obsidian & Topaz', herb: 'Basil & Wormwood', keyword: 'I Transform', traits: 'The phoenix furnace, occult depth, power distilled through death and rebirth.', alchemy: 'Putrefaction — the necessary rot before the great renewal.' },
  { name: 'Sagittarius', glyph: '♐\uFE0E', dates: 'Nov 22 – Dec 21', element: 'Fire', modality: 'Mutable', polarity: 'Yang', ruler: 'Jupiter', bodyPart: 'Hips & thighs', tarot: 'Temperance', stone: 'Turquoise & Amethyst', herb: 'Sage & Clove', keyword: 'I See', traits: 'The celestial arrow, philosophical quest, wisdom sought on the open road.', alchemy: 'Projection — the philosopher’s stone cast upon base matter.' },
  { name: 'Capricorn', glyph: '♑\uFE0E', dates: 'Dec 22 – Jan 19', element: 'Earth', modality: 'Cardinal', polarity: 'Yin', ruler: 'Saturn', bodyPart: 'Knees & bones', tarot: 'The Devil', stone: 'Onyx & Garnet', herb: 'Comfrey & Patchouli', keyword: 'I Use', traits: 'The mountain goat’s climb, crystallised mastery, time bent into structure.', alchemy: 'Coagulation — the stone perfected and crowned.' },
  { name: 'Aquarius', glyph: '♒\uFE0E', dates: 'Jan 20 – Feb 18', element: 'Air', modality: 'Fixed', polarity: 'Yang', ruler: 'Saturn (trad.) / Uranus', bodyPart: 'Ankles & circulation', tarot: 'The Star', stone: 'Amethyst & Aquamarine', herb: 'Valerian & Lavender', keyword: 'I Know', traits: 'The water-bearer’s wave, utopian circuitry, lightning-struck invention.', alchemy: 'Circulation — essence distributed through the whole vessel.' },
  { name: 'Pisces', glyph: '♓\uFE0E', dates: 'Feb 19 – Mar 20', element: 'Water', modality: 'Mutable', polarity: 'Yin', ruler: 'Jupiter (trad.) / Neptune', bodyPart: 'Feet & lymph', tarot: 'The Moon', stone: 'Amethyst & Aquamarine', herb: 'Lemon Balm & Poppy', keyword: 'I Believe', traits: 'The boundless sea, mystical dissolution, compassion without shore.', alchemy: 'Multiplication — the elixir shared until all is one.' },
]

export interface PlanetMeta {
  id: string
  name: string
  glyph: string
  astronomyBody: string
  color: string // UI tint
  metal: string
  element: string
  day: string
  archangel: string
  sephirah: string
  tarot: string[]
  colors: string[]
  crystals: string[]
  herbs: string[]
  incense: string
  deities: string
  number: string
  bodyPart: string
  process: string // alchemical operation
  magic: string
  retroMeaning: string
  classical: boolean
}

export const PLANETS: PlanetMeta[] = [
  {
    id: 'sun', name: 'Sun', glyph: '☉', astronomyBody: 'Sun', color: '#e8b64c', metal: 'Gold', element: 'Fire',
    day: 'Sunday', archangel: 'Michael', sephirah: 'Tiphareth — Beauty', tarot: ['The Sun', 'The Fool (0)'],
    colors: ['Gold', 'Amber', 'Royal Orange'], crystals: ['Sunstone', 'Diamond', 'Amber', 'Citrine', 'Topaz'],
    herbs: ['Rosemary', 'Sunflower', 'St. John’s Wort', 'Frankincense resin', 'Laurel'],
    incense: 'Frankincense & Cinnamon', deities: 'Ra, Helios, Sol, Amun, Apollo, Surya', number: '6 (Hexad)',
    bodyPart: 'Heart, vital force, spine, eyesight', process: 'Coagulation — the fixed crown of the Work',
    magic: 'Success, sovereignty, vitality, illumination, fame, healing of the spirit, blessing of endeavours.',
    retroMeaning: 'The Sun never retrogrades — its will is ever-direct.', classical: true,
  },
  {
    id: 'moon', name: 'Moon', glyph: '☽', astronomyBody: 'Moon', color: '#cfd8e3', metal: 'Silver', element: 'Water',
    day: 'Monday', archangel: 'Gabriel', sephirah: 'Yesod — Foundation', tarot: ['The Moon', 'The High Priestess (II)'],
    colors: ['Silver', 'White', 'Pearl Grey'], crystals: ['Moonstone', 'Selenite', 'Pearl', 'Clear Quartz', 'Beryl'],
    herbs: ['Chamomile', 'Jasmine', 'Willow bark', 'Mugwort', 'Lettuce'],
    incense: 'Jasmine & Camphor', deities: 'Selene, Luna, Artemis, Chandra, Thoth (lunar aspect)', number: '9 (Ennead)',
    bodyPart: 'Stomach, lymph, bodily fluids, memory', process: 'Dissolution — the surrender into the lunar waters',
    magic: 'Dreams, divination, intuition, tides of emotion, fertility, enchantment, travel over water.',
    retroMeaning: 'The Moon never retrogrades — she keeps her eternal tide.', classical: true,
  },
  {
    id: 'mercury', name: 'Mercury', glyph: '☿', astronomyBody: 'Mercury', color: '#d9c9a3', metal: 'Quicksilver (Mercury)', element: 'Air & Water',
    day: 'Wednesday', archangel: 'Raphael', sephirah: 'Hod — Splendour', tarot: ['The Magician (I)', 'The Lovers (VI)'],
    colors: ['Orange', 'Yellow', 'Opal, the iridescent mix'], crystals: ['Agate', 'Opal', 'Emerald', 'Fire Opal', 'Jasper'],
    herbs: ['Lavender', 'Mint', 'Fennel', 'Parsley', 'Cloves'],
    incense: 'Mastic & Lavender', deities: 'Hermes, Mercury, Thoth, Nabu, Anubis (psychopomp)', number: '8 (Ogdoad)',
    bodyPart: 'Nervous system, hands, speech, lungs', process: 'Sublimation — the volatile messenger rising',
    magic: 'Communication, commerce, writing, secrets, travel, trickery transformed into wisdom, memory.',
    retroMeaning: 'When retrograde: review, renegotiate, return. The messenger walks backward to mend old threads.',
    classical: true,
  },
  {
    id: 'venus', name: 'Venus', glyph: '♀', astronomyBody: 'Venus', color: '#e5a3a3', metal: 'Copper', element: 'Water & Earth',
    day: 'Friday', archangel: 'Haniel (Anael)', sephirah: 'Netzach — Victory', tarot: ['The Empress (III)', 'The Hierophant (V)'],
    colors: ['Green', 'Rose Pink', 'Seafoam'], crystals: ['Rose Quartz', 'Emerald', 'Malachite', 'Coral', 'Pink Tourmaline'],
    herbs: ['Rose', 'Yarrow', 'Damiana', 'Violet', 'Apple blossom'],
    incense: 'Sandalwood & Rose', deities: 'Aphrodite, Venus, Hathor, Inanna, Freyja, Oshun', number: '7 (Heptad)',
    bodyPart: 'Kidneys, throat, skin, the hormone of attraction', process: 'Fermentation — love fermenting into spirit',
    magic: 'Love, beauty, art, harmony, fertility of the soul, friendship, pleasure, diplomacy.',
    retroMeaning: 'When retrograde: the heart reconsiders — old loves surface for reckoning.',
    classical: true,
  },
  {
    id: 'mars', name: 'Mars', glyph: '♂', astronomyBody: 'Mars', color: '#d97757', metal: 'Iron', element: 'Fire',
    day: 'Tuesday', archangel: 'Camael (Samael)', sephirah: 'Geburah — Severity', tarot: ['The Tower (XVI)', 'The Chariot (VII)'],
    colors: ['Red', 'Crimson', 'Scarlet'], crystals: ['Ruby', 'Garnet', 'Bloodstone', 'Red Jasper', 'Iron Pyrite'],
    herbs: ['Nettle', 'Ginger', 'Thyme', 'Dragon’s Blood', 'Wormwood'],
    incense: 'Dragon’s Blood & Benzoin', deities: 'Ares, Mars, Sekhmet, Nergal, Tiwaz, Ogun', number: '5 (Pentad)',
    bodyPart: 'Muscles, blood, adrenals, the warrior’s drive', process: 'Calcination — the forge-fire burning impurity',
    magic: 'Courage, protection, banishing, strength, conflict mastered, victory in contest, severing.',
    retroMeaning: 'When retrograde: the sword is sheathed — energy turns inward to reforge strategy.',
    classical: true,
  },
  {
    id: 'jupiter', name: 'Jupiter', glyph: '♃', astronomyBody: 'Jupiter', color: '#c9a0dc', metal: 'Tin', element: 'Air & Fire',
    day: 'Thursday', archangel: 'Sachiel', sephirah: 'Chesed — Mercy', tarot: ['The Wheel of Fortune (X)', 'Temperance (XIV)'],
    colors: ['Royal Purple', 'Deep Blue', 'Rich Green'], crystals: ['Amethyst', 'Lapis Lazuli', 'Sapphire', 'Tin Oxide stone', 'Sugilite'],
    herbs: ['Sage', 'Cedar', 'Oak bark', 'Nutmeg', 'Hyssop'],
    incense: 'Cedar & Nutmeg', deities: 'Zeus, Jupiter, Marduk, Thor, Indra, Amun-Ra (sovereign aspect)', number: '4 (Tetrad)',
    bodyPart: 'Liver, thighs, fat metabolism, expansion of tissue', process: 'Multiplication — abundance increasing itself',
    magic: 'Expansion, wealth, luck, law, honour, wisdom, generosity, protection of status.',
    retroMeaning: 'When retrograde: growth pauses to digest — beliefs are re-examined for true worth.',
    classical: true,
  },
  {
    id: 'saturn', name: 'Saturn', glyph: '♄', astronomyBody: 'Saturn', color: '#9a9a9a', metal: 'Lead', element: 'Earth & Water',
    day: 'Saturday', archangel: 'Cassiel (Orifiel)', sephirah: 'Binah — Understanding', tarot: ['The World (XXI)', 'The Devil (XV)'],
    colors: ['Black', 'Dark Brown', 'Grey'], crystals: ['Obsidian', 'Onyx', 'Hematite', 'Black Tourmaline', 'Jet'],
    herbs: ['Patchouli', 'Cypress', 'Clove', 'Mullein', 'Horsetail'],
    incense: 'Myrrh & Cypress', deities: 'Cronus, Saturn, Ninurta, Set (bound), Kali (time aspect)', number: '3 (Triad)',
    bodyPart: 'Bones, teeth, skin, knees, the endurance of structure', process: 'Congelation — form fixed by the Lord of Time',
    magic: 'Discipline, binding, banishing, karma, structures, death rites, long labours crowned, gates of the ancestors.',
    retroMeaning: 'When retrograde: karma audits itself — the harvest of old commitments is weighed.',
    classical: true,
  },
  {
    id: 'uranus', name: 'Uranus', glyph: '♅', astronomyBody: 'Uranus', color: '#7fd4c1', metal: 'Uranium (esoteric: lodestone alloy)', element: 'Air',
    day: 'Wednesday (modern co-ruler)', archangel: 'Raziel', sephirah: 'Chokmah (esoteric)', tarot: ['The Fool (0)'],
    colors: ['Electric Teal', 'Silver-White'], crystals: ['Aquamarine', 'Labradorite', 'Herkimer Diamond', 'Amazonite'],
    herbs: ['Eucalyptus', 'Peppermint', 'Coffee'],
    incense: 'Frankincense & Peppermint', deities: 'Ouranos, Prometheus, Varuna', number: '0 (Ain)',
    bodyPart: 'Circulation, electrical impulses of the body', process: 'Circulation — the lightning sudden current',
    magic: 'Breakthrough, revolution, astrology itself, sudden insight, technology, liberation from chains.',
    retroMeaning: 'When retrograde: the revolution internalises — your own rules are rewritten.',
    classical: false,
  },
  {
    id: 'neptune', name: 'Neptune', glyph: '♆', astronomyBody: 'Neptune', color: '#89b8c9', metal: 'Platinum (esoteric)', element: 'Water',
    day: 'Friday (modern co-ruler)', archangel: 'Asariel', sephirah: 'Kether (esoteric)', tarot: ['The Hanged Man (XII)'],
    colors: ['Sea Green', 'Misty Aqua', 'Iridescent White'], crystals: ['Amethyst', 'Fluorite', 'Celestite', 'Angelite'],
    herbs: ['Poppy', 'Kava', 'Seaweed', 'Blue Lotus'],
    incense: 'Lotus & Ambergris', deities: 'Poseidon, Neptune, Varuna, Lir', number: '∞ (The Veil)',
    bodyPart: 'Pineal gland, feet, dream-body', process: 'Dissolution perfected — the oceanic unbinding',
    magic: 'Mysticism, dreams, trance, compassion, art as devotion, dissolution of ego-boundaries.',
    retroMeaning: 'When retrograde: the dream inverts — illusions are drained, truth remains.',
    classical: false,
  },
  {
    id: 'pluto', name: 'Pluto', glyph: '♇', astronomyBody: 'Pluto', color: '#a9866d', metal: 'Plutonium (esoteric: obsidian blade)', element: 'Water (transformative)',
    day: 'Tuesday (modern co-ruler)', archangel: 'Azrael', sephirah: 'Daath (the hidden gate)', tarot: ['Judgement (XX)'],
    colors: ['Deep Burgundy', 'Black-Red'], crystals: ['Obsidian', 'Black Kyanite', 'Serpentine', 'Garnet'],
    herbs: ['Mandrake', 'Cypress', 'Yew'],
    incense: 'Myrrh & Rue', deities: 'Hades, Pluto, Osiris (underworld), Kali, Hel', number: '13 (Death-Gate)',
    bodyPart: 'Cellular regeneration, eliminative systems', process: 'Putrefaction — the Great Work’s necessary death',
    magic: 'Transformation, the underworld, hidden power, death and rebirth, alchemical ruin and gold.',
    retroMeaning: 'When retrograde: generational depths churn — the collective shadow speaks.',
    classical: false,
  },
]

export const PLANET_BY_ID = Object.fromEntries(PLANETS.map((p) => [p.id, p]))

export interface ElementInfo {
  name: 'Fire' | 'Earth' | 'Air' | 'Water'
  symbol: string
  quality: string
  signs: string[]
  tarotSuit: string
  direction: string
  season: string
  temper: string
  magic: string
  color: string
}

export const ELEMENTS: ElementInfo[] = [
  { name: 'Fire', symbol: '🜂', quality: 'Hot & Dry — the ascending, expansive principle', signs: ['Aries', 'Leo', 'Sagittarius'], tarotSuit: 'Wands', direction: 'South', season: 'Summer', temper: 'Choleric — ardent, willful, radiant', magic: 'Energy, courage, purification, destruction of obstacle, the will made flame.', color: '#e2543e' },
  { name: 'Earth', symbol: '🜃', quality: 'Cold & Dry — the congealing, preserving principle', signs: ['Taurus', 'Virgo', 'Capricorn'], tarotSuit: 'Pentacles', direction: 'North', season: 'Winter', temper: 'Melancholic — steady, practical, enduring', magic: 'Prosperity, grounding, fertility, craft, the manifestation of tangible result.', color: '#8a9a5b' },
  { name: 'Air', symbol: '🜁', quality: 'Hot & Moist — the vivifying, communicating principle', signs: ['Gemini', 'Libra', 'Aquarius'], tarotSuit: 'Swords', direction: 'East', season: 'Spring', temper: 'Sanguine — quick, social, adaptable', magic: 'Intellect, breath, messages, contracts, the word that shapes the world.', color: '#d4c05a' },
  { name: 'Water', symbol: '🜄', quality: 'Cold & Moist — the dissolving, receptive principle', signs: ['Cancer', 'Scorpio', 'Pisces'], tarotSuit: 'Cups', direction: 'West', season: 'Autumn', temper: 'Phlegmatic — feeling, intuitive, deep', magic: 'Love, healing, dreams, psychic current, the mirror of the inner sea.', color: '#5aa8a0' },
]

// Chaldean order (descending geocentric speed): Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon
export const CHALDEAN_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'] as const
export const DAY_RULERS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const // Sunday..Saturday

export const PLANET_MAGICAL_HOURS: Record<string, string> = {
  sun: 'Crown endeavours, petition for success & vitality, bless leadership',
  venus: 'Attract love, forge friendship, create art, enchant with beauty',
  mercury: 'Write, study, sign contracts, send messages, divine with cards',
  moon: 'Dream-work, scrying, fertility rites, sail with the tides of feeling',
  saturn: 'Bind, banish, end bad habits, work with ancestors, fortify walls',
  jupiter: 'Petition for wealth, justice & expansion; consecrate money talismans',
  mars: 'Courage rites, protection, breaking hexes, competition, severing ties',
}

export interface CityPreset { name: string; lat: number; lon: number; tz: string }

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { name: 'Cape Town', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
  { name: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { name: 'Dublin', lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'Berlin', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { name: 'Rome', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { name: 'Athens', lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens' },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Reykjavík', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
  { name: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: 'Denver', lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  { name: 'Kathmandu', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu' },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Auckland', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  { name: 'Honolulu', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
]

export const PHASE_NAMES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
]

export const PHASE_GLYPHS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

export function phaseIndexOf(angle: number): number {
  // 8 buckets of 45°, 0 = new
  return Math.floor(((angle + 22.5) % 360) / 45) % 8
}

export function signOfLongitude(lon: number): { signIndex: number; degreeInSign: number; sign: string } {
  const norm = ((lon % 360) + 360) % 360
  const signIndex = Math.floor(norm / 30)
  const degreeInSign = norm - signIndex * 30
  return { signIndex, degreeInSign, sign: ZODIAC[signIndex].name }
}

export function formatDegree(degreeInSign: number): string {
  // Truncate (never round) to whole arcminutes — the astrological convention, and the only
  // way to avoid impossible values such as 17°60′ or 30°00′ at the end of a sign.
  const totalMinutes = Math.floor(degreeInSign * 60 + 1e-9)
  const d = Math.floor(totalMinutes / 60)
  const m = totalMinutes - d * 60
  return `${d}°${String(m).padStart(2, '0')}′`
}

export function elementOfSignIndex(i: number): string {
  return ['Fire', 'Earth', 'Air', 'Water'][i % 4]
}
export function modalityOfSignIndex(i: number): string {
  return ['Cardinal', 'Fixed', 'Mutable'][i % 3]
}
