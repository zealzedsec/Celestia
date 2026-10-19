'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MODULES } from './modules'

const GENERAL: [string, string][] = [
  ['⌘K / Ctrl K', 'Command palette — modules, places, actions'],
  ['/', 'Open the palette'],
  ['[  ]', 'Previous / next module'],
  ['\\', 'Collapse or expand the sidebar'],
  [',', 'Observatory settings'],
  ['?', 'This sheet of shortcuts'],
  ['Esc', 'Close any window'],
]

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scroll-ethereal">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[0.14em]">Keys of the Observatory</DialogTitle>
          <DialogDescription>Every chamber is one or two keystrokes away. Shortcuts pause while you type.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2 mt-2">
          <section>
            <h3 className="eyebrow mb-3">Chambers</h3>
            <ul className="space-y-1.5 text-sm">
              {MODULES.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span><span style={{ color: m.accent }}>{m.glyph}</span> {m.label}</span>
                  <span className="flex gap-1">
                    {m.key && <kbd className="key-badge">{m.key}</kbd>}
                    <kbd className="key-badge">g {m.chord}</kbd>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="eyebrow mb-3">Everywhere</h3>
            <ul className="space-y-2 text-sm">
              {GENERAL.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{v}</span>
                  <kbd className="key-badge whitespace-nowrap">{k}</kbd>
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-6 mb-3">Sky dome</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Wheel or <kbd className="key-badge">+</kbd> <kbd className="key-badge">−</kbd> to zoom · drag to pan</li>
              <li>Click any star for its dossier</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
