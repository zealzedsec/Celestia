'use client'

import { LayoutGrid } from 'lucide-react'
import { GROUPS, MODULES, ModuleId } from './modules'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/** Bottom tab bar on phones: four primary chambers + "All" */
export function MobileTabBar({ active, onNavigate, onOpenAll }: { active: ModuleId; onNavigate: (id: ModuleId) => void; onOpenAll: () => void }) {
  const primary = MODULES.filter((m) => m.primary).slice(0, 4)
  const activeIsPrimary = primary.some((m) => m.id === active)
  return (
    <nav className="mobile-tabbar lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5" aria-label="Primary modules">
      {primary.map((m) => (
        <button key={m.id} onClick={() => onNavigate(m.id)} aria-current={m.id === active ? 'page' : undefined} className={`tab-item ${m.id === active ? 'tab-item-active' : ''}`}>
          <span className="text-lg leading-none" style={{ color: m.id === active ? 'var(--gilded)' : m.accent }}>{m.glyph}</span>
          <span className="text-[9.5px] uppercase tracking-[0.14em]">{m.label}</span>
        </button>
      ))}
      <button onClick={onOpenAll} className={`tab-item ${!activeIsPrimary ? 'tab-item-active' : ''}`} aria-label="All modules">
        <LayoutGrid className="h-[18px] w-[18px]" />
        <span className="text-[9.5px] uppercase tracking-[0.14em]">All</span>
      </button>
    </nav>
  )
}

/** The full module index as a sheet (phones & tablets) */
export function ModuleSheet({ open, onOpenChange, active, onNavigate }: { open: boolean; onOpenChange: (v: boolean) => void; active: ModuleId; onNavigate: (id: ModuleId) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[86vw] max-w-sm p-0 overflow-y-auto scroll-ethereal">
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle className="font-display tracking-[0.2em] text-foil">CELESTIA</SheetTitle>
          <SheetDescription className="text-xs">Eleven chambers of the observatory</SheetDescription>
        </SheetHeader>
        <div className="px-3 pb-6 space-y-4">
          {GROUPS.map((g) => (
            <div key={g.id}>
              <div className="px-2 mb-1 text-[9.5px] uppercase tracking-[0.32em] text-muted-foreground">{g.glyph} {g.label}</div>
              {MODULES.filter((m) => m.group === g.id).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onNavigate(m.id); onOpenChange(false) }}
                  aria-current={m.id === active ? 'page' : undefined}
                  className={`w-full flex items-start gap-3 px-2.5 py-2.5 text-left transition-colors ${m.id === active ? 'nav-item-active text-[var(--gilded)]' : 'hover:bg-white/[0.04]'}`}
                >
                  <span className="text-xl w-6 text-center leading-none mt-0.5" style={{ color: m.id === active ? 'var(--gilded)' : m.accent }}>{m.glyph}</span>
                  <span className="min-w-0">
                    <span className="block text-sm">{m.title}</span>
                    <span className="block text-[11px] text-muted-foreground leading-snug line-clamp-2">{m.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
