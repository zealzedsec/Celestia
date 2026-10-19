'use client'

import { motion } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { GROUPS, MODULES, ModuleId } from './modules'
import { usePreferences } from '@/lib/celestial/preferences'
import { useSky } from '@/lib/celestial/use-sky'
import { MoonVisual } from '@/components/celestial/moon-visual'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function AppSidebar({ active, onNavigate }: { active: ModuleId; onNavigate: (id: ModuleId) => void }) {
  const collapsed = usePreferences((s) => s.sidebarCollapsed)
  const setPref = usePreferences((s) => s.set)

  return (
    <aside
      className={`orrery-sidebar hidden lg:flex flex-col shrink-0 sticky top-[var(--header-h)] h-[calc(100vh-var(--header-h))] transition-[width] duration-300 ease-out ${collapsed ? 'w-[68px]' : 'w-[244px]'}`}
      aria-label="Observatory navigation"
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scroll-ethereal py-3 px-2 space-y-3">
        {GROUPS.map((g) => (
          <div key={g.id} role="group" aria-labelledby={`nav-group-${g.id}`}>
            <div
              id={`nav-group-${g.id}`}
              className={`flex items-center gap-2 px-2 mb-1 text-[9.5px] uppercase tracking-[0.32em] text-muted-foreground/80 ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-[var(--gilded)]/70" aria-hidden="true">{g.glyph}</span>
              {!collapsed && <span>{g.label}</span>}
            </div>
            <ul className="space-y-0.5">
              {MODULES.filter((m) => m.group === g.id).map((m) => {
                const isActive = m.id === active
                const button = (
                  <button
                    onClick={() => onNavigate(m.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`nav-item group relative w-full flex items-center gap-3 px-2.5 py-[7px] text-left transition-colors ${
                      isActive ? 'text-[var(--gilded)]' : 'text-foreground/85 hover:text-foreground hover:bg-white/[0.035]'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 nav-item-active"
                        transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                      />
                    )}
                    <span
                      className={`relative z-10 w-6 text-center text-[17px] leading-none transition-transform group-hover:scale-110 ${isActive ? 'glow-gold' : ''}`}
                      style={{ color: isActive ? 'var(--gilded)' : m.accent }}
                      aria-hidden="true"
                    >
                      {m.glyph}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="relative z-10 min-w-0 flex-1 leading-tight">
                          <span className="block text-[13px] truncate">{m.label}</span>
                          <span className="block text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">{m.sub}</span>
                        </span>
                        <span className="key-badge relative z-10 opacity-0 group-hover:opacity-80 transition-opacity" aria-hidden="true">
                          {m.key ?? `g${m.chord}`}
                        </span>
                      </>
                    )}
                  </button>
                )
                return (
                  <li key={m.id}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {m.label} <span className="text-muted-foreground ml-1">{m.key ?? `g ${m.chord}`}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : button}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <SidebarSky collapsed={collapsed} onOpen={() => onNavigate('moon')} />

      <button
        onClick={() => setPref({ sidebarCollapsed: !collapsed })}
        className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-[var(--gilded)] border-t border-white/[0.05] transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar (\\)' : 'Collapse sidebar (\\)'}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4 mx-auto" /> : <><PanelLeftClose className="h-4 w-4" /> collapse</>}
      </button>
    </aside>
  )
}

/** A miniature live moon at the foot of the sidebar */
function SidebarSky({ collapsed, onOpen }: { collapsed: boolean; onOpen: () => void }) {
  const { data } = useSky(60000)
  if (!data) return <div className="h-16" />
  const m = data.moon
  return (
    <button
      onClick={onOpen}
      className={`sidebar-sky mx-2 mb-2 flex items-center gap-3 px-2 py-2.5 hover:bg-white/[0.03] transition-colors text-left ${collapsed ? 'justify-center' : ''}`}
      title={`${m.phaseName} · ${(m.illumination * 100).toFixed(0)}% · Moon in ${m.sign}`}
    >
      <MoonVisual phaseAngle={m.phaseAngle} size={collapsed ? 30 : 38} />
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[12px] text-[var(--moonlight)] truncate">{m.phaseName}</span>
          <span className="block text-[10px] text-muted-foreground tabular truncate">
            {(m.illumination * 100).toFixed(0)}% · ☽ in {m.sign}{m.voidOfCourse ? ' · v/c' : ''}
          </span>
        </span>
      )}
    </button>
  )
}
