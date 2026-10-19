// Celestia — Tarot engine: full 78-card RWS deck, spreads & draws
// Correspondences follow the Golden Dawn tradition (Golden Dawn astrological attributions)

export interface TarotCard {
  id: string
  name: string
  arcana: 'major' | 'minor'
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles'
  number: number // majors: 0-21, minors: 1-14 (11=page,12=knight,13=queen,14=king)
  element: 'Fire' | 'Water' | 'Air' | 'Earth' | 'Spirit'
  astro: string // Golden Dawn attribution, e.g. "Mercury", "Venus in Cancer"
  glyph: string // emoji/unicode sigil for the card face
  keywords: { upright: string[]; reversed: string[] }
  meaning: string // one-line poetic essence
}

const MAJORS: Omit<TarotCard, 'arcana'>[] = [
  { id: 'fool', name: 'The Fool', number: 0, element: 'Air', astro: 'Uranus', glyph: '🃏', keywords: { upright: ['beginnings', 'innocence', 'leap of faith'], reversed: ['recklessness', 'hesitation', 'naivety'] }, meaning: 'Step from the cliff — the universe catches those who trust.' },
  { id: 'magician', name: 'The Magician', number: 1, element: 'Air', astro: 'Mercury', glyph: '🪄', keywords: { upright: ['manifestation', 'willpower', 'skill'], reversed: ['illusion', 'scattered energy', 'manipulation'] }, meaning: 'As above, so below — the wand is raised and the world responds.' },
  { id: 'high-priestess', name: 'The High Priestess', number: 2, element: 'Water', astro: 'Moon', glyph: '🌙', keywords: { upright: ['intuition', 'mystery', 'inner voice'], reversed: ['secrets', 'disconnection', 'silence ignored'] }, meaning: 'Between the pillars, the answer is already written in moonlight.' },
  { id: 'empress', name: 'The Empress', number: 3, element: 'Earth', astro: 'Venus', glyph: '🌾', keywords: { upright: ['abundance', 'nurture', 'creation'], reversed: ['stagnation', 'smothering', 'creative block'] }, meaning: 'The garden grows wild and generous — tend it, and feast.' },
  { id: 'emperor', name: 'The Emperor', number: 4, element: 'Fire', astro: 'Aries', glyph: '♜', keywords: { upright: ['structure', 'authority', 'stability'], reversed: ['tyranny', 'rigidity', 'lost control'] }, meaning: 'Build the throne of stone; order is a form of devotion.' },
  { id: 'hierophant', name: 'The Hierophant', number: 5, element: 'Earth', astro: 'Taurus', glyph: '🗝', keywords: { upright: ['tradition', 'teaching', 'sacred knowledge'], reversed: ['dogma', 'rebellion', 'hollow ritual'] }, meaning: 'Old keys still open doors — seek the keeper of lineages.' },
  { id: 'lovers', name: 'The Lovers', number: 6, element: 'Air', astro: 'Gemini', glyph: '❦', keywords: { upright: ['union', 'choice', 'harmony'], reversed: ['discord', 'imbalance', 'misalignment'] }, meaning: 'Two mirrors face each other; every union begins as a choice.' },
  { id: 'chariot', name: 'The Chariot', number: 7, element: 'Water', astro: 'Cancer', glyph: '🛡', keywords: { upright: ['will', 'victory', 'momentum'], reversed: ['aimlessness', 'force', 'lost reins'] }, meaning: 'Opposite forces harnessed to one wheel — drive, and do not drift.' },
  { id: 'strength', name: 'Strength', number: 8, element: 'Fire', astro: 'Leo', glyph: '🦁', keywords: { upright: ['courage', 'gentleness', 'inner power'], reversed: ['doubt', 'brute force', 'tamed spirit'] }, meaning: 'The lion is not conquered but befriended — soft hands, iron heart.' },
  { id: 'hermit', name: 'The Hermit', number: 9, element: 'Earth', astro: 'Virgo', glyph: '🕯', keywords: { upright: ['solitude', 'searching', 'inner light'], reversed: ['isolation', 'lostness', 'withdrawal'] }, meaning: 'Climb away from the noise; the lantern you carry is your own.' },
  { id: 'wheel', name: 'Wheel of Fortune', number: 10, element: 'Fire', astro: 'Jupiter', glyph: '☸', keywords: { upright: ['cycles', 'fate', 'turning point'], reversed: ['resistance', 'bad luck', 'broken cycle'] }, meaning: 'The wheel turns whether you cling or dance — rise with it.' },
  { id: 'justice', name: 'Justice', number: 11, element: 'Air', astro: 'Libra', glyph: '⚖', keywords: { upright: ['truth', 'balance', 'cause & effect'], reversed: ['bias', 'unfairness', 'avoidance'] }, meaning: 'The sword weighs the heart — every scale settles in the end.' },
  { id: 'hanged-man', name: 'The Hanged Man', number: 12, element: 'Water', astro: 'Neptune', glyph: '🙃', keywords: { upright: ['surrender', 'new perspective', 'pause'], reversed: ['stalling', 'martyrdom', 'stagnation'] }, meaning: 'Hang a while upside-down — the world reads differently from here.' },
  { id: 'death', name: 'Death', number: 13, element: 'Water', astro: 'Scorpio', glyph: '🦋', keywords: { upright: ['transformation', 'endings', 'release'], reversed: ['clinging', 'fear of change', 'decay'] }, meaning: 'Something must end so the butterfly may unfold its wings.' },
  { id: 'temperance', name: 'Temperance', number: 14, element: 'Fire', astro: 'Sagittarius', glyph: '🏺', keywords: { upright: ['alchemy', 'moderation', 'blending'], reversed: ['excess', 'impatience', 'imbalance'] }, meaning: 'Pour the fire into the water, drop by drop — the elixir forms.' },
  { id: 'devil', name: 'The Devil', number: 15, element: 'Earth', astro: 'Capricorn', glyph: '⛓', keywords: { upright: ['bondage', 'shadow', 'temptation'], reversed: ['release', 'awareness', 'breaking chains'] }, meaning: 'The chains are loose — look closer: they were never locked.' },
  { id: 'tower', name: 'The Tower', number: 16, element: 'Fire', astro: 'Mars', glyph: '🗼', keywords: { upright: ['upheaval', 'revelation', 'collapse'], reversed: ['delayed disaster', 'fear of truth', 'aftershock'] }, meaning: 'Lightning strikes the false crown — truth is the mercy of storms.' },
  { id: 'star', name: 'The Star', number: 17, element: 'Air', astro: 'Aquarius', glyph: '⭐', keywords: { upright: ['hope', 'healing', 'renewal'], reversed: ['despair', 'dimmed faith', 'disconnection'] }, meaning: 'After the ruin, water flows to the land again — wish anew.' },
  { id: 'moon', name: 'The Moon', number: 18, element: 'Water', astro: 'Pisces', glyph: '☽', keywords: { upright: ['illusion', 'dreams', 'the unknown'], reversed: ['clarity', 'released fear', 'truth surfacing'] }, meaning: 'Not all that glimmers on the path is the road itself — walk slow.' },
  { id: 'sun', name: 'The Sun', number: 19, element: 'Fire', astro: 'Sun', glyph: '☉', keywords: { upright: ['joy', 'vitality', 'success'], reversed: ['dimmed joy', 'delay', 'false cheer'] }, meaning: 'No shadow can argue with noon — warmth is the verdict.' },
  { id: 'judgement', name: 'Judgement', number: 20, element: 'Fire', astro: 'Pluto', glyph: '📯', keywords: { upright: ['awakening', 'reckoning', 'calling'], reversed: ['self-doubt', 'deafness to call', 'avoidance'] }, meaning: 'The horn sounds beneath the soil — rise, revised and rinsed.' },
  { id: 'world', name: 'The World', number: 21, element: 'Earth', astro: 'Saturn', glyph: '🌍', keywords: { upright: ['completion', 'wholeness', 'arrival'], reversed: ['incompletion', 'shortcuts', 'unfinished circles'] }, meaning: 'The circle closes in laurel — dance once, then begin again.' },
]

const SUITS: { suit: NonNullable<TarotCard['suit']>; element: TarotCard['element']; glyph: string; domain: string; rankAstro: string[] }[] = [
  {
    suit: 'wands', element: 'Fire', glyph: '🜂', domain: 'passion, spirit & enterprise',
    rankAstro: ['Ace — root of fire', 'Aries', 'Sun in Aries', 'Venus in Aries', 'Mercury in Aries', 'Moon in Aries', 'Saturn in Aries', 'Jupiter in Aries', 'Mars in Aries', 'Sun in Sagittarius', 'Saturn in Sagittarius', 'Page — earth of fire', 'Knight — air of fire', 'Queen — water of fire', 'King — fire of fire'],
  },
  {
    suit: 'cups', element: 'Water', glyph: '🜄', domain: 'emotion, love & intuition',
    rankAstro: ['Ace — root of water', 'Cancer', 'Moon in Cancer', 'Mercury in Cancer', 'Venus in Cancer', 'Moon in Scorpio', 'Jupiter in Scorpio', 'Mars in Scorpio', 'Sun in Pisces', 'Moon in Pisces', 'Saturn in Pisces', 'Page — earth of water', 'Knight — air of water', 'Queen — water of water', 'King — fire of water'],
  },
  {
    suit: 'swords', element: 'Air', glyph: '🜁', domain: 'mind, truth & conflict',
    rankAstro: ['Ace — root of air', 'Libra', 'Moon in Libra', 'Jupiter in Libra', 'Venus in Libra', 'Mercury in Libra', 'Moon in Aquarius', 'Jupiter in Aquarius', 'Mars in Aquarius', 'Sun in Gemini', 'Saturn in Gemini', 'Page — earth of air', 'Knight — air of air', 'Queen — water of air', 'King — fire of air'],
  },
  {
    suit: 'pentacles', element: 'Earth', glyph: '🜃', domain: 'body, craft & resource',
    rankAstro: ['Ace — root of earth', 'Capricorn', 'Venus in Capricorn', 'Sun in Capricorn', 'Mercury in Capricorn', 'Moon in Taurus', 'Saturn in Taurus', 'Jupiter in Taurus', 'Mars in Capricorn', 'Sun in Virgo', 'Moon in Virgo', 'Page — earth of earth', 'Knight — air of earth', 'Queen — water of earth', 'King — fire of earth'],
  },
]

const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']

const MINOR_KEYWORDS: Record<string, { upright: string[]; reversed: string[] }> = {
  wands: {
    upright: ['ignition', 'vision', 'growth'], // per-rank nuance added below
    reversed: ['delay', 'burnout', 'scattered flame'],
  },
  cups: { upright: ['feeling', 'connection', 'flow'], reversed: ['spill', 'drain', 'closed heart'] },
  swords: { upright: ['clarity', 'cutting truth', 'vigilance'], reversed: ['confusion', 'cruelty', 'restless mind'] },
  pentacles: { upright: ['craft', 'grounding', 'harvest'], reversed: ['lack', 'overwork', 'stalled seed'] },
}

// Nuanced per-rank keywords for minors
const RANK_KEYS: Record<number, [string[], string[]]> = {
  1: [['new spark', 'pure potential'], ['false start', 'dulled promise']],
  2: [['balance', 'first choice'], ['stalemate', 'fear to choose']],
  3: [['first fruits', 'expansion'], ['thin harvest', 'delayed growth']],
  4: [['holding', 'stability'], ['clutching', 'restless shelf']],
  5: [['disruption', 'contest'], ['end of strife', 'lingering loss']],
  6: [['gift', 'passage onward'], ['strings attached', 'stuck ferry']],
  7: [['testing', 'strategy'], ['illusion of progress', 'surrendered ground']],
  8: [['swiftness', 'momentum'], ['dragging feet', 'fluttering aim']],
  9: [['near mastery', 'resilience'], ['guarding ghosts', 'last wall']],
  10: [['culmination', 'full circle'], ['overflow', 'burnt ending']],
  11: [['curiosity', 'eager study'], ['fickle focus', 'held tongue']],
  12: [['quest', 'bold charge'], ['reckless dash', 'bolted gate']],
  13: [['deep knowing', 'quiet command'], ['cold tide', 'smothered feel']],
  14: [['sovereignty', 'mastery'], ['rigid crown', 'scattered rule']],
}

function buildDeck(): TarotCard[] {
  const cards: TarotCard[] = MAJORS.map((m) => ({ ...m, arcana: 'major' }))
  for (const s of SUITS) {
    for (let rank = 1; rank <= 14; rank++) {
      const rk = RANK_KEYS[rank]
      cards.push({
        id: `${s.suit}-${rank}`,
        name: `${RANK_NAMES[rank]} of ${s.suit[0].toUpperCase()}${s.suit.slice(1)}`,
        arcana: 'minor',
        suit: s.suit,
        number: rank,
        element: s.element,
        astro: s.rankAstro[rank - 1],
        glyph: s.glyph,
        keywords: {
          upright: [rk[0][0], ...MINOR_KEYWORDS[s.suit].upright.slice(0, 2)],
          reversed: [rk[1][0], ...MINOR_KEYWORDS[s.suit].reversed.slice(0, 2)],
        },
        meaning: `${s.domain[0].toUpperCase()}${s.domain.slice(1)} — ${rk[0][0]} through the lens of ${s.element.toLowerCase()}.`,
      })
    }
  }
  return cards
}

export const TAROT_DECK: TarotCard[] = buildDeck()

export interface DrawnCard extends TarotCard {
  reversed: boolean
  position: string // spread position label
}

export interface TarotSpread {
  id: 'single' | 'three' | 'crescent'
  name: string
  blurb: string
  positions: string[]
}

export const SPREADS: TarotSpread[] = [
  { id: 'single', name: 'Daily Draw', blurb: 'One card as the day’s rune — a single thread of counsel.', positions: ['The Whisper of Today'] },
  { id: 'three', name: 'The Three Threads', blurb: 'Past, present and future woven into one short braid of time.', positions: ['What Was', 'What Is', 'What Bends Toward'] },
  { id: 'crescent', name: 'Crescent Veil', blurb: 'Five cards in a waxing arc — situation, challenge, hidden depths, counsel and unfolding.', positions: ['The Situation', 'The Challenge', 'The Hidden Current', 'The Counsel', 'The Unfolding'] },
]

/** Cryptographically random draw of `count` cards for a spread */
export function drawSpread(spreadId: TarotSpread['id']): { spread: TarotSpread; cards: DrawnCard[] } {
  const spread = SPREADS.find((s) => s.id === spreadId) ?? SPREADS[0]
  const n = spread.positions.length
  // Fisher–Yates with crypto randomness
  const pool = [...TAROT_DECK]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const cards: DrawnCard[] = pool.slice(0, n).map((c, i) => ({
    ...c,
    reversed: crypto.getRandomValues(new Uint8Array(1))[0] < 62, // ~24% reversed
    position: spread.positions[i],
  }))
  return { spread, cards }
}

export const TAROT_PROMPTS = [
  'What does the sky ask of me today?',
  'What hides beneath this feeling?',
  'Where is my true north this week?',
  'What wants to be released?',
  'What is quietly growing in me?',
  'What counsel does the veil offer this threshold?',
  'How do I tend the fire that keeps me?',
  'What gift waits inside this difficulty?',
]

export const MOODS = [
  { name: 'Radiant', glyph: '☀', color: 'var(--gilded)' },
  { name: 'Hopeful', glyph: '✦', color: 'var(--verdant)' },
  { name: 'Still', glyph: '◦', color: 'var(--moonlight)' },
  { name: 'Stormy', glyph: '☇', color: 'var(--astral)' },
  { name: 'Shadowed', glyph: '🌑', color: '#9b8ec4' },
  { name: 'Transmuting', glyph: '⚗', color: 'var(--ember)' },
  { name: 'Wondrous', glyph: '✧', color: 'var(--rose-cosmic)' },
  { name: 'Weary', glyph: '☾', color: '#8d86a8' },
] as const
