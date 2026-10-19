// Celestia — time-zone helpers (isomorphic: used by API routes and the browser)
//
// Birth data is entered as a *local wall time* ("YYYY-MM-DDTHH:mm") at a place. Converting it to
// UTC needs the offset that was in force at that instant, including historical DST rules, which
// the IANA database (via Intl) knows and a fixed "UTC+2" list does not.

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

/** Parse "YYYY-MM-DDTHH:mm[:ss]" as if it were UTC (pure arithmetic — never uses the host TZ). */
export function wallTimeAsUtcMs(wall: string): number {
  const m = WALL_RE.exec(wall)
  if (!m) return NaN
  const [, y, mo, d, h, mi, s] = m
  const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0)
  // Date.UTC silently rolls over invalid dates (Feb 30 → Mar 2); reject those
  const back = new Date(ms)
  if (back.getUTCMonth() !== +mo - 1 || back.getUTCDate() !== +d || +h > 23 || +mi > 59) return NaN
  return ms
}

export function isValidWallTime(wall: string): boolean {
  return Number.isFinite(wallTimeAsUtcMs(wall))
}

export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    dtfCache.set(tz, f)
  }
  return f
}

/** Offset of `tz` from UTC in minutes (east positive) at the instant `utcMs`. */
export function zoneOffsetMinutes(utcMs: number, tz: string): number {
  const parts = formatterFor(tz).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

/**
 * Resolve the UTC offset for a local wall time in an IANA zone.
 * Matches Python zoneinfo (fold=0): times inside a DST gap shift forward, and ambiguous times in a
 * fold resolve to the earlier (daylight) instant.
 */
export function offsetForWallTime(wall: string, tz: string): number {
  const asUtc = wallTimeAsUtcMs(wall)
  if (!Number.isFinite(asUtc)) return 0
  // every offset in force within ±1 day of the wall time is a candidate
  const candidates = [...new Set([-26, -13, 0, 13, 26].map((h) => zoneOffsetMinutes(asUtc + h * 3600000, tz)))]
  // a candidate is valid if reading the wall time with it round-trips through the zone
  const valid = candidates.filter((c) => zoneOffsetMinutes(asUtc - c * 60000, tz) === c)
  // fold (two valid readings): take the earlier instant = the larger offset, like zoneinfo fold=0
  if (valid.length) return Math.max(...valid)
  // gap (no valid reading): use the pre-transition offset, which shifts the time forward
  return Math.min(...candidates)
}

/** Local wall time + offset (minutes east of UTC) → UTC Date. */
export function wallTimeToUtc(wall: string, offsetMinutes: number): Date {
  return new Date(wallTimeAsUtcMs(wall) - offsetMinutes * 60000)
}

/** Inverse of wallTimeToUtc: a UTC instant rendered as wall time in `tz`. */
export function utcToWallTime(date: Date, tz: string): string {
  const parts = formatterFor(tz).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`
}

/** "UTC+05:30", "UTC−03:00", "UTC±00:00" */
export function formatOffset(minutes: number): string {
  if (!Number.isFinite(minutes)) return 'UTC'
  const sign = minutes > 0 ? '+' : minutes < 0 ? '−' : '±'
  const abs = Math.abs(Math.round(minutes))
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

/** All IANA zones the runtime knows (falls back to a curated list on old engines). */
export function listTimeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
  try {
    const zones = intl.supportedValuesOf?.('timeZone')
    if (zones?.length) return zones.includes('UTC') ? zones : ['UTC', ...zones]
  } catch { /* fall through */ }
  return [
    'UTC', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Lagos', 'America/Los_Angeles', 'America/Denver',
    'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'America/Mexico_City', 'Asia/Dubai',
    'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Athens',
    'Europe/Berlin', 'Europe/London', 'Europe/Moscow', 'Europe/Paris', 'Pacific/Auckland',
  ]
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
