'use client'

import { Command, Keyboard, Menu, Settings2 } from 'lucide-react'
import { LiveClock } from '@/components/celestial/live-clock'
import { LocationBar } from '@/components/celestial/location-bar'
import { MODULE_BY_ID, ModuleId } from './modules'
import { Sigil } from './sigil'

interface TopBarProps {
  active: ModuleId
  onHome: () => void
  onOpenPalette: () => void
  onOpenSettings: () => void
  onOpenShortcuts: () => void
  onOpenMenu: () => void
}

export function TopBar({ active, onHome, onOpenPalette, onOpenSettings, onOpenShortcuts, onOpenMenu }: TopBarProps) {
  const mod = MODULE_BY_ID[active]
  return (
    <div className="h-[var(--bar-h)] px-3 sm:px-4 flex items-center gap-3">
      <button onClick={onOpenMenu} className="lg:hidden icon-btn" aria-label="Open navigation">
        <Menu className="h-4 w-4" />
      </button>

      <button onClick={onHome} className="flex items-center gap-2.5 min-w-0 shrink-0" aria-label="CELESTIA — go to Sky Now">
        <Sigil size={36} />
        <span className="hidden sm:block text-left">
          <span className="block font-display text-lg tracking-[0.22em] text-foil leading-none">CELESTIA</span>
          <span className="block text-[8.5px] uppercase tracking-[0.34em] text-muted-foreground mt-1">living observatory</span>
        </span>
      </button>

      {/* breadcrumb */}
      <div className="hidden xl:flex items-center gap-2 min-w-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground pl-3 ml-1 border-l border-white/[0.06]">
        <span>{mod.group}</span>
        <span className="text-[var(--gilded)]/60">›</span>
        <span className="text-foreground/90 truncate">{mod.label}</span>
      </div>

      <div className="flex-1" />

      {/* palette trigger, styled as a search field */}
      <button
        onClick={onOpenPalette}
        className="palette-trigger hidden md:flex items-center gap-2 h-8 w-40 xl:w-72 px-3 text-xs text-muted-foreground"
        aria-label="Search modules, places and actions (Ctrl+K)"
      >
        <Command className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate"><span className="xl:hidden">Search…</span><span className="hidden xl:inline">Conjure a module, place, action…</span></span>
        <kbd className="key-badge">⌘K</kbd>
      </button>
      <button onClick={onOpenPalette} className="md:hidden icon-btn" aria-label="Open command palette">
        <Command className="h-4 w-4" />
      </button>

      <div className="hidden sm:block"><LiveClock /></div>
      <LocationBar />
      <button onClick={onOpenShortcuts} className="hidden md:inline-flex icon-btn" aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)">
        <Keyboard className="h-4 w-4" />
      </button>
      <button onClick={onOpenSettings} className="icon-btn" aria-label="Observatory settings (,)" title="Observatory settings (,)">
        <Settings2 className="h-4 w-4" />
      </button>
    </div>
  )
}
