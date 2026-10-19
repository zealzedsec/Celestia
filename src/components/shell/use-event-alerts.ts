'use client'

import { useEffect, useRef } from 'react'
import { usePreferences } from '@/lib/celestial/preferences'
import { fmtTime, useSky } from '@/lib/celestial/use-sky'

const SEEN_KEY = 'celestia-alerted'

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)))
  } catch { /* storage unavailable — alerts may repeat, which is harmless */ }
}

/**
 * Desktop notifications shortly before chosen sky events (while the observatory is open).
 * Each event alerts once, even across reloads.
 */
export function useEventAlerts() {
  const enabled = usePreferences((s) => s.alerts)
  const kinds = usePreferences((s) => s.alertKinds)
  const lead = usePreferences((s) => s.alertLeadMinutes)
  const { data: sky } = useSky(60000)
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!enabled || !sky || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    seen.current ??= loadSeen()
    const check = () => {
      const now = Date.now()
      for (const e of sky.events) {
        if (!kinds.includes(e.kind)) continue
        const t = new Date(e.time).getTime()
        const key = `${e.kind}|${e.title}|${e.time.slice(0, 16)}`
        if (t > now && t - now <= lead * 60_000 && !seen.current!.has(key)) {
          seen.current!.add(key)
          saveSeen(seen.current!)
          try {
            new Notification(`${e.glyph} ${e.title}`, { body: `${e.detail} — at ${fmtTime(e.time)}`, tag: key, silent: false })
          } catch { /* some platforms refuse notifications outside a user gesture */ }
        }
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [enabled, kinds, lead, sky])
}
