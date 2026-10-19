// Celestia — the module registry: one source of truth for navigation, routing, shortcuts & the palette
import {
  Sparkles, Moon, Orbit, CalendarRange, Sun, Heart, Hourglass, CircleDot, Eye, BookOpenText, NotebookPen,
  type LucideIcon,
} from 'lucide-react'

export type ModuleId =
  | 'dashboard' | 'moon' | 'planets' | 'almanac' | 'natal' | 'union' | 'chrono' | 'hours' | 'oracle' | 'grimoire' | 'journal'

export type ModuleGroup = 'Observe' | 'Cast' | 'Practice' | 'Record'

export interface ModuleDef {
  id: ModuleId
  glyph: string
  label: string
  title: string
  sub: string
  description: string
  group: ModuleGroup
  icon: LucideIcon
  /** number-key shortcut (1–9, 0) */
  key?: string
  /** "g" + letter chord */
  chord: string
  /** shown in the mobile tab bar */
  primary?: boolean
  accent: string
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', glyph: '✧', label: 'Sky Now', title: 'The Sky Now', sub: 'live overview', group: 'Observe', icon: Sparkles, key: '1', chord: 's', primary: true, accent: 'var(--gilded)',
    description: 'The living heavens over your observatory — Moon, Sun, every planet, the aspects between them and what is coming next.' },
  { id: 'moon', glyph: '☽', label: 'Moon', title: 'Moon Observatory', sub: 'phase observatory', group: 'Observe', icon: Moon, key: '2', chord: 'm', primary: true, accent: 'var(--moonlight)',
    description: 'True-phase lunar disc, the void-of-course watch, apsides and a month-by-month phase calendar in your own time zone.' },
  { id: 'planets', glyph: '♄', label: 'Planets', title: 'Planets & Sky Dome', sub: 'ephemeris · sky dome', group: 'Observe', icon: Orbit, key: '3', chord: 'p', primary: true, accent: 'var(--astral)',
    description: 'A full ephemeris with rise, set and visibility, and a planetarium dome of 300 bright stars, the ecliptic and the wandering planets.' },
  { id: 'almanac', glyph: '☷', label: 'Almanac', title: 'Celestial Almanac', sub: 'events · calendar', group: 'Observe', icon: CalendarRange, key: '4', chord: 'a', accent: 'var(--verdant)',
    description: 'Every lunation, ingress, station, elongation, eclipse and season up to a year ahead — filterable and exportable to your calendar.' },
  { id: 'natal', glyph: '☉', label: 'Natal', title: 'Natal Chart Caster', sub: 'chart caster', group: 'Cast', icon: Sun, key: '5', chord: 'n', primary: true, accent: 'var(--gilded)',
    description: 'Cast a birth chart with time-zone-exact DST handling, four house systems, the lunar nodes and the Part of Fortune.' },
  { id: 'union', glyph: '♀', label: 'Union', title: 'Union — Synastry Weaver', sub: 'synastry weaver', group: 'Cast', icon: Heart, key: '6', chord: 'u', accent: 'var(--rose-cosmic)',
    description: 'Lay two charts over each other: cross-aspects, house overlays, the four classic bonds and an honest resonance score.' },
  { id: 'chrono', glyph: '⧖', label: 'Chrono', title: 'The Chronomancer', sub: 'time machine', group: 'Cast', icon: Hourglass, key: '7', chord: 'c', accent: 'var(--astral)',
    description: 'Travel anywhere between 1800 and 2200 and watch the planets, aspects and the star dome rearrange themselves.' },
  { id: 'hours', glyph: '♃', label: 'Hours', title: 'Planetary Hours', sub: 'planetary clock', group: 'Practice', icon: CircleDot, key: '8', chord: 'h', accent: 'var(--gilded)',
    description: 'The Chaldean clock: 24 unequal hours anchored to your true sunrise and sunset, each with its ruler and its work.' },
  { id: 'oracle', glyph: '✶', label: 'Oracle', title: 'The Transit Oracle', sub: 'transit horoscopes', group: 'Practice', icon: Eye, key: '9', chord: 'o', accent: 'var(--verdant)',
    description: 'Twelve horoscopes written live from the actual transits to each sign’s solar point — no stock text.' },
  { id: 'grimoire', glyph: '⚗', label: 'Grimoire', title: 'The Alchemical Grimoire', sub: 'correspondences', group: 'Practice', icon: BookOpenText, key: '0', chord: 'r', accent: 'var(--ember)',
    description: 'Planetary, zodiacal and elemental correspondences: metals, herbs, stones, archangels, sephiroth and alchemical operations.' },
  { id: 'journal', glyph: '❦', label: 'Journal', title: 'Book of Shadows', sub: 'book of shadows', group: 'Record', icon: NotebookPen, chord: 'j', accent: 'var(--rose-cosmic)',
    description: 'Ponderings, dreams and tarot readings, each sealed with the sky sigil of the moment you wrote it.' },
]

export const GROUPS: { id: ModuleGroup; label: string; glyph: string }[] = [
  { id: 'Observe', label: 'Observe', glyph: '◉' },
  { id: 'Cast', label: 'Cast', glyph: '✦' },
  { id: 'Practice', label: 'Practice', glyph: '⚘' },
  { id: 'Record', label: 'Record', glyph: '❧' },
]

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<ModuleId, ModuleDef>

export function isModuleId(v: string): v is ModuleId {
  return v in MODULE_BY_ID
}
