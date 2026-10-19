'use client'

// Hash routing: #/moon, #/natal … — deep links, reloads and the browser back button all work,
// with no server round-trip (the whole observatory is a single client page).
import { useCallback, useSyncExternalStore } from 'react'
import { isModuleId, ModuleId } from './modules'

const DEFAULT: ModuleId = 'dashboard'

function read(): ModuleId {
  if (typeof window === 'undefined') return DEFAULT
  const id = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return isModuleId(id) ? id : DEFAULT
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  window.addEventListener('popstate', cb)
  return () => {
    window.removeEventListener('hashchange', cb)
    window.removeEventListener('popstate', cb)
  }
}

export function useModuleRoute(): [ModuleId, (id: ModuleId) => void] {
  const active = useSyncExternalStore(subscribe, read, () => DEFAULT)
  const navigate = useCallback((id: ModuleId) => {
    if (read() === id) return
    window.location.hash = `/${id}`
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])
  return [active, navigate]
}
