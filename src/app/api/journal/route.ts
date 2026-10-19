import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { computeAllPositions, computeMoonInfo, makeObserver } from '@/lib/celestial/astro'
import { computePlanetaryHours } from '@/lib/celestial/hours'
import { isValidTimeZone, utcToWallTime } from '@/lib/celestial/timezone'
import { DEFAULT_LOCATION, isNotFound, jsonError, readJson, serverError, zodMessage } from '@/lib/api'

export const dynamic = 'force-dynamic'

const KINDS = ['pondering', 'tarot', 'horoscope', 'diary', 'dream'] as const

const tagsSchema = z.array(z.string()).max(24).transform((tags) =>
  [...new Set(tags.map((t) => t.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 32)).filter(Boolean))].slice(0, 12))

const spreadSchema = z.unknown().refine((v) => v === null || (typeof v === 'object' && JSON.stringify(v).length <= 20_000), 'tarotSpread too large')

const createSchema = z.object({
  kind: z.enum(KINDS).default('pondering'),
  title: z.string().max(200).default(''),
  body: z.string().max(20_000).default(''),
  mood: z.string().max(40).nullable().optional(),
  tags: tagsSchema.optional().default([]),
  tarotSpread: spreadSchema.optional(),
  favorite: z.boolean().optional().default(false),
  lat: z.number().finite().min(-90).max(90).optional(),
  lon: z.number().finite().min(-180).max(180).optional(),
  name: z.string().max(80).optional(),
})

const updateSchema = z.object({
  kind: z.enum(KINDS).optional(),
  title: z.string().max(200).optional(),
  body: z.string().max(20_000).optional(),
  mood: z.string().max(40).nullable().optional(),
  tags: tagsSchema.optional(),
  tarotSpread: spreadSchema.optional(),
  favorite: z.boolean().optional(),
})

interface SkySigil {
  moonPhase: string
  moonPhaseAngle: number
  moonSign: string
  illumination: number
  sunSign: string
  hourRuler: string | null
  dayRuler: string | null
  locationName: string
  capturedAt: string
}

/** The "sky sigil" — the astral signature stamped into every entry at the moment of writing */
function computeSkySigil(lat = DEFAULT_LOCATION.lat, lon = DEFAULT_LOCATION.lon, name?: string): SkySigil {
  const now = new Date()
  const obs = makeObserver(lat, lon)
  const positions = computeAllPositions(now, obs, false)
  const moon = computeMoonInfo(now, obs, positions)
  const sun = positions.find((p) => p.id === 'sun')!
  let hourRuler: string | null = null
  let dayRuler: string | null = null
  try {
    const hours = computePlanetaryHours(now, lat, lon)
    hourRuler = hours.currentHour?.ruler ?? null
    dayRuler = hours.dayRuler
  } catch {
    // polar edge cases — the sigil survives without the hour ruler
  }
  return {
    moonPhase: moon.phaseName, moonPhaseAngle: moon.phaseAngle, moonSign: moon.sign, illumination: moon.illumination,
    sunSign: sun.sign, hourRuler, dayRuler, locationName: name || 'Celestia', capturedAt: now.toISOString(),
  }
}

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

type Row = Awaited<ReturnType<typeof db.journalEntry.findFirstOrThrow>>
const hydrate = (r: Row) => ({
  ...r,
  tags: safeParse<string[]>(r.tags, []),
  skySigil: safeParse<Record<string, unknown>>(r.skySigil, {}),
  tarotSpread: safeParse<unknown>(r.tarotSpread, null),
})

// GET /api/journal — entries + stats.  ?q= &kind= &tag= &favorite=1 &limit= &tz=<IANA zone for day streaks>
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim().slice(0, 120)
  const kind = sp.get('kind')
  const tag = sp.get('tag')?.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 32)
  const favorite = sp.get('favorite') === '1'
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 200, 1), 500)
  const tzRaw = sp.get('tz')
  const tz = tzRaw && isValidTimeZone(tzRaw) ? tzRaw : 'UTC'

  const where: Prisma.JournalEntryWhereInput = {
    ...(kind && (KINDS as readonly string[]).includes(kind) ? { kind } : {}),
    ...(favorite ? { favorite: true } : {}),
    // tags are stored as a JSON array, so the quoted tag is an exact element match
    ...(tag ? { tags: { contains: JSON.stringify(tag) } } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }, { tags: { contains: q.toLowerCase() } }] } : {}),
  }

  try {
    const [rows, all] = await Promise.all([
      db.journalEntry.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      db.journalEntry.findMany({ orderBy: { createdAt: 'desc' }, select: { kind: true, tags: true, favorite: true, createdAt: true } }),
    ])

    const byKind: Record<string, number> = {}
    const tagCloud: Record<string, number> = {}
    let favorites = 0
    for (const e of all) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1
      if (e.favorite) favorites++
      for (const t of safeParse<string[]>(e.tags, [])) tagCloud[t] = (tagCloud[t] ?? 0) + 1
    }

    // day streak in the writer's own calendar
    const localDay = (d: Date) => utcToWallTime(d, tz).slice(0, 10)
    const daySet = new Set(all.map((e) => localDay(e.createdAt)))
    let streak = 0
    let cursor = Date.now()
    if (!daySet.has(localDay(new Date(cursor)))) cursor -= 86400000 // a streak may end yesterday
    while (daySet.has(localDay(new Date(cursor)))) {
      streak++
      cursor -= 86400000
    }

    return NextResponse.json({
      entries: rows.map(hydrate),
      stats: {
        total: all.length, byKind, favorites, streak, days: daySet.size,
        tagCloud: Object.fromEntries(Object.entries(tagCloud).sort((a, b) => b[1] - a[1]).slice(0, 24)),
      },
    })
  } catch (err) {
    return serverError('journal-list', err, 'Failed to read the book of shadows')
  }
}

// POST /api/journal — create an entry
export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await readJson(req))
  if (!parsed.success) return jsonError(zodMessage(parsed.error))
  const b = parsed.data
  const title = b.title.trim()
  const body = b.body.trim()
  if (!title && !body) return jsonError('An entry needs a whisper — title or body required')
  try {
    const skySigil = computeSkySigil(b.lat, b.lon, b.name)
    const rec = await db.journalEntry.create({
      data: {
        kind: b.kind,
        title: title || `${b.kind[0].toUpperCase()}${b.kind.slice(1)} — untitled`,
        body,
        mood: b.mood || null,
        tags: JSON.stringify(b.tags),
        skySigil: JSON.stringify(skySigil),
        tarotSpread: b.tarotSpread ? JSON.stringify(b.tarotSpread) : null,
        favorite: b.favorite,
      },
    })
    return NextResponse.json({ entry: hydrate(rec) })
  } catch (err) {
    return serverError('journal-create', err, 'The quill slipped — could not save the entry')
  }
}

// PUT /api/journal?id=… — revise any subset of fields
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id required')
  const parsed = updateSchema.safeParse(await readJson(req))
  if (!parsed.success) return jsonError(zodMessage(parsed.error))
  const b = parsed.data
  const data: Prisma.JournalEntryUpdateInput = {}
  if (b.title !== undefined && b.title.trim()) data.title = b.title.trim()
  if (b.body !== undefined) data.body = b.body
  if (b.mood !== undefined) data.mood = b.mood || null
  if (b.tags !== undefined) data.tags = JSON.stringify(b.tags)
  if (b.favorite !== undefined) data.favorite = b.favorite
  if (b.kind !== undefined) data.kind = b.kind
  if (b.tarotSpread !== undefined) data.tarotSpread = b.tarotSpread === null ? null : JSON.stringify(b.tarotSpread)
  try {
    const rec = await db.journalEntry.update({ where: { id }, data })
    return NextResponse.json({ entry: hydrate(rec) })
  } catch (err) {
    if (isNotFound(err)) return jsonError('Entry not found', 404)
    return serverError('journal-update', err, 'Could not revise the entry')
  }
}

// DELETE /api/journal?id=… — burn a page
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id required')
  try {
    await db.journalEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (isNotFound(err)) return jsonError('Entry not found', 404)
    return serverError('journal-delete', err, 'The page refuses to burn')
  }
}
