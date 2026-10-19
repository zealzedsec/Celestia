'use client'

import { useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { StarField } from '@/components/celestial/star-field'
import { Dashboard } from '@/components/celestial/dashboard'
import { MoonTracker } from '@/components/celestial/moon-tracker'
import { PlanetTracker } from '@/components/celestial/planet-tracker'
import { Almanac } from '@/components/celestial/almanac'
import { NatalChart } from '@/components/celestial/natal-chart'
import { Synastry } from '@/components/celestial/synastry'
import { ChronoMachine } from '@/components/celestial/chrono-machine'
import { PlanetaryHours } from '@/components/celestial/planetary-hours'
import { HoroscopeView } from '@/components/celestial/horoscope-view'
import { Grimoire } from '@/components/celestial/grimoire'
import { Journal } from '@/components/celestial/journal'
import { usePreferences, prefersReducedMotion } from '@/lib/celestial/preferences'
import { useFormatSync } from '@/lib/celestial/use-sky'
import { MODULE_BY_ID, ModuleId } from './modules'
import { useModuleRoute } from './use-route'
import { useGlobalShortcuts } from './use-shortcuts'
import { AppSidebar } from './app-sidebar'
import { TopBar } from './top-bar'
import { SkyRibbon } from './sky-ribbon'
import { MobileTabBar, ModuleSheet } from './mobile-nav'
import { ModuleHeader, ModulePager } from './module-header'
import { CommandPalette } from './command-palette'
import { SettingsSheet } from './settings-sheet'
import { ShortcutsDialog } from './shortcuts-dialog'
import { SiteFooter } from './site-footer'
import { ModuleBoundary } from './module-boundary'
import { useEventAlerts } from './use-event-alerts'

function ModuleView({ id, navigate }: { id: ModuleId; navigate: (id: ModuleId) => void }) {
  switch (id) {
    case 'dashboard': return <Dashboard onOpenModule={(m) => navigate(m as ModuleId)} />
    case 'moon': return <MoonTracker />
    case 'planets': return <PlanetTracker />
    case 'almanac': return <Almanac />
    case 'natal': return <NatalChart />
    case 'union': return <Synastry />
    case 'chrono': return <ChronoMachine />
    case 'hours': return <PlanetaryHours />
    case 'oracle': return <HoroscopeView />
    case 'grimoire': return <Grimoire />
    case 'journal': return <Journal />
  }
}

export function AppShell() {
  const [active, navigate] = useModuleRoute()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const motionPref = usePreferences((s) => s.motion)
  const grain = usePreferences((s) => s.grain)
  const pushRecent = usePreferences((s) => s.pushRecent)
  const setPref = usePreferences((s) => s.set)
  const formatKey = useFormatSync()
  useEventAlerts()
  const [reduced, setReduced] = useState(false)

  // motion preference → framer-motion + CSS (data-motion on <html>)
  useEffect(() => {
    const apply = () => {
      const r = prefersReducedMotion(motionPref)
      setReduced(r)
      document.documentElement.dataset.motion = r ? 'reduce' : 'full'
    }
    apply()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [motionPref])

  useEffect(() => {
    pushRecent(active)
    const title = `${MODULE_BY_ID[active].title} · CELESTIA`
    document.title = title
    // the metadata <title> can be re-applied once hydration settles — reassert ours after it
    const t = setTimeout(() => { document.title = title }, 300)
    return () => clearTimeout(t)
  }, [active, pushRecent])

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  useGlobalShortcuts({
    active,
    navigate,
    togglePalette: () => setPaletteOpen((v) => !v),
    openPalette,
    openSettings: () => setSettingsOpen(true),
    openShortcuts: () => setShortcutsOpen(true),
    toggleSidebar: () => setPref({ sidebarCollapsed: !usePreferences.getState().sidebarCollapsed }),
  })

  const mod = MODULE_BY_ID[active]

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <div className="min-h-screen flex flex-col relative">
        <a href="#main" className="skip-link">Skip to content</a>
        <StarField />
        {grain && <div className="grain-veil" aria-hidden="true" />}

        <header className="app-header sticky top-0 z-30">
          <TopBar
            active={active}
            onHome={() => navigate('dashboard')}
            onOpenPalette={openPalette}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <SkyRibbon onNavigate={navigate} />
        </header>

        <div className="relative z-10 flex flex-1 w-full">
          <AppSidebar active={active} onNavigate={navigate} />
          <main id="main" tabIndex={-1} className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-28 lg:pb-10 outline-none">
            <div className="max-w-7xl mx-auto">
              {/* keyed remount + CSS entrance: content swaps instantly and can never be held
                  hostage by an exit animation (e.g. in a background tab where frames are paused) */}
              <div key={`${active}-${formatKey}`} className="module-enter">
                <ModuleHeader mod={mod} />
                <ModuleBoundary name={mod.label}>
                  <ModuleView id={active} navigate={navigate} />
                </ModuleBoundary>
                <ModulePager active={active} onNavigate={navigate} />
              </div>
            </div>
            <SiteFooter onOpenPalette={openPalette} />
          </main>
        </div>

        <MobileTabBar active={active} onNavigate={navigate} onOpenAll={() => setMenuOpen(true)} />
        <ModuleSheet open={menuOpen} onOpenChange={setMenuOpen} active={active} onNavigate={navigate} />
        <CommandPalette
          open={paletteOpen}
          setOpen={setPaletteOpen}
          onNavigate={navigate}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </div>
    </MotionConfig>
  )
}
