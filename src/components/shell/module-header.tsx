'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MODULES, ModuleDef, ModuleId } from './modules'

export function ModuleHeader({ mod }: { mod: ModuleDef }) {
  return (
    <header className="module-header mb-5 flex items-start gap-4">
      <div className="module-glyph shrink-0" style={{ color: mod.accent }} aria-hidden="true">{mod.glyph}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.34em] text-muted-foreground">{mod.group} · {mod.sub}</div>
        <h2 className="font-display text-2xl sm:text-[28px] tracking-[0.08em] leading-tight mt-0.5 text-[var(--moonlight)]">{mod.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">{mod.description}</p>
      </div>
    </header>
  )
}

/** Previous / next chamber links at the foot of every module */
export function ModulePager({ active, onNavigate }: { active: ModuleId; onNavigate: (id: ModuleId) => void }) {
  const i = MODULES.findIndex((m) => m.id === active)
  const prev = MODULES[(i - 1 + MODULES.length) % MODULES.length]
  const next = MODULES[(i + 1) % MODULES.length]
  return (
    <nav className="mt-10 grid grid-cols-2 gap-3" aria-label="Adjacent modules">
      <button onClick={() => onNavigate(prev.id)} className="pager-link text-left">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground"><ChevronLeft className="h-3 w-3" /> previous <kbd className="key-badge ml-1">[</kbd></span>
        <span className="block mt-1 text-sm"><span style={{ color: prev.accent }}>{prev.glyph}</span> {prev.title}</span>
      </button>
      <button onClick={() => onNavigate(next.id)} className="pager-link text-right">
        <span className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground"><kbd className="key-badge mr-1">]</kbd> next <ChevronRight className="h-3 w-3" /></span>
        <span className="block mt-1 text-sm">{next.title} <span style={{ color: next.accent }}>{next.glyph}</span></span>
      </button>
    </nav>
  )
}
