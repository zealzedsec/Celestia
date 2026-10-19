import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { computeNatalChart } from '@/lib/celestial/natal'
import { offsetForWallTime } from '@/lib/celestial/timezone'
import { HouseSystem, isHouseSystem } from '@/lib/celestial/houses'
import { birthInputSchema, houseSystemSchema, isNotFound, jsonError, readJson, serverError, zodMessage } from '@/lib/api'

export const dynamic = 'force-dynamic'

const castSchema = birthInputSchema.extend({
  houseSystem: houseSystemSchema.optional().default('placidus'),
  save: z.boolean().optional().default(false),
})

/** A named IANA zone wins over a raw offset: the server resolves historical DST itself */
function resolveOffset(birthDate: string, tzOffsetMinutes: number, timeZone?: string | null): number {
  return timeZone ? offsetForWallTime(birthDate, timeZone) : tzOffsetMinutes
}

// POST /api/natal — cast a chart { name, birthDate, lat, lon, locationName, tzOffsetMinutes, timeZone?, houseSystem?, save? }
export async function POST(req: NextRequest) {
  const parsed = castSchema.safeParse(await readJson(req))
  if (!parsed.success) return jsonError(zodMessage(parsed.error))
  const b = parsed.data
  try {
    const tzOffsetMinutes = resolveOffset(b.birthDate, b.tzOffsetMinutes, b.timeZone)
    const chart = computeNatalChart({
      name: b.name || 'Unnamed Soul', birthDate: b.birthDate, lat: b.lat, lon: b.lon,
      locationName: b.locationName, tzOffsetMinutes, timeZone: b.timeZone ?? null,
      houseSystem: b.houseSystem as HouseSystem,
    })
    let savedId: string | null = null
    if (b.save) {
      const rec = await db.savedChart.create({
        data: {
          name: chart.input.name, birthDate: b.birthDate, lat: b.lat, lon: b.lon,
          locationName: chart.input.locationName, tzOffset: tzOffsetMinutes,
          timeZone: b.timeZone ?? null, houseSystem: chart.houseSystem,
          chartData: JSON.stringify(chart),
        },
      })
      savedId = rec.id
    }
    return NextResponse.json({ chart, savedId })
  } catch (err) {
    return serverError('natal', err, 'Failed to compute natal chart')
  }
}

// GET /api/natal — list saved charts
export async function GET() {
  try {
    const charts = await db.savedChart.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, birthDate: true, locationName: true, timeZone: true, tzOffset: true, houseSystem: true, updatedAt: true },
      take: 100,
    })
    return NextResponse.json({ charts })
  } catch (err) {
    return serverError('natal-list', err, 'Failed to list charts')
  }
}

// DELETE /api/natal?id=… — release a saved chart
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id required')
  try {
    await db.savedChart.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (isNotFound(err)) return jsonError('Chart not found', 404)
    return serverError('natal-delete', err, 'Failed to delete chart')
  }
}

// PUT /api/natal?id=…&houseSystem=… — recompute a saved chart with the current engine (optionally another house system)
export async function PUT(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const id = sp.get('id')
  if (!id) return jsonError('id required')
  const hsParam = sp.get('houseSystem')
  if (hsParam && !isHouseSystem(hsParam)) return jsonError('Unknown house system')
  try {
    const rec = await db.savedChart.findUnique({ where: { id } })
    if (!rec) return jsonError('Chart not found', 404)
    const houseSystem = (hsParam ?? (isHouseSystem(rec.houseSystem) ? rec.houseSystem : 'placidus')) as HouseSystem
    const tzOffsetMinutes = resolveOffset(rec.birthDate, rec.tzOffset, rec.timeZone)
    const chart = computeNatalChart({
      name: rec.name, birthDate: rec.birthDate, lat: rec.lat, lon: rec.lon, locationName: rec.locationName,
      tzOffsetMinutes, timeZone: rec.timeZone, houseSystem,
    })
    await db.savedChart.update({ where: { id }, data: { chartData: JSON.stringify(chart), houseSystem, tzOffset: tzOffsetMinutes } })
    return NextResponse.json({ chart, id })
  } catch (err) {
    return serverError('natal-update', err, 'Failed to load chart')
  }
}
