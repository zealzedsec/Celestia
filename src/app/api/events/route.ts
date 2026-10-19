import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { computeUpcomingEvents } from '@/lib/celestial/astro'
import { SkyEvent } from '@/lib/celestial/types'
import { jsonError, parseInstant, serverError, TtlCache } from '@/lib/api'

export const dynamic = 'force-dynamic'

// Event searches over a year take a few hundred ms — cache per (start hour, window, moon flag)
const cache = new TtlCache<SkyEvent[]>(15 * 60_000, 24)

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(400).default(90),
  moon: z.enum(['0', '1']).default('0'),
  format: z.enum(['json', 'ics']).default('json'),
})

/** GET /api/events?days=90&moon=1&kinds=eclipse,retrograde&t=ISO&format=ics — the almanac: every notable sky event in a window */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = querySchema.safeParse({ days: sp.get('days') ?? undefined, moon: sp.get('moon') ?? undefined, format: sp.get('format') ?? undefined })
  if (!q.success) return jsonError('days must be 1–400; moon 0|1; format json|ics')
  const start = parseInstant(sp.get('t'), 1900, 2100)
  if ('error' in start) return jsonError(start.error)

  const hourBucket = new Date(Math.floor(start.getTime() / 3600000) * 3600000)
  const key = `${hourBucket.toISOString()}|${q.data.days}|${q.data.moon}`
  let events = cache.get(key)
  try {
    if (!events) {
      events = computeUpcomingEvents(start, { days: q.data.days, moonIngresses: q.data.moon === '1' })
      cache.set(key, events)
    }
  } catch (err) {
    return serverError('events', err, 'Failed to compute the almanac')
  }
  const kinds = new Set((sp.get('kinds') ?? '').split(',').map((k) => k.trim()).filter(Boolean))
  const upcoming = events.filter((e) => new Date(e.time).getTime() >= start.getTime() && (!kinds.size || kinds.has(e.kind)))

  if (q.data.format === 'ics') {
    return new NextResponse(toIcs(upcoming), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="celestia-almanac-${start.toISOString().slice(0, 10)}.ics"`,
        'Cache-Control': 'no-store',
      },
    })
  }
  return NextResponse.json({ start: start.toISOString(), days: q.data.days, events: upcoming }, { headers: { 'Cache-Control': 'no-store' } })
}

/** RFC 5545 calendar — one 30-minute VEVENT per sky event */
function toIcs(events: SkyEvent[]): string {
  const stamp = icsDate(new Date())
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Celestia//Almanac//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Celestia Almanac']
  for (const e of events) {
    const t = new Date(e.time)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.kind}-${t.getTime()}-${(e.body ?? 'sky')}@celestia`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(t)}`,
      `DTEND:${icsDate(new Date(t.getTime() + 30 * 60000))}`,
      `SUMMARY:${esc(`${e.glyph} ${e.title}`)}`,
      `DESCRIPTION:${esc(e.detail)}`,
      `CATEGORIES:${e.kind.toUpperCase()}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  // fold lines longer than 75 octets as the RFC requires
  return lines.map(fold).join('\r\n') + '\r\n'
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = ''
  let curLen = 0
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length
    if (curLen + len > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      curLen = 0
    }
    cur += ch
    curLen += len
  }
  out.push(cur)
  return out.join('\r\n ')
}
