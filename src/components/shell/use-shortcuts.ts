'use client'

import { useEffect, useRef } from 'react'
import { MODULES, ModuleId } from './modules'

interface Handlers {
  active: ModuleId
  navigate: (id: ModuleId) => void
  togglePalette: () => void
  openPalette: () => void
  openSettings: () => void
  openShortcuts: () => void
  toggleSidebar: () => void
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

/**
 * Global keys: 1–9/0 chambers, "g"+letter chords, [ ] cycling, / and ⌘K palette, ? help, , settings, \ sidebar.
 * Everything except ⌘K stands down while typing or while any modal window is open.
 */
export function useGlobalShortcuts(h: Handlers) {
  const ref = useRef(h)
  ref.current = h
  const chordAt = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = ref.current
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        k.togglePalette()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (isTyping(e.target)) return
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return

      // "g" then a letter within 1.2 s
      if (chordAt.current && Date.now() - chordAt.current < 1200) {
        chordAt.current = 0
        const m = MODULES.find((x) => x.chord === e.key.toLowerCase())
        if (m) { e.preventDefault(); k.navigate(m.id) }
        return
      }
      if (e.key === 'g') { chordAt.current = Date.now(); return }

      const idx = MODULES.findIndex((m) => m.id === k.active)
      switch (e.key) {
        case '[': e.preventDefault(); k.navigate(MODULES[(idx - 1 + MODULES.length) % MODULES.length].id); return
        case ']': e.preventDefault(); k.navigate(MODULES[(idx + 1) % MODULES.length].id); return
        case '/': e.preventDefault(); k.openPalette(); return
        case '?': e.preventDefault(); k.openShortcuts(); return
        case ',': e.preventDefault(); k.openSettings(); return
        case '\\': e.preventDefault(); k.toggleSidebar(); return
      }
      const byKey = MODULES.find((m) => m.key === e.key)
      if (byKey) k.navigate(byKey.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
