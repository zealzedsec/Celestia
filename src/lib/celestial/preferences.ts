'use client'

// Celestia — persisted viewer preferences (clock, motion, ambience, astrology defaults, shell layout)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HouseSystem } from './houses'

export type MotionPref = 'system' | 'reduce' | 'full'
export type AmbiencePref = 'off' | 'subtle' | 'full'
/** whose clock times are shown in: the observatory's location or this computer's */
export type TimeDisplayPref = 'observatory' | 'system'

interface Preferences {
  clock24: boolean
  showSeconds: boolean
  timeDisplay: TimeDisplayPref
  alerts: boolean
  alertKinds: string[]
  alertLeadMinutes: number
  motion: MotionPref
  ambience: AmbiencePref
  grain: boolean
  houseSystem: HouseSystem
  sidebarCollapsed: boolean
  recentModules: string[]
  set: (patch: Partial<Omit<Preferences, 'set' | 'pushRecent' | 'reset'>>) => void
  pushRecent: (id: string) => void
  reset: () => void
}

const DEFAULTS = {
  clock24: true,
  showSeconds: true,
  timeDisplay: 'observatory' as TimeDisplayPref,
  alerts: false,
  alertKinds: ['moonphase', 'eclipse', 'retrograde', 'season'] as string[],
  alertLeadMinutes: 15,
  motion: 'system' as MotionPref,
  ambience: 'full' as AmbiencePref,
  grain: true,
  houseSystem: 'placidus' as HouseSystem,
  sidebarCollapsed: false,
  recentModules: [] as string[],
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set(patch),
      pushRecent: (id) => set((s) => ({ recentModules: [id, ...s.recentModules.filter((x) => x !== id)].slice(0, 5) })),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'celestia-preferences',
      version: 2,
      // v1 → v2 adds time display & event alerts; keep everything the viewer already chose
      migrate: (persisted) => ({ ...DEFAULTS, ...(persisted as object) }),
    }
  )
)

/** Whether animation should be reduced, combining the explicit setting with the OS preference */
export function prefersReducedMotion(pref: MotionPref): boolean {
  if (pref === 'reduce') return true
  if (pref === 'full') return false
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
