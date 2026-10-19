'use client'

import { useEffect, useState } from 'react'
import { usePreferences } from '@/lib/celestial/preferences'
import { useBrowserTimeZone, useCelestiaStore } from '@/lib/celestial/use-sky'
import { zoneOffsetMinutes } from '@/lib/celestial/timezone'

/** Live ticking clock: local time + UTC + Julian Day */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  const clock24 = usePreferences((s) => s.clock24)
  const showSeconds = usePreferences((s) => s.showSeconds)
  const loc = useCelestiaStore((s) => s.location)
  const systemTz = useBrowserTimeZone()

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    // align ticks to the wall-clock second so the display never skips
    let id: ReturnType<typeof setInterval> | undefined
    const align = setTimeout(() => { tick(); id = setInterval(tick, 1000) }, 1000 - (Date.now() % 1000))
    return () => { clearTimeout(align); if (id) clearInterval(id) }
  }, [])

  if (!now) return <div className="w-36 h-9" aria-hidden="true" />

  const jd = now.getTime() / 86400000 + 2440587.5
  const local = now.toLocaleTimeString(clock24 ? 'en-GB' : 'en-US', {
    hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined, hour12: !clock24,
  })
  // when the observatory sits in another zone, show its wall clock as well
  const remote = loc.tz && zoneOffsetMinutes(now.getTime(), loc.tz) !== zoneOffsetMinutes(now.getTime(), systemTz)
    ? now.toLocaleTimeString(clock24 ? 'en-GB' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !clock24, timeZone: loc.tz })
    : null
  return (
    <div className="text-right select-none lens-flare" aria-label={`Local time ${local}${remote ? `, ${loc.name} ${remote}` : ''}`}>
      <div className="tabular text-[15px] leading-tight glow-gold" style={{ color: 'var(--gilded)' }}>{local}</div>
      <div className="tabular text-[10px] text-muted-foreground leading-tight">
        {remote ? <span className="text-[var(--astral)]">{loc.name.split(/[ ,(]/)[0]} {remote} · </span> : null}UTC {now.toISOString().slice(11, 16)} · JD {jd.toFixed(3)}
      </div>
    </div>
  )
}
