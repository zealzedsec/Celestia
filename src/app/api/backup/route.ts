import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { jsonError, readJson, serverError, zodMessage } from '@/lib/api'

export const dynamic = 'force-dynamic'

const FORMAT = 'celestia-backup'
const VERSION = 1

const journalSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(['pondering', 'tarot', 'horoscope', 'diary', 'dream']),
  title: z.string().max(200),
  body: z.string().max(20_000),
  mood: z.string().max(40).nullable(),
  tags: z.string().max(4_000),
  skySigil: z.string().max(4_000),
  tarotSpread: z.string().max(40_000).nullable(),
  favorite: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

const chartSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(80),
  birthDate: z.string().max(20),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  locationName: z.string().max(120),
  tzOffset: z.number().int().min(-840).max(840),
  timeZone: z.string().max(64).nullable().optional(),
  houseSystem: z.string().max(20).optional().default('placidus'),
  chartData: z.string().max(500_000),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

const backupSchema = z.object({
  format: z.literal(FORMAT),
  version: z.number().int().max(VERSION),
  journal: z.array(journalSchema).max(50_000),
  charts: z.array(chartSchema).max(10_000),
})

/** GET /api/backup — everything the observatory remembers, as one JSON document */
export async function GET() {
  try {
    const [journal, charts] = await Promise.all([db.journalEntry.findMany({ orderBy: { createdAt: 'asc' } }), db.savedChart.findMany({ orderBy: { createdAt: 'asc' } })])
    const stamp = new Date().toISOString()
    return new NextResponse(JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: stamp, journal, charts }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="celestia-backup-${stamp.slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return serverError('backup-export', err, 'Could not export the archive')
  }
}

/** POST /api/backup — restore: merges by id (existing rows are updated, new rows created, nothing deleted) */
export async function POST(req: NextRequest) {
  const parsed = backupSchema.safeParse(await readJson(req))
  if (!parsed.success) return jsonError(`Not a Celestia backup — ${zodMessage(parsed.error)}`)
  const { journal, charts } = parsed.data
  try {
    await db.$transaction([
      ...journal.map((j) => db.journalEntry.upsert({ where: { id: j.id }, create: j, update: j })),
      ...charts.map((c) => db.savedChart.upsert({ where: { id: c.id }, create: c, update: c })),
    ])
    return NextResponse.json({ ok: true, journal: journal.length, charts: charts.length })
  } catch (err) {
    return serverError('backup-import', err, 'The restore failed — nothing was changed')
  }
}
